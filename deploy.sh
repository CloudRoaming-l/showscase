#!/bin/bash

echo "======================================"
echo "  kidsshowcode.cn 网站一键更新脚本"
echo "======================================"

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