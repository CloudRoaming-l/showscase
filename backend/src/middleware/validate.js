// 字段校验 + XSS 过滤 + 分页校验 + 搜索清洗 + 基础限流中间件

import ActivityLog from '../models/ActivityLog.js';

// ——— 全局共享常量 ———
export const VALID_CATEGORIES = [
  '机器人编程',
  '动画制作',
  '项目开发',
  '游戏创作',
  '人工智能',
  '网页设计',
  '创意绘画'
];

export const STATUS_ENUM = ['pending', 'approved', 'rejected'];
export const USER_ROLE_ENUM = ['admin', 'teacher'];
export const USER_STATUS_ENUM = ['active', 'inactive'];

// 分页限制
export const PAGINATION = {
  MIN_PAGE: 1,
  MAX_PAGE: 1000,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  SEARCH_MAX_LEN: 32
};

// ———————— 基础字符串清洗 ————————
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  let clean = str.trim();
  clean = clean.replace(/<[^>]*>/g, '');
  clean = clean.replace(/\b(on\w+|javascript:|data:)\b/gi, '');
  return clean;
}
export { sanitizeString };

// ———————— 正则元字符转义 ————————
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export { escapeRegExp };

// ———————— 分页参数校验（全局中间件） ————————
export function paginationValidator(req, res, next) {
  if (req.method === 'GET' && req.query) {
    // page
    const rawPage = req.query.page;
    if (rawPage !== undefined) {
      const parsed = parseInt(rawPage, 10);
      if (Number.isFinite(parsed)) {
        req.query.page = String(
          Math.max(PAGINATION.MIN_PAGE, Math.min(PAGINATION.MAX_PAGE, parsed))
        );
      } else {
        req.query.page = String(PAGINATION.DEFAULT_PAGE);
      }
    }

    // limit
    const rawLimit = req.query.limit;
    if (rawLimit !== undefined) {
      const parsed = parseInt(rawLimit, 10);
      if (Number.isFinite(parsed)) {
        req.query.limit = String(
          Math.max(PAGINATION.MIN_LIMIT, Math.min(PAGINATION.MAX_LIMIT, parsed))
        );
      } else {
        req.query.limit = String(PAGINATION.DEFAULT_LIMIT);
      }
    }
  }
  next();
}

// ———————— 搜索关键词清洗（全局中间件） ————————
export function searchSanitizer(req, res, next) {
  if (req.method === 'GET' && req.query && typeof req.query.search === 'string') {
    let safe = sanitizeString(req.query.search);
    // 截断到安全长度
    if (safe.length > PAGINATION.SEARCH_MAX_LEN) {
      safe = safe.slice(0, PAGINATION.SEARCH_MAX_LEN);
    }
    req.query.search = safe;
  }
  next();
}

// ———————— 基础内存级限流（简单滑动窗口） ————————
// 用于防止对 /api/auth/login 等接口的暴力尝试；对其他公开接口放宽限制
const rateLimitBuckets = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000,
    max = 60,
    keyGenerator = (req) =>
      (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim(),
    skip = () => false
  } = options;

  return (req, res, next) => {
    if (skip(req)) return next();

    const key = `${keyGenerator(req)}|${req.originalUrl.split('?')[0]}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key) || { count: 0, start: now };

    // 窗口过期：重置
    if (now - bucket.start > windowMs) {
      bucket.count = 0;
      bucket.start = now;
    }

    bucket.count += 1;
    rateLimitBuckets.set(key, bucket);

    if (bucket.count > max) {
      // 写一条告警日志
      try {
        ActivityLog.create({
          action: 'rate_limit',
          targetType: 'system',
          targetName: key,
          description: `请求频率超限: ${bucket.count}/${max} 在 ${Math.round(windowMs / 1000)}s 窗口`,
          operator: key,
          ip: key,
          userAgent: req.headers['user-agent'] || '',
          status: 'failed'
        }).catch(() => {});
      } catch (_e) {}

      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        status: 'error',
        message: '请求过于频繁，请稍后再试'
      });
    }

    next();
  };
}

// 便捷 preset：登录接口更严格（1 分钟最多 10 次）
export const loginRateLimit = rateLimit({ windowMs: 60 * 1000, max: 10 });

// 公开 GET 接口限流（1 分钟最多 120 次，防止爬虫/刷接口）
export const publicRateLimit = rateLimit({ windowMs: 60 * 1000, max: 120 });

// 写操作限流（1 分钟最多 30 次，POST/PUT/DELETE）
export const writeRateLimit = rateLimit({ windowMs: 60 * 1000, max: 30 });

// 管理接口限流（1 分钟最多 60 次）
export const adminRateLimit = rateLimit({ windowMs: 60 * 1000, max: 60 });

// ———————— 作品校验 ————————
export function validatePhoto(req, res, next) {
  const { title, description, category, author, authorId, grade, imageUrl, isFeatured } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ status: 'error', message: '作品名称不能为空' });
  }
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ status: 'error', message: '请选择分类' });
  }
  if (!author || typeof author !== 'string' || author.trim() === '') {
    return res.status(400).json({ status: 'error', message: '作者名称不能为空' });
  }
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return res.status(400).json({ status: 'error', message: '请上传作品图片' });
  }
  if (title.length > 100) {
    return res.status(400).json({ status: 'error', message: '作品名称不能超过100个字符' });
  }
  if (author.length > 50) {
    return res.status(400).json({ status: 'error', message: '作者名称不能超过50个字符' });
  }
  if (description && (typeof description !== 'string' || description.length > 500)) {
    return res.status(400).json({ status: 'error', message: '作品描述不能超过500个字符' });
  }
  if (!VALID_CATEGORIES.includes(category.trim())) {
    return res.status(400).json({ status: 'error', message: '无效的分类' });
  }
  if (!/^(https?:\/\/|data:|\/)/.test(imageUrl)) {
    return res.status(400).json({ status: 'error', message: '图片URL格式无效' });
  }

  const body = {
    title: sanitizeString(title),
    description: description ? sanitizeString(description) : '',
    category: category.trim(),
    author: sanitizeString(author),
    grade: grade ? sanitizeString(grade) : '',
    imageUrl: imageUrl.trim(),
    isFeatured: typeof isFeatured === 'boolean' ? isFeatured : false
  };

  // 有提供 authorId 时，校验为合法 ObjectId 后保存
  if (authorId && typeof authorId === 'string' && /^[0-9a-fA-F]{24}$/.test(authorId)) {
    body.authorId = authorId;
  }

  req.body = body;

  next();
}

// ———————— 学生校验 ————————
export function validateStudent(req, res, next) {
  const { name, grade, className, phone, avatar } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ status: 'error', message: '学生姓名不能为空' });
  }
  if (name.length > 50) {
    return res.status(400).json({ status: 'error', message: '姓名不能超过50个字符' });
  }
  if (phone && !/^[\d\-+\s]{6,20}$/.test(phone)) {
    return res.status(400).json({ status: 'error', message: '手机号格式不正确' });
  }

  req.body = {
    name: sanitizeString(name),
    grade: grade ? sanitizeString(grade) : '',
    className: className ? sanitizeString(className) : '',
    phone: phone ? phone.replace(/[^\d]/g, '').slice(0, 11) : '',
    avatar: avatar ? avatar.trim() : ''
  };

  next();
}

// —— 定期清理老的限流 bucket（每 10 分钟），防止内存无限增长 ——
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitBuckets) {
    if (now - v.start > 5 * 60 * 1000) rateLimitBuckets.delete(k);
  }
}, 10 * 60 * 1000).unref?.();
