import { Router } from 'express';
import Photo from '../models/Photo.js';
import ActivityLog from '../models/ActivityLog.js';
import { authMiddleware } from '../middleware/auth.js';
import { validatePhoto, VALID_CATEGORIES, STATUS_ENUM, PAGINATION, escapeRegExp, publicRateLimit, writeRateLimit, adminRateLimit } from '../middleware/validate.js';

const router = Router();

// 公开接口：返回共享常量（分类列表、状态枚举）
router.get('/config', publicRateLimit, (req, res) => {
  res.json({
    status: 'success',
    data: {
      categories: VALID_CATEGORIES,
      statuses: STATUS_ENUM
    }
  });
});

// 操作日志辅助函数
const logActivity = async ({ action, targetType, targetId, targetName, description, operator, status = 'success', details = null, req }) => {
  try {
    await ActivityLog.create({
      action,
      targetType,
      targetId,
      targetName,
      description,
      operator: operator || req.user?.username || '管理员',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      status,
      details
    });
  } catch (err) {
    console.error('记录操作日志失败:', err);
  }
};

// 公开接口：列表、详情、精选
router.get('/', publicRateLimit, async (req, res) => {
  try {
    // 从全局 paginationValidator / searchSanitizer 取清洗后的值
    const category = req.query.category;
    const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
    const search = req.query.search;

    const query = {
      $or: [
        { status: 'approved' },
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    };
    if (category && category !== 'all' && VALID_CATEGORIES.includes(category)) {
      query.category = category;
    }

    if (search) {
      // searchSanitizer 已截断长度、清洗 XSS；此处转义正则元字符
      const safeSearch = escapeRegExp(String(search).slice(0, PAGINATION.SEARCH_MAX_LEN));
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { author: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const photos = await Photo.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name grade className avatar');

    const total = await Photo.countDocuments(query);

    res.json({
      status: 'success',
      data: photos,
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
      message: '获取作品失败'
    });
  }
});

router.get('/featured', publicRateLimit, async (req, res) => {
  try {
    const photos = await Photo.find({
      isFeatured: true,
      $or: [
        { status: 'approved' },
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('authorId', 'name grade className avatar');

    res.json({
      status: 'success',
      data: photos
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取精选作品失败'
    });
  }
});

router.get('/:id', publicRateLimit, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).populate('authorId', 'name grade className avatar');

    if (!photo) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    photo.viewCount = (photo.viewCount || 0) + 1;
    await photo.save();

    res.json({
      status: 'success',
      data: photo
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取作品详情失败'
    });
  }
});

router.get('/stats/summary', publicRateLimit, async (req, res) => {
  try {
    const totalPhotos = await Photo.countDocuments();
    const categories = await Photo.distinct('category');
    const totalAuthors = await Photo.distinct('author').then(docs => docs.length);
    // pending = 明确标记为待审核 + 从未被审核过（status 字段缺失/null/空字符串，default 未在这些旧数据上生效）
    const pendingCount = await Photo.countDocuments({
      $or: [
        { status: 'pending' },
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    });
    const rejectedCount = await Photo.countDocuments({ status: 'rejected' });
    // approved = 明确标记为已通过
    const approvedCount = await Photo.countDocuments({ status: 'approved' });
    const featuredCount = await Photo.countDocuments({
      isFeatured: true,
      $or: [
        { status: 'approved' },
        { status: 'pending' },
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ]
    });

    res.json({
      status: 'success',
      data: {
        totalPhotos,
        totalCategories: categories.length,
        totalAuthors,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        featured: featuredCount,
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取统计数据失败'
    });
  }
});

// 需要鉴权的接口
router.post('/', authMiddleware, writeRateLimit, validatePhoto, async (req, res) => {
  try {
    const photo = await Photo.create(req.body);

    await logActivity({
      action: 'create',
      targetType: 'photo',
      targetId: photo._id,
      targetName: photo.title,
      description: `创建作品《${photo.title}》`,
      req
    });

    res.status(201).json({
      status: 'success',
      message: '作品创建成功',
      data: photo
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '创建作品失败'
    });
  }
});

// 管理员接口：获取所有作品（包括待审核）
router.get('/admin/all', authMiddleware, adminRateLimit, async (req, res) => {
  try {
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;
    const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

    const query = {};
    if (status && status !== 'all' && STATUS_ENUM.includes(status)) {
      query.status = status;
    }
    if (category && category !== 'all' && VALID_CATEGORIES.includes(category)) {
      query.category = category;
    }
    if (search) {
      const safeSearch = escapeRegExp(String(search).slice(0, PAGINATION.SEARCH_MAX_LEN));
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { author: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const photos = await Photo.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name grade className avatar');
    const total = await Photo.countDocuments(query);

    // 统计各状态数量（同时处理 status 字段缺失/null/空字符串的情况，统一归入 pending）
    const statusCounts = await Photo.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $in: [{ $ifNull: ['$status', ''] }, ['pending', null, '']] },
              'pending',
              '$status'
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);
    const counts = { pending: 0, approved: 0, rejected: 0 };
    statusCounts.forEach(item => {
      const key = item._id;
      if (key === 'pending' || key === null || key === undefined || key === '') {
        counts.pending += item.count;
      } else if (key === 'approved') {
        counts.approved += item.count;
      } else if (key === 'rejected') {
        counts.rejected += item.count;
      }
    });

    res.json({
      status: 'success',
      data: photos,
      statusCounts: counts,
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
      message: '获取作品列表失败'
    });
  }
});

// 管理员接口：审核通过
router.post('/:id/approve', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const operator = req.user?.username || '管理员';
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectedReason: '', reviewedBy: operator, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!photo) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    await logActivity({
      action: 'approve',
      targetType: 'photo',
      targetId: photo._id,
      targetName: photo.title,
      description: `审核通过作品《${photo.title}》`,
      req
    });

    res.json({
      status: 'success',
      message: '作品已审核通过',
      data: photo
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '审核操作失败'
    });
  }
});

// 管理员接口：审核拒绝
router.post('/:id/reject', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { reason } = req.body;
    const operator = req.user?.username || '管理员';

    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectedReason: reason || '', reviewedBy: operator, reviewedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!photo) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    await logActivity({
      action: 'reject',
      targetType: 'photo',
      targetId: photo._id,
      targetName: photo.title,
      description: `审核拒绝作品《${photo.title}》${reason ? `，原因：${reason}` : ''}`,
      req
    });

    res.json({
      status: 'success',
      message: '作品已拒绝',
      data: photo
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '审核操作失败'
    });
  }
});

