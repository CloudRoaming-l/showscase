import mongoose from 'mongoose';

const scratchProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '作品名称不能为空'],
      trim: true,
      maxlength: [100, '作品名称不能超过100个字符']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, '作品描述不能超过500个字符']
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [500, '操作说明不能超过500个字符']
    },
    category: {
      type: String,
      required: [true, '请选择分类'],
      default: 'Scratch编程'
    },
    author: {
      type: String,
      required: [true, '作者名称不能为空'],
      trim: true
    },
    coverUrl: {
      type: String,
      trim: true
    },
    projectFile: {
      type: String,
      required: [true, '请上传Scratch项目文件'],
      trim: true
    },
    projectFileSize: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true
    },
    rejectedReason: {
      type: String,
      trim: true,
      maxlength: [200, '拒绝原因不能超过200个字符']
    }
  },
  {
    timestamps: true
  }
);

scratchProjectSchema.index({ category: 1, createdAt: -1 });
scratchProjectSchema.index({ status: 1, createdAt: -1 });
scratchProjectSchema.index({ title: 'text', description: 'text', author: 'text' });

export default mongoose.model('ScratchProject', scratchProjectSchema);
