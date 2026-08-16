import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { chatMessageHook } from "../hook";

export interface ChatChatroomProps {}
export const ChatChatroom: React.FC<ChatChatroomProps> = () => {
  const { input, setInput, sending, messages, sendStream } = chatMessageHook();
  const send = sendStream;

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrollUp, setIsUserScrollUp] = useState(false);

  const handleScroll = () => {
    const container = messageContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    setIsUserScrollUp(!isAtBottom);
  };

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container || isUserScrollUp) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isUserScrollUp]);

  return (
    <main
      className={`feature-chatroom ${messages.length ? "has-messages" : "is-empty"}`}
    >
      {messages.length > 0 && (
        <section
          ref={messageContainerRef}
          className="feature-messages flex flex-col gap-8"
          onScroll={handleScroll}
          style={{ overflowY: "auto", flex: 1 }}
        >
          {messages.map((message) => {
            return (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* 气泡容器，强制换行兜底 */}
                <div
                  className={`feature-message ${message.role}`}
                  style={{
                    maxWidth: message.role === "user" ? "50%" : "100%",
                    wordBreak: "break-all",
                    whiteSpace: "normal",
                  }}
                >
                  {message.role === "assistant" ? (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{message.text}</span>
                  )}
                </div>
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
            className="w-full resize-y overflow-auto whitespace-pre-wrap"
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
          ></button>
        </footer>
      </section>
    </main>
  );
};
