import { Router } from 'express';
import Tool from '../models/Tool.js';
import ToolCategory from '../models/ToolCategory.js';
import { authMiddleware } from '../middleware/auth.js';
import { hardwareAccessRequired } from '../middleware/hardwareAccess.js';
import { writeRateLimit, publicRateLimit } from '../middleware/validate.js';

const router = Router();

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 前台：获取器材列表（需要密码访问）
router.get('/', hardwareAccessRequired, publicRateLimit, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const categoryId = req.query.categoryId;
    const keyword = req.query.keyword;

    const filter = { status: 'published' };
    if (categoryId) filter.categoryId = categoryId;
    if (keyword) {
      filter.$or = [
        { name: { $regex: escapeRegExp(keyword), $options: 'i' } },
        { model: { $regex: escapeRegExp(keyword), $options: 'i' } },
        { summary: { $regex: escapeRegExp(keyword), $options: 'i' } }
      ];
    }

    const total = await Tool.countDocuments(filter);
    const tools = await Tool.find(filter)
      .populate('categoryId', 'name')
      .sort({ categoryId: 1, sort: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      status: 'success',
      data: {
        list: tools,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取器材列表失败'
    });
  }
});

// 前台：获取器材详情
router.get('/:id', hardwareAccessRequired, publicRateLimit, async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('applicableStages', 'name shortName');

    if (!tool || tool.status !== 'published') {
      return res.status(404).json({
        status: 'error',
        message: '器材不存在'
      });
    }

    res.json({
      status: 'success',
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取器材详情失败'
    });
  }
});

// 管理员：获取器材列表（全状态）
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const categoryId = req.query.categoryId;
    const keyword = req.query.keyword;
    const status = req.query.status;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;
    if (keyword) {
      filter.$or = [
        { name: { $regex: escapeRegExp(keyword), $options: 'i' } },
        { model: { $regex: escapeRegExp(keyword), $options: 'i' } }
      ];
    }

    const total = await Tool.countDocuments(filter);
    const tools = await Tool.find(filter)
      .populate('categoryId', 'name')
      .sort({ categoryId: 1, sort: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      status: 'success',
      data: {
        list: tools,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取器材列表失败'
    });
  }
});

// 管理员：获取单个器材详情（编辑用）
router.get('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({
        status: 'error',
        message: '器材不存在'
      });
    }

    res.json({
      status: 'success',
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取器材详情失败'
    });
  }
});

// 管理员：创建器材
router.post('/', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const {
      name, model, categoryId, image, images, summary,
      principle, specifications, usage, exampleCode,
      wiringImages, pinout, teacherNotes, applicableStages,
      price, purchaseNote, sort, status
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: '器材名称不能为空'
      });
    }
    if (!categoryId) {
      return res.status(400).json({
        status: 'error',
        message: '请选择器材分类'
      });
    }

    const tool = await Tool.create({
      name: name.trim(),
      model: model?.trim() || '',
      categoryId,
      image: image || '',
      images: images || [],
      summary: summary?.trim() || '',
      principle: principle || '',
      specifications: specifications || '',
      usage: usage || '',
      exampleCode: exampleCode || '',
      wiringImages: wiringImages || [],
      pinout: pinout || '',
      teacherNotes: teacherNotes || '',
      applicableStages: applicableStages || [],
      price: price?.trim() || '',
      purchaseNote: purchaseNote?.trim() || '',
      sort: sort || 0,
      status: status === 'draft' ? 'draft' : 'published'
    });

    res.status(201).json({
      status: 'success',
      message: '器材创建成功',
      data: tool
    });
  } catch (error) {
    console.error('[tool create] error:', error);
    res.status(400).json({
      status: 'error',
      message: '创建器材失败'
    });
  }
});

// 管理员：更新器材
router.put('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const {
      name, model, categoryId, image, images, summary,
      principle, specifications, usage, exampleCode,
      wiringImages, pinout, teacherNotes, applicableStages,
      price, purchaseNote, sort, status
    } = req.body;

    const update = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ status: 'error', message: '器材名称不能为空' });
      }
      update.name = name.trim();
    }
    if (model !== undefined) update.model = model.trim();
    if (categoryId !== undefined) update.categoryId = categoryId;
    if (image !== undefined) update.image = image;
    if (images !== undefined) update.images = images;
    if (summary !== undefined) update.summary = summary.trim();
    if (principle !== undefined) update.principle = principle;
    if (specifications !== undefined) update.specifications = specifications;
    if (usage !== undefined) update.usage = usage;
    if (exampleCode !== undefined) update.exampleCode = exampleCode;
    if (wiringImages !== undefined) update.wiringImages = wiringImages;
    if (pinout !== undefined) update.pinout = pinout;
    if (teacherNotes !== undefined) update.teacherNotes = teacherNotes;
    if (applicableStages !== undefined) update.applicableStages = applicableStages;
    if (price !== undefined) update.price = price.trim();
    if (purchaseNote !== undefined) update.purchaseNote = purchaseNote.trim();
    if (sort !== undefined) update.sort = sort;
    if (status !== undefined) update.status = status;

    const tool = await Tool.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!tool) {
      return res.status(404).json({
        status: 'error',
        message: '器材不存在'
      });
    }

    res.json({
      status: 'success',
      message: '器材更新成功',
      data: tool
    });
  } catch (error) {
    console.error('[tool update] error:', error);
    res.status(400).json({
      status: 'error',
      message: '更新器材失败'
    });
  }
});

// 管理员：删除器材
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({
        status: 'error',
        message: '器材不存在'
      });
    }

    await Tool.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: '器材删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除器材失败'
    });
  }
});

export default router;
