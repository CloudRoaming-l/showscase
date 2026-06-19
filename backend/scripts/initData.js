import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Photo from '../src/models/Photo.js';
import Student from '../src/models/Student.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-showcase';

const initialPhotos = Array.from({ length: 40 }, (_, i) => ({
  title: `${['机器人编程', '动画制作', '项目开发', '游戏创作', '人工智能', '网页设计', '创意绘画'][i % 7]}作品 ${i + 1}`,
  category: ['机器人编程', '动画制作', '项目开发', '游戏创作', '人工智能', '网页设计', '创意绘画'][i % 7],
  author: ['张小明', '李小红', '王小强', '赵小花', '刘小东', '陈小丽', '周小杰', '吴小燕'][i % 8],
  grade: ['三年级', '四年级', '五年级', '六年级'][i % 4],
  description: '这是一个展示学生编程能力和创造力的精彩作品，凝聚了孩子们的想象力与技术实力。通过自主设计与团队协作，展现了少儿编程教育的优秀成果。',
  imageUrl: `https://picsum.photos/seed/photo${i + 1}/800/600`,
  isFeatured: [2, 5, 8, 12, 15, 20].includes(i + 1),
  viewCount: Math.floor(Math.random() * 100)
}));

const initialStudents = [
  { name: '张小明', grade: '三年级', className: '编程一班', phone: '138****1234' },
  { name: '李小红', grade: '四年级', className: '编程二班', phone: '139****5678' },
  { name: '王小强', grade: '五年级', className: '编程三班', phone: '137****9012' },
  { name: '赵小花', grade: '三年级', className: '编程一班', phone: '136****3456' },
  { name: '刘小东', grade: '四年级', className: '编程二班', phone: '135****7890' },
  { name: '陈小丽', grade: '五年级', className: '编程三班', phone: '134****2345' },
  { name: '周小杰', grade: '六年级', className: '编程四班', phone: '133****6789' },
  { name: '吴小燕', grade: '三年级', className: '编程一班', phone: '132****0123' }
];

async function initDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 连接到 MongoDB');

    // 清空现有数据
    await Photo.deleteMany({});
    await Student.deleteMany({});
    console.log('🗑️  已清空现有数据');

    // 插入学生数据
    const students = await Student.insertMany(initialStudents);
    console.log(`✅ 已插入 ${students.length} 条学生数据`);

    // 插入作品数据
    const photos = await Photo.insertMany(initialPhotos);
    console.log(`✅ 已插入 ${photos.length} 条作品数据`);

    console.log('\n📊 数据库初始化完成！');
    console.log(`   学生数量: ${students.length}`);
    console.log(`   作品数量: ${photos.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

initDatabase();
