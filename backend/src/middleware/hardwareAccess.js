// 硬件知识库密码访问中间件
// 只有输入正确密码的用户才能访问硬件知识库的前台页面和接口
// 密码通过 cookie 验证，不需要 JWT

const HARDWARE_PASSWORD_COOKIE = 'hw_kit_access';
const HARDWARE_PASSWORD_TOKEN = 'hw_kit_token';

// 根据密码生成 token（简单的哈希，够用就行）
function generateToken(password) {
  // 简单的编码方式，足够防止普通访问
  return Buffer.from('hw_kit_' + password + '_' + process.env.JWT_SECRET).toString('base64');
}

// 验证密码
export function verifyHardwarePassword(password) {
  const correctPassword = process.env.HARDWARE_KIT_PASSWORD || 'liulaoshi2026';
  return password === correctPassword;
}

// 验证访问权限中间件
export function hardwareAccessRequired(req, res, next) {
  // 先检查 header 里的 token
  const token = req.headers['x-hw-kit-token'] 
    || req.cookies?.[HARDWARE_PASSWORD_COOKIE]
    || req.query.token;

  const correctPassword = process.env.HARDWARE_KIT_PASSWORD || 'liulaoshi2026';
  const validToken = generateToken(correctPassword);

  if (token && token === validToken) {
    req.hardwareAccess = true;
    return next();
  }

  return res.status(403).json({
    status: 'error',
    message: '请输入访问密码',
    requirePassword: true
  });
}

// 登录接口：验证密码并返回 token
export function hardwareLogin(req, res) {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      status: 'error',
      message: '请输入访问密码'
    });
  }

  if (!verifyHardwarePassword(password)) {
    return res.status(401).json({
      status: 'error',
      message: '密码错误'
    });
  }

  const token = generateToken(password);

  // 设置 cookie（30 天有效）
  res.cookie(HARDWARE_PASSWORD_COOKIE, token, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    path: '/'
  });

  res.json({
    status: 'success',
    message: '验证成功',
    token: token
  });
}

export default hardwareAccessRequired;
