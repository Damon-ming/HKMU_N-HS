import { searchItems } from '@ming/features-search'
import { getHistoryList } from '@ming/features-history-api'
export const searchHistory = (keyword: string) => searchItems(getHistoryList(), keyword)
