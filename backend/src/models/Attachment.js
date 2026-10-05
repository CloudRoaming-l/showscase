import mongoose from 'mongoose';

// 附件文件模型（课件的 PPT/PDF/Word/Zip 等文件）
const attachmentSchema = new mongoose.Schema(
  {
    // 文件名（原始文件名）
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    // 存储后的文件名
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    // 文件路径（相对 uploads 目录）
    filePath: {
      type: String,
      required: true,
      trim: true
    },
    // 文件大小（字节）
    fileSize: {
      type: Number,
      default: 0
    },
    // 文件类型（MIME type）
    mimeType: {
      type: String,
      trim: true
    },
    // 文件扩展名
    extension: {
      type: String,
      trim: true,
      lowercase: true
    },
    // 附件类型：ppt / pdf / doc / zip / image / other
    fileType: {
      type: String,
      enum: ['ppt', 'pdf', 'doc', 'zip', 'image', 'other'],
      default: 'other'
    },
    // 关联类型：lesson / tool
    relatedType: {
      type: String,
      enum: ['lesson', 'tool'],
      default: 'lesson'
    },
    // 关联的ID
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    // 上传者
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // 排序
    sort: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

attachmentSchema.index({ relatedType: 1, relatedId: 1, sort: 1 });

export default mongoose.model('Attachment', attachmentSchema);
