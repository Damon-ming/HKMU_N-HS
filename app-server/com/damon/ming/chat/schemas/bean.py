from ai.schemas.request import BaseLLMRequest

class ChatRequest(BaseLLMRequest):
    query: str
    think:bool