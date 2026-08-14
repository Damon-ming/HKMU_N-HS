// app/main/src/App.tsx
import React from 'react'
// 1. 从数据层引入统一的 DataProvider，壳层不需要关心底层是 React Query 还是其他库

import { DataProvider } from '@ming/data-layer'
// 2. 引入业务 Feature 页面
import { ChatView } from '@ming/features-chat'

export const App: React.FC = () => {
  return (
    <DataProvider>
      {/* 业务/路由挂载点 */}
      <ChatView />
    </DataProvider>
  )
}