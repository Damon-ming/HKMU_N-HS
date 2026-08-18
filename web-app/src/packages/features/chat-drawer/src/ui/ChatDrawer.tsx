import React, { useMemo, useState } from "react"
import { getHistoryList } from "@ming/features-history-api"
import { searchHistory } from "@ming/features-search-api"
import { getCurrentAccount } from "@ming/features-account-api"
import { useUploadApi } from "@ming/features-upload-api"
import { useChatUploadStore } from "@ming/store/biz/chat-state"

export interface ChatDrawerProps {
  open: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat?: (id: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  open,
  onToggle,
  onNewChat,
  onSelectChat,
}) => {
  const [search, setSearch] = useState("");
  const uploading = useChatUploadStore((state) => state.upload.status === "uploading");
  const startUpload = useChatUploadStore((state) => state.startUpload);
  const finishUpload = useChatUploadStore((state) => state.finishUpload);
  const items = useMemo(
    () => (search ? searchHistory(search) : getHistoryList()),
    [search],
  );
  const account = getCurrentAccount();
  const onUploadFile = async (fileList?: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    startUpload(files.map((file) => file.name));
    try {
      const response = await useUploadApi(files);
      // dataApi 已将服务端成功响应解包为 { bizCode, data }。
      // 只要业务码是成功码，就不能因为展示字段缺失而误报上传失败。
      if (response.bizCode >= 40000) {
        throw new Error("服务端返回上传失败");
      }
      const resultFiles = Array.isArray(response.data?.files) ? response.data.files : [];
      const allIndexed = resultFiles.length === 0 || resultFiles.every((file) => file.indexed || file.duplicate);
      finishUpload("success", allIndexed ? "文件已经进入语料库" : "文件已上传，部分词条仍在更新", resultFiles);
    } catch (e) {
      const error = e as { errData?: { error_msg?: string }; clientErrData?: { message?: string } };
      finishUpload("error", error.errData?.error_msg ?? error.clientErrData?.message ?? (e instanceof Error ? e.message : "文件上传失败"));
    }
  };
  return (
    <aside className={`feature-chat-drawer ${open ? "" : "is-collapsed"}`}>
      {open ? (
        <>
          <div className="feature-drawer-top">
            <div className="feature-brand">✦</div>
            <strong>Ming AI</strong>
            <button onClick={onToggle}>‹</button>
          </div>
          <button className="feature-new-chat" onClick={onNewChat}>
            ＋ 新建对话
          </button>
          <label className="feature-upload-file">
            <span>{uploading ? "◌ 正在上传文件..." : "⌁ 上传文件"}</span>
            <input hidden multiple accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.csv" type="file" onChange={(e) => onUploadFile(e.target.files)} />
          </label>
          <label className="feature-search">
            ⌕
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索对话"
            />
          </label>
          <div className="feature-history-title">
            最近对话 <span>{items.length}</span>
          </div>
          <nav>
            {items.map((item) => (
              <button
                className="feature-history-item"
                key={item.id}
                onClick={() => onSelectChat?.(item.id)}
              >
                ◌ <span>{item.title}</span>
                <small>{item.meta}</small>
              </button>
            ))}
          </nav>
          <div className="feature-user">
            <span>{account.avatarText}</span>
            <strong>{account.name}</strong>
          </div>
        </>
      ) : (
        <div className="feature-collapsed-tools">
          <button onClick={onToggle} aria-label="展开抽屉">
            ☰
          </button>
          <button onClick={onToggle} aria-label="搜索">
            ⌕
          </button>
          <button onClick={onNewChat} aria-label="新建对话">
            ＋
          </button>
          <label className="feature-collapsed-upload" aria-label="上传图片">
            ⌁
            <input hidden multiple accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.csv" type="file" onChange={(e) => onUploadFile(e.target.files)} />
          </label>
        </div>
      )}
    </aside>
  );
};
