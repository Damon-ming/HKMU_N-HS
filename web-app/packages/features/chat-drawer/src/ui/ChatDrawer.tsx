import React, { useMemo, useState } from "react";
import { getHistoryList } from "@ming/features-history-api";
import { searchHistory } from "@ming/features-search-api";
import { getCurrentAccount } from "@ming/features-account-api";

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
  const items = useMemo(
    () => (search ? searchHistory(search) : getHistoryList()),
    [search],
  );
  const account = getCurrentAccount();
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
        </div>
      )}
    </aside>
  );
};
