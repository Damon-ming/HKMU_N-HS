# app-server/src/com/damon/ming/ai/source/ref_sources.py
import os
import hashlib
from abc import ABC, abstractmethod
from typing import List

from llama_index.core import Document
import pymupdf4llm
from src.com.damon.ming.log import pin

class BaseDataSource(ABC):
    """数据源抽象：仅负责加载原始文档"""
    @abstractmethod
    def load_documents(self) -> List[Document]:
        pass

class LocalPDFDataSource(BaseDataSource):
    """PDF文件加载实现，只负责读取PDF并转为Document，不做切块"""
    def __init__(
        self,
        folder_path: str,
        enable_image_extract: bool = False
    ):
        self.folder_path = folder_path
        self.enable_image_extract = enable_image_extract
        self.logger = pin("LocalPDFDataSource")
        self._ensure_dir_exists()

    def _ensure_dir_exists(self):
        if not os.path.exists(self.folder_path):
            os.makedirs(self.folder_path)
            self.logger.info(f"[PDFDataSource] 创建知识库目录: {self.folder_path}")

    @staticmethod
    def _get_file_md5(file_path: str) -> str:
        hash_md5 = hashlib.md5()
        buffer_size = 8192
        with open(file_path, "rb") as f:
            while chunk := f.read(buffer_size):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def load_documents(self) -> List[Document]:
        self.logger.info(f"[PDFDataSource] 开始加载PDF目录: {self.folder_path}")
        raw_docs: List[Document] = []
        fail_files: List[str] = []

        for root, _, files in os.walk(self.folder_path):
            for file in files:
                if not file.lower().endswith(".pdf"):
                    continue
                file_path = os.path.abspath(os.path.join(root, file))
                try:
                    file_md5 = self._get_file_md5(file_path)
                    md_pages = pymupdf4llm.to_markdown(
                        file_path,
                        page_chunks=True,
                        write_images=self.enable_image_extract,
                        dpi=150
                    )

                    full_md_text = ""
                    # page_info_list = []
                    for page_item in md_pages:
                        # page_num = page_item["page"]
                        page_text = page_item["text"]
                        full_md_text += page_text + "\n\n"
                        # page_info_list.append({"page": page_num, "text": page_text})

                    doc = Document(
                        text=full_md_text.strip(),
                        metadata={
                            "file_name": file,
                            "file_path": file_path,
                            "file_md5": file_md5,
                            "source_refId": file_md5,
                            "total_pages": len(md_pages),
                            # "page_detail": page_info_list
                        }
                    )
                    raw_docs.append(doc)
                except Exception as e:
                    self.logger.error(f"[PDFDataSource] 解析失败 | 文件:{file_path} | err:{str(e)}")
                    fail_files.append(file_path)

        self.logger.info(f"[PDFDataSource] 成功解析PDF数量: {len(raw_docs)}")
        if fail_files:
            self.logger.warning(f"[PDFDataSource] 解析失败文件总数:{len(fail_files)}, 列表:{fail_files}")
        return raw_docs
