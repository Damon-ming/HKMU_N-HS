import React from "react";
import { useDrawerHook } from "../hook";

export const ChatDrawer: React.FC = () => {
  const {
    open,
    toggle,
    list,
    groups,
    activeId,
    account,
    openSearch,
    openAccount,
    upload,
    newChat,
    selectChat,
    uploadFiles,
    deleteHistory,
  } = useDrawerHook();
  return (
    <aside className={`feature-chat-drawer ${open ? "" : "is-collapsed"}`}>
      {open ? (
        <>
          <div className="feature-drawer-top">
            <div className="feature-brand">✦</div>
            <strong>Ming AI</strong>
            <button onClick={toggle}>‹</button>
          </div>
          <button className="feature-new-chat" onClick={newChat}>
            ＋ 新建对话
          </button>
          <label className="feature-upload-file">
            <span>
              {upload.status === "uploading"
                ? "◌ 正在上传文件..."
                : "⌁ 上传文件"}
            </span>
            <input
              hidden
              multiple
              accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.csv"
              type="file"
              onChange={(event) => uploadFiles(event.target.files)}
            />
          </label>
          <button type="button" className="feature-search" onClick={openSearch}>
            ⌕<span>搜索对话</span>
          </button>
          <div className="feature-history-title">
            最近对话 <span>{list.length}</span>
          </div>
          <nav>
            {groups.map((group) => (
              <React.Fragment key={group.label}>
                <div className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <button
                    className={`feature-history-item ${activeId === item.id ? "is-active" : ""}`}
                    key={item.id}
                    onClick={() => selectChat(item.id)}
                  >
                    ◌ <span>{item.title}</span>
                    <i
                      role="button"
                      tabIndex={0}
                      title="删除记录"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteHistory(item.id);
                      }}
                    >
                      ×
                    </i>
                  </button>
                ))}
              </React.Fragment>
            ))}
          </nav>
          <button
            className="feature-user"
            type="button"
            onClick={() => openAccount(account.name)}
          >
            <span>{account.avatarText}</span>
            <strong>{account.name}</strong>
            <small>账户设置 ›</small>
          </button>
        </>
      ) : (
        <div className="feature-collapsed-tools">
          <button onClick={toggle} aria-label="展开抽屉">
            ☰
          </button>
          <button onClick={openSearch} aria-label="搜索">
            ⌕
          </button>
          <button onClick={newChat} aria-label="新建对话">
            ＋
          </button>
          <label className="feature-collapsed-upload" aria-label="上传文件">
            ⌁
            <input
              hidden
              multiple
              type="file"
              onChange={(event) => uploadFiles(event.target.files)}
            />
          </label>
        </div>
      )}
    </aside>
  );
};
