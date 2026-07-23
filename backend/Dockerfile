# ==========================================
# 后端 Dockerfile - Node.js API 服务
# ==========================================

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# 创建上传目录（图片 / Scratch 项目文件 / Scratch 封面）
RUN mkdir -p uploads/scratch uploads/scratch-covers

EXPOSE 5001

CMD ["node", "src/app.js"]
