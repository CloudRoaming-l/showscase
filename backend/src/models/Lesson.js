import mongoose from 'mongoose';

// 课件模型
const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '课件标题不能为空'],
      trim: true,
      maxlength: [100, '课件标题不能超过100个字符']
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [100, '副标题不能超过100个字符']
    },
    // 所属阶段
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LessonStage',
      required: [true, '请选择所属阶段']
    },
    // 课时序号（同一阶段内排序）
    lessonNumber: {
      type: Number,
      default: 1,
      min: 1
    },
    // 标签：入门/核心/趣味/拓展/项目课/复习
    tag: {
      type: String,
      enum: ['入门', '核心', '趣味', '拓展', '项目课', '复习', ''],
      default: ''
    },
    // 课时时长
    duration: {
      type: String,
      trim: true,
      maxlength: [20, '课时时长不能超过20个字符']
    },
    // 适用年龄
    ageRange: {
      type: String,
      trim: true,
      maxlength: [30, '适用年龄不能超过30个字符']
    },
    // 课程简介（列表页显示）
    summary: {
      type: String,
      trim: true,
      maxlength: [500, '课程简介不能超过500个字符']
    },
    // 课程正文（富文本 HTML，可选）
    content: {
      type: String,
      trim: true
    },
    // 封面图
    coverImage: {
      type: String,
      trim: true
    },
    // 图形化程序截图（Mind+/米思齐）
    codeImages: [
      {
        type: String,
        trim: true
      }
    ],
    // 接线图
    wiringImages: [
      {
        type: String,
        trim: true
      }
    ],
    // 教学备注（仅自己可见的备课笔记）
    teacherNotes: {
      type: String,
      trim: true
    },
    // 附件文件列表（PPT/PDF/Word/Zip等）
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attachment'
      }
    ],
    // 对应器材
    relatedTools: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tool'
      }
    ],
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

lessonSchema.index({ stageId: 1, lessonNumber: 1 });
lessonSchema.index({ status: 1, createdAt: -1 });
lessonSchema.index({ title: 'text', summary: 'text', content: 'text' });

export default mongoose.model('Lesson', lessonSchema);
