# app-server/src/com/damon/ming/ai/registry/summary_registry.py
from src.com.damon.ming.ai.summary.summarizer_factory import SummarizerFactory
from src.com.damon.ming.ai.summary.tiny_llm_summarizer import TinyLLMSummarizer
from src.com.damon.ming.ai.monitor.log import pin

logger = pin("SummaryRegistry")

def register_all_summarizers():
    """启动自动注册所有摘要实现"""
    SummarizerFactory.register("ollama", TinyLLMSummarizer)
    logger.info(f"[Registry] 已注册摘要器: {SummarizerFactory.list_providers()}")
