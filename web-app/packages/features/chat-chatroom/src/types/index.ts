import type { BaseRequest, BizApiResponse } from "@ming/biz-common-net-api"

export interface ChatRoomMessage {
  id: string
  text: string
  sender: "user" | "assistant"
}

export interface ChatRoomRequest extends BaseRequest {
  message: string
  tempId: string
}

export interface ChatRoomResponse {
  id: string
  message: string
  sender: "user" | "assistant"
  timestamp: number
}
export type ChatRoomApiResponse = BizApiResponse<ChatRoomResponse>;
