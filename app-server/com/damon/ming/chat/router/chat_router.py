from fastapi import APIRouter
from chat.schemas.bean import ChatRequest

# 前缀设置为完整的业务路径
router = APIRouter(prefix="/v1/llm", tags=["聊天模块"])

# 这里只写相对路径
@router.post("/chat")
async def chat(request: ChatRequest):
    return {"message": "收到聊天请求"}