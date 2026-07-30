import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '分类名称不能为空'],
      trim: true,
      maxlength: [30, '分类名称不能超过30个字符']
    },
    type: {
      type: String,
      required: [true, '分类类型不能为空'],
      enum: ['photo', 'scratch']
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

// 同类型下名称唯一
categorySchema.index({ name: 1, type: 1 }, { unique: true });
// 列表查询索引
categorySchema.index({ type: 1, sort: 1, status: 1 });

export default mongoose.model('Category', categorySchema);
