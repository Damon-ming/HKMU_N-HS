import React from "react";
import { useChatRoomController } from "../hook";

export const ChatChatroom: React.FC = () => {
  const {
    input,
    setInput,
    fileName,
    uploading,
    error,
    sending,
    messages,
    send,
    handleFileChange,
  } = useChatRoomController();
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
          <label aria-label="上传图片">
            ＋
            <input
              hidden
              multiple
              accept="image/*"
              type="file"
              onChange={(e) => handleFileChange(e.target.files)}
            />
          </label>
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
              uploading ? "正在上传图片..." : fileName || "输入消息..."
            }
            disabled={uploading || sending}
          />
          <button onClick={() => void send()} aria-label="发送消息" disabled={uploading || sending}>
            ↑
          </button>
        </footer>
        <p className="feature-hint">Enter 发送 · Shift + Enter 换行</p>
      </section>
    </main>
  );
};
