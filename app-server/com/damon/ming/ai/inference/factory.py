# app-server/com/damon/ming/ai/inference/factory.py
from typing import Dict, Type
from monitor.log import pin
from base_inference import BaseInferenceService

logger = pin("InferenceFactory")

class InferenceFactory:
    _registry: Dict[str, Type[BaseInferenceService]] = {}

    @classmethod
    def register(cls, provider: str, impl_cls: Type[BaseInferenceService]):
        if not issubclass(impl_cls, BaseInferenceService):
            raise TypeError(f"{impl_cls} 必须继承 BaseInferenceService")
        cls._registry[provider] = impl_cls
        logger.info(f"注册推理后端: {provider}")

    @classmethod
    def create(cls, provider: str, **kwargs) -> BaseInferenceService:
        if provider not in cls._registry:
            raise ValueError(f"不支持推理后端 {provider}，可用：{list(cls._registry.keys())}")
        return cls._registry[provider](**kwargs)

    @classmethod
    def list_providers(cls) -> list:
        return list(cls._registry.keys())
