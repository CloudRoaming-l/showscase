#!/bin/bash
# MongoDB 自动备份脚本
# 用法：在宝塔面板「计划任务」中添加，每天凌晨3点执行
# 命令：bash /www/wwwroot/student-showcase/scripts/backup-mongodb.sh

# —— 配置 ——
DB_NAME="student-showcase"
BACKUP_DIR="/www/backup/mongodb"
KEEP_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.gz"

# —— 创建备份目录 ——
mkdir -p "${BACKUP_DIR}"

# —— 执行备份 ——
echo "[$(date)] 开始备份 ${DB_NAME} ..."
mongodump --db "${DB_NAME}" --gzip --archive="${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[$(date)] 备份成功: ${BACKUP_FILE}"
  echo "[$(date)] 文件大小: $(du -h ${BACKUP_FILE} | cut -f1)"
else
  echo "[$(date)] ❌ 备份失败！"
  exit 1
fi

# —— 清理过期备份（只保留最近 KEEP_DAYS 天） ——
echo "[$(date)] 清理 ${KEEP_DAYS} 天前的旧备份 ..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.gz" -type f -mtime +${KEEP_DAYS} -delete
echo "[$(date)] 清理完成"

# —— 列出当前备份 ——
echo "[$(date)] 当前备份文件列表:"
ls -lh "${BACKUP_DIR}"/${DB_NAME}_*.gz 2>/dev/null

echo "[$(date)] 备份任务完成"
