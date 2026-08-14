// packages/features/chat/src/models/chat.ts

/** 接口请求 DTO */
export interface SendMessageDto {
  message: string
  /** 客户端发起的临时消息ID，用于前端更新状态与重试 */
  tempId?: string
}

/** 核心数据实体 */
export interface ChatMessageEntity {
  id: string
  message: string
  sender: 'user' | 'assistant'
  timestamp: number
}

/** 扩展 UI 展示状态的模型 */
export interface RenderChatMessage extends ChatMessageEntity {
  /** 消息流转状态：发送中 | 发送成功 | 发送失败 */
  status?: 'pending' | 'success' | 'error'
}