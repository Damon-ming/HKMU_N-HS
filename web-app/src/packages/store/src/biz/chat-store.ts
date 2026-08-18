import { createAppStore } from "../app-store";

export interface ChatMessage {
  id: string;
  text: string;
  role: "user" | "assistant";
}
export interface ChatState {
  drawerOpen: boolean;
  sessionId: number;
  input: string;
  messages: ChatMessage[];
  sending: boolean;
  toggleDrawer: () => void;
  setInput: (input: string) => void;
  setSending: (sending: boolean) => void;
  setMessages: (
    updater: ChatMessage[] | ((messages: ChatMessage[]) => ChatMessage[]),
  ) => void;
  resetSession: () => void;
}

export const useChatStore = createAppStore<ChatState>((set) => ({
  drawerOpen: true,
  sessionId: 0,
  input: "",
  messages: [],
  sending: false,
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  setInput: (input) => set({ input }),
  setSending: (sending) => set({ sending }),
  setMessages: (updater) =>
    set((state) => ({
      messages:
        typeof updater === "function" ? updater(state.messages) : updater,
    })),
  resetSession: () =>
    set((state) => ({
      sessionId: state.sessionId + 1,
      input: "",
      messages: [],
      sending: false,
    })),
}));
