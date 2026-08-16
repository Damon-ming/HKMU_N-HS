# app-server/com/damon/ming/ai/registry/summary_registry.py
from summary.summarizer_factory import SummarizerFactory
from summary.tiny_llm_summarizer import TinyLLMSummarizer
from monitor.log import pin

logger = pin("SummaryRegistry")

def register_all_summarizers():
    """启动自动注册所有摘要实现"""
    SummarizerFactory.register("tiny_ollama", TinyLLMSummarizer)
    logger.info(f"[Registry] 已注册摘要器: {SummarizerFactory.list_providers()}")
