import { useState } from "react";
import { sendChatRoomMessage, streamChatRoomMessage } from "../api";
import type { ChatRoomMessage, ChatRoomRequest } from "../types";

export function chatMessageHook() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
  const [sending, setSending] = useState(false);

  // 同步一次性请求（保留备用）
  const sendNormal = async () => {
    const query = input.trim();
    if (!query || sending) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // 预先插入消息，AI气泡初始显示加载文案
    setMessages((items) => [
      ...items,
      { id: userMsgId, text: query },
      { id: assistantMsgId, text: "正在思考中..." },
    ]);
    setInput("");
    setSending(true);

    try {
      const req: ChatRoomRequest = {
        query,
        think: false,
      };
      const res = await sendChatRoomMessage(req);
      const data = res.data;
      if (data) {
        setMessages((items) =>
          items.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, text: data.answer_content }
              : msg
          )
        );
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "消息发送失败，请稍后重试";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: `${errMsg}` }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  // SSE流式（默认使用）
  const sendStream = async () => {
    const query = input.trim();
    if (!query || sending) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // AI气泡初始展示加载提示「正在思考中...」
    setMessages((items) => [
      ...items,
      { id: userMsgId, text: query },
      { id: assistantMsgId, text: "正在思考中..." },
    ]);
    setInput("");
    setSending(true);

    let firstChunk = true;

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
            prev.map((msg) => {
              if (msg.id === assistantMsgId) {
                // 第一条分片到来：直接丢弃加载文字，使用第一段内容
                if (firstChunk) {
                  firstChunk = false;
                  return { ...msg, text: delta };
                }
                // 后续分片：持续追加
                return { ...msg, text: msg.text + delta };
              }
              return msg;
            })
          );
        } else if (payload.event === "done") {
          setSending(false);
        } else if (payload.event === "error") {
          const errData = payload.data as { error_msg: string };
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: `请求异常：${errData.error_msg}` }
                : msg
            )
          );
          setSending(false);
        }
      });
    } catch (e) {
      // 网络异常、接口请求失败统一捕获
      const errMsg = e instanceof Error ? e.message : "消息发送失败，请稍后重试";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: `${errMsg}` }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  return {
    input,
    setInput,
    messages,
    sending,
    sendNormal,
    sendStream,
  };
}