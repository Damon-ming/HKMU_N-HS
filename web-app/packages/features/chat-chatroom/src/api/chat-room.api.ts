import { dataApi } from "@ming/data-layer";
import type { ChatRoomApiResponse, ChatRoomRequest, ChatSseMessage } from "../types";

// 同步接口 /api/llm/v1/send
export const sendChatRoomMessage = (
  request: ChatRoomRequest,
): Promise<ChatRoomApiResponse> => dataApi.post("/api/llm/v1/send", request);

// 流式接口 /api/llm/v1/chat SSE
export const streamChatRoomMessage = async (
  request: ChatRoomRequest,
  onMessage: (payload: ChatSseMessage) => void
) => {
  const res = await fetch("/api/llm/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      // 若项目需要token鉴权，自行补充 Authorization
      // Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`请求失败 status:${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("当前环境不支持流式读取");

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
        console.warn("SSE JSON解析异常", jsonStr);
      }
    }
  }
};