import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'approve', 'reject', 'batch_approve', 'batch_delete', 'login', 'other'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['photo', 'student', 'user', 'system'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    sparse: true
  },
  targetName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '描述不能超过500个字符']
  },
  operator: {
    type: String,
    trim: true,
    default: '系统'
  },
  ip: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
}, {
  timestamps: true
});

activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, createdAt: -1 });
activityLogSchema.index({ operator: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
