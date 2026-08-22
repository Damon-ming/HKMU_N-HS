# AI Fullstack System

An AI full-stack application deployable with Docker Compose. It consists of a React frontend, a FastAPI application server, and an Ollama model service. The system focuses on knowledge-base question answering and supports file uploads, RAG retrieval, synchronous responses, and SSE streaming responses.

## 1. Project Structure

```text
ai-fullstack-system/
├─ docker-compose.yml       # Docker Compose deployment entry point
├─ web-app/                  # React + TypeScript frontend
│  ├─ src/app/main/          # Main application and Vite configuration
│  ├─ src/packages/features/ # Account, chat, history, search, upload modules
│  ├─ src/packages/core/     # Network, logging, and utility infrastructure
│  ├─ src/packages/biz-common/
│  ├─ Dockerfile             # pnpm build followed by Nginx hosting
│  └─ nginx.conf             # Static hosting and /api reverse proxy
└─ app-server/               # Python FastAPI backend and AI services
   ├─ src/com/damon/ming/chat/       # Chat routes and schemas
   ├─ src/com/damon/ming/upload/     # File upload and knowledge updates
   ├─ src/com/damon/ming/ai/         # RAG, models, and retrieval components
   ├─ models/                # Host-mounted local model directory
   └─ Dockerfile
```

## 2. System Architecture

```text
Browser
  │ HTTP / SSE
  ▼
web-app container (Nginx + React static files, port 80)
  │ Reverse proxy for /api/*
  ▼
app-server container (FastAPI, port 8000)
  ├─ File upload → parsing / splitting / embedding → ChromaDB
  ├─ User query → hybrid retrieval / RRF → reranking → context
  └─ Context + prompt → Ollama → JSON or SSE streaming response
                                      │
                                      ▼
                         ollama-server container (port 11434)
```

The containers communicate through the default Docker Compose network. The backend connects to Ollama through `http://ollama-server:11434`, while Nginx proxies API requests to `http://app-server:8000`. In production, expose only ports 80/443 publicly whenever possible.

## 3. Module Design

### Frontend: `web-app`

- `features/account`: Account data and account APIs.
- `features/chat`, `chat-chatroom`, `chat-drawer`: Chat pages, chat rooms, message streaming, and drawer interactions.
- `features/history`: Conversation history and message persistence.
- `features/search`: History or knowledge search.
- `features/upload`: Multi-file uploads and upload state management.
- `core/network`, `biz-common/net`: HTTP clients, error codes, response unwrapping, and networking utilities.
- `data-layer`, `store`: Data access and global state management.

The frontend uses same-origin `/api` requests, so a separate public backend URL is normally not required in browser-side configuration.

### Backend: `app-server`

- `chat/router`: Synchronous and SSE streaming chat endpoints.
- `upload/router`, `upload/service`: Multi-file upload and knowledge-base updates.
- `ai/rag_tool.py`: Main composition point for the RAG pipeline.
- `ai/spliter`: Document chunking.
- `ai/embedding`: Embedding providers, including Ollama and HuggingFace.
- `ai/vector_db`: Vector stores, currently including ChromaDB and PGVector.
- `ai/retriever`: BM25, vector retrieval, hybrid retrieval, and RRF fusion.
- `ai/rerank`: Cross-Encoder reranking.
- `ai/rewrite`: Query rewriting.
- `ai/summary`: Lightweight model summarization.
- `ai/tokenizer`: Token counting and length control through tiktoken.
- `ai/inference`: LLM inference abstraction, currently supporting Ollama and reserving vLLM support.
- `ai/registry`: Central registration for inference, embedding, vector store, reranker, summarizer, and tokenizer providers.

The AI components use a `Base*` abstraction + `Factory` + YAML profile pattern. To add a provider, implement the corresponding interface, register it, and add a configuration profile.

## 4. RAG Question-Answering Flow

1. A user uploads files through `/api/files/upload/v1`.
2. The backend parses the files and splits them into searchable chunks.
3. An embedding model generates vectors, which are stored in ChromaDB or another configured vector store.
4. The user calls either the synchronous or streaming chat endpoint.
5. The query is processed through vector retrieval, BM25 retrieval, RRF fusion, and Cross-Encoder reranking.
6. The retrieved content is inserted into a strict knowledge-grounded system prompt.
7. Ollama generates the answer. The streaming endpoint returns `delta` events and finishes with a `done` event.

The current prompt restricts the model to the retrieved knowledge base. If no relevant content is found, the response should be `The knowledge base contains no relevant materials.`

## 5. Models and Providers

Model files and Ollama data should be persisted through host volumes rather than bundled into container images.

