import os
from datetime import datetime
from typing import List
from fastapi import UploadFile
from upload.schemas.bean import FileUploadRequest

UPLOAD_DIR = "./knowledges"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
            safe_filename = file.filename
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)

            saved_files.append({
                "filename": safe_filename,
                "save_path": file_path,
                "file_size": len(content)
            })
        return saved_files
