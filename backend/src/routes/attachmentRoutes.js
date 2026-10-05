import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Attachment from '../models/Attachment.js';
import { authMiddleware } from '../middleware/auth.js';
import { writeRateLimit } from '../middleware/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../uploads/hardware');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, uniqueName);
  }
});

// 文件类型判断
function getFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const pptExts = ['ppt', 'pptx', 'pps', 'ppsx'];
  const pdfExts = ['pdf'];
  const docExts = ['doc', 'docx', 'rtf', 'txt', 'md'];
  const zipExts = ['zip', 'rar', '7z', 'tar', 'gz'];
  const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

  if (pptExts.includes(ext)) return 'ppt';
  if (pdfExts.includes(ext)) return 'pdf';
  if (docExts.includes(ext)) return 'doc';
  if (zipExts.includes(ext)) return 'zip';
  if (imgExts.includes(ext)) return 'image';
  return 'other';
}

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

const router = Router();

// 上传附件（管理员）
router.post('/upload', authMiddleware, writeRateLimit, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的文件'
      });
    }

    const fileType = getFileType(req.file.originalname, req.file.mimetype);
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const attachment = await Attachment.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: `/uploads/hardware/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extension: ext,
      fileType: fileType,
      relatedType: req.body.relatedType || 'lesson',
      relatedId: req.body.relatedId || null,
      uploadedBy: req.user?.id || null,
      sort: parseInt(req.body.sort) || 0
    });

    res.status(201).json({
      status: 'success',
      message: '文件上传成功',
      data: attachment
    });
  } catch (error) {
    console.error('[upload] 上传失败:', error);
    res.status(500).json({
      status: 'error',
      message: '文件上传失败'
    });
  }
});

// 批量上传附件
router.post('/upload-multiple', authMiddleware, writeRateLimit, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的文件'
      });
    }

    const attachments = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileType = getFileType(file.originalname, file.mimetype);
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

      const attachment = await Attachment.create({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: `/uploads/hardware/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        extension: ext,
        fileType: fileType,
        relatedType: req.body.relatedType || 'lesson',
        relatedId: req.body.relatedId || null,
        uploadedBy: req.user?.id || null,
        sort: i
      });
      attachments.push(attachment);
    }

    res.status(201).json({
      status: 'success',
      message: `成功上传 ${attachments.length} 个文件`,
      data: attachments
    });
  } catch (error) {
    console.error('[upload-multiple] 上传失败:', error);
    res.status(500).json({
      status: 'error',
      message: '文件上传失败'
    });
  }
});

// 删除附件
router.delete('/:id', authMiddleware, writeRateLimit, async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({
        status: 'error',
        message: '附件不存在'
      });
    }

    // 删除物理文件
    const filePath = path.join(__dirname, '../../..', attachment.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Attachment.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: '附件删除成功'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '删除附件失败'
    });
  }
});

export default router;
