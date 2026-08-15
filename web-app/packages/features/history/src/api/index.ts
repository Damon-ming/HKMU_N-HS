import type { HistoryItem } from '../types'
export const historyStore = { list(): HistoryItem[] { return [{ id: 'welcome', title: '欢迎使用智能助手', meta: '刚刚' }, { id: 'design', title: '产品设计讨论', meta: '昨天' }, { id: 'plan', title: '制定本周工作计划', meta: '周一' }] } }
