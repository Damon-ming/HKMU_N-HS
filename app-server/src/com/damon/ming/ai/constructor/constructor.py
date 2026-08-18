# app-server/src/com/damon/ming/ai/constructor/constructor.py
from typing import List, Optional, Set, Tuple, Dict
from llama_index.core.schema import TextNode
from src.com.damon.ming.ai.tokenizer.base_tokenizer import BaseTokenizer
from src.com.damon.ming.ai.summary import BaseSummarizer
from src.com.damon.ming.ai.vector_db.base_vector_db import BaseVectorStore


class SectionReconstructor:
    def __init__(self, tokenizer: BaseTokenizer, summarizer: Optional[BaseSummarizer] = None):
        self.tokenizer = tokenizer
        self.summarizer = summarizer
        # 单个章节的摘要触发阈值（token数）
        self.section_summary_threshold = 1000
        # 摘要生成的目标长度
        self.summary_max_tokens = 1200
    
    def debug_memory_reconstruct(self, chunks: List[TextNode], section_id: str) -> Optional[str]:
        section_chunks = [
            c for c in chunks
            if c.metadata.get("section_id") == section_id
        ]
        return self._merge_chunks(section_chunks)
    
    async def retrieve_and_reconstruct(self, vector_store, hit_node: TextNode) -> Optional[str]:
        file_md5 = hit_node.metadata.get("file_md5")
        section_id = hit_node.metadata.get("section_id")
        if not file_md5 or not section_id:
            return None
        
        filter_condition = {
            "file_md5": file_md5,
            "section_id": section_id
        }
        
        section_nodes: List[TextNode] = await vector_store.asearch(metadata_filter=filter_condition)
        return self._merge_chunks(section_nodes)
    
    def retrieve_and_reconstruct_sync(self, vector_store, hit_node: TextNode) -> Optional[str]:
        file_md5 = hit_node.metadata.get("file_md5")
        section_id = hit_node.metadata.get("section_id")
        if not file_md5 or not section_id:
            return None
        
        filter_condition = {
            "file_md5": file_md5,
            "section_id": section_id
        }
        section_nodes: List[TextNode] = vector_store.query(metadata_filter=filter_condition)
        return self._merge_chunks(section_nodes)
    
    def _merge_chunks(self, section_chunks: List[TextNode]) -> Optional[str]:
        if not section_chunks:
            return None
        section_chunks.sort(key=lambda x: x.metadata.get("section_seq", 0))
        return "\n".join([node.text for node in section_chunks])
    
    # 长度保护，使用统一tokenizer接口
    def truncate_by_token(self, text: str, max_tokens: int) -> str:
        tokens = self.tokenizer.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return self.tokenizer.decode(tokens[:max_tokens])
    
    def reconstruct_sections_from_nodes(
        self,
        vector_store: BaseVectorStore,
        hit_nodes: List[TextNode],
        max_context_tokens: int = 4096,
        section_separator: str = "\n---\n"
    ) -> str:
        """
        从召回节点列表中重构完整章节上下文
        
        Args:
            vector_store: 向量数据库实例
            hit_nodes: 召回的节点列表
            max_context_tokens: 最终上下文最大token数
            section_separator: 章节之间的分隔符
        
        Returns:
            重构后的上下文文本
        """
        if not hit_nodes:
            return ""
        
        # 收集所有唯一 (file_md5, section_id) 章节对
        section_keys = self._extract_section_keys(hit_nodes)
        if not section_keys:
            return ""
        
        # 批量获取所有章节的完整分片
        all_section_nodes = self._fetch_all_section_chunks(vector_store, section_keys)
        
        # 按章节分组并重构
        group_map = self._group_chunks_by_section(all_section_nodes)
        
        # 构建上下文：对每个章节合并，超长则摘要
        full_context_parts = self._build_section_contexts(group_map, section_keys)
        
        # 拼接并截断
        full_text = section_separator.join(full_context_parts)
        return self.truncate_by_token(full_text, max_context_tokens)
    
    def _extract_section_keys(self, nodes: List[TextNode]) -> Set[Tuple[str, str]]:
        """从节点列表中提取唯一的 (file_md5, section_id) 键"""
        section_keys = set()
        for node in nodes:
            file_md5 = node.metadata.get("file_md5")
            section_id = node.metadata.get("section_id")
            if file_md5 and section_id:
                section_keys.add((file_md5, section_id))
        return section_keys
    
    def _fetch_all_section_chunks(
        self,
        vector_store: BaseVectorStore,
        section_keys: Set[Tuple[str, str]]
    ) -> List[TextNode]:
        """批量获取所有章节的完整分片"""
        if not section_keys:
            return []
        
        # 构造 OR 查询条件
        or_conditions = []
        for file_md5, section_id in section_keys:
            or_conditions.append({
                "$and": [
                    {"file_md5": file_md5},
                    {"section_id": section_id}
                ]
            })
        batch_filter = {"$or": or_conditions}
        
        return vector_store.get_by_metadata(metadata_filter=batch_filter)
    
    def _group_chunks_by_section(
        self,
        chunks: List[TextNode]
    ) -> Dict[Tuple[str, str], List[TextNode]]:
        """按 (file_md5, section_id) 分组所有chunk分片"""
        group_map = {}
        for chunk in chunks:
            file_md5 = chunk.metadata.get("file_md5")
            section_id = chunk.metadata.get("section_id")
            if file_md5 is None or section_id is None:
                continue
            key = (file_md5, section_id)
            if key not in group_map:
                group_map[key] = []
            group_map[key].append(chunk)
        return group_map
    
    def _build_section_contexts(
        self,
        group_map: Dict[Tuple[str, str], List[TextNode]],
        target_keys: Set[Tuple[str, str]]
    ) -> List[str]:
        """构建每个章节的上下文文本，超长则生成摘要"""
        contexts = []
        
        for key in target_keys:
            section_nodes = group_map.get(key, [])
            full_section = self._merge_chunks(section_nodes)
            if not full_section:
                continue
            
            # 检查是否需要摘要
            token_cnt = self.tokenizer.count_tokens(full_section)
            if token_cnt > self.section_summary_threshold and self.summarizer:
                compressed_text = self.summarizer.summarize(
                    text=full_section,
                    max_summary_tokens=self.summary_max_tokens
                )
                contexts.append(compressed_text)
            else:
                contexts.append(full_section)
        
        return contexts