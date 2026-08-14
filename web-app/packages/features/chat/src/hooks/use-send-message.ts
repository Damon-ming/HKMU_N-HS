// packages/features/chat/src/hooks/use-send-message.ts
import { QueryFactory, BaseMutationOptions } from '@ming/data-layer'
import { chatService } from '../services/chat-service'
import type { SendMessageDto, ChatMessageEntity } from '../models/chat'

/**
 * 封装 Chat 发送消息 Mutation
 */
export function useSendMessageMutation(
  options?: BaseMutationOptions<ChatMessageEntity, SendMessageDto>
) {
  return QueryFactory.createMutation<ChatMessageEntity, SendMessageDto>(
    (variables) => chatService.sendMessage(variables),
    options
  )
}