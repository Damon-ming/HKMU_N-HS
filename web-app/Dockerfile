FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /web-app

# 复制全部源码进入容器（宿主机本来就无node_modules，不用担心拷入）
COPY . .

# 在容器内部执行安装，pnpm自动创建workspace符号链接
RUN pnpm install --frozen-lockfile --no-optional=false

# 打包
RUN pnpm build:docker

# 阶段2 Nginx不变
FROM nginx:alpine

COPY --from=builder /web-app/src/app/main/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]