# app-server/src/com/damon/ming/ai/rewrite/base_rewriter.py

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseQueryRewriter(ABC):
    @abstractmethod
    def rewrite(
        self,
        query: str,
        context: Optional[str] = None,
        max_tokens: int = 256
    ) -> str:
        """
        用户查询改写/提炼，生成适合向量检索的问句
        :param query: 用户原始问句
        :param context: 多轮上文上下文（可选，用于补全指代）
        :param max_tokens: 改写后最大长度限制
        :return: 优化后的检索query
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """监控日志使用"""
        pass


