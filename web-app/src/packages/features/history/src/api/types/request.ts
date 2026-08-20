import type { HistoryMessage } from "./response"

export interface SaveHistoryRequest { title: string; messages: HistoryMessage[] }
