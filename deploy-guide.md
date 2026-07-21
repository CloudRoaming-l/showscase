# 网站更新部署流程

## 📋 更新前准备

### 本地操作

1. **确保代码已提交到 GitHub**

```bash
# 查看状态
git status

# 添加所有文件
git add .

# 提交代码
git commit -m "update: 描述这次更新的内容"

# 推送到 GitHub
git push github main
```

2. **确保本地构建测试通过**

```bash
cd d:\MyApp_3\frontend
npm run build
```

---

## 🚀 服务器更新步骤

### 第 1 步：登录宝塔面板

访问宝塔面板地址，进入 **终端**。

### 第 2 步：进入项目目录

```bash
cd /www/wwwroot/showscase
```

### 第 3 步：拉取最新代码

```bash
git pull github main
```

### 第 4 步：更新前端

```bash
cd frontend

# 删除宝塔自动生成的 .user.ini 文件（关键！）
rm -f dist/.user.ini

# 构建前端
npm run build

cd ..
```

### 第 5 步：更新后端（如果有代码变更）

```bash
cd backend

# 如果 package.json 有变更，重新安装依赖
npm install

cd ..
```

### 第 6 步：重启后端服务

```bash
# 停止现有服务
pm2 delete showcase-backend

# 重新启动
pm2 start backend/src/app.js --name showcase-backend

# 检查状态
pm2 status
```

### 第 7 步：验证网站

访问 `https://kidsshowcode.cn` 检查：
- 首页数据是否正常加载
- 大屏展示页面是否正常
- 管理后台是否可登录

---

## 🛠️ 一键部署脚本

创建一个脚本文件 `deploy.sh`，以后可以一键更新：

```bash
#!/bin/bash

echo "======================================"
echo "  kidsshowcode.cn 网站一键更新脚本"
echo "======================================"

# 进入项目目录
cd /www/wwwroot/showscase

echo ""
echo "[1/5] 拉取最新代码..."
git pull github main

echo ""
echo "[2/5] 更新前端..."
cd frontend
rm -f dist/.user.ini
npm run build

echo ""
echo "[3/5] 更新后端依赖..."
cd ../backend
npm install

echo ""
echo "[4/5] 重启后端服务..."
cd ..
pm2 delete showcase-backend
pm2 start backend/src/app.js --name showcase-backend

echo ""
echo "[5/5] 检查服务状态..."
pm2 status

echo ""
echo "======================================"
echo "  更新完成！"
echo "  访问: https://kidsshowcode.cn"
echo "======================================"
```

**使用方法：**

```bash
# 第一次使用需要给脚本添加执行权限
chmod +x deploy.sh

# 以后每次更新只需执行
./deploy.sh
```

---

## ⚠️ 常见问题排查

### 问题 1：前端构建失败 - `.user.ini` 权限问题

**现象：**
```
Error: ENOTDIR: not a directory, scandir '/www/wwwroot/showscase/frontend/dist/.user.ini'
```

**解决：**
```bash
chattr -i /www/wwwroot/showscase/frontend/dist/.user.ini
rm /www/wwwroot/showscase/frontend/dist/.user.ini
npm run build
```

### 问题 2：后端启动失败 - sharp 模块缺失

**现象：**
```
Error: Cannot find package 'sharp'
```

**解决：**
```bash
cd /www/wwwroot/showscase/backend
npm install sharp
pm2 restart showcase-backend
```

### 问题 3：前端请求 API 返回 502 Bad Gateway

**现象：**
```
GET https://kidsshowcode.cn/api/photos/featured 502 (Bad Gateway)
```

**排查步骤：**
```bash
# 检查后端服务状态
pm2 status

# 检查端口是否监听
netstat -tlnp | grep 5001

# 测试后端接口
curl http://localhost:5001/api/health

# 查看后端日志
pm2 logs showcase-backend
```

### 问题 4：前端数据显示为 0

**原因：** 前端构建时使用了错误的 API 地址

**解决：**
```bash
cd /www/wwwroot/showscase/frontend

# 创建 .env 文件
echo "VITE_API_ORIGIN=https://kidsshowcode.cn" > .env

# 重新构建
npm run build
```

### 问题 5：数据库连接失败

**现象：**
```
MongoDB 连接失败
```

**解决：**
```bash
# 检查 MongoDB 是否运行
systemctl status mongod

# 如果没运行，启动 MongoDB
systemctl start mongod

# 设置开机自启
systemctl enable mongod
```

---

## 📁 项目目录结构

```
/www/wwwroot/showscase/
├── frontend/                # 前端项目
│   ├── dist/               # 构建产物（Nginx 指向这里）
│   ├── src/                # 源代码
│   └── .env               # 生产环境配置
│
├── backend/                # 后端项目
│   ├── src/                # 源代码
│   ├── uploads/           # 上传的作品文件（不要删除！）
│   └── .env               # 生产环境配置（不要删除！）
│
└── deploy.sh              # 一键部署脚本
```

---

## 📌 重要提醒

1. **不要删除 `backend/uploads/`** - 里面是所有上传的作品文件和封面
2. **不要删除 `backend/.env`** - 里面是数据库连接和密钥配置
3. **每次更新前最好备份**：
   ```bash
   cp -r /www/wwwroot/showscase/backend/uploads /backup/uploads-$(date +%Y%m%d)
   ```
4. **更新后检查网站**：确保所有功能正常

---

## 📞 紧急恢复

如果更新后网站无法正常访问，可以回滚到上一个版本：

```bash
cd /www/wwwroot/showscase

# 查看提交历史
git log --oneline

# 回滚到上一个版本
git revert HEAD

# 重新构建
cd frontend && npm run build
cd ..

# 重启后端
pm2 restart showcase-backend
```
