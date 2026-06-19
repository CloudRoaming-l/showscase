import mongoose from 'mongoose';
import { VALID_CATEGORIES, STATUS_ENUM } from '../middleware/validate.js';

const photoSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: [true, '请选择分类'],
      enum: VALID_CATEGORIES
    },
    author: {
      type: String,
      required: [true, '作者名称不能为空'],
      trim: true
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      description: '关联学生ID（可选，若提供则可用于查询和详情和展示关联数据）'
    },
    grade: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      required: [true, '请上传作品图片']
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
    status: {
      type: String,
      enum: STATUS_ENUM,
      default: 'pending',
      index: true
    },
    rejectedReason: {
      type: String,
      trim: true,
      maxlength: [200, '拒绝原因不能超过200个字符']
    },
    reviewedBy: {
      type: String,
      description: '审核人用户名（仅当 status !== approved/rejected 时记录）'
    },
    reviewedAt: {
      type: Date,
      description: '审核时间'
    }
  },
  {
    timestamps: true
  }
);

photoSchema.index({ category: 1, createdAt: -1 });
photoSchema.index({ authorId: 1, createdAt: -1 });
photoSchema.index({ status: 1, createdAt: -1 });
photoSchema.index({ title: 'text', description: 'text', author: 'text' });

export default mongoose.model('Photo', photoSchema);
