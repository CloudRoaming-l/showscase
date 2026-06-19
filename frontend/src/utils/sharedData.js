// 前后端共享常量（与后端 middleware/validate.js 中的 VALID_CATEGORIES / STATUS_ENUM 保持一致）

export const CATEGORIES = [
  '机器人编程',
  '动画制作',
  '项目开发',
  '游戏创作',
  '人工智能',
  '网页设计',
  '创意绘画'
];

export const STATUS_OPTIONS = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' }
];

export const STATUSES = ['pending', 'approved', 'rejected'];

export default {
  CATEGORIES,
  STATUSES,
  STATUS_OPTIONS
};
