import hashlib
from abc import ABC, abstractmethod
from typing import List, Optional

from llama_index.core import Document
from llama_index.core.node_parser import MarkdownNodeParser, SentenceSplitter, TokenTextSplitter
from llama_index.core.schema import TextNode
import tiktoken
from monitor.log import pin

class BaseDocumentSplitter(ABC):
    """文档分割器抽象接口"""
    @abstractmethod
    def split(self, docs: List[Document], max_chunk_size: Optional[int] = None) -> List[TextNode]:
        pass

class MarkdownDocumentSplitter(BaseDocumentSplitter):

    def __init__(self, max_chunk_token_size: int = 1024, chunk_overlap: int = 120, tokenizer_model: str = "cl100k_base"):
        self.max_chunk_token_size = max_chunk_token_size
        self.chunk_overlap = chunk_overlap
        self.tokenizer = tiktoken.get_encoding(tokenizer_model)
        self.logger = pin("MarkdownDocumentSplitter")
        self.md_parser = MarkdownNodeParser()
        self.token_splitter = TokenTextSplitter(
            chunk_size=max_chunk_token_size,
            chunk_overlap=chunk_overlap
        )

        # 统计信息
        self.stats = {
            "total_chunks": 0,
            "total_sections": 0,
            "split_sections": 0,
            "errors": 0
        }

    def _gen_section_id(self, file_md5: str, node_text: str):
        # 基于文件+原始章节文本生成稳定章节ID
        seg_hash = hashlib.md5(node_text.encode("utf-8")).hexdigest()[:16]
        return f"section_{file_md5}_{seg_hash}"
    
    def _count_tokens(self, text: str) -> int:
        try:
            return len(self.tokenizer.encode(text))
        except Exception:
            return len(text)


    def split(self, docs: List[Document], max_chunk_size: Optional[int] = None) -> List[TextNode]:
        """
        分割文档列表
        
        Args:
            docs: Document 列表
            max_chunk_size: 可选，覆盖默认的 max_chunk_token_size
            
        Returns:
            List[TextNode]: 分割后的节点列表
        """
        limit = max_chunk_size or self.max_chunk_token_size
        all_nodes: List[TextNode] = []
        
        # 重置统计
        self.stats = {
            "total_chunks": 0,
            "total_sections": 0,
            "split_sections": 0,
            "errors": 0
        }

        for doc_idx, doc in enumerate(docs):
            try:
                doc_text = doc.text.strip()
                if not doc_text:
                    self.logger.warning(f"文档 {doc_idx} 为空，跳过")
                    continue

                file_md5 = doc.metadata.get("file_md5", f"file_{doc_idx}")
                file_name = doc.metadata.get("file_name", f"unknown_{doc_idx}")
                
                # 记录原始文档的总长度（用于边界检查）
                doc_total_len = len(doc_text)

                # 第一步：Markdown 按标题切分出原始章节
                md_section_nodes = self.md_parser.get_nodes_from_documents([doc])
                
                self.logger.info(
                    f"[Splitter] 处理文档: {file_name} | "
                    f"章节数: {len(md_section_nodes)} | "
                    f"文档长度: {doc_total_len} 字符"
                )

                for section_node in md_section_nodes:
                    section_raw_text = section_node.text.strip()
                    if not section_raw_text:
                        continue

                    self.stats["total_sections"] += 1
                    section_id = self._gen_section_id(file_md5, section_raw_text)
                    
                    # 记录章节在原始文档中的位置
                    section_start = section_node.start_char_idx or 0
                    section_end = section_node.end_char_idx or len(section_raw_text)
                    
                    # 计算章节 token 数
                    section_tokens = self._count_tokens(section_raw_text)

                    # 判断是否需要二次分割
                    if section_tokens > limit:
                        self.stats["split_sections"] += 1
                        self.logger.info(
                            f"[Splitter] 超大章节触发分割 | "
                            f"file={file_name}, "
                            f"tokens={section_tokens}, "
                            f"limit={limit}, "
                            f"section_id={section_id[:30]}..."
                        )
                        
                        # 二次切割：使用 TokenTextSplitter
                        sub_nodes = self.token_splitter.get_nodes_from_documents(
                            [Document(text=section_raw_text)]
                        )
                        
                        # 给子块填充序号，并修正位置偏移
                        for seq, sub_node in enumerate(sub_nodes):
                            if not sub_node.text.strip():
                                continue
                                
                            # 计算在原始 Document 中的真实位置
                            # TokenTextSplitter输出的idx是相对片段内部，存在字符错位风险，业务谨慎使用
                            real_start = section_start + (sub_node.start_char_idx or 0)
                            real_end = section_start + (sub_node.end_char_idx or len(sub_node.text))
                            
                            # 边界保护：确保不超过原始文档长度
                            real_start = max(0, min(real_start, doc_total_len - 1))
                            real_end = max(0, min(real_end, doc_total_len))
                            
                            # 如果起始位置大于结束位置，交换
                            if real_start > real_end:
                                real_start, real_end = real_end, real_start
                            
                            self._attach_metadata(
                                node=sub_node,
                                file_md5=file_md5,
                                file_name=file_name,
                                section_id=section_id,
                                section_seq=seq,
                                char_start=real_start,
                                char_end=real_end,
                                total_chunks_in_section=len(sub_nodes)
                            )
                            all_nodes.append(sub_node)
                    else:
                        # 无需分割，单个块 = 完整章节
                        self._attach_metadata(
                            node=section_node,
                            file_md5=file_md5,
                            file_name=file_name,
                            section_id=section_id,
                            section_seq=0,
                            char_start=section_start,
                            char_end=section_end,
                            total_chunks_in_section=1
                        )
                        all_nodes.append(section_node)

            except Exception as e:
                self.stats["errors"] += 1
                self.logger.error(
                    f"[Splitter] 处理文档失败 | "
                    f"doc_idx={doc_idx}, "
                    f"file={doc.metadata.get('file_name', 'unknown')}, "
                    f"error={e}",
                    exc_info=True
                )
                continue

        self.stats["total_chunks"] = len(all_nodes)
        
        self.logger.info(
            f"[MarkdownSplitter] 切块完成 | "
            f"总chunk={self.stats['total_chunks']} | "
            f"章节数={self.stats['total_sections']} | "
            f"触发分割={self.stats['split_sections']} | "
            f"错误={self.stats['errors']}"
        )
        return all_nodes

    def _attach_metadata(
        self, 
        node: TextNode, 
        file_md5: str, 
        file_name: str, 
        section_id: str, 
        section_seq: int,
        char_start: int,
        char_end: int,
        total_chunks_in_section: int
    ):
        # 生成稳定的 chunk ID
        text_hash = hashlib.md5(node.text.encode("utf-8")).hexdigest()[:16]
        chunk_id = f"chunk_{file_md5}_{text_hash}"

        # 核心元数据
        node.metadata["chunk_id"] = chunk_id
        node.metadata["file_name"] = file_name
        node.metadata["file_md5"] = file_md5
        node.metadata["section_id"] = section_id
        node.metadata["section_seq"] = section_seq
        node.metadata["total_chunks_in_section"] = total_chunks_in_section
        
        # 位置信息（指向原始文档）
        node.metadata["char_start"] = char_start
        node.metadata["char_end"] = char_end
        
        # 辅助信息
        node.metadata["chunk_length"] = len(node.text)
        node.metadata["token_count"] = self._count_tokens(node.text)
        
        # 如果是分割后的子块，保留原 MarkdownNodeParser 的层级信息
        if hasattr(node, 'metadata') and 'heading_level' in node.metadata:
            # 保留标题层级
            pass

    def get_stats(self) -> dict:
        """获取分割统计信息"""
        return self.stats.copy()

    def verify_chunk_position(self, chunk: TextNode, original_document: Document) -> bool:
        try:
            start = chunk.metadata.get("char_start", -1)
            end = chunk.metadata.get("char_end", -1)
            
            if start < 0 or end < 0 or start >= end:
                self.logger.warning(f"无效的位置信息: start={start}, end={end}")
                return False
            
            # 从原始文档中切片
            extracted = original_document.text[start:end]
            
            # 忽略空白字符差异进行比较
            if extracted.strip() != chunk.text.strip():
                self.logger.warning(
                    f"位置验证失败！\n"
                    f"  原始切片长度: {len(extracted)}\n"
                    f"  Chunk文本长度: {len(chunk.text)}\n"
                    f"  原始切片前100字符: {extracted[:100]}...\n"
                    f"  Chunk前100字符: {chunk.text[:100]}..."
                )
                return False
                
            return True
            
        except Exception as e:
            self.logger.error(f"验证位置时出错: {e}")
            return False

    def reconstruct_section(self, chunks: List[TextNode], section_id: str) -> Optional[str]:
        # 筛选出同一章节的所有 chunk
        section_chunks = [
            c for c in chunks 
            if c.metadata.get("section_id") == section_id
        ]
        
        if not section_chunks:
            return None
        
        # 按序号排序
        section_chunks.sort(key=lambda x: x.metadata.get("section_seq", 0))
        
        # 合并文本
        return "\n".join([c.text for c in section_chunks])