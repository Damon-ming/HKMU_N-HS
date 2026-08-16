# app-server/com/damon/ming/ai/registry/inference_registry.py
from ..inference.factory import InferenceFactory
from ..inference.ollama_inference import OllamaInference
from ..inference.vllm_inference import VLLMInference
from ..monitor.log import pin

logger = pin("InferenceRegistry")

def register_all_inferences():
    InferenceFactory.register("ollama", OllamaInference)
    #InferenceFactory.register("vllm", VLLMInference)
    logger.info(f"已注册推理后端: {InferenceFactory.list_providers()}")
