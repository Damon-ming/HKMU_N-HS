# app-server/src/com/damon/ming/ai/inference/base_inference.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncGenerator

class BaseInferenceService(ABC):
    """推理服务统一抽象，Ollama/VLLM/第三方大模型统一接口"""

    @abstractmethod
    async def text_generation(
        self,
        model_name: str,
        messages: List[Dict[str, str]],
        think_flag: bool = False,
        response_schema: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """一次性返回完整文本/结构化JSON"""
        pass

    @abstractmethod
    async def stream_generate(
        self,
        model_name: str,
        messages: List[Dict[str, str]],
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        """流式SSE输出"""
        pass

    @abstractmethod
    async def check_model_ready(self, model_name: str) -> bool:
        """检测模型是否存在/服务就绪"""
        pass

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """监控、日志模型信息"""
        pass
