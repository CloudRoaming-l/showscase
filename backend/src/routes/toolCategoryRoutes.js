import { Router } from 'express';
import ToolCategory from '../models/ToolCategory.js';
import Tool from '../models/Tool.js';
import { authMiddleware } from '../middleware/auth.js';
import { hardwareAccessRequired } from '../middleware/hardwareAccess.js';
import { writeRateLimit, publicRateLimit } from '../middleware/validate.js';

const router = Router();

// 前台：获取器材分类列表（需要密码访问）
router.get('/', hardwareAccessRequired, publicRateLimit, async (req, res) => {
  try {
    const categories = await ToolCategory.find({ status: 'active' })
      .sort({ sort: 1, createdAt: 1 });

    res.json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取分类列表失败'
    });
  }
});

// 管理员：获取全部分类
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const categories = await ToolCategory.find()
      .sort({ sort: 1, createdAt: 1 });

    res.json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取分类列表失败'
    });
  }
});

// 管理员：创建分类
router.post('/', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, description, sort, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: '分类名称不能为空'
      });
    }

    const category = await ToolCategory.create({
      name: name.trim(),
      description: description?.trim() || '',
      sort: typeof sort === 'number' ? sort : 0,
      status: status === 'inactive' ? 'inactive' : 'active'
    });

    res.status(201).json({
      status: 'success',
      message: '分类创建成功',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: '已存在同名分类'
      });
    }
    res.status(400).json({
      status: 'error',
      message: '创建分类失败'
    });
  }
});

// 管理员：更新分类
router.put('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, description, sort, status } = req.body;
    const update = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ status: 'error', message: '分类名称不能为空' });
      }
      update.name = name.trim();
    }
    if (description !== undefined) update.description = description.trim();
    if (typeof sort === 'number') update.sort = Math.max(0, sort);
    if (status === 'active' || status === 'inactive') update.status = status;

    const category = await ToolCategory.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: '分类不存在'
      });
    }

    res.json({
      status: 'success',
      message: '分类更新成功',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: '已存在同名分类'
      });
    }
    res.status(400).json({
      status: 'error',
      message: '更新分类失败'
    });
  }
});

// 管理员：删除分类
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const category = await ToolCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: '分类不存在'
      });
    }

    // 检查是否有关联器材
    const toolCount = await Tool.countDocuments({ categoryId: req.params.id });
    if (toolCount > 0) {
      return res.status(409).json({
        status: 'error',
        message: `该分类下还有 ${toolCount} 个器材，请先处理后再删除`
      });
    }

    await ToolCategory.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: '分类删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除分类失败'
    });
  }
});

export default router;
