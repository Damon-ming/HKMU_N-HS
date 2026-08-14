// packages/features/chat/src/services/chat-service.ts
import { dataApi } from '@ming/data-layer'
import type { BizApiResponse } from '@ming/biz-common-net-api'
import type { SendMessageDto, ChatMessageEntity } from '../models/chat'

export const chatService = {
  /**
   * 发送普通 HTTP 消息（彻底摆脱 class 与 extends，纯组合）
   */
  sendMessage(dto: SendMessageDto): Promise<BizApiResponse<ChatMessageEntity>> {
    return dataApi.post<ChatMessageEntity>('/api/v1/chat/send', dto)
  },

  /**
   * 预留的 SSE 打字机流式接口
   */
  async sendMessageStream(
    dto: SendMessageDto,
    onChunk: (chunkText: string) => void
  ): Promise<void> {
    // 未来可接入 Fetch ReadableStream / EventSource
  }
}