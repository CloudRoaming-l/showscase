import { Router } from 'express';
import LessonStage from '../models/LessonStage.js';
import { authMiddleware } from '../middleware/auth.js';
import { hardwareAccessRequired } from '../middleware/hardwareAccess.js';
import { writeRateLimit, publicRateLimit } from '../middleware/validate.js';

const router = Router();

// 前台：获取课程阶段列表（需要密码访问）
router.get('/', hardwareAccessRequired, publicRateLimit, async (req, res) => {
  try {
    const stages = await LessonStage.find({ status: 'active' })
      .sort({ sort: 1, createdAt: 1 });

    res.json({
      status: 'success',
      data: stages
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取阶段列表失败'
    });
  }
});

// 前台：获取单个阶段详情
router.get('/:id', hardwareAccessRequired, publicRateLimit, async (req, res) => {
  try {
    const stage = await LessonStage.findById(req.params.id);
    if (!stage || stage.status !== 'active') {
      return res.status(404).json({
        status: 'error',
        message: '阶段不存在'
      });
    }

    res.json({
      status: 'success',
      data: stage
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取阶段详情失败'
    });
  }
});

// 管理员：获取全部阶段列表
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const stages = await LessonStage.find()
      .sort({ sort: 1, createdAt: 1 });

    res.json({
      status: 'success',
      data: stages
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取阶段列表失败'
    });
  }
});

// 管理员：创建阶段
router.post('/', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, shortName, description, ageRange, sort, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: '阶段名称不能为空'
      });
    }

    const stage = await LessonStage.create({
      name: name.trim(),
      shortName: shortName?.trim() || '',
      description: description?.trim() || '',
      ageRange: ageRange?.trim() || '',
      sort: typeof sort === 'number' ? sort : 0,
      status: status === 'inactive' ? 'inactive' : 'active'
    });

    res.status(201).json({
      status: 'success',
      message: '阶段创建成功',
      data: stage
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: '已存在同名阶段'
      });
    }
    res.status(400).json({
      status: 'error',
      message: '创建阶段失败'
    });
  }
});

// 管理员：更新阶段
router.put('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, shortName, description, ageRange, sort, status } = req.body;
    const update = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ status: 'error', message: '阶段名称不能为空' });
      }
      update.name = name.trim();
    }
    if (shortName !== undefined) update.shortName = shortName.trim();
    if (description !== undefined) update.description = description.trim();
    if (ageRange !== undefined) update.ageRange = ageRange.trim();
    if (typeof sort === 'number') update.sort = Math.max(0, sort);
    if (status === 'active' || status === 'inactive') update.status = status;

    const stage = await LessonStage.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!stage) {
      return res.status(404).json({
        status: 'error',
        message: '阶段不存在'
      });
    }

    res.json({
      status: 'success',
      message: '阶段更新成功',
      data: stage
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: '已存在同名阶段'
      });
    }
    res.status(400).json({
      status: 'error',
      message: '更新阶段失败'
    });
  }
});

// 管理员：删除阶段
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const stage = await LessonStage.findById(req.params.id);
    if (!stage) {
      return res.status(404).json({
        status: 'error',
        message: '阶段不存在'
      });
    }

    // 检查是否有关联的课件
    const Lesson = (await import('../models/Lesson.js')).default;
    const lessonCount = await Lesson.countDocuments({ stageId: req.params.id });
    if (lessonCount > 0) {
      return res.status(409).json({
        status: 'error',
        message: `该阶段下还有 ${lessonCount} 个课件，请先处理这些课件后再删除`
      });
    }

    await LessonStage.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: '阶段删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除阶段失败'
    });
  }
});

export default router;
