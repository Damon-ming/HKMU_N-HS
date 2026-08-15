// Chat data and interaction logic.
import { useState, useCallback } from 'react'
import { useSendMessageMutation } from './useSendMessage'
import type { ChatMessageEntity, SendMessageDto } from '../types/chat.types'

// 扩展前端消息模型，加入状态管理
export interface RenderChatMessage extends ChatMessageEntity {
  status?: 'pending' | 'success' | 'error'
}

export function useChatController() {
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<RenderChatMessage[]>([])
  const resetConversation = useCallback(() => {
    setMessages([])
    setInputText('')
  }, [])

  const { mutate: sendMessage, isPending } = useSendMessageMutation({
    onSuccess: (res, variables) => {
      // 1. 将刚刚发送成功的【用户临时消息】状态改为 success
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === variables.tempId
            ? { ...msg, status: 'success' }
            : msg
        )
      )

      // 2. 将 AI 返回的新消息追加（Append）到列表中
      if (res.data) {
        const aiMsg: RenderChatMessage = {
          ...res.data,
          status: 'success'
        }
        setMessages((prev) => [...prev, aiMsg])
      }
    },
    onError: (err, variables) => {
      // 标记指定的【用户消息】发送失败，UI 显示红色感叹号/重试按钮
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === variables.tempId ? { ...msg, status: 'error' } : msg
        )
      )
    }
  })

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isPending) return

    const textToSend = inputText.trim()
    const tempId = `temp-${Date.now()}`

    // 乐观更新：先在 UI 上呈现用户刚发出的消息
    const userMsg: RenderChatMessage = {
      id: tempId,
      message: textToSend,
      sender: 'user',
      timestamp: Date.now(),
      status: 'pending'
    }

    setMessages((prev) => [...prev, userMsg])
    
    // 发送网络请求，带上 tempId
    sendMessage({ 
      message: textToSend, 
      tempId 
    } as SendMessageDto)

    setInputText('')
  }, [inputText, isPending, sendMessage])

  return {
    inputText,
    setInputText,
    messages,
    isLoading: isPending,
    handleSend,
    resetConversation
  }
}
