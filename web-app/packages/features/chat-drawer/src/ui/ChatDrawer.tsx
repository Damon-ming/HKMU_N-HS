import React, { useMemo, useState } from "react"
import { getHistoryList } from "@ming/features-history-api"
import { searchHistory } from "@ming/features-search-api"
import { getCurrentAccount } from "@ming/features-account-api"
import { useUploadApi } from "@ming/features-upload-api"

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
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const items = useMemo(
    () => (search ? searchHistory(search) : getHistoryList()),
    [search],
  );
  const account = getCurrentAccount();
  const onUploadFile = async (fileList?: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    setUploadNotice("");
    setUploading(true);
    try {
      await useUploadApi(files);
      setUploadNotice("文件上传成功");
      window.setTimeout(() => setUploadNotice(""), 2800);
    } catch (e) {
      setUploadNotice(e instanceof Error ? e.message : "文件上传失败");
    } finally {
      setUploading(false);
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
          {uploadNotice && <div className="feature-upload-toast" role="status">✓ {uploadNotice}</div>}
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
      <style>{`.feature-upload-toast{margin:10px 0 0;padding:10px 12px;border:1px solid #b7ebd1;border-radius:12px;background:#effcf5;color:#16794a;font-size:12px;font-weight:600;box-shadow:0 8px 18px rgba(22,121,74,.1);animation:feature-upload-toast-in .25s ease-out}@keyframes feature-upload-toast-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}`}</style>
    </aside>
  );
};
