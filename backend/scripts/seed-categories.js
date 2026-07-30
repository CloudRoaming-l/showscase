// 初始化分类数据脚本
// 使用方法：node backend/scripts/seed-categories.js
// 将现有硬编码的 Photo 分类和 Scratch 分类导入数据库

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import Category from '../src/models/Category.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-showcase';

const PHOTO_CATEGORIES = [
  '机器人编程',
  '动画制作',
  '项目开发',
  '游戏创作',
  '人工智能',
  '网页设计',
  '创意绘画'
];

const SCRATCH_CATEGORIES = [
  'Scratch编程',
  '游戏创作',
  '动画制作',
  '互动故事',
  '数学科学'
];

async function seed() {
  console.log('正在连接数据库...');
  await mongoose.connect(MONGODB_URI);
  console.log('数据库已连接');

  let created = 0;
  let skipped = 0;

  // 导入 Photo 分类
  for (let i = 0; i < PHOTO_CATEGORIES.length; i++) {
    const name = PHOTO_CATEGORIES[i];
    const existing = await Category.findOne({ name, type: 'photo' });
    if (existing) {
      console.log(`  [跳过] 图片分类已存在: ${name}`);
      skipped++;
      continue;
    }
    await Category.create({ name, type: 'photo', sort: i, status: 'active' });
    console.log(`  [新增] 图片分类: ${name}`);
    created++;
  }

  // 导入 Scratch 分类
  for (let i = 0; i < SCRATCH_CATEGORIES.length; i++) {
    const name = SCRATCH_CATEGORIES[i];
    const existing = await Category.findOne({ name, type: 'scratch' });
    if (existing) {
      console.log(`  [跳过] Scratch分类已存在: ${name}`);
      skipped++;
      continue;
    }
    await Category.create({ name, type: 'scratch', sort: i, status: 'active' });
    console.log(`  [新增] Scratch分类: ${name}`);
    created++;
  }

  console.log(`\n✅ 分类初始化完成！新增 ${created} 个，跳过 ${skipped} 个已存在的分类`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 初始化失败:', err.message);
  process.exit(1);
});
