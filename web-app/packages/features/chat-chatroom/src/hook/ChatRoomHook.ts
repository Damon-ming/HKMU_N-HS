import { useState } from "react";
import { useUploadApi } from "@ming/features-upload-api";
import { sendChatRoomMessage } from "../api";
import type { ChatRoomMessage } from "../types";

export function chatRoomHook() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    const message = input.trim();
    if (!message || uploading || sending) return;
    const tempId = "temp-" + Date.now();
    setMessages((items) => [
      ...items,
      { id: tempId, text: message, sender: "user" },
    ]);
    setInput("");
    setSending(true);
    try {
      const response = await sendChatRoomMessage({
        message,
        tempId,
        requestId: crypto.randomUUID(),
        requestedAt: Date.now(),
      });
      if (response.data) {
          const { id, message: text, sender } = response.data
          setMessages((items) => [
              ...items,
              {
                  id,
                  text,
                  sender: sender ?? 'assistant', 
              },
          ])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "消息发送失败");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (fileList?: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    setError("");
    setUploading(true);
    try {
      const response = await useUploadApi(files);
      console.log(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件上传失败");
    } finally {
      setUploading(false);
    }
  };
  return {
    input,
    setInput,
    messages,
    fileName,
    uploading,
    sending,
    error,
    send,
    handleFileChange,
  };
}
