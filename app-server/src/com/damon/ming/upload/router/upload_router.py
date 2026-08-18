import json
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form
from src.com.damon.ming.schemas.response import BaseSuccessResponse, BaseFailedResponse
from src.com.damon.ming.upload.schemas.bean import FileUploadRequest, FileUploadSuccessData, FileUploadFailedData
from src.com.damon.ming.upload.service.upload_service import UploadService, UploadInProgressError
from src.com.damon.ming.log import pin

logger = pin("upload.router")

router = APIRouter(prefix="/api/files", tags=["文件管理"])

@router.post("/upload/v1", response_model=None)
async def save_files(
    files: list[UploadFile] = File(..., description="多文件"),
    meta_json: str = Form("", description="额外业务参数，JSON字符串")
):
    logger.info("文件上传请求开始 | file_count=%s", len(files))
    try:
        # 解析业务参数
        req_data = FileUploadRequest(**json.loads(meta_json)) if meta_json else FileUploadRequest()

        # 调用service，路由不碰IO读写
        saved_files = await UploadService.batch_save_files(files, req_data)
        logger.info("文件上传请求完成 | saved_count=%s", len(saved_files))

        success_data = FileUploadSuccessData(
            server_time=datetime.now().isoformat(),
            files=saved_files
        )
        return BaseSuccessResponse(bizCode=20000, data=success_data)

    except Exception as e:
        logger.exception("文件上传请求失败")
        if isinstance(e, UploadInProgressError):
            fail_code = "KNOWLEDGE_UPDATE_IN_PROGRESS"
        else:
            fail_code = "FILE_SAVE_ERROR"
        fail_data = FileUploadFailedData(
            error_msg=str(e),
            error_code=fail_code
        )
        return BaseFailedResponse(bizCode=40000, data=fail_data)
