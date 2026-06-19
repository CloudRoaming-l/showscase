import { Router } from 'express';
import Student from '../models/Student.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateStudent, PAGINATION, escapeRegExp, publicRateLimit, writeRateLimit, adminRateLimit } from '../middleware/validate.js';

const router = Router();

// 公开接口：列表、详情
router.get('/', publicRateLimit, async (req, res) => {
  try {
    const grade = req.query.grade;
    const search = req.query.search;
    const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
    const query = { status: 'active' };

    if (grade && grade !== 'all') {
      query.grade = grade;
    }

    if (search) {
      const safeSearch = escapeRegExp(String(search).slice(0, PAGINATION.SEARCH_MAX_LEN));
      query.name = { $regex: safeSearch, $options: 'i' };
    }

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Student.countDocuments(query);

    res.json({
      status: 'success',
      data: students,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取学生列表失败'
    });
  }
});

router.get('/:id', publicRateLimit, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该学生'
      });
    }

    res.json({
      status: 'success',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取学生详情失败'
    });
  }
});

// 需要鉴权的接口
router.post('/', authMiddleware, writeRateLimit, validateStudent, async (req, res) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json({
      status: 'success',
      message: '学生创建成功',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '创建学生失败'
    });
  }
});

router.put('/:id', authMiddleware, writeRateLimit, validateStudent, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该学生'
      });
    }

    res.json({
      status: 'success',
      message: '学生更新成功',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新学生失败'
    });
  }
});

router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该学生'
      });
    }

    res.json({
      status: 'success',
      message: '学生删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除学生失败'
    });
  }
});

export default router;
