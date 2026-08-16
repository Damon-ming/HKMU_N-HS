import type { BaseRequest, BizApiResponse } from "@ming/biz-common-net-api";

// 聊天消息渲染模型（页面展示用，和后端响应无关）
export interface ChatRoomMessage {
  id: string;
  text: string;
}

export interface ChatRoomRequest extends BaseRequest {
  query: string;
  think: boolean;
}

export interface ChatRoomSyncData {
  answer_content: string;
  thinking_process?: string;
}
export type ChatRoomApiResponse = BizApiResponse<ChatRoomSyncData>;

export type SseEvent = "delta" | "done" | "error";

export interface ChatDeltaData {
  answer_content: string;
  thinking_process?: string;
}

export interface ChatSseErrorData {
  error_msg: string;
  error_code?: string;
}

export interface ChatSseMessage {
  bizCode: number;
  event: SseEvent;
  data: ChatDeltaData | ChatSseErrorData | Record<string, never>;
}
