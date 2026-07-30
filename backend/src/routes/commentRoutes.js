import { Router } from 'express';
import Comment from '../models/Comment.js';
import { authMiddleware } from '../middleware/auth.js';
import { sanitizeString, publicRateLimit, writeRateLimit, PAGINATION } from '../middleware/validate.js';

const router = Router();

// 评论限流：5 次/分钟（防刷屏）
const commentRateLimit = (() => {
  const buckets = new Map();
  return (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const bucket = buckets.get(ip) || { count: 0, start: now };

    if (now - bucket.start > 60 * 1000) {
      bucket.count = 0;
      bucket.start = now;
    }

    bucket.count += 1;
    buckets.set(ip, bucket);

    if (bucket.count > 5) {
      return res.status(429).json({
        status: 'error',
        message: '评论过于频繁，请稍后再试'
      });
    }

    next();
  };
})();

// 公开接口：获取评论列表
router.get('/', publicRateLimit, async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || (targetType !== 'photo' && targetType !== 'scratch')) {
      return res.status(400).json({ status: 'error', message: 'targetType 必须是 photo 或 scratch' });
    }
    if (!targetId || !/^[0-9a-fA-F]{24}$/.test(targetId)) {
      return res.status(400).json({ status: 'error', message: 'targetId 格式无效' });
    }

    const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const query = { targetType, targetId, status: 'active' };

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-ip'); // 不返回 IP 字段

    const total = await Comment.countDocuments(query);

    res.json({
      status: 'success',
      data: comments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取评论列表失败'
    });
  }
});

// 公开发布评论（免审核，限流）
router.post('/', commentRateLimit, async (req, res) => {
  try {
    const { targetType, targetId, nickname, content } = req.body;

    if (!targetType || (targetType !== 'photo' && targetType !== 'scratch')) {
      return res.status(400).json({ status: 'error', message: 'targetType 必须是 photo 或 scratch' });
    }
    if (!targetId || !/^[0-9a-fA-F]{24}$/.test(targetId)) {
      return res.status(400).json({ status: 'error', message: 'targetId 格式无效' });
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ status: 'error', message: '评论内容不能为空' });
    }
    if (content.length > 500) {
      return res.status(400).json({ status: 'error', message: '评论内容不能超过500个字符' });
    }

    const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

    const comment = await Comment.create({
      targetType,
      targetId,
      nickname: nickname ? sanitizeString(nickname).slice(0, 20) : '匿名用户',
      content: sanitizeString(content),
      ip
    });

    // 返回时不包含 IP
    const safeComment = comment.toObject();
    delete safeComment.ip;

    res.status(201).json({
      status: 'success',
      message: '评论发布成功',
      data: safeComment
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '发布评论失败'
    });
  }
});

// 管理员删除评论
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted' },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ status: 'error', message: '未找到该评论' });
    }

    res.json({
      status: 'success',
      message: '评论已删除'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除评论失败'
    });
  }
});

export default router;
