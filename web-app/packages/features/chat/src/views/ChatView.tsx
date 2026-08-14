// packages/features/chat/src/views/ChatView.tsx
import React, { useRef, useEffect } from 'react'
import { useChatController } from '../hooks/use-chat-controller'

export const ChatView: React.FC = () => {
  const { inputText, setInputText, messages, isLoading, handleSend } = useChatController()
  const messageEndRef = useRef<HTMLDivElement>(null)

  // 收到新消息时自动滚动到底部
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={styles.container}>
      {/* 顶部 Header 区域 - 方便后续扩充模型切换等功能 */}
      <header style={styles.header}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Gemini Assistant</h2>
      </header>

      {/* 消息展示区域 */}
      <main style={styles.messageList}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'
          return (
            <div
              key={msg.id}
              style={{
                ...styles.messageItem,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                backgroundColor: isUser ? '#e3f2fd' : '#f5f5f5',
                opacity: msg.status === 'pending' ? 0.7 : 1
              }}
            >
              <div style={styles.messageContent}>{msg.message}</div>
              {msg.status === 'error' && (
                <span style={styles.errorTag}>发送失败</span>
              )}
            </div>
          )
        })}
        {/* 用于滚动吸底的锚点 */}
        <div ref={messageEndRef} />
      </main>

      {/* 底部固定居中的输入框容器 */}
      <footer style={styles.inputWrapper}>
        <div style={styles.inputContainer}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Gemini..."
            disabled={isLoading}
            style={styles.input}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            style={{
              ...styles.button,
              opacity: isLoading || !inputText.trim() ? 0.5 : 1
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </footer>
    </div>
  )
}

// 采用响应式、自适应高度布局，解决居中容器限制扩展性的问题
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: '#ffffff'
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messageList: {
    flex: 1,
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxSizing: 'border-box'
  },
  messageItem: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '85%',
    wordBreak: 'break-word',
    position: 'relative'
  },
  messageContent: {
    fontSize: '15px',
    lineHeight: '1.5',
    color: '#333'
  },
  errorTag: {
    fontSize: '12px',
    color: '#d32f2f',
    marginTop: '4px',
    display: 'block'
  },
  inputWrapper: {
    width: '100%',
    padding: '16px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center'
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    maxWidth: '800px',
    padding: '8px 12px',
    borderRadius: '24px',
    border: '1px solid #ccc',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    padding: '8px 12px',
    backgroundColor: 'transparent'
  },
  button: {
    border: 'none',
    borderRadius: '20px',
    padding: '8px 20px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'opacity 0.2s'
  }
}