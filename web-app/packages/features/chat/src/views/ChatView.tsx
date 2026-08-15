import React, { useEffect, useRef, useState } from 'react'
import { useChatController } from '../hooks/use-chat-controller'

export const ChatView: React.FC = () => {
  const { inputText, setInputText, messages, isLoading, handleSend, resetConversation } = useChatController()
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [activeChat, setActiveChat] = useState('new')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isLoading])

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend() }
  }
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  const history = [
    { id: 'welcome', title: '欢迎使用智能助手', meta: '刚刚' },
    { id: 'design', title: '产品设计讨论', meta: '昨天' },
    { id: 'plan', title: '制定本周工作计划', meta: '周一' },
  ].filter(item => item.title.toLowerCase().includes(search.toLowerCase()))
  const startNewChat = () => { resetConversation(); setActiveChat('new') }

  return (
    <div className="chat-page">
      <aside className={`chat-drawer ${drawerOpen ? '' : 'collapsed'}`}>
        <div className="drawer-top"><div className="brand-mark">✦</div><strong>Ming AI</strong><button className="collapse-button" onClick={() => setDrawerOpen(false)}>‹</button></div>
        <button className="new-chat-button" onClick={startNewChat}>＋ 新建对话</button>
        <label className="search-box">⌕<input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索对话" /></label>
        <div className="history-heading">最近对话 <span>{history.length}</span></div>
        <nav className="history-list">{history.map(item => <button className={`history-item ${activeChat === item.id ? 'active' : ''}`} key={item.id} onClick={() => setActiveChat(item.id)}>◌ <span>{item.title}</span><small>{item.meta}</small></button>)}</nav>
        <div className="drawer-user"><div className="user-avatar">M</div><div><strong>Murphy</strong><span>个人工作区</span></div><button>···</button></div>
      </aside>
      {!drawerOpen && <div className="collapsed-tools" aria-label="抽屉快捷操作">
        <button onClick={() => setDrawerOpen(true)} aria-label="展开抽屉">☰</button>
        <button onClick={() => setDrawerOpen(true)} aria-label="搜索">⌕</button>
        <button onClick={startNewChat} aria-label="开启新对话">＋</button>
      </div>}
      <section className="chat-shell">
      <main className="chat-content">
        {messages.length === 0 ? <section className="welcome-state">
          <div className="welcome-icon">✦</div><h2>今天想聊点什么？</h2>
          <p>向我提问、写点东西，或上传文件一起分析。</p>
          <div className="suggestions">{['帮我整理一份计划', '解释一个复杂概念', '写一段创意文案'].map(item => <button key={item} onClick={() => setInputText(item)}>{item}<span>→</span></button>)}</div>
        </section> : <section className="message-list">
          {messages.map(message => { const isUser = message.sender === 'user'; return <div className={`message-row ${isUser ? 'user' : 'assistant'}`} key={message.id}>
            {!isUser && <div className="avatar">✦</div>}
            <div className={`message-bubble ${message.status === 'pending' ? 'pending' : ''}`}>{message.message}{message.status === 'error' && <small>发送失败，请重试</small>}</div>
          </div> })}
          {isLoading && <div className="message-row assistant"><div className="avatar">✦</div><div className="message-bubble typing"><i /><i /><i /></div></div>}
          <div ref={messageEndRef} />
        </section>}
      </main>
      <footer className="composer-area">
        {selectedFile && <div className="file-chip"><span>📎</span>{selectedFile.name}<button onClick={() => setSelectedFile(null)} aria-label="移除文件">×</button></div>}
        <div className="composer">
          <input ref={fileInputRef} type="file" onChange={onFileChange} hidden />
          <button className="icon-button" onClick={() => fileInputRef.current?.click()} aria-label="上传文件">＋</button>
          <textarea value={inputText} onChange={event => setInputText(event.target.value)} onKeyDown={onKeyDown} placeholder="输入消息..." rows={1} disabled={isLoading} aria-label="消息输入框" />
          <button className="send-button" onClick={handleSend} disabled={isLoading || !inputText.trim()} aria-label="发送消息">↑</button>
        </div>
        <p className="composer-hint">Enter 发送 · Shift + Enter 换行</p>
      </footer>
      </section>
      <style>{styles}</style><style>{extraStyles}</style>
    </div>
  )
}

const extraStyles = `body{margin:0}.chat-page{flex-direction:row;background:#f8faff}.chat-shell{min-width:0;flex:1;display:flex;flex-direction:column}.chat-drawer{width:272px;flex:none;display:flex;flex-direction:column;padding:20px 14px 14px;background:#fff;border-right:1px solid #e9edf4}.drawer-top{display:flex;align-items:center;gap:10px;padding:0 7px 23px}.collapse-button,.drawer-user button{margin-left:auto;border:0;background:transparent;color:#9ca6b5;font-size:22px;cursor:pointer}.new-chat-button{height:42px;border:1px solid #dce3f1;border-radius:11px;background:#fff;color:#4965d7;font-weight:600;cursor:pointer}.search-box{display:flex;align-items:center;gap:8px;margin:18px 3px 24px;padding:9px 11px;border-radius:9px;background:#f5f7fa;color:#a0aaba}.search-box input{width:100%;border:0;outline:0;background:transparent;font:inherit;font-size:12px}.history-heading{display:flex;justify-content:space-between;padding:0 8px 9px;color:#9aa4b1;font-size:11px;font-weight:700}.history-list{display:flex;flex-direction:column;gap:4px}.history-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px 9px;border:0;border-radius:9px;background:transparent;color:#687486;text-align:left;cursor:pointer;font-size:12px}.history-item.active,.history-item:hover{background:#f1f4ff;color:#435bd0}.history-item small{margin-left:auto;color:#aeb7c3;font-size:10px}.drawer-user{display:flex;align-items:center;gap:9px;margin-top:auto;padding:12px 8px 3px;border-top:1px solid #edf0f5}.user-avatar{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#e8ecff;color:#596fd6;font-size:12px;font-weight:700}.drawer-user strong,.drawer-user span{display:block}.drawer-user span{margin-top:3px;color:#a0a9b6;font-size:10px}.chat-drawer.collapsed{display:none}.collapsed-tools{position:fixed;top:18px;left:18px;z-index:4;display:flex;flex-direction:row;gap:8px}.collapsed-tools button{width:42px;height:42px;border:1px solid #e1e6f0;border-radius:10px;background:#fff;color:#596fd6;font-size:18px;cursor:pointer}@media(max-width:720px){.chat-drawer{position:fixed;z-index:2;inset:0 auto 0 0;box-shadow:8px 0 30px rgba(28,42,72,.14)}}`

