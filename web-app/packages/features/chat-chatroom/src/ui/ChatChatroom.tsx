import React, { useState } from 'react'
import type { ChatRoomMessage } from '../types'

export const ChatChatroom: React.FC = () => {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatRoomMessage[]>([])
  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages(items => [...items, { id: String(Date.now()), text, sender: 'user' }, { id: String(Date.now() + 1), text: '收到你的消息了，我会继续帮你处理。', sender: 'assistant' }])
    setInput('')
  }
  return <main className={`feature-chatroom ${messages.length ? 'has-messages' : 'is-empty'}`}>
    {messages.length > 0 && <section className="feature-messages">{messages.map(message => <div className={`feature-message ${message.sender}`} key={message.id}>{message.text}</div>)}</section>}
    <section className="feature-composer-area">
      {messages.length === 0 && <section className="feature-welcome"><div>✦</div><h1>今天想聊点什么？</h1><p>向我提问、写点东西，或上传文件一起分析。</p></section>}
      <footer className="feature-composer"><button aria-label="上传文件">＋</button><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="输入消息..." /><button onClick={send} aria-label="发送消息">↑</button></footer>
      <p className="feature-hint">Enter 发送 · Shift + Enter 换行</p>
    </section>
  </main>
}

