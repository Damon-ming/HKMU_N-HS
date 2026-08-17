# app-server/com/damon/ming/ai/summary/summarizer_factory.py
from typing import Dict, Type
from ..monitor.log import pin
from .base_summarizer import BaseSummarizer
from .tiny_llm_summarizer import TinyLLMSummarizer

logger = pin("SummarizerFactory")
class SummarizerFactory:
    _registry: Dict[str, Type[BaseSummarizer]] = {}

    @classmethod
    def register(cls, name: str, impl_cls: Type[BaseSummarizer]):
        if not issubclass(impl_cls, BaseSummarizer):
            raise TypeError("摘要器必须继承BaseSummarizer")
        cls._registry[name] = impl_cls
        logger.info(f"注册摘要模型: {name}")

    @classmethod
    def create(cls, provider: str, **kwargs) -> BaseSummarizer:
        if provider not in cls._registry:
            raise ValueError(f"不支持的摘要模型，可用列表：{list(cls._registry.keys())}")
        return cls._registry[provider](**kwargs)

    @classmethod
    def list_providers(cls) -> list:
        return list(cls._registry.keys())

SummarizerFactory.register("ollama", TinyLLMSummarizer)
