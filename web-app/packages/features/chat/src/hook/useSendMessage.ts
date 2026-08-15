// Chat message mutation logic.
import { QueryFactory, BaseMutationOptions } from '@ming/data-layer'
import { chatApi } from '../api/chat.api'
import type { SendMessageDto, ChatMessageEntity } from '../types/chat.types'

/**
 * 封装 Chat 发送消息 Mutation
 */
export function useSendMessageMutation(
  options?: BaseMutationOptions<ChatMessageEntity, SendMessageDto>
) {
  return QueryFactory.createMutation<ChatMessageEntity, SendMessageDto>(
    (variables) => chatApi.sendMessage(variables),
    options
  )
}

