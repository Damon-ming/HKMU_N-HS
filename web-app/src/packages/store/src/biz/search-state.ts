import { createAppStore } from "../app-store";

export interface SearchState {
  open: boolean;
  keyword: string;
  openSearch: () => void;
  closeSearch: () => void;
  setKeyword: (keyword: string) => void;
}

export const useSearchStore = createAppStore<SearchState>((set) => ({
  open: false,
  keyword: "",
  openSearch: () => set({ open: true, keyword: "" }),
  closeSearch: () => set({ open: false, keyword: "" }),
  setKeyword: (keyword) => set({ keyword }),
}));
