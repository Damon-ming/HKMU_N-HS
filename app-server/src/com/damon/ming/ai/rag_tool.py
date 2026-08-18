# app-server/src/com/damon/ming/ai/rag_tool.py

from pathlib import Path
from typing import List
from llama_index.core import Document
from src.com.damon.ming.ai.registry.db_registry import register_all_vector_dbs
from src.com.damon.ming.ai.registry.embedding_registry import register_all_embeddings
from src.com.damon.ming.ai.embedding.config import EmbeddingConfig
from src.com.damon.ming.ai.vector_db.config import VectorStoreConfig
from src.com.damon.ming.ai.embedding.BaseEmbeddingService import BaseEmbeddingService
from src.com.damon.ming.ai.vector_db.base_vector_db import BaseVectorStore
from src.com.damon.ming.ai.retriever.base_retriever import DenseRetriever, SparseRetriever
from src.com.damon.ming.ai.retriever.bm25_index import BM25Index
from src.com.damon.ming.ai.retriever.hybrid_retriever import HybridRetriever
from src.com.damon.ming.ai.constructor.constructor import SectionReconstructor
from src.com.damon.ming.ai.source.ref_sources import LocalPDFDataSource
from src.com.damon.ming.ai.spliter.spliter import MarkdownDocumentSplitter
from src.com.damon.ming.ai.summary import BaseSummarizer
from src.com.damon.ming.ai.registry.tokenizer_registry import register_all_tokenizers
from src.com.damon.ming.ai.tokenizer.base_tokenizer import BaseTokenizer
from src.com.damon.ming.ai.tokenizer.config import TokenizerConfig
from src.com.damon.ming.ai.registry.summary_registry import register_all_summarizers
from src.com.damon.ming.ai.summary.config import SummarizerConfig
from src.com.damon.ming.ai.registry.rerank_registry import register_all_rerankers
from src.com.damon.ming.ai.rerank.config import RerankerConfig
from src.com.damon.ming.log import pin

logger = pin("ai.rag")

KNOWLEDGES_DIR = Path(__file__).resolve().parent.parent / "knowledges"

# 1. 全局单例容器
class RAGContainer:
    def __init__(self):
        logger.info("RAG 容器初始化开始")
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
            dense_weight=0.7,
            sparse_weight=0.3,
            fuse_k=40
        )

        # 文本切块器，补充缺失的分块逻辑
        self.splitter = MarkdownDocumentSplitter(
            tokenizer=self.tokenizer,
            max_chunk_token_size=1024,
            chunk_overlap=0
        )

        # 首次启动自动建立随项目发布的知识库，已有持久化数据时不重复写入。
        # 检查向量数据库中是否没有任何数据
        if self.vector_store.count() == 0:
            self.load_pdf_knowledge()
        else:
            # Chroma 持久化了向量，但 BM25 是内存索引，重启后必须恢复。
            docs = LocalPDFDataSource(KNOWLEDGES_DIR).load_documents()
            bm25_nodes = []
            bm25_nodes.extend(self.splitter.split(docs))
            self.bm25_index.build(bm25_nodes)
            
        logger.info("RAG 容器初始化完成")

    # 增量更新场景会丢失历史文档,需要增量逻辑
    def load_pdf_knowledge(self, folder_path: str = None) -> List[str]:
        if folder_path is None:
            folder_path = KNOWLEDGES_DIR
            
        pdf_ds = LocalPDFDataSource(folder_path=folder_path)
        docs: List[Document] = pdf_ds.load_documents()
        all_nodes = []
        # 正确调用切块器split方法，自动生成标准section_id/section_seq
        chunks = self.splitter.split(docs)
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
        logger.info("RAG 检索开始 | query_length=%s | top_k=%s", len(query), top_k)
        # 1. 混合稠密+稀疏召回
        raw_nodes = self.hybrid_retriever.retrieve(
            query=query,
            top_k=top_k,
            dense_top_k=30,
            sparse_top_k=30
        )
        if not raw_nodes:
            logger.info("RAG 检索无结果")
            return ""

        # 2. CrossEncoder 重排过滤低相关文档
        rerank_nodes = self.reranker.rerank(query=query, nodes=raw_nodes, top_k=top_k)
        if not rerank_nodes:
            logger.info("RAG 重排后无有效结果")
            return ""

        # 3. 重构完整章节上下文（所有逻辑已封装到 SectionReconstructor）
        final_context = self.section_recon.reconstruct_sections_from_nodes(
            vector_store=self.vector_store,
            hit_nodes=rerank_nodes,
            max_context_tokens=max_context_tokens
        )

        logger.info("RAG 检索完成 | context_length=%s", len(final_context))
        return final_context