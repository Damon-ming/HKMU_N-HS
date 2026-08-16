import { useState } from "react";
import { sendChatRoomMessage, streamChatRoomMessage } from "../api";
import type { ChatRoomMessage, ChatRoomRequest } from "../types";

export function chatMessageHook() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // 同步一次性请求
  const sendNormal = async () => {
    const query = input.trim();
    if (!query || sending) return;

    const userMsgId = `user-${Date.now()}`;
    setMessages((items) => [...items, { id: userMsgId, text: query }]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const req: ChatRoomRequest = {
        query,
        think: false,
      };
      const res = await sendChatRoomMessage(req);
      const data = res.data;
      if (data) {
        const assistantId = `assistant-${Date.now()}`;
        setMessages((items) => [
          ...items,
          { id: assistantId, text: data.answer_content },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "消息发送失败");
    } finally {
      setSending(false);
    }
  };

  // SSE 流式打字效果（推荐使用）
  const sendStream = async () => {
    const query = input.trim();
    if (!query || sending) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // 先插入用户消息 + 空助手占位消息，移除sender
    setMessages((items) => [
      ...items,
      { id: userMsgId, text: query },
      { id: assistantMsgId, text: "" },
    ]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const req: ChatRoomRequest = {
        query,
        think: false,
      };

      await streamChatRoomMessage(req, (payload) => {
        if (payload.event === "delta") {
          const data = payload.data as { answer_content: string };
          const delta = data.answer_content || "";
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: msg.text + delta }
                : msg,
            ),
          );
        } else if (payload.event === "done") {
          setSending(false);
        } else if (payload.event === "error") {
          const errData = payload.data as { error_msg: string };
          setError(errData.error_msg || "流式请求异常");
          setSending(false);
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "消息发送失败");
    } finally {
      setSending(false);
    }
  };

  return {
    input,
    setInput,
    messages,
    sending,
    error,
    sendNormal,
    sendStream,
  };
}