import React, { useRef, useEffect, useState } from "react";
import { chatMessageHook } from "../hook";

export interface ChatChatroomProps {}
export const ChatChatroom: React.FC<ChatChatroomProps> = () => {
  const {
    input,
    setInput,
    sending,
    messages,
    sendStream,
  } = chatMessageHook();
  const send = sendStream;

  // 消息列表容器ref
  const messageContainerRef = useRef<HTMLDivElement>(null);
  // 判断用户是否手动向上滚动，离开底部
  const [isUserScrollUp, setIsUserScrollUp] = useState(false);

  // 监听滚动事件：判断用户是否停留在底部
  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    // 距离底部小于10px，视为在底部
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    setIsUserScrollUp(!isAtBottom);
  };

  // messages 发生变化时自动滚动到底部
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container || isUserScrollUp) return;
    // 滚动到最底部
    container.scrollTop = container.scrollHeight;
  }, [messages, isUserScrollUp]);

  return (
    <main
      className={`feature-chatroom ${messages.length ? "has-messages" : "is-empty"}`}
    >
      {messages.length > 0 && (
        // 绑定ref + 滚动监听
        <section
          ref={messageContainerRef}
          className="feature-messages"
          onScroll={handleScroll}
          style={{ overflowY: "auto", flex: 1 }}
        >
          {messages.map((message, index) => {
            const senderType = index % 2 === 0 ? "user" : "assistant";
            return (
              <div className={`feature-message ${senderType}`} key={message.id}>
                {message.text}
              </div>
            );
          })}
        </section>
      )}
      <section className="feature-composer-area">
        {messages.length === 0 && (
          <section className="feature-welcome">
            <div>✦</div>
            <h1>今天想聊点什么？</h1>
            <p>向我提问、写点东西，或上传文件一起分析。</p>
          </section>
        )}
        <footer className="feature-composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={"输入消息..."}
            disabled={sending}
          />
          <button
            onClick={() => void send()}
            aria-label="发送消息"
            disabled={sending}
          >
          </button>
        </footer>
      </section>
    </main>
  );
};
