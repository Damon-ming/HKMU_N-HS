# 阶段 1: 构建前端应用
FROM node:18-alpine AS builder

# 开启 pnpm 支持
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /web-app

# 1. 优先复制项目全部代码（保证 app 和 packages 目录结构完整）
COPY . .

# 2. 安装所有工作区依赖
RUN pnpm install --frozen-lockfile

# 3. 编译打包 main 子应用
RUN pnpm build:docker

# 阶段 2: Nginx 静态托管
FROM nginx:alpine

# 将构建产物（app/main/dist）复制到 Nginx 托管目录
COPY --from=builder /web-app/src/app/main/dist /usr/share/nginx/html

# 覆盖 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]