from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field

# 定义泛型，用于包裹具体的业务数据
T = TypeVar('T')
F = TypeVar('F')

# ================= 1. 响应外壳 =================
class BaseLLMSuccessResponse(BaseModel, Generic[T]):
    """全局统一成功响应结构 (bizCode: 100000-299999)"""
    bizCode: int = Field(100000, description="业务状态码")
    data: Optional[T] = Field(None, description="成功业务数据")

class BaseLLMFailedResponse(BaseModel, Generic[F]):
    """全局统一失败响应结构 (bizCode: 300000-499999)"""
    bizCode: int = Field(300000, description="业务状态码")
    data: Optional[F] = Field(None, description="失败业务数据")

# ================= 2. 业务数据基类 =================
class BaseLLMSuccessData(BaseModel):
    pass

class BaseLLMFailedData(BaseModel):
    """全局失败业务数据基类：可放全局通用的错误附加信息"""
    error_msg: str = Field(..., description="全局错误描述")
    error_code: Optional[str] = Field(None, description="内部错误追踪码")
    
    
StreamDataT = TypeVar("StreamDataT")
class StreamMessage(BaseModel, Generic[StreamDataT]):
    """SSE单条消息基础封装"""
    bizCode: int
    event: str = Field(description="delta / done / error")
    data: Optional[StreamDataT] = None

# 增量分片数据模型
class ChatDeltaData(BaseModel):
    answer_content: str = ""
    thinking_process: str = ""

# 空结束数据
class ChatDoneData(BaseModel):
    pass