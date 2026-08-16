# app-server/com/damon/ming/upload/service/upload_service.py
from pathlib import Path
import uuid
from fastapi import UploadFile
from typing import List
from upload.schemas.bean import FileUploadRequest

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "knowledges"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class UploadService:
    @staticmethod
    async def batch_save_files(
        file_list: List[UploadFile],
        req: FileUploadRequest
    ) -> list[dict]:
        """
        批量保存文件
        :param file_list: 上传文件数组
        :param req: 上传附加业务参数
        :return: 文件信息列表
        """
        saved_files = []
        for file in file_list:
            # 建议：可以重命名文件名，避免重名、路径穿越
            origin_name = Path(file.filename or "unnamed").name
            file_uid = str(uuid.uuid4())
            # 3. 磁盘真实文件名：uuid + 原始名称
            store_name = f"{file_uid}__{origin_name}"
            file_path = UPLOAD_DIR / store_name

            content = await file.read()
            with file_path.open("wb") as f:
                f.write(content)

            saved_files.append({
                "filename": origin_name,
                "save_path": str(file_path),
                "file_size": len(content)
            })
        return saved_files