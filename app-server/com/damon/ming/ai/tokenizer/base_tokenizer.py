# app-server/com/damon/ming/ai/tokenizer/base_tokenizer.py
from abc import ABC, abstractmethod
from typing import List

class BaseTokenizer(ABC):
    """分词器统一抽象接口"""

    @abstractmethod
    def encode(self, text: str) -> List[int]:
        """文本转token id列表"""
        pass

    @abstractmethod
    def decode(self, tokens: List[int]) -> str:
        """token id列表还原文本"""
        pass

    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """统计文本token数量"""
        pass

    @abstractmethod
    def get_encoding_name(self) -> str:
        """返回当前分词器编码名称"""
        pass
