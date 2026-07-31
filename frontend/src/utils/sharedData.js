// 前后端共享常量（CATEGORIES 仅作回退默认值，实际分类请从后端动态获取）

export const CATEGORIES = [
  '机器人编程',
  '动画制作',
  '项目开发',
  '游戏创作',
  '人工智能',
  '网页设计',
  '创意绘画'
];

// 分类颜色列表（用于 getCategoryColor 哈希映射）
const CATEGORY_COLORS = [
  'from-purple-500 to-blue-500',
  'from-pink-500 to-red-500',
  'from-yellow-500 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-yellow-500'
];

// 基于分类名称的稳定哈希，保证同一分类永远显示同一种颜色
// 不依赖固定数组顺序，新增/删除分类不会影响其他分类的颜色
export function getCategoryColor(name) {
  if (!name) return CATEGORY_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export const STATUS_OPTIONS = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' }
];

export const STATUSES = ['pending', 'approved', 'rejected'];

export default {
  CATEGORIES,
  STATUSES,
  STATUS_OPTIONS,
  getCategoryColor
};
