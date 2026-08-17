# app-server/src/com/damon/ming/ai/tokenizer/tiktoken_tokenizer.py
import tiktoken
from typing import List
from src.com.damon.ming.log import pin
from src.com.damon.ming.ai.tokenizer.base_tokenizer import BaseTokenizer

logger = pin("TiktokenTokenizer")

class TiktokenTokenizer(BaseTokenizer):
    def __init__(self, encoding_name: str = "cl100k_base"):
        self.encoding_name = encoding_name
        self.enc = tiktoken.get_encoding(encoding_name)
    
    def encode(self, text: str) -> List[int]:
        return self.enc.encode(text)

    def decode(self, tokens: List[int]) -> str:
        return self.enc.decode(tokens)

    def count_tokens(self, text: str) -> int:
        return len(self.encode(text))

    def get_encoding_name(self) -> str:
        return self.encoding_name
