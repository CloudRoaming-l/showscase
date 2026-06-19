import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '用户名不能为空'],
      unique: true,
      trim: true,
      minlength: [3, '用户名至少3个字符']
    },
    password: {
      type: String,
      required: [true, '密码不能为空'],
      minlength: [6, '密码至少6个字符']
    },
    name: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'teacher'],
      default: 'teacher'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('User', userSchema);
