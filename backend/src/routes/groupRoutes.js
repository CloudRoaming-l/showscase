import { Router } from 'express';
import Group from '../models/Group.js';
import Student from '../models/Student.js';
import Photo from '../models/Photo.js';
import ScratchProject from '../models/ScratchProject.js';
import { authMiddleware } from '../middleware/auth.js';
import { sanitizeString, publicRateLimit, writeRateLimit, adminRateLimit } from '../middleware/validate.js';

const router = Router();

// 公开接口：获取组别列表（仅 active）
router.get('/', publicRateLimit, async (req, res) => {
  try {
    const groups = await Group.find({ status: 'active' }).sort({ sort: 1, createdAt: 1 });

    res.json({
      status: 'success',
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取组别列表失败'
    });
  }
});

// 管理员接口：获取全部组别（含 inactive）
router.get('/admin/all', authMiddleware, adminRateLimit, async (req, res) => {
  try {
    const groups = await Group.find({}).sort({ sort: 1, createdAt: 1 });

    res.json({
      status: 'success',
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取组别列表失败'
    });
  }
});

// 创建组别
router.post('/', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, sort, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ status: 'error', message: '组别名称不能为空' });
    }

    const cleanName = sanitizeString(name);
    const existing = await Group.findOne({ name: cleanName });
    if (existing) {
      return res.status(409).json({ status: 'error', message: '已存在同名组别' });
    }

    const group = await Group.create({
      name: cleanName,
      sort: typeof sort === 'number' ? sort : 0,
      status: status === 'inactive' ? 'inactive' : 'active'
    });

    res.status(201).json({
      status: 'success',
      message: '组别创建成功',
      data: group
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: '已存在同名组别' });
    }
    res.status(400).json({
      status: 'error',
      message: '创建组别失败'
    });
  }
});

// 更新组别
router.put('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { name, sort, status } = req.body;
    const update = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ status: 'error', message: '组别名称不能为空' });
      }
      update.name = sanitizeString(name);
    }
    if (typeof sort === 'number') {
      update.sort = Math.max(0, sort);
    }
    if (status === 'active' || status === 'inactive') {
      update.status = status;
    }

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({ status: 'error', message: '未找到该组别' });
    }

    res.json({
      status: 'success',
      message: '组别更新成功',
      data: group
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ status: 'error', message: '已存在同名组别' });
    }
    res.status(400).json({
      status: 'error',
      message: '更新组别失败'
    });
  }
});

// 删除组别（检查是否有关联）
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ status: 'error', message: '未找到该组别' });
    }

    const [studentCount, photoCount, scratchCount] = await Promise.all([
      Student.countDocuments({ groupId: group._id }),
      Photo.countDocuments({ groupId: group._id }),
      ScratchProject.countDocuments({ groupId: group._id })
    ]);

    const totalUsed = studentCount + photoCount + scratchCount;
    if (totalUsed > 0) {
      return res.status(409).json({
        status: 'error',
        message: `该组别下还有 ${totalUsed} 个关联数据（学生${studentCount}/图片${photoCount}/Scratch${scratchCount}），请先移除关联后再删除`
      });
    }

    await Group.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: '组别删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除组别失败'
    });
  }
});

export default router;
