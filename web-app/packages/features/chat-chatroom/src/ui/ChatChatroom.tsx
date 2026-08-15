import React from "react";
import { chatMessageHook } from "../hook";

export interface ChatChatroomProps { fileName: string; uploading: boolean; uploadError: string }
export const ChatChatroom: React.FC<ChatChatroomProps> = ({ fileName, uploading, uploadError }) => {
  const {
    input,
    setInput,
    sending,
    messages,
    send,
    error: messageError,
  } = chatMessageHook();
  const error = messageError || uploadError;
  return (
    <main
      className={`feature-chatroom ${messages.length ? "has-messages" : "is-empty"}`}
    >
      {messages.length > 0 && (
        <section className="feature-messages">
          {messages.map((message) => (
            <div
              className={`feature-message ${message.sender}`}
              key={message.id}
            >
              {message.text}
            </div>
          ))}
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
        {error && <p role="alert">{error}</p>}
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
            placeholder={
              uploading ? "正在上传文件..." : fileName || "输入消息..."
            }
            disabled={uploading || sending}
          />
          <button
            onClick={() => void send()}
            aria-label="发送消息"
            disabled={uploading || sending}
          >
          </button>
        </footer>
      </section>
    </main>
  );
};
