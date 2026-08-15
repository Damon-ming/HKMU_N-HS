import { jsx as _jsx } from "react/jsx-runtime";
// app/main/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootstrap } from './bootstrap';
import { App } from './App';
async function startApp() {
    try {
        // 1. 确保在应用渲染前完成最高优先级的初始化
        await bootstrap();
        // 2. 网络等基础层就绪后，挂载 React App
        const rootElement = document.getElementById('root');
        if (!rootElement)
            throw new Error('Root element #root not found');
        ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
    }
    catch (error) {
        console.error('[App] Failed to start application:', error);
        // 渲染全局降级/错误提示页面
    }
}
// 启动应用
startApp();
