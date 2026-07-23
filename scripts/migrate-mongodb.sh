#!/bin/bash

# ==========================================
# MongoDB 数据迁移脚本
# 从裸机 MongoDB 迁移到 Docker MongoDB 容器
# ==========================================
# 使用方法（在服务器项目根目录执行）：
#   chmod +x scripts/migrate-mongodb.sh
#   ./scripts/migrate-mongodb.sh
#
# 前提条件：
#   1. 裸机 MongoDB 仍在运行（systemctl status mongod）
#   2. 已安装 mongodump 工具（apt install mongodb-tools）
#   3. Docker 容器已启动（docker compose up -d mongodb）

set -e

# 加载同目录 .env（如果存在），避免默认密码与实际密码不一致
if [ -f .env ]; then
    set -a
    . .env
    set +a
fi

# —— 配置 ——
SOURCE_DB="student-showcase"
DUMP_DIR="/tmp/mongo-dump"
DOCKER_CONTAINER="showcase-mongodb"
MONGO_USER="admin"
MONGO_PASSWORD="${MONGO_PASSWORD:-showcase123}"

echo "======================================"
echo "  MongoDB 数据迁移脚本"
echo "  源: 裸机 MongoDB (localhost:27017)"
echo "  目标: Docker 容器 ($DOCKER_CONTAINER)"
echo "======================================"
echo ""

# —— 检查 mongodump 是否安装 ——
if ! command -v mongodump &> /dev/null; then
    echo "[错误] mongodump 未安装，请先安装："
    echo "  apt install -y mongodb-tools"
    exit 1
fi

# —— 检查 Docker 容器是否运行 ——
if ! docker ps --format '{{.Names}}' | grep -q "$DOCKER_CONTAINER"; then
    echo "[错误] Docker MongoDB 容器未运行，请先启动："
    echo "  docker compose up -d mongodb"
    exit 1
fi

# —— Step 1: 导出裸机数据 ——
echo "[1/4] 导出裸机 MongoDB 数据..."
echo "  数据库: $SOURCE_DB"
echo "  输出目录: $DUMP_DIR"

rm -rf "$DUMP_DIR"
mongodump --db "$SOURCE_DB" --out "$DUMP_DIR"

echo "  ✅ 导出完成"
echo ""

# —— Step 2: 导入到 Docker 容器 ——
echo "[2/4] 导入数据到 Docker 容器..."
echo "  容器: $DOCKER_CONTAINER"
echo "  用户: $MONGO_USER"

docker exec -i "$DOCKER_CONTAINER" mongorestore \
    --username "$MONGO_USER" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --db "$SOURCE_DB" \
    --drop \
    "$DUMP_DIR/$SOURCE_DB"

echo "  ✅ 导入完成"
echo ""

# —— Step 3: 迁移上传文件 ——
echo "[3/4] 迁移上传文件 (uploads)..."

UPLOADS_SOURCE="/www/wwwroot/showscase/backend/uploads"
UPLOADS_VOLUME=$(docker volume inspect showscase_backend-uploads --format '{{.Mountpoint}}' 2>/dev/null || echo "")

if [ -d "$UPLOADS_SOURCE" ]; then
    if [ -n "$UPLOADS_VOLUME" ]; then
        echo "  源: $UPLOADS_SOURCE"
        echo "  目标: $UPLOADS_VOLUME"
        cp -r "$UPLOADS_SOURCE"/* "$UPLOADS_VOLUME"/ 2>/dev/null || true
        echo "  ✅ 上传文件迁移完成"
    else
        echo "  [警告] 找不到 Docker 卷路径，使用 docker cp 替代..."
        docker cp "$UPLOADS_SOURCE/." showcase-backend:/app/uploads/
        echo "  ✅ 上传文件迁移完成 (via docker cp)"
    fi
else
    echo "  [跳过] 源目录不存在: $UPLOADS_SOURCE"
fi
echo ""

# —— Step 4: 验证 ——
echo "[4/4] 验证数据..."
docker exec "$DOCKER_CONTAINER" mongosh \
    --username "$MONGO_USER" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --eval "use $SOURCE_DB; print('collections:'); db.getCollectionNames().forEach(c => print('  - ' + c + ': ' + db.getCollection(c).countDocuments() + ' docs'))"

echo ""
echo "======================================"
echo "  ✅ 迁移完成！"
echo "  临时文件已保留在: $DUMP_DIR"
echo "  确认无误后可删除: rm -rf $DUMP_DIR"
echo "======================================"
