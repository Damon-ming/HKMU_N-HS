// app/main/vite.config.ts
// 1. 从 'vite' 包里导入 defineConfig 工具函数
// 导入 Vite 提供的类型辅助函数，让你在写配置时有类型提示和自动补全
import { defineConfig } from 'vite'
// 2. 从 '@vitejs/plugin-react' 包导入 React 插件
// 导入官方的 React 插件（这是独立安装的 @vitejs/plugin-react 包）
import react from '@vitejs/plugin-react'
// 3. 导出 Vite 配置对象
export default defineConfig({
  // 告诉 Vite 在构建和开发时启用 React 支持（比如处理 JSX、支持 React Fast Refresh）
  plugins: [react()]
})
