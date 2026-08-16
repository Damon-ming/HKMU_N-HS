# app-server/com/damon/ming/ai/rag_tool.py
from pathlib import Path
from typing import List
from llama_index.core import Document
from .registry.db_registry import register_all_vector_dbs
from .registry.embedding_registry import register_all_embeddings
from .embedding.config import EmbeddingConfig
from .vector_db.config import VectorStoreConfig
from .embedding.BaseEmbeddingService import BaseEmbeddingService
from .vector_db.base_vector_db import BaseVectorStore
from .retriever.base_retriever import DenseRetriever, SparseRetriever
from .retriever.bm25_index import BM25Index
from .retriever.hybrid_retriever import HybridRetriever
from .constructor.constructor import SectionReconstructor
from .source.ref_sources import LocalPDFDataSource
from .spliter.spliter import MarkdownDocumentSplitter
from .summary import BaseSummarizer
from .registry.tokenizer_registry import register_all_tokenizers
from .tokenizer.base_tokenizer import BaseTokenizer
from .tokenizer.config import TokenizerConfig
from .registry.summary_registry import register_all_summarizers
from .summary.config import SummarizerConfig
from .registry.rerank_registry import register_all_rerankers
from .rerank.config import RerankerConfig

KNOWLEDGES_DIR = Path(__file__).resolve().parent.parent / "knowledges"

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
            fuse_k=40
        )

        # 文本切块器，补充缺失的分块逻辑
        self.splitter = MarkdownDocumentSplitter(
            tokenizer=self.tokenizer,
            max_chunk_token_size=1024,
            chunk_overlap=0
        )

        # 首次启动自动建立随项目发布的知识库，已有持久化数据时不重复写入。
        if self.vector_store.count() == 0:
            self.load_pdf_knowledge()
        else:
            # Chroma 持久化了向量，但 BM25 是内存索引，重启后必须恢复。
            docs = LocalPDFDataSource(KNOWLEDGES_DIR).load_documents()
            bm25_nodes = []
            for doc in docs:
                bm25_nodes.extend(self.splitter.split([doc]))
            self.bm25_index.build(bm25_nodes)

    # 增量更新场景会丢失历史文档,需要增量逻辑
    def load_pdf_knowledge(self, folder_path: str = None) -> List[str]:
        if folder_path is None:
            folder_path = KNOWLEDGES_DIR
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
        # 1. 混合稠密+稀疏召回
        raw_nodes = self.hybrid_retriever.retrieve(
            query=query,
            top_k=top_k,
            dense_top_k=30,
            sparse_top_k=30
        )
        if not raw_nodes:
            return ""

        # 2. CrossEncoder 重排过滤低相关文档
        rerank_nodes = self.reranker.rerank(query=query, nodes=raw_nodes, top_k=top_k)

        # 收集所有唯一 (file_md5, section_id) 章节对
        section_keys = set()
        for node in rerank_nodes:
            file_md5 = node.metadata.get("file_md5")
            section_id = node.metadata.get("section_id")
            if file_md5 and section_id:
                section_keys.add((file_md5, section_id))

        full_context_parts = []
        single_section_token_threshold = 1000
        final_context = ""  # 提前初始化，防止无章节时变量不存在

        if section_keys:
            # 批量构造 OR 查询条件，只访问一次向量库，替代循环多次IO
            or_conditions = []
            for file_md5, section_id in section_keys:
                or_conditions.append({
                    "$and": [
                        {"file_md5": file_md5},
                        {"section_id": section_id}
                    ]
                })
            batch_filter = {"$or": or_conditions}
            all_section_nodes = self.vector_store.get_by_metadata(metadata_filter=batch_filter)

            # 按 (file_md5, section_id) 分组所有chunk分片
            group_map = {}
            for chunk in all_section_nodes:
                key = (chunk.metadata["file_md5"], chunk.metadata["section_id"])
                if key not in group_map:
                    group_map[key] = []
                group_map[key].append(chunk)

            # 遍历每一个目标章节，合并完整文本/超长摘要
            for key in section_keys:
                section_nodes = group_map.get(key, [])
                full_section = self.section_recon._merge_chunks(section_nodes)
                if not full_section:
                    continue

                # 使用封装好的 count_tokens，替代直接 encode
                token_cnt = self.section_recon.tokenizer.count_tokens(full_section)
                if token_cnt > single_section_token_threshold:
                    # 超长章节生成摘要
                    compressed_text = self.summarizer.summarize(text=full_section, max_summary_tokens=1200)
                    full_context_parts.append(compressed_text)
                else:
                    full_context_parts.append(full_section)

            # 全部章节收集完成后，统一拼接（移出循环，修复缩进bug）
            # 使用短分隔符减少token占用，不引入无效资料
            full_text = "\n---\n".join(full_context_parts)
            # 全局token兜底截断
            final_context = self.section_recon.truncate_by_token(full_text, max_context_tokens)

        return final_context