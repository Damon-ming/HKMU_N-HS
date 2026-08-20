import type { AccountProfile } from "./types"
const key = "ming-ai-account"
const fallback: AccountProfile = { id: "murphy", name: "Murphy", avatarText: "M" }
export const accountStore = {
  current(): AccountProfile {
    if (typeof window === "undefined") return fallback
    try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") } } catch { return fallback }
  },
  update(name: string) {
    const normalized = name.trim() || fallback.name
    const profile = { ...fallback, ...this.current(), name: normalized, avatarText: normalized.slice(0, 1).toUpperCase() }
    localStorage.setItem(key, JSON.stringify(profile))
    return profile
  },
}
