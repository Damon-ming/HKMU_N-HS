# app-server/src/com/damon/ming/ai/rewrite/rewrite_factory.py
from typing import Dict, Type
from src.com.damon.ming.ai.monitor.log import pin
from src.com.damon.ming.ai.rewrite.base_rewriter import BaseQueryRewriter
from src.com.damon.ming.ai.rewrite.ollama_rewriter import OllamaQueryRewriter

logger = pin("RewriteFactory")

class RewriteFactory:
    _registry: Dict[str, Type[BaseQueryRewriter]] = {}

    @classmethod
    def register(cls, name: str, impl_cls: Type[BaseQueryRewriter]):
        if not issubclass(impl_cls, BaseQueryRewriter):
            raise TypeError("Query改写器必须继承BaseQueryRewriter")
        cls._registry[name] = impl_cls
        logger.info(f"注册Query改写模型: {name}")

    @classmethod
    def create(cls, provider: str, **kwargs) -> BaseQueryRewriter:
        if provider not in cls._registry:
            raise ValueError(f"不支持的改写模型，可用列表：{list(cls._registry.keys())}")
        return cls._registry[provider](**kwargs)

    @classmethod
    def list_providers(cls) -> list:
        return list(cls._registry.keys())

RewriteFactory.register("ollama", OllamaQueryRewriter)



