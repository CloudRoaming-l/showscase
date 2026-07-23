# ==========================================
# kidsshowcode.cn Docker 部署指南
# ==========================================
# 本文档指导你从 宝塔+PM2 部署迁移到 Docker 部署
# 操作前请仔细阅读全文，按顺序执行

---

## 一、前置条件

### 1.1 安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash

# 启动 Docker 并设置开机自启
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
docker compose version
```

### 1.2 确认当前服务状态

```bash
# 确认宝塔 Nginx 正在运行（迁移期间不要停）
systemctl status nginx

# 确认 PM2 后端正在运行
pm2 status

# 确认裸机 MongoDB 正在运行
systemctl status mongod

# 测试当前网站是否正常
curl -I https://kidsshowcode.cn
```

> ⚠️ 迁移期间保持宝塔服务运行，确认 Docker 版完全正常后再切换。

---

## 二、配置文件准备

### 2.1 修改 .env 文件

```bash
cd /www/wwwroot/showscase

# 编辑环境变量文件
vi .env
```

确认以下内容（密码请改成你自己的强密码）：

```env
MONGO_PASSWORD=改成你的强密码
JWT_SECRET=改成至少64位的随机字符串
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的管理员密码
ADMIN_NAME=管理员
VITE_API_ORIGIN=https://kidsshowcode.cn
```

### 2.2 迁移 SSL 证书

宝塔的 Let's Encrypt 证书在：
```
/www/server/panel/vhost/cert/kidsshowcode.cn/
```

需要复制到 Docker 项目目录：

```bash
cd /www/wwwroot/showscase

# 复制 SSL 证书（宝塔的证书会自动续期，Docker 用的是副本）
cp /www/server/panel/vhost/cert/kidsshowcode.cn/fullchain.pem nginx/ssl/cert.pem
cp /www/server/panel/vhost/cert/kidsshowcode.cn/privkey.pem nginx/ssl/key.pem

# 验证文件存在
ls -la nginx/ssl/
# 应该看到 cert.pem 和 key.pem
```

> 💡 **SSL 续期方案**：宝塔会自动续期 Let's Encrypt 证书。续期后需要重新复制到 nginx/ssl/ 并重启 nginx 容器。可以设置宝塔的定时任务：
> ```bash
> # 宝塔面板 → 计划任务 → 添加 Shell 脚本
> cp /www/server/panel/vhost/cert/kidsshowcode.cn/fullchain.pem /www/wwwroot/showscase/nginx/ssl/cert.pem
> cp /www/server/panel/vhost/cert/kidsshowcode.cn/privkey.pem /www/wwwroot/showscase/nginx/ssl/key.pem
> docker restart showcase-nginx
> ```
> 每月执行一次即可。

---

## 三、数据迁移

### 3.1 迁移 MongoDB 数据

```bash
cd /www/wwwroot/showscase

# 先只启动 MongoDB 容器
docker compose up -d mongodb

# 等待 MongoDB 就绪（约 10 秒）
sleep 10

# 执行迁移脚本
chmod +x scripts/migrate-mongodb.sh
./scripts/migrate-mongodb.sh
```

迁移脚本会：
1. 从裸机 MongoDB 导出数据
2. 导入到 Docker MongoDB 容器
3. 复制上传的文件（uploads/）到 Docker 卷
4. 验证数据完整性

### 3.2 验证数据

```bash
# 检查 MongoDB 中的数据
docker exec showcase-mongodb mongosh \
    -u admin -p 你的MONGO_PASSWORD \
    --authenticationDatabase admin \
    --eval "use student-showcase; db.photos.countDocuments(); db.students.countDocuments(); db.scratchprojects.countDocuments()"
```

应该看到和你原来数据库一样的文档数量。

---

## 四、构建并启动所有容器

### 4.1 一键启动

```bash
cd /www/wwwroot/showscase

# 构建并启动所有服务（首次构建约需 3-5 分钟）
docker compose up -d --build
```

### 4.2 检查容器状态

```bash
# 查看所有容器状态
docker compose ps

# 所有容器应该都是 "running" 状态：
#   showcase-mongodb    running (healthy)
#   showcase-backend    running
#   showcase-frontend   running
#   showcase-nginx      running
```

### 4.3 检查日志

```bash
# 查看后端日志（确认 MongoDB 连接成功）
docker compose logs backend --tail 20

# 查看所有服务日志
docker compose logs --tail 10
```

后端日志应该显示：
```
✅ MongoDB 已连接: mongodb://admin:...@mongodb:27017/student-showcase?authSource=admin
🚀 服务启动于 http://localhost:5001
```

---

## 五、切换流量到 Docker

### 5.1 停止旧服务

确认 Docker 版本完全正常后，停止旧服务：

```bash
# 停止 PM2 后端
pm2 delete showcase-backend

# 停止宝塔 Nginx（释放 80/443 端口给 Docker nginx）
systemctl stop nginx

