import { useState } from 'react'
import { useUploadApi } from '@ming/features-upload-api'
import type { ChatRoomMessage } from '../types'

export function useChatRoomController() {
  const [input, setInput] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [messages, setMessages] = useState<ChatRoomMessage[]>([])

  const send = () => {
    const text = input.trim()
    if (!text || uploading) return
    setMessages(items => [...items, { id: String(Date.now()), text, sender: 'user' }, { id: String(Date.now() + 1), text: '收到你的消息了，我会继续帮你处理。', sender: 'assistant' }])
    setInput('')
  }

  const handleFileChange = async (file?: File) => {
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const result = await useUploadApi(file)
      setFileName(result.name)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '文件上传失败')
    } finally {
      setUploading(false)
    }
  }

  return { input, setInput, fileName, uploading, uploadError, messages, send, handleFileChange }
}
