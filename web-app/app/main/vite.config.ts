// app/main/vite.config.ts
// 1. 从 'vite' 包里导入 defineConfig 工具函数
// 导入 Vite 提供的类型辅助函数，让你在写配置时有类型提示和自动补全
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// 2. 从 '@vitejs/plugin-react' 包导入 React 插件
// 导入官方的 React 插件（这是独立安装的 @vitejs/plugin-react 包）
// 3. 导出 Vite 配置对象
export default defineConfig({
  plugins: [react()],
  define: {
    // 控制全局变量，也可以用来保留 console
  },
  build: {
    minify: 'esbuild',
    // 使用 build.rollupOptions 控制
  }
})