# app-server/com/damon/ming/ai/pipeline.py
# pip install llama-index tiktoken pymupdf4llm chromadb sentence-transformers ollama rank-bm25 transformers torch psycopg2-binary pyyaml
# pgvector需要额外安装postgresql+pgvector扩展
# 运行Ollama需本地启动11434服务，提前pull bge-m3、nomic-embed-text、qwen:1.8b等模型
from typing import List
from llama_index.core import Document
# 注册器：启动时自动注册所有向量库、embedding、reranker
from registry.db_registry import register_all_vector_dbs
from registry.embedding_registry import register_all_embeddings
# 配置
from embedding.config import EmbeddingConfig
from vector_db.config import VectorStoreConfig
# 核心服务
from embedding.BaseEmbeddingService import BaseEmbeddingService
from vector_db.base_vector_db import BaseVectorStore
from retriever.base_retriever import DenseRetriever, SparseRetriever
from retriever.bm25_index import BM25Index
from retriever.hybrid_retriever import HybridRetriever
from rerank.factory import RerankerFactory
from constructor.constructor import SectionReconstructor
from source.ref_sources import LocalPDFDataSource
from constructor.constructor import SectionReconstructor
from spliter.spliter import MarkdownDocumentSplitter
from summary import SummarizerFactory, BaseSummarizer
from registry.tokenizer_registry import register_all_tokenizers
from tokenizer.base_tokenizer import BaseTokenizer
from tokenizer.config import TokenizerConfig
from registry.summary_registry import register_all_summarizers
from summary.config import SummarizerConfig
# 注册器补充
from registry.rerank_registry import register_all_rerankers
# 重排器配置
from rerank.config import RerankerConfig

# 1. 全局单例容器
class RAGContainer:
    def __init__(self):
        # 步骤1：执行所有模块注册
        register_all_vector_dbs()
        register_all_embeddings()
        register_all_tokenizers()
        register_all_summarizers()
        register_all_rerankers()
        
        self.token_config = TokenizerConfig()
        self.tokenizer: BaseTokenizer = self.token_config.create_tokenizer(profile="default")
        
        # 步骤2：加载配置，初始化Embedding
        self.emb_config = EmbeddingConfig()
        self.embedder: BaseEmbeddingService = self.emb_config.create_embedder(profile="default")

        # 步骤3：初始化向量库（本地Chroma）
        self.vector_config = VectorStoreConfig()
        self.vector_store: BaseVectorStore = self.vector_config.create_store(profile="default")

        # 新增：轻量文本摘要器
        self.summary_config = SummarizerConfig()
        self.summarizer: BaseSummarizer = self.summary_config.create_summarizer(profile="default")
        
        # 步骤4：初始化章节重构工具（用于召回后合并完整章节）
        self.section_recon = SectionReconstructor(tokenizer=self.tokenizer)

        # 步骤5：初始化重排器 cross-encoder
        self.rerank_config = RerankerConfig()
        self.reranker = self.rerank_config.create_reranker(profile="default")

        # 步骤6：初始化稠密检索器
        self.dense_retriever = DenseRetriever(
            vector_store=self.vector_store,
            embedding_service=self.embedder
        )

        # 步骤7：初始化稀疏BM25索引（启动时预加载所有节点构建）
        self.bm25_index = BM25Index()
        self.sparse_retriever = SparseRetriever(bm25_index=self.bm25_index)

        # 步骤8：混合检索器（稠密+稀疏RRF融合）
        self.hybrid_retriever = HybridRetriever(
            dense_retriever=self.dense_retriever,
            sparse_retriever=self.sparse_retriever,
            dense_weight=0.6,
            sparse_weight=0.4,
            fuse_k=60
        )

        # 文本切块器，补充缺失的分块逻辑
        self.splitter = MarkdownDocumentSplitter(
            tokenizer=self.tokenizer,
            max_chunk_token_size=1024,
            chunk_overlap=0
        )

    # 增量更新场景会丢失历史文档,需要增量逻辑
    def load_pdf_knowledge(self, folder_path: str = "./knowledges") -> List[str]:
        pdf_ds = LocalPDFDataSource(folder_path=folder_path)
        docs: List[Document] = pdf_ds.load_documents()
        all_nodes = []
        for doc in docs:
            # 正确调用切块器split方法，自动生成标准section_id/section_seq
            chunks = self.splitter.split([doc])
            all_nodes.extend(chunks)

        # 批量向量化
        texts = [n.text for n in all_nodes]
        embeddings = self.embedder.embed_documents(texts)
        for node, vec in zip(all_nodes, embeddings):
            node.embedding = vec

        # 写入向量库
        node_ids = self.vector_store.add_documents(all_nodes)
        # 刷新BM25
        self.bm25_index.build(all_nodes)
        return node_ids

    async def query_rag(self, query: str, top_k: int = 5, max_context_tokens: int = 4096):
        raw_nodes = self.hybrid_retriever.retrieve(
            query=query,
            top_k=top_k,
            dense_top_k=50,
            sparse_top_k=50
        )
        if not raw_nodes:
            return ""
        rerank_nodes = self.reranker.rerank(query=query, nodes=raw_nodes, top_k=top_k)

        # 1. 批量拉取全部完整章节
        section_keys = set()
        for node in rerank_nodes:
            md5 = node.metadata.get("file_md5")
            sid = node.metadata.get("section_id")
            if md5 and sid:
                section_keys.add((md5, sid))

        full_context_parts = []
        # 单章节超长阈值：超过该值则摘要压缩
        single_section_token_threshold = 1500

        for file_md5, section_id in section_keys:
            filter_condition = {"file_md5": file_md5, "section_id": section_id}
            section_nodes = self.vector_store.get_by_metadata(metadata_filter=filter_condition)
            full_section = self.section_recon._merge_chunks(section_nodes)
            if not full_section:
                continue
            
            # 统计章节token
            token_cnt = len(self.section_recon.tokenizer.encode(full_section))
            if token_cnt > single_section_token_threshold:
                # 超长：调用轻量小模型生成摘要替代原文
                compressed_text = self.summarizer.summarize(
                    text=full_section,
                    max_summary_tokens=800
                )
                full_context_parts.append(f"【长文档摘要】\n{compressed_text}")
            else:
                full_context_parts.append(full_section)

        full_text = "\n=====章节分割=====\n".join(full_context_parts)
        # 全局兜底截断
        final_context = self.section_recon.truncate_by_token(full_text, max_context_tokens)
        return final_context

# 全局单例，项目启动只初始化一次
rag_app = RAGContainer()