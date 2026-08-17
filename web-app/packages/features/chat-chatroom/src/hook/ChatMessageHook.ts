import { useState } from "react";
import { ChatRoomMessage, ChatRoomRequest } from "../types";
import { sendChatRoomMessage, streamChatRoomMessage } from "../api";
import { createLogger } from "@ming/core-log";

const log = createLogger("chat-chatroom/hook");

export function chatMessageHook() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
  const [sending, setSending] = useState(false);

  // 同步一次性请求（保留备用）
  const sendNormal = async () => {
    const query = input.trim();
    if (!query || sending) {
      log.debug("sendNormal skipped", { hasQuery: Boolean(query), sending });
      return;
    }
    log.debug("sendNormal started", { queryLength: query.length });

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // 预先插入消息，补充role
    setMessages((items) => [
      ...items,
      { id: userMsgId, text: query, role: "user" },
      { id: assistantMsgId, text: "正在思考中...", role: "assistant" },
    ]);
    setInput("");
    setSending(true);

    try {
      const req: ChatRoomRequest = {
        query,
        think: false,
      };
      const res = await sendChatRoomMessage(req);
      log.debug("sendNormal succeeded");
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
      log.error("sendNormal failed", e);
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
    if (!query || sending) {
      log.debug("sendStream skipped", { hasQuery: Boolean(query), sending });
      return;
    }
    log.debug("sendStream started", { queryLength: query.length });

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setMessages((items) => [
      ...items,
      { id: userMsgId, text: query, role: "user" },
      { id: assistantMsgId, text: "正在思考中...", role: "assistant" },
    ]);
    setInput("");
    setSending(true);

    let firstChunk = true;
    let streamFinished = false;

    try {
      const req: ChatRoomRequest = {
        query,
        think: false,
      };

      await streamChatRoomMessage(req, (payload) => {
        log.debug("sendStream received event", { event: payload.event });
        if (payload.event === "delta") {
          const data = payload.data as { answer_content: string };
          const delta = data.answer_content || "";
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === assistantMsgId) {
                if (firstChunk) {
                  firstChunk = false;
                  return { ...msg, text: delta };
                }
                return { ...msg, text: msg.text + delta };
              }
              return msg;
            })
          );
        } else if (payload.event === "done") {
          streamFinished = true;
        } else if (payload.event === "error") {
          streamFinished = true;
          const errData = payload.data as { error_msg: string };
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, text: `请求异常：${errData.error_msg}` }
                : msg
            )
          );
        }
      });
    } catch (e) {
      log.error("sendStream failed", e);
      const errMsg = e instanceof Error ? e.message : "消息发送失败，请稍后重试";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, text: `${errMsg}` }
            : msg
        )
      );
    } finally {
      log.debug("sendStream finished", { streamFinished });
      // 只有流没有正常结束才在这里修改状态
      if (!streamFinished) {
        setSending(false);
      }
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
