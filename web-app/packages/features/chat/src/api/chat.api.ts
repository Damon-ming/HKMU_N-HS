// Chat API service.
import { dataApi } from '@ming/data-layer'
import type { BizApiResponse } from '@ming/biz-common-net-api'
import type { SendMessageDto, ChatMessageEntity } from '../types/chat.types'

export const chatApi = {
  /**
   * 发送普通 HTTP 消息（彻底摆脱 class 与 extends，纯组合）
   */
  sendMessage(dto: SendMessageDto): Promise<BizApiResponse<ChatMessageEntity>> {
    return dataApi.post<ChatMessageEntity>('/api/v1/chat/send', dto)
  },
}
