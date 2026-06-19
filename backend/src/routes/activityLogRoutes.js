import { Router } from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { authMiddleware } from '../middleware/auth.js';
import { PAGINATION, escapeRegExp, adminRateLimit } from '../middleware/validate.js';

const router = Router();

// 获取操作日志列表（需要鉴权）
router.get('/', authMiddleware, adminRateLimit, async (req, res) => {
  try {
    const action = req.query.action;
    const targetType = req.query.targetType;
    const operator = req.query.operator;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }
    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }
    if (operator) {
      const safeOperator = escapeRegExp(String(operator).slice(0, PAGINATION.SEARCH_MAX_LEN));
      query.operator = { $regex: safeOperator, $options: 'i' };
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const skip = (page - 1) * limit;
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments(query);

    res.json({
      status: 'success',
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取操作日志失败'
    });
  }
});

// 获取日志统计
router.get('/stats', authMiddleware, adminRateLimit, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, todayResult, byActionResult, byTargetResult] = await Promise.all([
      ActivityLog.countDocuments(),
      ActivityLog.countDocuments({ createdAt: { $gte: today } }),
      ActivityLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      ActivityLog.aggregate([
        { $group: { _id: '$targetType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      status: 'success',
      data: {
        total: totalResult,
        today: todayResult,
        byAction: byActionResult,
        byTargetType: byTargetResult
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取日志统计失败'
    });
  }
});

export default router;
