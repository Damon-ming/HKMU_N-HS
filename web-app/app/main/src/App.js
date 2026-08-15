import { jsx as _jsx } from "react/jsx-runtime";
// 1. 从数据层引入统一的 DataProvider，壳层不需要关心底层是 React Query 还是其他库
import { DataProvider } from '@ming/data-layer';
// 2. 引入业务 Feature 页面
import { ChatPage } from '@ming/features-chat';
export const App = () => {
    return (_jsx(DataProvider, { children: _jsx(ChatPage, {}) }));
};
