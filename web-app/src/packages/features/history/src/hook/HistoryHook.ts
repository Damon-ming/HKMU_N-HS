import { useCallback, useMemo } from "react"
import { historyStore } from "../api"
import type { HistoryMessage } from "../api/types"
import { getCalendarDayDistance, getMonthParts } from "@ming/core-util"

function getHistoryGroupLabel(createdAt: number): string {
  const days = getCalendarDayDistance(createdAt)
  if (days === 0) return "今天"
  if (days === 1) return "昨天"
  if (days < 7) return "1周内"
  if (days < 30) return "30天内"
  const { year, month } = getMonthParts(createdAt)
  return `${year}.${month}`
}

export function useHistory(revision = 0) {
  const list = useMemo(() => historyStore.list(), [revision])
  const saveMessages = useCallback((title: string, messages: HistoryMessage[]) => historyStore.saveMessages(title, messages), [])
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof list>()
    for (const item of [...list].sort((a, b) => b.createdAt - a.createdAt)) {
      const label = getHistoryGroupLabel(item.createdAt)
      grouped.set(label, [...(grouped.get(label) || []), item])
    }
    return [...grouped.entries()].map(([label, items]) => ({ label, items }))
  }, [list])
  return { list, groups, getMessages: historyStore.messages, saveMessages, remove: historyStore.remove, add: historyStore.add }
}

export const historyActions = {
  list: historyStore.list,
  messages: historyStore.messages,
  saveMessages: historyStore.saveMessages,
  add: historyStore.add,
  remove: historyStore.remove,
}
