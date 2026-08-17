from typing import Optional

from pydantic import BaseModel, Field

from src.com.damon.ming.schemas.request import BaseBizRequest
from src.com.damon.ming.schemas.response import BaseBizSuccessData,BaseBizFailedData

# ================= 1. 文件上传请求 =================
class FileUploadRequest(BaseBizRequest):
    """文件上传请求：继承全局基类，补充文件特有参数"""
    description: Optional[str] = Field(None, description="文件描述或备注")
    category: Optional[str] = Field(None, description="文件分类（如：合同、发票）")

class FileUploadItem(BaseModel):
    filename: str = Field(..., description="原始文件名")
    save_path: str = Field(..., description="服务端保存路径")
    file_size: int = Field(..., description="文件大小(字节)")

# ================= 2. 文件上传成功数据 =================
class FileUploadSuccessData(BaseBizSuccessData):
    """文件上传成功数据：继承全局成功基类，补充文件特有返回"""
    files: list[FileUploadItem] = Field(default_factory=list, description="已保存文件列表")

# ================= 3. 文件上传失败数据 =================
class FileUploadFailedData(BaseBizFailedData):
    """文件上传失败数据：继承全局失败基类，补充文件特有错误"""
    unsupported_format: Optional[str] = Field(None, description="不支持的文件格式")
