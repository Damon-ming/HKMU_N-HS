import { useState } from "react";
import { sendChatRoomMessage } from "../api";
import type { ChatRoomMessage } from "../types";

export function chatMessageHook() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const message = input.trim();
    if (!message || sending) return;

    const tempId = "temp-" + Date.now();
    setMessages((items) => [...items, { id: tempId, text: message, sender: "user" }]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const response = await sendChatRoomMessage({
        message,
        tempId,
        requestId: crypto.randomUUID(),
        requestedAt: Date.now(),
      });
      if (response.data) {
        const { id, message: text, sender } = response.data;
        setMessages((items) => [...items, { id, text, sender: sender ?? "assistant" }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "消息发送失败");
    } finally {
      setSending(false);
    }
  };

  return { input, setInput, messages, sending, error, send };
}