| Capability | Default | Backup / Extension |
|---|---|---|
| LLM inference | Ollama, configured in `ai/inference/inference-config.yaml` | vLLM |
| Embedding | Ollama `bge-m3` | `nomic-embed-text`, HuggingFace `BAAI/bge-m3` |
| Vector store | ChromaDB, `./chroma_data` | PGVector, Pinecone configuration reserved |
| Reranking | Local `./models/bge-reranker-v2-m3` | CPU fallback |
| Intent classification | Ollama `qwen:0.5b` | `qwen:1.8b` |
| Summarization | Ollama `qwen2.5:1.5b` | `gemma:2b` |
| Tokenizer | tiktoken | Extensible through providers |

For example, change the inference model in the YAML profile:

```yaml
inference:
  default:
    provider: ollama
    llm_model: qwen2.5:7b
    base_url: http://ollama-server:11434
```

Then download the required models inside the Ollama container:

```bash
docker compose exec ollama ollama pull qwen2.5:7b
docker compose exec ollama ollama pull bge-m3
docker compose exec ollama ollama list
```

The configured `embedding_dimension` must match the actual output dimension of the embedding model. When changing embedding models, rebuild the vector collection if the dimension or embedding space changes.

## 6. Docker Cloud Deployment

### Requirements

- A Linux cloud server with Docker Engine and Docker Compose v2.
- GPU deployment requires NVIDIA drivers, NVIDIA Container Toolkit, and Docker support for `runtime: nvidia`.
- Sufficient disk space for Ollama models, local embedding/reranking models, knowledge files, vector data, and logs.

### First Deployment

Run the following commands from the project root:

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f app-server
```

Open `http://YOUR_SERVER_PUBLIC_IP/` in a browser. Download the required chat and embedding models before uploading files and testing questions.

### Persistent Volumes

The current `docker-compose.yml` uses the following host directories. Change them to match the cloud server:

| Host directory | Container directory | Purpose |
|---|---|---|
| `/root/ming/ollama/.ollama` | `/root/.ollama` | Ollama model library |
| `/root/ming/models` | `/app-server/models` | Local reranking and other models |
| `/root/ming/logs/app-server` | `/app-server/logs` | Backend logs |
| `/root/ming/chroma_data` | `/app-server/chroma_data` | ChromaDB persistence |
| `/root/ming/knowledges` | `/app-server/src/com/damon/ming/knowledges` | Source knowledge files |

Create these directories before startup and make sure the Docker process has read/write access. Store database credentials, API keys, and other secrets in environment variables or a secret manager instead of committing them to Git.

## 7. API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/files/upload/v1` | Multi-file upload using `multipart/form-data` |
| `POST` | `/api/llm/send/v1` | Synchronous question answering with JSON response |
| `POST` | `/api/llm/chat/v1` | SSE streaming question answering with `delta`, `done`, and `error` events |

The backend can be accessed directly at `http://SERVER_IP:8000`. Through the frontend, use the unified `/api` paths.

## 8. Operations and Troubleshooting

```bash
docker compose ps
docker compose logs --tail=200 app-server
docker compose logs --tail=200 web-app
docker compose exec ollama ollama list
curl http://127.0.0.1:11434/api/tags
curl http://127.0.0.1:8000/docs
```

Common issues:

- Model not found: check `ollama list` and pull the model configured in the YAML files.
- Backend cannot connect to Ollama: use `http://ollama-server:11434` inside Docker, not `localhost`.
- Vector dimension errors: verify the embedding model output dimension and `embedding_dimension` in the vector store configuration.
- GPU unavailable: check the NVIDIA driver, Container Toolkit, and Compose `runtime: nvidia` configuration.
- Page refresh returns 404: keep the Nginx `try_files` fallback to `index.html` for React Router.
- SSE disconnects: keep `proxy_buffering off` and a sufficiently long `proxy_read_timeout` in Nginx.

## 9. Local Development

The frontend requires Node.js 22, Corepack, and pnpm 9:

```bash
cd web-app
corepack enable
pnpm install
pnpm dev
```

The backend uses Python 3.11:

```bash
cd app-server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m src.com.damon.ming.main
```

On Windows PowerShell, activate the virtual environment with `.venv\\Scripts\\Activate.ps1`. If Ollama is running outside Docker during local development, update the YAML service URLs accordingly.

## 10. Production Recommendations

- Put Nginx behind HTTPS or a cloud load balancer.
- Restrict FastAPI CORS in production instead of permanently using `allow_origins=["*"]`.
- Avoid exposing ports 11434 and 8000 publicly unless authentication and firewall rules are in place.
- Validate upload types, file sizes, archives, and filenames.
- Use a task queue or locking mechanism for knowledge-base updates.
- Back up `chroma_data`, knowledge files, model directories, and logs.
- Back up the vector data before changing embedding models and assess whether re-indexing is required.
- Add health checks and monitoring for Ollama, backend endpoints, disk usage, and model availability.

