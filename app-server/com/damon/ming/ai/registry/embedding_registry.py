# app-server/com/damon/ming/ai/registry/embedding_registry.py
from embedding.factory import EmbeddingFactory
from embedding.ollama import OllamaEmbedding
from embedding.huggingface import HuggingFaceEmbedding
from monitor.log import pin

logger = pin("Registry")

def register_all_embeddings():
    """注册所有 embedding provider"""
    EmbeddingFactory.register("ollama", OllamaEmbedding)
    # EmbeddingFactory.register("huggingface", HuggingFaceEmbedding)
    logger.info(f"[Registry] 已注册 providers: {EmbeddingFactory.list_providers()}")