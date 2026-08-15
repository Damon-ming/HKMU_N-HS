from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field

# 定义泛型，用于包裹具体的业务数据
T = TypeVar('T')
F = TypeVar('F')

# ================= 1. 响应外壳 =================
class BaseSuccessResponse(BaseModel, Generic[T]):
    """全局统一成功响应结构 (bizCode: 20000-39999)"""
    bizCode: int = Field(20000, description="业务状态码")
    data: Optional[T] = Field(None, description="成功业务数据")

class BaseFailedResponse(BaseModel, Generic[F]):
    """全局统一失败响应结构 (bizCode: 40000-50000)"""
    bizCode: int = Field(40000, description="业务状态码")
    data: Optional[F] = Field(None, description="失败业务数据")

# ================= 2. 业务数据基类 =================
class BaseBizSuccessData(BaseModel):
    ...

class BaseBizFailedData(BaseModel):
    """全局失败业务数据基类：可放全局通用的错误附加信息"""
    error_msg: str = Field(..., description="全局错误描述")
    error_code: Optional[str] = Field(None, description="内部错误追踪码")