import { Router } from 'express';
import Lesson from '../models/Lesson.js';
import LessonStage from '../models/LessonStage.js';
import Attachment from '../models/Attachment.js';
import { authMiddleware } from '../middleware/auth.js';
import { hardwareAccessRequired } from '../middleware/hardwareAccess.js';
import { writeRateLimit, publicRateLimit } from '../middleware/validate.js';

const router = Router();

// 辅助：转义正则特殊字符
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 前台：获取课件列表（分页，需要密码访问）
router.get('/', hardwareAccessRequired, publicRateLimit, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const stageId = req.query.stageId;
    const keyword = req.query.keyword;

    const filter = { status: 'published' };
    if (stageId) filter.stageId = stageId;
    if (keyword) {
      filter.$or = [
        { title: { $regex: escapeRegExp(keyword), $options: 'i' } },
        { summary: { $regex: escapeRegExp(keyword), $options: 'i' } }
      ];
    }

    const total = await Lesson.countDocuments(filter);
    const lessons = await Lesson.find(filter)
      .populate('stageId', 'name shortName')
      .populate('attachments')
      .sort({ stageId: 1, lessonNumber: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      status: 'success',
      data: {
        list: lessons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[lesson list] error:', error);
    res.status(500).json({
      status: 'error',
      message: '获取课件列表失败'
    });
  }
});

// 前台：获取课件详情
router.get('/:id', hardwareAccessRequired, publicRateLimit, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('stageId', 'name shortName')
      .populate('attachments')
      .populate('relatedTools', 'name model image');

    if (!lesson || lesson.status !== 'published') {
      return res.status(404).json({
        status: 'error',
        message: '课件不存在'
      });
    }

    res.json({
      status: 'success',
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取课件详情失败'
    });
  }
});

// 管理员：获取课件列表（全状态）
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const stageId = req.query.stageId;
    const keyword = req.query.keyword;
    const status = req.query.status;

    const filter = {};
    if (stageId) filter.stageId = stageId;
    if (status) filter.status = status;
    if (keyword) {
      filter.$or = [
        { title: { $regex: escapeRegExp(keyword), $options: 'i' } }
      ];
    }

    const total = await Lesson.countDocuments(filter);
    const lessons = await Lesson.find(filter)
      .populate('stageId', 'name')
      .sort({ stageId: 1, lessonNumber: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      status: 'success',
      data: {
        list: lessons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取课件列表失败'
    });
  }
});

// 管理员：获取单个课件详情（编辑用）
router.get('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('attachments')
      .populate('relatedTools', 'name model');

    if (!lesson) {
      return res.status(404).json({
        status: 'error',
        message: '课件不存在'
      });
    }

    res.json({
      status: 'success',
      data: lesson
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '获取课件详情失败'
    });
  }
});

// 管理员：创建课件
router.post('/', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const {
      title, subtitle, stageId, lessonNumber, tag, duration,
      ageRange, summary, content, coverImage, codeImages,
      wiringImages, teacherNotes, attachments, relatedTools,
      sort, status
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: '课件标题不能为空'
      });
    }
    if (!stageId) {
      return res.status(400).json({
        status: 'error',
        message: '请选择所属阶段'
      });
    }

    const lesson = await Lesson.create({
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      stageId,
      lessonNumber: lessonNumber || 1,
      tag: tag || '',
      duration: duration?.trim() || '',
      ageRange: ageRange?.trim() || '',
      summary: summary?.trim() || '',
      content: content || '',
      coverImage: coverImage || '',
      codeImages: codeImages || [],
      wiringImages: wiringImages || [],
      teacherNotes: teacherNotes || '',
      attachments: attachments || [],
      relatedTools: relatedTools || [],
      sort: sort || 0,
      status: status === 'draft' ? 'draft' : 'published'
    });

    // 如果传了附件ID，更新附件的关联
    if (attachments && attachments.length > 0) {
      await Attachment.updateMany(
        { _id: { $in: attachments } },
        { $set: { relatedType: 'lesson', relatedId: lesson._id } }
      );
    }

    res.status(201).json({
      status: 'success',
      message: '课件创建成功',
      data: lesson
    });
  } catch (error) {
    console.error('[lesson create] error:', error);
    res.status(400).json({
      status: 'error',
      message: '创建课件失败'
    });
  }
});

// 管理员：更新课件
router.put('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const {
      title, subtitle, stageId, lessonNumber, tag, duration,
      ageRange, summary, content, coverImage, codeImages,
      wiringImages, teacherNotes, attachments, relatedTools,
      sort, status
    } = req.body;

    const update = {};
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ status: 'error', message: '课件标题不能为空' });
      }
      update.title = title.trim();
    }
    if (subtitle !== undefined) update.subtitle = subtitle.trim();
    if (stageId !== undefined) update.stageId = stageId;
    if (lessonNumber !== undefined) update.lessonNumber = lessonNumber;
    if (tag !== undefined) update.tag = tag;
    if (duration !== undefined) update.duration = duration.trim();
    if (ageRange !== undefined) update.ageRange = ageRange.trim();
    if (summary !== undefined) update.summary = summary.trim();
    if (content !== undefined) update.content = content;
    if (coverImage !== undefined) update.coverImage = coverImage;
    if (codeImages !== undefined) update.codeImages = codeImages;
    if (wiringImages !== undefined) update.wiringImages = wiringImages;
    if (teacherNotes !== undefined) update.teacherNotes = teacherNotes;
    if (attachments !== undefined) update.attachments = attachments;
    if (relatedTools !== undefined) update.relatedTools = relatedTools;
    if (sort !== undefined) update.sort = sort;
    if (status !== undefined) update.status = status;

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!lesson) {
      return res.status(404).json({
        status: 'error',
        message: '课件不存在'
      });
    }

    // 更新附件关联
    if (attachments !== undefined) {
      // 先清除旧关联
      await Attachment.updateMany(
        { relatedType: 'lesson', relatedId: lesson._id },
        { $set: { relatedId: null } }
      );
      // 设置新关联
      if (attachments.length > 0) {
        await Attachment.updateMany(
          { _id: { $in: attachments } },
          { $set: { relatedType: 'lesson', relatedId: lesson._id } }
        );
      }
    }

    res.json({
      status: 'success',
      message: '课件更新成功',
      data: lesson
    });
  } catch (error) {
    console.error('[lesson update] error:', error);
    res.status(400).json({
      status: 'error',
      message: '更新课件失败'
    });
  }
});

// 管理员：删除课件
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        status: 'error',
        message: '课件不存在'
      });
    }

    // 删除关联的附件（物理文件也删）
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (lesson.attachments && lesson.attachments.length > 0) {
      const attachments = await Attachment.find({ _id: { $in: lesson.attachments } });
      for (const att of attachments) {
        const filePath = path.join(__dirname, '../../..', att.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await Attachment.deleteMany({ _id: { $in: lesson.attachments } });
    }

    await Lesson.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: '课件删除成功'
    });
  } catch (error) {
    console.error('[lesson delete] error:', error);
    res.status(500).json({
      status: 'error',
      message: '删除课件失败'
    });
  }
});

export default router;
