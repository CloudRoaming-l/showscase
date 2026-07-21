#!/bin/bash
# MongoDB 恢复脚本
# 用法：bash restore-mongodb.sh <备份文件路径>
# 示例：bash restore-mongodb.sh /www/backup/mongodb/student-showcase_20260714_030000.gz

if [ -z "$1" ]; then
  echo "用法: bash restore-mongodb.sh <备份文件路径>"
  echo "示例: bash restore-mongodb.sh /www/backup/mongodb/student-showcase_20260714_030000.gz"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="student-showcase"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ 文件不存在: ${BACKUP_FILE}"
  exit 1
fi

echo "[$(date)] 开始恢复 ${DB_NAME} 从 ${BACKUP_FILE} ..."
echo "⚠  警告：这将覆盖当前数据库中的同名数据！"
echo "按 Ctrl+C 取消，按回车继续..."
read

mongorestore --db "${DB_NAME}" --gzip --archive="${BACKUP_FILE}" --drop

if [ $? -eq 0 ]; then
  echo "[$(date)] ✅ 恢复成功！"
else
  echo "[$(date)] ❌ 恢复失败！"
  exit 1
fi
