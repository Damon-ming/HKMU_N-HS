import json
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form
from src.com.damon.ming.schemas.response import BaseSuccessResponse, BaseFailedResponse
from src.com.damon.ming.upload.schemas.bean import FileUploadRequest, FileUploadSuccessData, FileUploadFailedData
from src.com.damon.ming.upload.service.upload_service import UploadService

router = APIRouter(prefix="/api/v1/files", tags=["文件管理"])

@router.post("/upload", response_model=BaseSuccessResponse[FileUploadSuccessData])
async def save_files(
    files: list[UploadFile] = File(..., description="多文件"),
    meta_json: str = Form("", description="额外业务参数，JSON字符串")
):
    try:
        # 解析业务参数
        req_data = FileUploadRequest(**json.loads(meta_json)) if meta_json else FileUploadRequest()

        # 调用service，路由不碰IO读写
        saved_files = await UploadService.batch_save_files(files, req_data)

        success_data = FileUploadSuccessData(
            server_time=datetime.now().isoformat(),
            files=saved_files
        )
        return BaseSuccessResponse(bizCode=20000, data=success_data)

    except Exception as e:
        fail_data = FileUploadFailedData(
            error_msg=str(e),
            error_code="FILE_SAVE_ERROR"
        )
        return BaseFailedResponse(bizCode=40000, data=fail_data)
