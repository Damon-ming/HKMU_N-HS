# app-server/com/damon/ming/ai/tokenizer/tokenizer_factory.py
from typing import Dict, Type
from ..monitor.log import pin
from .base_tokenizer import BaseTokenizer
from .tiktoken_tokenizer import TiktokenTokenizer

logger = pin("TokenizerFactory")

class TokenizerFactory:
    _providers: Dict[str, Type[BaseTokenizer]] = {}

    @classmethod
    def register(cls, provider_name: str, tokenizer_cls: Type[BaseTokenizer]):
        if not issubclass(tokenizer_cls, BaseTokenizer):
            raise TypeError(f"{tokenizer_cls} 必须继承 BaseTokenizer")
        cls._providers[provider_name] = tokenizer_cls
        logger.info(f"[TokenizerFactory] 注册分词器provider: {provider_name}")

    @classmethod
    def create(cls, provider: str, **kwargs) -> BaseTokenizer:
        if provider not in cls._providers:
            available = list(cls._providers.keys())
            raise ValueError(
                f"不支持的分词器provider: {provider}. 可用列表: {available}"
            )
        return cls._providers[provider](**kwargs)

    @classmethod
    def list_providers(cls) -> list:
        return list(cls._providers.keys())

# 内置注册tiktoken
TokenizerFactory.register("tiktoken", TiktokenTokenizer)
