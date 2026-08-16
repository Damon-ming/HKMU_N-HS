# app-server/com/damon/ming/chat/router/chat_router.py
from fastapi import APIRouter
from chat.schemas.bean import ChatRequest
from ai.rag_tool import RAGContainer
from ai.registry.inference_registry import register_all_inferences
from ai.inference.config import InferenceConfig
from ai.inference.base_inference import BaseInferenceService
from ai.schemas.response import BaseLLMFailedData, BaseLLMSuccessResponse, ChatDeltaData, ChatDoneData, StreamMessage
from ai.schemas.inference_params import get_chat_schema
import json
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="api/llm/v1", tags=["聊天模块"])

# 全局单例初始化
rag_app = RAGContainer()
register_all_inferences()

# 推理客户端全局初始化
infer_config = InferenceConfig()
infer_profile = "default"
infer_service: BaseInferenceService = infer_config.create_infer_client(profile=infer_profile)
llm_model_name = infer_config.get_llm_model_name(infer_profile)

SYSTEM_PROMPT_TPL = """
你是严格基于知识库的问答助手，必须遵守以下硬性规则，绝对不能违反：
1. 只能使用【参考知识库】内存在的内容回答用户问题；
2. 如果参考知识库为空、或者没有和用户问题相关的内容，直接只输出：不知道；
3. 禁止使用你自身内置常识、禁止脑补、禁止推测、禁止编造任何原文不存在的信息；
4. 回答使用标准Markdown格式输出，存在多条内容用有序/无序列表，重点内容加粗，表格原样保留；
5. 回答精简，不要多余解释、不要分析、不要思考过程；
6. 不允许输出无关内容，严格遵守知识库边界。

【参考知识库】
{ref_content}
"""

@router.post("/send", response_class=BaseLLMSuccessResponse)
async def chat(request: ChatRequest):
    # 1. 调用RAG检索，获取拼接完整章节上下文
    ref_content = await rag_app.query_rag(request.query)

    schema = get_chat_schema(request.think)
    
    # 2. 填充固定Prompt，构造标准messages数组
    system_prompt = SYSTEM_PROMPT_TPL.format(
        ref_content=ref_content
    )
    prompt_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.query}
    ]

    # 3. 调用推理服务生成回答
    llm_raw = await infer_service.text_generation(
        model_name=llm_model_name,
        messages=prompt_messages,
        think_flag=request.think,
        response_schema=schema
    )

    # 4. 组装返回结构体，think控制是否携带思考过程（当前固定空）
    resp_inner = json.loads(llm_raw)

    # 外层统一返回
    return BaseLLMSuccessResponse(bizCode=100000, data=resp_inner)

@router.post("/chat", response_class=EventSourceResponse)
async def chat_stream(request: ChatRequest):
    """流式问答接口，SSE流式输出"""
    generator = stream_chat_generator(request)
    return EventSourceResponse(generator)

async def stream_chat_generator(request: ChatRequest):
    try:
        ref_content = await rag_app.query_rag(request.query)
        system_prompt = SYSTEM_PROMPT_TPL.format(ref_content=ref_content)
        prompt_messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.query}
        ]

        async for token in infer_service.stream_generate(
            model_name=llm_model_name,
            messages=prompt_messages
        ):
            delta_msg = StreamMessage[ChatDeltaData](
                bizCode=100000,
                event="delta",
                data=ChatDeltaData(answer_content=token)
            )
            yield delta_msg.model_dump_json(ensure_ascii=False)

        # 结束包
        done_msg = StreamMessage[ChatDoneData](
            bizCode=100000,
            event="done",
            data=ChatDoneData()
        )
        yield done_msg.model_dump_json(ensure_ascii=False)

    except Exception as e:
        err_msg = StreamMessage[BaseLLMFailedData](
            bizCode=300001,
            event="error",
            data=BaseLLMFailedData(error_msg=str(e), error_code="STREAM_ERROR")
        )
        yield err_msg.model_dump_json(ensure_ascii=False)