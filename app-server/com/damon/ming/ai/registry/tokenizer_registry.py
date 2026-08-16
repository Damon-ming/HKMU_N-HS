# app-server/com/damon/ming/ai/registry/tokenizer_registry.py
from tokenizer.tokenizer_factory import TokenizerFactory
from tokenizer.tiktoken_tokenizer import TiktokenTokenizer
from monitor.log import pin

logger = pin("TokenizerRegistry")

def register_all_tokenizers():
    """启动时注册所有分词器实现"""
    TokenizerFactory.register("tiktoken", TiktokenTokenizer)
    logger.info(f"[Registry] 已注册分词器: {TokenizerFactory.list_providers()}")
