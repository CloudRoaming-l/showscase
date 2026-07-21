import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ScratchProject from '../models/ScratchProject.js';
import ActivityLog from '../models/ActivityLog.js';
import { authMiddleware } from '../middleware/auth.js';
import { PAGINATION, escapeRegExp, publicRateLimit, writeRateLimit, adminRateLimit } from '../middleware/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../uploads/scratch');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const COVER_DIR = path.join(__dirname, '../../uploads/scratch-covers');
if (!fs.existsSync(COVER_DIR)) {
  fs.mkdirSync(COVER_DIR, { recursive: true });
}

const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, uniqueName);
  }
});

const projectUpload = multer({
  storage: projectStorage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /sb3|sb2|json|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('只允许上传 .sb3 / .sb2 / .json 格式的 Scratch 项目文件'));
  }
});

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, COVER_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, uniqueName);
  }
});

const coverUpload = multer({
  storage: coverStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件作为封面'));
  }
});

const router = Router();

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

// 公开接口：Scratch 作品列表
router.get('/', publicRateLimit, async (req, res) => {
  try {
    const category = req.query.category;
    const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'newest';

    const query = { status: 'approved' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      const safeSearch = escapeRegExp(String(search).slice(0, PAGINATION.SEARCH_MAX_LEN));
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { author: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // 排序：newest=最新, popular=热门(按点赞数+浏览量综合排序)
    let sortOption = { createdAt: -1 };
    if (sortBy === 'popular') {
      sortOption = { likeCount: -1, viewCount: -1, createdAt: -1 };
    }

    const projects = await ScratchProject.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await ScratchProject.countDocuments(query);

    res.json({
      status: 'success',
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取Scratch作品失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取作品失败'
    });
  }
});

// 公开接口：精选 Scratch 作品
router.get('/featured', publicRateLimit, async (req, res) => {
  try {
    const projects = await ScratchProject.find({
      isFeatured: true,
      status: 'approved'
    })
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      status: 'success',
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取精选作品失败'
    });
  }
});

// 内存缓存：记录 IP 对项目的浏览、点赞和分享（生产环境建议换 Redis）
// 格式: viewTracker = { 'ip::projectId': timestamp }
const viewTracker = new Map();
const likeTracker = new Map();
const shareTracker = new Map();
const VIEW_COOLDOWN_MS = 60 * 60 * 1000; // 1小时内同一IP重复访问不计数
const LIKE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24小时内同一IP不能重复点赞
const SHARE_COOLDOWN_MS = 10 * 60 * 1000; // 10分钟内同一IP重复分享不计数

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.ip
    || req.connection?.remoteAddress
    || 'unknown';
}

function shouldCount(key, tracker, cooldownMs) {
  const now = Date.now();
  const lastTime = tracker.get(key);
  if (!lastTime || (now - lastTime) > cooldownMs) {
    tracker.set(key, now);
    return true;
  }
  return false;
}

// 定期清理过期的缓存（避免内存泄漏）
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of viewTracker.entries()) {
    if ((now - time) > VIEW_COOLDOWN_MS) viewTracker.delete(key);
  }
  for (const [key, time] of likeTracker.entries()) {
    if ((now - time) > LIKE_COOLDOWN_MS) likeTracker.delete(key);
  }
  for (const [key, time] of shareTracker.entries()) {
    if ((now - time) > SHARE_COOLDOWN_MS) shareTracker.delete(key);
  }
}, 60 * 60 * 1000); // 每小时清理一次

// 公开接口： Scratch 作品详情
router.get('/:id', publicRateLimit, async (req, res) => {
  try {
    const project = await ScratchProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    // IP 去重：同一IP在冷却期内重复访问不计数
    const clientIp = getClientIp(req);
    const viewKey = `${clientIp}::${req.params.id}`;
    if (shouldCount(viewKey, viewTracker, VIEW_COOLDOWN_MS)) {
      project.viewCount = (project.viewCount || 0) + 1;
      await project.save();
    }

    res.json({
      status: 'success',
      data: project
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取作品详情失败'
    });
  }
});

