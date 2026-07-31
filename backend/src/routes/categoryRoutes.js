import { Router } from 'express';
import Category from '../models/Category.js';
import Photo from '../models/Photo.js';
import ScratchProject from '../models/ScratchProject.js';
import { authMiddleware } from '../middleware/auth.js';
import { sanitizeString, publicRateLimit, writeRateLimit, adminRateLimit } from '../middleware/validate.js';

const router = Router();

// 公开接口：获取指定类型的分类列表（仅 active）
router.get('/', publicRateLimit, async (req, res) => {
  try {
    const type = req.query.type;
    const filter = { status: 'active' };
    if (type === 'photo' || type === 'scratch') {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ sort: 1, createdAt: 1 });

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

// 管理员接口：获取全部分类（含 inactive）
router.get('/admin/all', authMiddleware, adminRateLimit, async (req, res) => {
  try {
    const type = req.query.type;
    const filter = {};
    if (type === 'photo' || type === 'scratch') {
      filter.type = type;
    }

    const categories = await Category.find(filter).sort({ type: 1, sort: 1, createdAt: 1 });

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

// 创建分类
router.post('/', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, type, sort, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ status: 'error', message: '分类名称不能为空' });
    }
    if (type !== 'photo' && type !== 'scratch') {
      return res.status(400).json({ status: 'error', message: '分类类型必须是 photo 或 scratch' });
    }

    const cleanName = sanitizeString(name);
    const existing = await Category.findOne({ name: cleanName, type });
    if (existing) {
      return res.status(409).json({ status: 'error', message: '该类型下已存在同名分类' });
    }

    const category = await Category.create({
      name: cleanName,
      type,
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
      return res.status(409).json({ status: 'error', message: '该类型下已存在同名分类' });
    }
    res.status(400).json({
      status: 'error',
      message: '创建分类失败'
    });
  }
});

// 更新分类
router.put('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, sort, status } = req.body;
    const update = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ status: 'error', message: '分类名称不能为空' });
      }
      update.name = sanitizeString(name);
    }
    if (typeof sort === 'number') {
      update.sort = Math.max(0, sort);
    }
    if (status === 'active' || status === 'inactive') {
      update.status = status;
    }

    // 先查出原分类，用于判断 name 是否变化及同步关联作品
    const oldCategory = await Category.findById(req.params.id);
    if (!oldCategory) {
      return res.status(404).json({ status: 'error', message: '未找到该分类' });
    }

    // 如果 name 发生变化，同步更新所有关联作品的 category 字段
    // （Photo/ScratchProject 用名称字符串存储 category，见 Photo.js 第17行、ScratchProject.js 第21行）
    if (update.name && oldCategory.name !== update.name) {
      if (oldCategory.type === 'photo') {
        await Photo.updateMany(
          { category: oldCategory.name },
          { $set: { category: update.name } }
        );
      } else if (oldCategory.type === 'scratch') {
        await ScratchProject.updateMany(
          { category: oldCategory.name },
          { $set: { category: update.name } }
        );
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      message: '分类更新成功',
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: '该类型下已存在同名分类' });
    }
    res.status(400).json({
      status: 'error',
      message: '更新分类失败'
    });
  }
});

// 删除分类（检查是否有关联作品）
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: '未找到该分类' });
    }

    // 检查是否有关联作品
    let usedCount = 0;
    if (category.type === 'photo') {
      usedCount = await Photo.countDocuments({ category: category.name });
    } else {
      usedCount = await ScratchProject.countDocuments({ category: category.name });
    }

    if (usedCount > 0) {
      return res.status(409).json({
        status: 'error',
        message: `该分类下还有 ${usedCount} 个作品，请先移除或修改这些作品的分类后再删除`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

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
