import React, { useState } from 'react'
import type { ChatHistoryItem } from '../types'

export interface ChatDrawerProps {
  open: boolean
  onToggle: () => void
  onNewChat: () => void
  onSelectChat?: (id: string) => void
}

const history: ChatHistoryItem[] = [
  { id: 'welcome', title: '欢迎使用智能助手', meta: '刚刚' },
  { id: 'design', title: '产品设计讨论', meta: '昨天' },
  { id: 'plan', title: '制定本周工作计划', meta: '周一' },
]

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onToggle, onNewChat, onSelectChat }) => {
  const [search, setSearch] = useState('')
  const items = history.filter(item => item.title.includes(search))
  return <aside className={`feature-chat-drawer ${open ? '' : 'is-collapsed'}`}>
    {open ? <><div className="feature-drawer-top"><div className="feature-brand">✦</div><strong>Ming AI</strong><button onClick={onToggle}>‹</button></div>
      <button className="feature-new-chat" onClick={onNewChat}>＋ 新建对话</button>
      <label className="feature-search">⌕<input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索对话" /></label>
      <div className="feature-history-title">最近对话 <span>{items.length}</span></div>
      <nav>{items.map(item => <button className="feature-history-item" key={item.id} onClick={() => onSelectChat?.(item.id)}>◌ <span>{item.title}</span><small>{item.meta}</small></button>)}</nav>
      <div className="feature-user"><span>M</span><strong>Murphy</strong></div></>
      : <div className="feature-collapsed-tools"><button onClick={onToggle} aria-label="展开抽屉">☰</button><button onClick={onToggle} aria-label="搜索">⌕</button><button onClick={onNewChat} aria-label="新建对话">＋</button></div>}
  </aside>
}
