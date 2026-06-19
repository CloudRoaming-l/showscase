// JWT 鉴权中间件 — JWT_SECRET 在请求处理时读取（运行时读取）
// 避免「ES6 import 先于 dotenv.config() 执行」导致读取到 undefined 的问题
import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: '未登录或token已过期'
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error('[SAFETY] JWT_SECRET 缺失或太短，鉴权中间件拒绝请求');
    return res.status(500).json({
      status: 'error',
      message: '服务器配置有误，请联系管理员'
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'token无效或已过期'
    });
  }
}

export default authMiddleware;
