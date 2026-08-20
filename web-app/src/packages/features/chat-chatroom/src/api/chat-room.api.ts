import { dataApi } from "@ming/data-layer";
import type { ChatRoomApiResponse, ChatRoomRequest, ChatSseMessage } from "./types";
import { createLogger } from "@ming/core-log";

const log = createLogger("chat-chatroom/api");

// 同步接口 /api/llm/v1/send
export const sendChatRoomMessage = (
  request: ChatRoomRequest,
): Promise<ChatRoomApiResponse> => {
  log.debug("send request", { endpoint: "/api/llm/send/v1", queryLength: request.query.length });
  return dataApi.post("/api/llm/send/v1", request)
    .then((response) => { log.debug("send response received"); return response; })
    .catch((error) => { log.error("send request failed", error); throw error; });
};

// 流式接口 /api/llm/v1/chat SSE
export const streamChatRoomMessage = async (
  request: ChatRoomRequest,
  onMessage: (payload: ChatSseMessage) => void
) => {
  log.debug("stream request", { endpoint: "/api/llm/chat/v1", queryLength: request.query.length });
  const res = await fetch("/api/llm/chat/v1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      // 若项目需要token鉴权，自行补充 Authorization
      // Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) { const error = new Error(`请求失败 status:${res.status}`); log.error("stream response failed", error, { status: res.status }); throw error; }

  const reader = res.body?.getReader();
  if (!reader) { const error = new Error("当前环境不支持流式读取"); log.error("stream reader unavailable", error); throw error; }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimLine = line.trim();
      if (!trimLine || !trimLine.startsWith("data: ")) continue;
      const jsonStr = trimLine.slice(6);
      try {
        const payload = JSON.parse(jsonStr) as ChatSseMessage;
        onMessage(payload);
      } catch (err) {
        log.warn("SSE JSON parse failed", { json: jsonStr });
      }
    }
  }
  log.debug("stream response completed");
};
