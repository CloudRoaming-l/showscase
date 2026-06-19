import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { loginRateLimit, publicRateLimit } from '../middleware/validate.js';

const router = Router();

// —— 安全参数：运行时读取，避免模块加载早于 dotenv.config() ——
const DEFAULT_EXPIRES_IN = '24h';

// —— 默认管理员账号配置（用于：用户不存在时自动创建 + 标记是否需改密）——
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  name: '默认管理员',
  role: 'admin'
};

async function ensureDefaultAdmin() {
  try {
    // 任何环境下：若管理员已存在，则不创建
    const existing = await User.findOne({ username: DEFAULT_ADMIN.username });
    if (existing) return;

    // 运行时读取 NODE_ENV（避免模块加载早于 dotenv.config()）
    const nodeEnv = process.env.NODE_ENV || 'development';

    // 生产环境：不自动创建默认账号（避免默认密码暴露风险）
    if (nodeEnv === 'production') {
      console.warn(
        '[SAFETY] 生产环境未检测到管理员账号，请手动创建后再启动。'
      );
      return;
    }

    // 开发/测试环境：自动创建，但打印警告
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    await User.create({
      username: DEFAULT_ADMIN.username,
      password: hashedPassword,
      name: DEFAULT_ADMIN.name,
      role: DEFAULT_ADMIN.role,
      status: 'active'
    });
    console.log(
      `✅ [DEV-ONLY] 已创建默认管理员：${DEFAULT_ADMIN.username} / ${DEFAULT_ADMIN.password}\n   ⚠  生产环境务必替换为强密码！`
    );
  } catch (error) {
    console.error('创建默认管理员失败:', error.message);
  }
}

// ⚠  注意：此处不再自动调用 ensureDefaultAdmin()
//    由 app.js 在 MongoDB 连接成功后显式调用，避免「模块加载早于数据库就绪」的竞态问题

// —— 登录（1 分钟内最多 10 次，防止暴力破解） ——
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 参数校验
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: '请输入用户名'
      });
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: '请输入密码'
      });
    }

    // 2. 查询用户
    const user = await User.findOne({ username: username.trim() });

    // 3. 未找到或非激活状态 → 统一错误信息（防止用户名枚举）
    const genericAuthFail = () =>
      res.status(401).json({
        status: 'error',
        message: '用户名或密码错误'
      });

    if (!user) {
      await logAuthFailure(req, username, '用户不存在');
      return genericAuthFail();
    }

    if (user.status !== 'active') {
      await logAuthFailure(req, username, '账号已停用');
      return genericAuthFail();
    }

    // 4. 密码校验（bcrypt 天然防时序攻击）
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAuthFailure(req, username, '密码错误');
      return genericAuthFail();
    }

    // 5. 运行时读取 JWT_SECRET（关键：必须在请求处理时读取，
    //    而不是模块加载时（此时 dotenv.config() 可能还没执行）
    const runtimeSecret = process.env.JWT_SECRET;
    if (!runtimeSecret || runtimeSecret.length < 32) {
      console.error('[SAFETY] 登录被拒绝：JWT_SECRET 缺失或太短（需要至少 32 位）');
      return res.status(500).json({
        status: 'error',
        message: '服务器配置有误，请联系管理员'
      });
    }
    const runtimeExpiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;
    const runtimeNodeEnv = process.env.NODE_ENV || 'development';

    // 6. 签发 Token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role
      },
      runtimeSecret,
      { expiresIn: runtimeExpiresIn }
    );

    // 7. 更新 lastLogin
    user.lastLogin = new Date();
    await user.save();

    await logActivity({
      action: 'login',
      targetType: 'user',
      targetId: user._id,
      targetName: user.username,
      description: '用户登录',
      operator: user.username,
      req
    });

    res.json({
      status: 'success',
      message: '登录成功',
      data: {
        token,
        expiresIn: runtimeExpiresIn,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          needChangePassword:
            runtimeNodeEnv !== 'production' &&
            username === DEFAULT_ADMIN.username &&
            password === DEFAULT_ADMIN.password
        }
      }
    });
  } catch (error) {
    console.error('[login] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '登录失败'
    });
  }
});

// —— 登出 ——
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: '登出成功'
  });
});

// —— 当前用户信息 ——
router.get('/me', publicRateLimit, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: '未登录'
      });
    }

    // 运行时读取 JWT_SECRET（与登录接口保持一致）
    const runtimeSecret = process.env.JWT_SECRET;
    if (!runtimeSecret || runtimeSecret.length < 32) {
      return res.status(500).json({
        status: 'error',
        message: '服务器配置有误，请联系管理员'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, runtimeSecret);
    } catch {
      return res.status(401).json({
        status: 'error',
        message: 'token无效或已过期'
      });
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    res.json({
      status: 'success',
      data: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[me] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '查询失败'
    });
  }
});

// —— 工具函数 ——
async function logActivity({ action, targetType, targetId, targetName, description, operator, status = 'success', req = {} }) {
  try {
    await ActivityLog.create({
      action,
      targetType,
      targetId,
      targetName,
      description,
      operator,
      ip: (req.headers && req.headers['x-forwarded-for']) || req.ip || req.connection?.remoteAddress || '',
      userAgent: (req.headers && req.headers['user-agent']) || '',
      status
    });
  } catch (err) {
    console.error('[logActivity] 记录操作日志失败:', err.message);
  }
}

async function logAuthFailure(req, username, reason) {
  try {
    await ActivityLog.create({
      action: 'login',
      targetType: 'user',
      targetName: username,
      description: `登录失败：${reason}`,
      operator: username,
      ip: (req.headers && req.headers['x-forwarded-for']) || req.ip || '',
      userAgent: (req.headers && req.headers['user-agent']) || '',
      status: 'failed'
    });
  } catch (err) {
    console.error('[logAuthFailure] 写入失败:', err.message);
  }
}

export default router;

// 导出 ensureDefaultAdmin，供 app.js 在 MongoDB 连接成功后显式调用
export { ensureDefaultAdmin };
