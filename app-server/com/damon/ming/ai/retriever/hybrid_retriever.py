# app-server/com/damon/ming/ai/retriever/hybrid_retriever.py
from typing import List, Optional, Dict, Any
from llama_index.core.schema import TextNode
from monitor.log import pin

from base_retriever import DenseRetriever, SparseRetriever
from rrf import ReciprocalRankFusion

class HybridRetriever:
    """
    混合检索器：稠密 + 稀疏 + RRF
    仅负责多路召回与融合，Rerank由外部独立模块实现
    """

    def __init__(
        self,
        dense_retriever: DenseRetriever,
        sparse_retriever: SparseRetriever,
        dense_weight: float = 0.6,
        sparse_weight: float = 0.4,
        fuse_k: int = 60
    ):
        self.dense_retriever = dense_retriever
        self.sparse_retriever = sparse_retriever
        self.dense_weight = dense_weight
        self.sparse_weight = sparse_weight
        self.fuser = ReciprocalRankFusion(k=fuse_k)
        self.logger = pin("HybridRetriever")

    def retrieve(
        self,
        query: str,
        top_k: int = 10,
        dense_top_k: int = 50,
        sparse_top_k: int = 50,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[TextNode]:
        """
        混合检索主入口

        Args:
            query: 查询文本
            top_k: 最终返回数量
            dense_top_k: 稠密检索候选数
            sparse_top_k: 稀疏检索候选数
            metadata_filter: 通用元数据过滤条件

        Returns:
            List[TextNode]: 检索结果
        """
        # 1. 稠密检索，透传filter
        self.logger.info(f"[HybridRetriever] 执行稠密检索 | query={query[:50]}...")
        dense_results = self.dense_retriever.retrieve_with_score(
            query, dense_top_k, metadata_filter=metadata_filter
        )

        # 2. 稀疏检索，透传filter
        self.logger.info(f"[HybridRetriever] 执行稀疏检索 | query={query[:50]}...")
        sparse_results = self.sparse_retriever.retrieve_with_score(
            query, sparse_top_k, metadata_filter=metadata_filter
        )

        # 3. RRF 融合
        self.logger.info(f"[HybridRetriever] 执行 RRF 融合")
        fused_results = self.fuser.fuse_with_weights(
            results_list=[dense_results, sparse_results],
            weights=[self.dense_weight, self.sparse_weight],
            top_k=top_k
        )

        self.logger.info(f"[HybridRetriever] 检索完成 | 返回 {len(fused_results)} 个结果")
        return fused_results
