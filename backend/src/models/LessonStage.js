import mongoose from 'mongoose';

// 课程阶段模型（L1 电子启蒙、L2 传感器世界等）
const lessonStageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '阶段名称不能为空'],
      trim: true,
      maxlength: [50, '阶段名称不能超过50个字符']
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: [20, '简称不能超过20个字符']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, '阶段描述不能超过300个字符']
    },
    ageRange: {
      type: String,
      trim: true,
      maxlength: [30, '适用年龄不能超过30个字符']
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

lessonStageSchema.index({ sort: 1, status: 1 });

export default mongoose.model('LessonStage', lessonStageSchema);
