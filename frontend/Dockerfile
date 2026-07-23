# ==========================================
# 前端 Dockerfile - 多阶段构建
# ==========================================

# ---- 第一阶段：构建 React 应用 ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# 构建时注入 API 域名（用于 Scratch 播放器 iframe 加载项目文件）
ARG VITE_API_ORIGIN=https://kidsshowcode.cn
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}

RUN npm run build

# ---- 第二阶段：Nginx 提供静态文件 ----
FROM nginx:alpine

# 自定义 nginx 配置（处理 SPA 路由回退）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
