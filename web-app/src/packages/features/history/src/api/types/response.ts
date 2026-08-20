export interface HistoryMessage { id: string; text: string; role: "user" | "assistant" }
export interface HistoryItem { id: string; title: string; meta: string; createdAt: number; messages?: HistoryMessage[] }
