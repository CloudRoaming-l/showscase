#!/bin/bash

# ==========================================
# kidsshowcode.cn Docker 一键部署脚本
# ==========================================
# 使用方法：
#   chmod +x deploy-docker.sh
#   ./deploy-docker.sh          # 首次部署
#   ./deploy-docker.sh update   # 更新代码后重新部署

set -e

cd /www/wwwroot/showscase

echo "======================================"
echo "  kidsshowcode.cn Docker 部署脚本"
echo "======================================"
echo ""

MODE="${1:-deploy}"

if [ "$MODE" = "update" ]; then
    echo "[1/4] 拉取最新代码..."
    git pull github main
    echo ""
    echo "[2/4] 清理缓存并重新构建（避免 Vite index.html 不刷新）..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
else
    echo "[1/4] 检查配置文件..."

    # 检查 .env
    if [ ! -f .env ]; then
        echo "  [错误] .env 文件不存在，请先创建！"
        echo "  参考 DOCKER_DEPLOY.md 第二节"
        exit 1
    fi

    # 检查 SSL 证书
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        echo "  [警告] SSL 证书不存在，正在从宝塔复制..."
        cp /www/server/panel/vhost/cert/kidsshowcode.cn/fullchain.pem nginx/ssl/cert.pem
        cp /www/server/panel/vhost/cert/kidsshowcode.cn/privkey.pem nginx/ssl/key.pem
        echo "  ✅ SSL 证书已复制"
    else
        echo "  ✅ .env 和 SSL 证书就绪"
    fi
    echo ""

    echo "[2/4] 构建并启动所有容器..."
    docker compose up -d --build
fi

echo ""
echo "[3/4] 等待服务就绪..."
sleep 5

echo ""
echo "[4/4] 检查服务状态..."
docker compose ps

echo ""
echo "======================================"
echo "  ✅ 部署完成！"
echo "  访问: https://kidsshowcode.cn"
echo ""
echo "  查看日志: docker compose logs -f"
echo "  管理命令: docker compose ps/restart/down"
echo "======================================"
