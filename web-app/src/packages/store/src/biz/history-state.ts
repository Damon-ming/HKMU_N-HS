import { createAppStore } from "../app-store";

export interface HistoryState {
  revision: number;
  activeId: string | null;
  loading: boolean;
  skipSave: boolean;
  notifyChanged: () => void;
  setActiveId: (id: string | null) => void;
  beginLoad: () => void;
  finishLoad: () => void;
  clearSkipSave: () => void;
}

export const useHistoryStore = createAppStore<HistoryState>((set) => ({
  revision: 0,
  activeId: null,
  loading: false,
  skipSave: false,
  notifyChanged: () => set((state) => ({ revision: state.revision + 1 })),
  setActiveId: (activeId) => set({ activeId }),
  beginLoad: () => set({ loading: true, skipSave: false }),
  finishLoad: () => set({ loading: false, skipSave: true }),
  clearSkipSave: () => set({ skipSave: false }),
}));
