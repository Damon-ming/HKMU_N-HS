import json
import time
import ollama
from typing import List, Dict, Any, Optional, AsyncGenerator
from ..monitor.log import pin
from .base_inference import BaseInferenceService

logger = pin("OllamaInference")

class OllamaInference(BaseInferenceService):
    def __init__(
        self,
        base_url: str = "http://127.0.0.1:11434",
        timeout: int = 60,
        max_retries: int = 3,
        temperature: float = 0.1,
        top_p: float = 0.9,
        num_ctx: int = 4096
    ):
        self.client = ollama.AsyncClient(host=base_url, timeout=timeout)
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self.default_options = {
            "temperature": temperature,
            "top_p": top_p,
            "num_ctx": num_ctx
        }
        logger.info(f"Ollama推理客户端初始化 | url={base_url}")

    async def text_generation(
        self,
        model_name: str,
        messages: List[Dict[str, str]],
        think_flag: bool = False,
        response_schema: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        run_opts = self.default_options.copy()
        if options:
            run_opts.update(options)

        ollama_kwargs = {
            "model": model_name,
            "messages": messages,
            "options": run_opts
        }
        if response_schema is not None:
            ollama_kwargs["format"] = response_schema

        err_msg = ""
        for attempt in range(self.max_retries):
            try:
                resp = await self.client.chat(**ollama_kwargs)
                return resp["message"]["content"]
            except Exception as e:
                err_msg = f"Ollama调用异常: {str(e)}"
                wait = 2 ** attempt
                logger.warning(f"推理重试 {attempt+1}/{self.max_retries}, wait {wait}s | {err_msg}")
                time.sleep(wait)

        logger.error(f"Ollama推理全部重试失败: {err_msg}")
        # 结构化兜底返回
        if response_schema is not None:
            fallback_dict = {
                "answer_content": f"系统调用失败: {err_msg}",
            }
            if think_flag:
                fallback_dict["thinking_process"] = ""
            return json.dumps(fallback_dict, ensure_ascii=False)
        return json.dumps({"error": err_msg})

    async def stream_generate(
        self,
        model_name: str,
        messages: List[Dict[str, str]],
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[str, None]:
        run_opts = self.default_options.copy()
        if options:
            run_opts.update(options)
        stream = await self.client.chat(
            model=model_name,
            messages=messages,
            options=run_opts,
            stream=True
        )
        async for chunk in stream:
            content = chunk["message"].get("content", "")
            if content:
                yield content

    async def check_model_ready(self, model_name: str) -> bool:
        try:
            res = await self.client.list()
            model_list = [m["name"] for m in res.get("models", [])]
            return model_name in model_list
        except Exception as e:
            logger.error("模型检测失败:", str(e))
            return False

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "provider": "ollama",
            "base_url": self.base_url,
            "timeout": self.timeout,
            "default_options": self.default_options
        }
