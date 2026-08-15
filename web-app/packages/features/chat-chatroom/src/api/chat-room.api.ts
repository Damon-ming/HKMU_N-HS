import { dataApi } from "@ming/data-layer";
import type { ChatRoomApiResponse, ChatRoomRequest } from "../types";
export const sendChatRoomMessage = (
  request: ChatRoomRequest,
): Promise<ChatRoomApiResponse> => dataApi.post("/api/v1/chat/send", request);