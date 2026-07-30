import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      required: [true, '目标类型不能为空'],
      enum: ['photo', 'scratch']
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, '目标ID不能为空']
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [20, '昵称不能超过20个字符'],
      default: '匿名用户'
    },
    content: {
      type: String,
      required: [true, '评论内容不能为空'],
      trim: true,
      maxlength: [500, '评论内容不能超过500个字符']
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active'
    },
    ip: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// 按目标查询评论的复合索引
commentSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: -1 });

export default mongoose.model('Comment', commentSchema);
