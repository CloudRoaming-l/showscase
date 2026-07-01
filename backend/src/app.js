import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import photoRoutes from './routes/photoRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import authRoutes, { ensureDefaultAdmin } from './routes/authRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { paginationValidator, searchSanitizer } from './middleware/validate.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-showcase';

// —— 环境变量基础校验 ——
const envWarnings = [];
if (!process.env.MONGODB_URI) {
  envWarnings.push('MONGODB_URI 未配置');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  envWarnings.push('JWT_SECRET 未配置或太短（至少 32 位）');
}
if (NODE_ENV === 'production' && envWarnings.length > 0) {
  console.error('[SAFETY] 生产环境检测到以下必须配置项缺失，拒绝启动：\n  - ' + envWarnings.join('\n  - '));
  process.exit(1);
}

// —— 解析 ALLOWED_ORIGIN（支持逗号分隔多域名） ——
const rawOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:5173';
const allowedOrigins = rawOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // 开发环境允许所有来源，方便内网穿透调试
      if (NODE_ENV !== 'production') return callback(null, true);
      // 允许无 origin 的请求（如 curl / postman）
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// —— 请求体大小限制，防止大 payload ——
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

// —— 全局中间件：分页参数校验 + 搜索参数清洗 ——
app.use(paginationValidator);
app.use(searchSanitizer);

// —— 健康检查（公开） ——
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running!',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV === 'production' ? 'production' : NODE_ENV
  });
});

// —— 路由注册 ——
app.use('/api/photos', photoRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/users', userRoutes);

// —— 404 兜底 ——
app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `未找到接口: ${req.method} ${req.originalUrl}`
  });
});

// —— 全局错误处理 ——
app.use((err, req, res, next) => {
  // CORS 错误单独处理
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      status: 'error',
      message: 'Origin 不被允许'
    });
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      message: '请求体过大'
    });
  }

  // Syntax Error（非法 JSON body）
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      message: '请求体格式错误'
    });
  }

  // 服务器内部错误：只记录日志，不把堆栈回传给前端
  console.error('[server] 未处理异常:', err.message);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误'
  });
});

// —— 数据库连接 ——
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  })
  .then(async () => {
    console.log(`✅ MongoDB 已连接: ${MONGODB_URI}`);
    await ensureDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`🚀 服务启动于 http://localhost:${PORT}`);
      console.log(`📋 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`🌐 允许的前端域名: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB 连接失败:', error.message);
    if (NODE_ENV === 'production') {
      process.exit(1);
    } else {
      // 开发环境允许降级启动，方便前端开发者不依赖 DB
      console.warn('⚠  降级启动：未连接数据库，部分功能不可用。');
      app.listen(PORT, () => {
        console.log(`🚀 降级服务启动于 http://localhost:${PORT}`);
      });
    }
  });

export default app;
