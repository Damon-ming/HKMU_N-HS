# app-server/com/damon/ming/ai/retriever/bm25_index.py
from typing import List
from llama_index.core.schema import TextNode
from monitor.log import pin

class BM25Index:
    """
    BM25 索引（基于 rank_bm25）
    为 SparseRetriever 提供底层关键词检索能力
    """
    def __init__(self, tokenizer=None):
        self.tokenizer = tokenizer or self._default_tokenizer
        self.index = None
        self.corpus: List[TextNode] = []
        self.logger = pin("BM25Index")

    def _default_tokenizer(self, text: str) -> List[str]:
        """默认简单空格分词，中文场景建议外部传入jieba等分词器"""
        return text.lower().split()

    def build(self, nodes: List[TextNode]):
        """构建 BM25 内存索引"""
        from rank_bm25 import BM25Okapi
        self.corpus = nodes
        tokenized_corpus = [self.tokenizer(node.text) for node in nodes]
        self.index = BM25Okapi(tokenized_corpus)
        self.logger.info(f"[BM25Index] 索引构建完成 | 文档数: {len(nodes)}")

    def get_scores(self, query: str) -> List[float]:
        """获取查询对全部文档的BM25分数数组，和corpus一一对应"""
        if self.index is None:
            raise ValueError("索引未初始化，请先执行 build()")
        tokenized_query = self.tokenizer(query)
        return self.index.get_scores(tokenized_query)
