# app-server/com/damon/ming/ai/constructor/constructor.py
from typing import List, Optional
from llama_index.core.schema import TextNode
from tokenizer.base_tokenizer import BaseTokenizer

class SectionReconstructor:
    def __init__(self, tokenizer: BaseTokenizer):
        self.tokenizer = tokenizer
        
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