import React from "react";
import { chatMessageHook } from "../hook";

export interface ChatChatroomProps {}
export const ChatChatroom: React.FC<ChatChatroomProps> = () => {
  const {
    input,
    setInput,
    sending,
    messages,
    sendStream, // 注意：你hook现在导出是 sendStream / sendNormal，不再是 send
    error: messageError,
  } = chatMessageHook();
  const error = messageError;

  return (
    <main
      className={`feature-chatroom ${messages.length ? "has-messages" : "is-empty"}`}
    >
      {messages.length > 0 && (
        <section className="feature-messages">
          {messages.map((message, index) => {
            // 偶数 = 用户消息，奇数 = AI消息
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
        {error && <p role="alert">{error}</p>}
        <footer className="feature-composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendStream();
              }
            }}
            placeholder={"输入消息..."}
            disabled={sending}
          />
          <button
            onClick={() => void sendStream()}
            aria-label="发送消息"
            disabled={sending}
          >
          </button>
        </footer>
      </section>
    </main>
  );
};
