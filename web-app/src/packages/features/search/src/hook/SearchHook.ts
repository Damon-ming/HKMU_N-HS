import { useMemo } from "react"
import type { SearchOptions } from "../api/types/request"
import type { SearchResultItem } from "../api/types/response"

export const searchItems = <T extends SearchResultItem>(items: T[], keyword: string) => {
  const normalized = keyword.trim().toLocaleLowerCase()
  return normalized ? items.filter((item) => item.title.toLocaleLowerCase().includes(normalized) || (item.messages || []).some((message) => message.text.toLocaleLowerCase().includes(normalized))) : items
}

export function useSearch<T extends { title: string; messages?: Array<{ text: string }> }>(items: T[], options: SearchOptions) {
  return useMemo(() => searchItems(items, options.keyword), [items, options.keyword])
}