// 管理员接口：批量审核
router.post('/batch/approve', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供有效的作品ID列表'
      });
    }

    const result = await Photo.updateMany(
      { _id: { $in: ids } },
      { status: 'approved', rejectedReason: '' }
    );

    await logActivity({
      action: 'batch_approve',
      targetType: 'photo',
      targetId: ids,
      targetName: `${ids.length} 个作品`,
      description: `批量审核通过 ${result.modifiedCount} 个作品`,
      req
    });

    res.json({
      status: 'success',
      message: `已通过 ${result.modifiedCount} 个作品`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '批量审核失败'
    });
  }
});

router.put('/:id', authMiddleware, writeRateLimit, validatePhoto, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!photo) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    await logActivity({
      action: 'update',
      targetType: 'photo',
      targetId: photo._id,
      targetName: photo.title,
      description: `更新作品《${photo.title}》`,
      req
    });

    res.json({
      status: 'success',
      message: '作品更新成功',
      data: photo
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新作品失败'
    });
  }
});

router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndDelete(req.params.id);

    if (!photo) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    await logActivity({
      action: 'delete',
      targetType: 'photo',
      targetId: photo._id,
      targetName: photo.title,
      description: `删除作品《${photo.title}》`,
      req
    });

    res.json({
      status: 'success',
      message: '作品删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除作品失败'
    });
  }
});

// 批量删除
router.post('/batch/delete', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供有效的作品ID列表'
      });
    }

    const result = await Photo.deleteMany({ _id: { $in: ids } });

    await logActivity({
      action: 'batch_delete',
      targetType: 'photo',
      targetId: ids,
      targetName: `${ids.length} 个作品`,
      description: `批量删除 ${result.deletedCount} 个作品`,
      req
    });

    res.json({
      status: 'success',
      message: `已删除 ${result.deletedCount} 个作品`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '批量删除失败'
    });
  }
});

// 批量导入（需要鉴权 + 数据校验）
router.post('/batch', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { photos } = req.body;

    // 基本校验
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供有效的作品数据'
      });
    }

    // 限制单次导入数量，防止性能攻击
    if (photos.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: '单次导入最多支持 100 条数据'
      });
    }

    const { sanitizeString } = await import('../middleware/validate.js');
    const VALID_CATEGORIES = ['机器人编程', '动画制作', '项目开发', '游戏创作', '人工智能', '网页设计', '创意绘画'];

    // 逐条校验和清理数据
    const sanitizedPhotos = [];
    const errors = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      // 必填字段校验
      if (!photo.title || !photo.title.trim()) {
        errors.push(`第 ${i + 1} 行：作品名称不能为空`);
        continue;
      }
      if (!photo.category || !VALID_CATEGORIES.includes(photo.category)) {
        errors.push(`第 ${i + 1} 行：无效的分类`);
        continue;
      }
      if (!photo.author || !photo.author.trim()) {
        errors.push(`第 ${i + 1} 行：作者名称不能为空`);
        continue;
      }
      if (!photo.imageUrl || !photo.imageUrl.trim()) {
        errors.push(`第 ${i + 1} 行：图片URL不能为空`);
        continue;
      }

      // 长度限制
      if (photo.title.length > 100) {
        errors.push(`第 ${i + 1} 行：作品名称不能超过100个字符`);
        continue;
      }

      // 清理并添加到列表
      sanitizedPhotos.push({
        title: sanitizeString(photo.title),
        description: photo.description ? sanitizeString(photo.description) : '',
        category: photo.category.trim(),
        author: sanitizeString(photo.author),
        grade: photo.grade ? sanitizeString(photo.grade) : '',
        imageUrl: photo.imageUrl.trim(),
        isFeatured: Boolean(photo.isFeatured)
      });
    }

    // 如果所有数据都有错误，直接返回
    if (sanitizedPhotos.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '所有数据校验失败',
        errors: errors.slice(0, 5) // 最多返回5个错误
      });
    }

    const result = await Photo.insertMany(sanitizedPhotos, { ordered: false });

    const response = {
      status: 'success',
      message: `批量导入完成，成功 ${result.length} 个`,
      data: result
    };

    // 如果有部分失败，也返回警告信息
    if (errors.length > 0) {
      response.warnings = {
        failed: errors.length,
        details: errors.slice(0, 10)
      };
    }

    res.json(response);
  } catch (error) {
    console.error('批量导入错误:', error);
    res.status(400).json({
      status: 'error',
      message: '批量导入失败'
    });
  }
});

export default router;
