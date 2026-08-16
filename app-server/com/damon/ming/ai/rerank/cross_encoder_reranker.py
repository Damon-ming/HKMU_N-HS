# app-server/com/damon/ming/ai/rerank/cross_encoder_reranker.py
from typing import List, Optional
import torch
from llama_index.core.schema import TextNode
from ..monitor.log import pin
from .base_reranker import BaseReranker

class CrossEncoderModel:
    """
    CrossEncoder 底层推理封装
    只实现：query + 文本列表 → 相似度分数列表
    不感知业务框架、TextNode，可独立复用
    """
    def __init__(
        self,
        model_name: str,
        device: str = None,
        max_seq_len: int = 512,
        batch_size: int = 16
    ):
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        self.logger = pin("CrossEncoderModel")

        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
        self.device = torch.device(device)
        self.max_seq_len = max_seq_len
        self.batch_size = batch_size

        self.logger.info(f"加载Rerank模型: {model_name}, device={self.device}, max_seq_len={max_seq_len}")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_name, local_files_only=True)
            self.model.to(self.device)
            self.model.eval()
            self._fallback = False
        except Exception as exc:
            self.logger.warning(f"Rerank模型未缓存，启用词法重排兜底: {exc}")
            self.tokenizer = None
            self.model = None
            self._fallback = True

    def score_pairs(self, query: str, texts: List[str]) -> List[float]:
        if not texts:
            return []

        if self._fallback:
            query_terms = set(query.lower().split())
            return [sum(1 for term in query_terms if term in text.lower()) / max(len(query_terms), 1) for text in texts]
        all_scores = []
        # 分批推理，避免OOM
        for start in range(0, len(texts), self.batch_size):
            batch_texts = texts[start:start + self.batch_size]
            pairs = [[query, text] for text in batch_texts]

            inputs = self.tokenizer(
                pairs,
                padding=True,
                truncation=True,
                max_length=self.max_seq_len,
                return_tensors="pt"
            ).to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                scores = outputs.logits[:, 0].float()
                all_scores.extend(scores.cpu().numpy().tolist())
        return all_scores


class CrossEncoderReranker(BaseReranker):
    """
    CrossEncoder 重排适配器
    实现BaseReranker抽象接口，适配整套RAG框架
    """
    def __init__(
        self,
        model_name: str,
        device: str = None,
        max_seq_len: int = 512,
        batch_size: int = 16
    ):
        self.logger = pin("CrossEncoderReranker")
        self.model = CrossEncoderModel(
            model_name=model_name,
            device=device,
            max_seq_len=max_seq_len,
            batch_size=batch_size
        )

    def rerank(
        self,
        query: str,
        nodes: List[TextNode],
        top_k: Optional[int] = None
    ) -> List[TextNode]:
        if not nodes:
            return []

        texts = [node.text for node in nodes]
        scores = self.model.score_pairs(query, texts)

        node_with_score = list(zip(nodes, scores))
        node_with_score.sort(key=lambda x: x[1], reverse=True)

        out_nodes = []
        for node, score in node_with_score:
            node.metadata["_rerank_score"] = float(score)
            out_nodes.append(node)

        if top_k is not None:
            out_nodes = out_nodes[:top_k]

        self.logger.info(f"[Rerank] 候选数量:{len(nodes)} → 输出:{len(out_nodes)}")
        return out_nodes
