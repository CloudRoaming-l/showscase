import mongoose from 'mongoose';

// 器材档案模型
const toolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '器材名称不能为空'],
      trim: true,
      maxlength: [80, '器材名称不能超过80个字符']
    },
    // 型号
    model: {
      type: String,
      trim: true,
      maxlength: [80, '型号不能超过80个字符']
    },
    // 所属分类
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ToolCategory',
      required: [true, '请选择器材分类']
    },
    // 器材图片
    image: {
      type: String,
      trim: true
    },
    // 多图展示
    images: [
      {
        type: String,
        trim: true
      }
    ],
    // 一句话简介
    summary: {
      type: String,
      trim: true,
      maxlength: [300, '简介不能超过300个字符']
    },
    // 工作原理
    principle: {
      type: String,
      trim: true
    },
    // 技术参数（HTML 或文本）
    specifications: {
      type: String,
      trim: true
    },
    // 使用方法
    usage: {
      type: String,
      trim: true
    },
    // 示例代码
    exampleCode: {
      type: String,
      trim: true
    },
    // 接线图
    wiringImages: [
      {
        type: String,
        trim: true
      }
    ],
    // 引脚说明
    pinout: {
      type: String,
      trim: true
    },
    // 教学心得与注意事项
    teacherNotes: {
      type: String,
      trim: true
    },
    // 适用的课程阶段
    applicableStages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LessonStage'
      }
    ],
    // 参考单价
    price: {
      type: String,
      trim: true,
      maxlength: [30, '参考单价不能超过30个字符']
    },
    // 采购链接/备注
    purchaseNote: {
      type: String,
      trim: true,
      maxlength: [300, '采购备注不能超过300个字符']
    },
    // 排序
    sort: {
      type: Number,
      default: 0
    },
    // 状态
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    }
  },
  {
    timestamps: true
  }
);

toolSchema.index({ categoryId: 1, sort: 1 });
toolSchema.index({ status: 1, createdAt: -1 });
toolSchema.index({ name: 'text', model: 'text', summary: 'text', principle: 'text' });

export default mongoose.model('Tool', toolSchema);
