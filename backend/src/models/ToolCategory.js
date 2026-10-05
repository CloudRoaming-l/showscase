import mongoose from 'mongoose';

// 器材分类模型
const toolCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '分类名称不能为空'],
      trim: true,
      maxlength: [30, '分类名称不能超过30个字符']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, '分类描述不能超过200个字符']
    },
    sort: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

toolCategorySchema.index({ sort: 1, status: 1 });
toolCategorySchema.index({ name: 1 }, { unique: true });

export default mongoose.model('ToolCategory', toolCategorySchema);
