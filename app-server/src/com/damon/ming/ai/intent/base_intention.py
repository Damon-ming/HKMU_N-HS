# app-server/src/com/damon/ming/ai/intent/base_intention.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseIntentionClassifier(ABC):
    @abstractmethod
    def classify(
        self,
        query: str,
        intention_list: List[str],
        extra_instruction: Optional[str] = None
    ) -> str:
        """
        用户query意图识别
        :param query: 用户原始提问
        :param intention_list: 可选意图列表，例如 ["chat", "doc_query", "upload_file"]
        :param extra_instruction: 额外业务约束指令
        :return: 识别出的意图名称（严格返回intention_list内的值）
        """
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """监控、日志使用"""
        pass
