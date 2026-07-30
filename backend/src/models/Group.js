import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '组别名称不能为空'],
      trim: true,
      maxlength: [30, '组别名称不能超过30个字符']
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

groupSchema.index({ name: 1 }, { unique: true });
groupSchema.index({ sort: 1, status: 1 });

export default mongoose.model('Group', groupSchema);
