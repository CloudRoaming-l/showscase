import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '学生姓名不能为空'],
      trim: true,
      maxlength: [50, '姓名不能超过50个字符']
    },
    grade: {
      type: String,
      trim: true
    },
    className: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
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

studentSchema.index({ name: 1 });
studentSchema.index({ grade: 1 });
studentSchema.index({ className: 1 });

export default mongoose.model('Student', studentSchema);