# 确认端口已释放
netstat -tlnp | grep -E ':80|:443'
# 应该没有任何输出，或者只显示 Docker 的进程
```

### 5.2 启动 Docker Nginx

```bash
cd /www/wwwroot/showscase

# 启动 nginx 容器（会占用 80 和 443 端口）
docker compose up -d nginx
```

### 5.3 验证网站

```bash
# 测试 HTTPS 访问
curl -I https://kidsshowcode.cn

# 测试 API
curl https://kidsshowcode.cn/api/health

# 测试管理后台
curl -I https://kidsshowcode.cn/admin/login
```

在浏览器中访问：
- ✅ `https://kidsshowcode.cn` - 首页正常
- ✅ `https://kidsshowcode.cn/gallery` - 画廊刷新不 404
- ✅ `https://kidsshowcode.cn/admin/login` - 后台可登录
- ✅ `https://kidsshowcode.cn/scratch` - Scratch 作品页正常
- ✅ Scratch 作品可以在线播放

### 5.4 禁用宝塔 Nginx 开机自启

```bash
systemctl disable nginx
```

---

## 六、后续更新流程

代码有更新后，重新部署：

```bash
cd /www/wwwroot/showscase

# 拉取最新代码
git pull github main

# 重新构建并启动（只重建有变更的服务）
docker compose up -d --build

# 查看状态
docker compose ps
```

---

## 七、常见问题排查

### 问题 1：端口被占用

```
Error: Bind for 0.0.0.0:443 failed: port is already allocated
```

**原因**：宝塔 Nginx 或其他服务仍在占用端口

**解决**：
```bash
# 查看谁占用了端口
netstat -tlnp | grep -E ':80|:443'

# 停止宝塔 Nginx
systemctl stop nginx

# 如果是其他进程，用 kill 停掉
# 然后重启 Docker
docker compose up -d
```

### 问题 2：MongoDB 认证失败

```
MongoDB 连接失败: Authentication failed
```

**原因**：.env 中的 MONGO_PASSWORD 与 MongoDB 容器初始化时的密码不一致

**解决**：
```bash
# 如果 MongoDB 容器已经用旧密码初始化过，需要删除数据卷重来
docker compose down
docker volume rm showcase-mongodb-data
docker volume rm showcase_backend-uploads

# 修改 .env 中的 MONGO_PASSWORD
vi .env

# 重新启动（会重新初始化 MongoDB）
docker compose up -d mongodb
sleep 10

# 重新迁移数据
./scripts/migrate-mongodb.sh
```

### 问题 3：前端页面刷新 404

**原因**：前端容器内 nginx 配置未生效

**排查**：
```bash
# 进入前端容器检查
docker exec showcase-frontend cat /etc/nginx/conf.d/default.conf

# 确认有 try_files $uri $uri/ /index.html;
```

### 问题 4：图片/文件上传失败

**原因**：外层 nginx 的 client_max_body_size 太小

**排查**：
```bash
docker exec showcase-nginx nginx -T | grep client_max_body_size
# 应该显示 client_max_body_size 60M;
```

### 问题 5：Scratch 作品无法播放

**原因**：VITE_API_ORIGIN 未在构建时注入

**解决**：
```bash
# 确认 .env 中有 VITE_API_ORIGIN
grep VITE_API_ORIGIN .env

# 重新构建前端
docker compose up -d --build frontend
```

### 问题 6：SSL 证书过期

```bash
# 查看证书有效期
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# 从宝塔复制最新证书
cp /www/server/panel/vhost/cert/kidsshowcode.cn/fullchain.pem nginx/ssl/cert.pem
cp /www/server/panel/vhost/cert/kidsshowcode.cn/privkey.pem nginx/ssl/key.pem

# 重启 nginx 容器
docker restart showcase-nginx
```

---

## 八、回滚方案

如果 Docker 版本出问题，可以快速回滚到宝塔+PM2 部署：

```bash
# 1. 停止 Docker 服务（释放端口）
cd /www/wwwroot/showscase
docker compose down

# 2. 启动宝塔 Nginx
systemctl start nginx
systemctl enable nginx

# 3. 启动 PM2 后端
pm2 start backend/src/app.js --name showcase-backend

# 4. 验证
curl -I https://kidsshowcode.cn
```

> 数据不需要回滚，因为迁移时是从裸机导出复制到 Docker，原始数据仍在裸机 MongoDB 中。

---

## 九、服务管理常用命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f backend        # 实时查看后端日志
docker compose logs -f nginx          # 实时查看 nginx 日志
docker compose logs --tail 50         # 所有服务最近 50 行

# 重启单个服务
docker compose restart backend
docker compose restart nginx

# 停止所有服务
docker compose down

# 停止并删除数据（⚠️ 危险！会删除数据库数据！）
docker compose down -v

# 进入容器调试
docker exec -it showcase-backend sh
docker exec -it showcase-mongodb mongosh -u admin -p 你的密码 --authenticationDatabase admin
```
