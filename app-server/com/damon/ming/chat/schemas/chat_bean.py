from pydantic import BaseModel,Field
from typing import List, Dict, Any
import strings.global_strings as strings

class ChatRequest(BaseModel):
    session_id: str
    message: str
    think:bool

def get_response_schema(lang: str, think_flag: bool) -> Dict[str, Any]:
    
    
    desc = strings.descriptions.get(lang, strings.descriptions["en"])
    
    if think_flag:
        class WithThinkDynamic(BaseModel):
            thinking_process: str
            answer_content: str = Field(description=desc["answer_content"])
            used_chunk_ids: List[str] = Field(default=[], description=desc["used_chunk_ids"])
        return WithThinkDynamic.model_json_schema()
    else:
        class NoThinkDynamic(BaseModel):
            answer_content: str = Field(description=desc["answer_content"])
            used_chunk_ids: List[str] = Field(default=[], description=desc["used_chunk_ids"])
        return NoThinkDynamic.model_json_schema()

def get_intent_extraction_schema(lang: str):

    desc = strings.intent_descriptions.get(lang, strings.intent_descriptions["en"])

    class IntentItem(BaseModel):
        question: str = Field(..., description=desc["question"])
        keywords: List[str] = Field(default=[], description=desc["keywords"])

    class IntentExtraction(BaseModel):
        intents: List[IntentItem] = Field(default=[], description=desc["intents"])
    
    return IntentExtraction.model_json_schema()