# 🚀 学生作品展示系统 - 部署上线指南

## 📋 项目概述

| 项目信息 | 内容 |
|---|---|
| **项目名称** | 学生作品展示系统 |
| **代码仓库** | `https://gitee.com/nliuzhen/student-showcase` |
| **后端技术** | Node.js + Express + MongoDB |
| **前端技术** | React + Vite + Tailwind CSS |
| **默认端口** | 后端 5001，前端 3000/3001 |

---

## 🔐 预先生成的密钥（请妥善保存）

```bash
# JWT 加密密钥（已生成，可直接使用）
JWT_SECRET=a3f2d9e4c7b8a1d0f9e4c7b2a8d1f0e9a3d2f1c0e9f4d7a8b1c2f0d9e4a7d3f2
```

> ⚠️ **重要**：此密钥用于加密用户登录凭证，请妥善保管，不要泄露！

---

## 📦 部署环境要求

### 服务器配置
| 配置项 | 要求 |
|---|---|
| **操作系统** | Linux (推荐 Ubuntu 20.04/22.04) |
| **CPU** | 至少 2 核 |
| **内存** | 至少 4GB |
| **存储** | 至少 20GB |

### 需要开放的端口
| 端口 | 用途 |
|---|---|
| `22` | SSH 远程连接 |
| `80` | HTTP 网站访问 |
| `443` | HTTPS 加密访问 |

---

## 🔧 部署步骤

### 第 1 步：连接服务器

```bash
# 替换为你的服务器公网IP
ssh root@你的服务器IP地址
```

### 第 2 步：更新系统并安装依赖

```bash
# 更新系统软件
apt update && apt upgrade -y

# 安装必需软件
apt install -y nginx mongodb-org nodejs npm git
```

### 第 3 步：创建环境变量配置

```bash
# 创建项目目录
mkdir -p /opt/student-showcase

# 创建 .env 配置文件
cat > /opt/student-showcase/.env << 'EOF'
# ==================== 配置开始 ====================
# 服务器端口（一般无需修改）
PORT=5001

# 运行环境（生产环境填 production）
NODE_ENV=production

# MongoDB 数据库地址（本地数据库，无需修改）
MONGODB_URI=mongodb://localhost:27017/student-showcase

# JWT 密钥（已预先生成，直接使用）
JWT_SECRET=a3f2d9e4c7b8a1d0f9e4c7b2a8d1f0e9a3d2f1c0e9f4d7a8b1c2f0d9e4a7d3f2

# Token 有效期
JWT_EXPIRES_IN=24h

# 允许的前端域名（⚠️ 替换为你的域名）
ALLOWED_ORIGIN=http://你的域名.com,https://你的域名.com
# ==================== 配置结束 ====================
EOF
```

### 第 4 步：拉取代码

```bash
cd /opt/student-showcase
git clone https://gitee.com/nliuzhen/student-showcase.git
```

### 第 5 步：安装依赖并编译前端

```bash
# 安装后端依赖
cd /opt/student-showcase/student-showcase/backend
npm install --production

# 安装前端依赖并编译
cd ../frontend
npm install
npm run build
```

### 第 6 步：配置 PM2 进程管理

```bash
# 安装 PM2
npm install -g pm2

# 进入后端目录
cd /opt/student-showcase/student-showcase/backend

# 加载环境变量并启动服务
export $(cat /opt/student-showcase/.env | xargs)
pm2 start src/app.js --name "student-backend"

# 设置开机自启
pm2 save
pm2 startup
```

### 第 7 步：配置 Nginx 反向代理

```bash
# 创建 Nginx 配置文件
cat > /etc/nginx/sites-available/student-showcase << 'EOF'
server {
    listen 80;
    # ⚠️ 替换为你的域名
    server_name 你的域名.com www.你的域名.com;

    # 前端静态文件配置
    location / {
        root /opt/student-showcase/student-showcase/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # API 请求转发到后端
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/student-showcase /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 检查配置并重启
nginx -t
systemctl restart nginx
```

### 第 8 步：配置 HTTPS（推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书（替换为你的域名）
certbot --nginx -d 你的域名.com -d www.你的域名.com
```

---

## ✅ 验证部署

| 验证项 | 命令/地址 | 预期结果 |
|---|---|---|
| 后端状态 | `pm2 status` | `student-backend` 状态为 `online` |
| 健康检查 | `curl http://localhost:5001/api/health` | 返回成功 JSON |
| 前端首页 | `http://你的域名.com` | 显示作品展示首页 |
| 管理后台 | `http://你的域名.com/admin/login` | 显示登录页面 |

---

## 📝 日常运维命令

```bash
# 查看后端日志
pm2 logs student-backend

# 重启后端服务
pm2 restart student-backend

# 停止后端服务
pm2 stop student-backend

# 更新代码并重新部署
cd /opt/student-showcase/student-showcase
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart student-backend
```

---

## 🔒 安全加固

### 配置防火墙

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 禁止 MongoDB 外网访问

```bash
# 编辑配置文件
nano /etc/mongod.conf

# 确保 bindIp 为本地地址
bindIp: 127.0.0.1

# 重启 MongoDB
systemctl restart mongod
```

---

## 🎯 需要替换的内容汇总

| 内容 | 示例值 | 修改位置 |
|---|---|---|
| 服务器 IP | `123.45.67.89` | 第 1 步 SSH 连接 |
| 域名 | `student-showcase.com` | 第 3 步 `.env` + 第 7 步 Nginx |

---

## ❓ 常见问题

### Q1：后端启动失败？
- 检查 MongoDB：`systemctl status mongod`
- 查看日志：`pm2 logs student-backend`

### Q2：前端页面打不开？
- 检查 Nginx：`nginx -t`
- 查看错误日志：`tail -f /var/log/nginx/error.log`

### Q3：登录失败？
- 检查后端：`curl http://localhost:5001/api/health`
- 默认账号：`admin` / `admin123`

---

## 📧 管理后台登录

```
账号：admin
密码：admin123
```

> ⚠️ 登录后请立即修改默认密码！