// 公开接口：点赞
router.post('/:id/like', publicRateLimit, async (req, res) => {
  try {
    // IP 去重：同一IP在24小时内不能重复点赞同一作品
    const clientIp = getClientIp(req);
    const likeKey = `${clientIp}::${req.params.id}`;
    if (!shouldCount(likeKey, likeTracker, LIKE_COOLDOWN_MS)) {
      return res.status(429).json({
        status: 'error',
        message: '你已经点赞过这个作品了，24小时后再来吧~'
      });
    }

    const project = await ScratchProject.findByIdAndUpdate(
      req.params.id,
      { $inc: { likeCount: 1 } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    res.json({
      status: 'success',
      message: '点赞成功',
      data: { likeCount: project.likeCount }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '点赞失败'
    });
  }
});

// 公开接口：分享
router.post('/:id/share', publicRateLimit, async (req, res) => {
  try {
    // IP 去重：同一IP在10分钟内重复分享同一作品不计数
    const clientIp = getClientIp(req);
    const shareKey = `${clientIp}::${req.params.id}`;
    if (!shouldCount(shareKey, shareTracker, SHARE_COOLDOWN_MS)) {
      return res.status(429).json({
        status: 'error',
        message: '分享太频繁了，休息一会儿再试吧~'
      });
    }

    const project = await ScratchProject.findByIdAndUpdate(
      req.params.id,
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    res.json({
      status: 'success',
      message: '分享成功',
      data: { shareCount: project.shareCount }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '分享失败'
    });
  }
});

// 上传 Scratch 项目文件
router.post('/upload', authMiddleware, writeRateLimit, projectUpload.single('project'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的 Scratch 项目文件'
      });
    }

    const fileUrl = `/uploads/scratch/${req.file.filename}`;

    await logActivity({
      action: 'upload_scratch',
      targetType: 'scratch_project',
      targetId: req.file.filename,
      targetName: req.file.originalname,
      description: `上传 Scratch 项目: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`,
      req
    });

    res.json({
      status: 'success',
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message || '上传失败'
    });
  }
});

// 上传封面图
router.post('/upload-cover', authMiddleware, writeRateLimit, coverUpload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的封面图片'
      });
    }

    const coverUrl = `/uploads/scratch-covers/${req.file.filename}`;

    res.json({
      status: 'success',
      message: '上传成功',
      data: {
        url: coverUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message || '上传失败'
    });
  }
});

// 管理员接口：获取所有 Scratch 作品
router.get('/admin/all', authMiddleware, adminRateLimit, async (req, res) => {
  try {
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;
    const page = parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
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
    const projects = await ScratchProject.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await ScratchProject.countDocuments(query);

    const statusCounts = await ScratchProject.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const counts = { pending: 0, approved: 0, rejected: 0 };
    statusCounts.forEach(item => {
      if (item._id && counts[item._id] !== undefined) {
        counts[item._id] = item.count;
      }
    });

    res.json({
      status: 'success',
      data: projects,
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

// 管理员接口：创建 Scratch 作品
router.post('/', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const { title, description, instructions, category, author, coverUrl, projectFile, projectFileSize, isFeatured } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 'error', message: '作品名称不能为空' });
    }
    if (!author || !author.trim()) {
      return res.status(400).json({ status: 'error', message: '作者名称不能为空' });
    }
    if (!projectFile || !projectFile.trim()) {
      return res.status(400).json({ status: 'error', message: '请上传 Scratch 项目文件' });
    }

    const project = await ScratchProject.create({
      title: title.trim(),
      description: description || '',
      instructions: instructions || '',
      category: category || 'Scratch编程',
      author: author.trim(),
      coverUrl: coverUrl || '',
      projectFile: projectFile.trim(),
      projectFileSize: projectFileSize || 0,
      isFeatured: Boolean(isFeatured),
      status: 'approved'
    });

    await logActivity({
      action: 'create_scratch',
      targetType: 'scratch_project',
      targetId: project._id,
      targetName: project.title,
      description: `创建 Scratch 作品《${project.title}》`,
      req
    });

    res.status(201).json({
      status: 'success',
      message: '作品创建成功',
      data: project
    });
  } catch (error) {
    console.error('创建Scratch作品失败:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || '创建作品失败'
    });
  }
});

// 管理员接口：更新 Scratch 作品
router.put('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const project = await ScratchProject.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    await logActivity({
      action: 'update_scratch',
      targetType: 'scratch_project',
      targetId: project._id,
      targetName: project.title,
      description: `更新 Scratch 作品《${project.title}》`,
      req
    });

    res.json({
      status: 'success',
      message: '作品更新成功',
      data: project
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: '更新作品失败'
    });
  }
});

// 管理员接口：删除 Scratch 作品
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const project = await ScratchProject.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: '未找到该作品'
      });
    }

    // 删除项目文件
    if (project.projectFile) {
      const filePath = path.join(UPLOAD_DIR, project.projectFile.replace('/uploads/scratch/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    // 删除封面
    if (project.coverUrl) {
      const coverPath = path.join(COVER_DIR, project.coverUrl.replace('/uploads/scratch-covers/', ''));
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await logActivity({
      action: 'delete_scratch',
      targetType: 'scratch_project',
      targetId: project._id,
      targetName: project.title,
      description: `删除 Scratch 作品《${project.title}》`,
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

export default router;