const styles = `
*{box-sizing:border-box}.chat-page{min-height:100vh;display:flex;flex-direction:column;color:#17202a;background:radial-gradient(circle at 50% -20%,#f1f7ff 0,#fff 42%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.chat-header{height:76px;padding:0 32px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #edf0f4;background:rgba(255,255,255,.8)}.brand-mark,.welcome-icon,.avatar{display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#5b7cff,#8d6cf0);box-shadow:0 8px 18px rgba(91,124,255,.22)}.brand-mark{width:34px;height:34px;border-radius:10px;font-size:19px}.chat-header h1{margin:0;font-size:16px}.chat-header p{margin:3px 0 0;color:#9aa4b2;font-size:12px}.online-status{margin-left:auto;color:#7c8795;font-size:12px;display:flex;gap:6px;align-items:center}.online-status i{width:7px;height:7px;border-radius:50%;background:#38c793}.chat-content{flex:1;width:100%;max-width:880px;margin:0 auto;padding:34px 24px 20px}.welcome-state{min-height:min(58vh,500px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.welcome-icon{width:58px;height:58px;border-radius:18px;font-size:30px;margin-bottom:20px}.welcome-state h2{margin:0;font-size:clamp(24px,4vw,31px);letter-spacing:-.8px}.welcome-state p{margin:12px 0 28px;color:#8c97a6;font-size:14px}.suggestions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}.suggestions button{border:1px solid #e6eaf0;background:#fff;color:#596575;border-radius:10px;padding:10px 13px;cursor:pointer;font-size:13px;transition:.2s}.suggestions button:hover{border-color:#aebdfd;color:#536ce0;transform:translateY(-1px)}.suggestions span{margin-left:12px;color:#aeb8c6}.message-list{display:flex;flex-direction:column;gap:22px;padding:10px 0 30px}.message-row{display:flex;align-items:flex-start;gap:10px}.message-row.user{justify-content:flex-end}.avatar{width:28px;height:28px;flex:0 0 auto;border-radius:9px;font-size:14px}.message-bubble{max-width:min(72%,620px);padding:12px 15px;border-radius:15px;background:#f4f6f9;color:#293442;white-space:pre-wrap;word-break:break-word;line-height:1.55;font-size:14px}.message-row.user .message-bubble{color:#fff;background:#5b7cff;border-bottom-right-radius:4px}.message-row.assistant .message-bubble{border-bottom-left-radius:4px}.message-bubble.pending{opacity:.65}.message-bubble small{display:block;margin-top:6px;color:#d95d5d}.typing{display:flex;gap:4px;padding:16px}.typing i{width:5px;height:5px;border-radius:50%;background:#aab4c3;animation:bounce 1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}@keyframes bounce{50%{transform:translateY(-3px);opacity:.5}}.composer-area{width:100%;max-width:880px;margin:auto;padding:0 24px 22px}.composer{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 13px;border:1px solid #dfe4ec;border-radius:16px;background:#fff;box-shadow:0 8px 30px rgba(37,52,75,.07)}.composer textarea{flex:1;resize:none;border:0;outline:0;color:#283445;font:inherit;font-size:14px;line-height:24px;max-height:120px;background:transparent}.composer textarea::placeholder{color:#a7b0bc}.icon-button,.send-button{border:0;cursor:pointer}.icon-button{width:30px;height:30px;border-radius:8px;color:#8994a3;background:transparent;font-size:25px;font-weight:300}.icon-button:hover{background:#f1f4f8;color:#5265ce}.send-button{width:34px;height:34px;border-radius:10px;color:#fff;background:#5b7cff;font-size:20px;line-height:1}.send-button:disabled{color:#b7bfca;background:#edf0f4;cursor:not-allowed}.composer-hint{margin:9px 0 0;text-align:center;color:#afb7c2;font-size:11px}.file-chip{display:inline-flex;align-items:center;gap:7px;max-width:100%;margin:0 0 8px;padding:6px 9px;color:#657183;border:1px solid #e2e7ef;border-radius:8px;background:#fafbfc;font-size:12px}.file-chip button{border:0;color:#9aa5b3;background:transparent;cursor:pointer;font-size:16px}@media(max-width:600px){.chat-header{padding:0 18px}.chat-content{padding:20px 16px}.composer-area{padding:0 16px 16px}.message-bubble{max-width:84%}.suggestions{flex-direction:column;width:min(100%,280px)}.suggestions button{text-align:left}}
`



