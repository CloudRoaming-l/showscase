import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-showcase';

const sampleProjects = [
  {
    title: '小猫走迷宫',
    description: '一只可爱的小猫在迷宫中寻找出口的故事。使用方向键控制小猫移动，帮助它找到奶酪！',
    instructions: '使用方向键 ↑ ↓ ← → 控制小猫移动，找到奶酪即可过关。',
    category: '游戏创作',
    author: '小明',
    coverUrl: 'https://cdn2.scratch.mit.edu/get_image/project/617008324_480x360.png',
    projectFile: 'https://projects.scratch.mit.edu/617008324',
    isFeatured: true,
    status: 'approved',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0
  },
  {
    title: '打地鼠小游戏',
    description: '经典的打地鼠游戏，考验你的反应速度！地鼠会随机从洞里冒出来，点击它们获得分数。',
    instructions: '点击从洞里冒出来的地鼠获得分数，30秒内尽可能多地打到地鼠。',
    category: '游戏创作',
    author: '小红',
    coverUrl: 'https://cdn2.scratch.mit.edu/get_image/project/1522016860_480x360.png',
    projectFile: 'https://projects.scratch.mit.edu/1522016860',
    isFeatured: true,
    status: 'approved',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0
  },
  {
    title: '钢琴演奏家',
    description: '一个简易的钢琴模拟器，可以用键盘弹奏出美妙的音乐。',
    instructions: '按键盘上的 A S D F G H J 键来弹奏不同的音符。',
    category: '互动故事',
    author: '小华',
    coverUrl: 'https://cdn2.scratch.mit.edu/get_image/project/11831108_480x360.png',
    projectFile: 'https://projects.scratch.mit.edu/11831108',
    isFeatured: false,
    status: 'approved',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0
  },
  {
    title: '海底世界探索',
    description: '跟随小潜水艇一起探索神秘的海底世界，看看都有哪些奇妙的海洋生物。',
    instructions: '点击绿旗开始，使用方向键控制潜水艇上下左右移动。',
    category: '动画制作',
    author: '小刚',
    coverUrl: 'https://cdn2.scratch.mit.edu/get_image/project/1277772711_480x360.png',
    projectFile: 'https://projects.scratch.mit.edu/1277772711',
    isFeatured: false,
    status: 'approved',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0
  },
  {
    title: '数学加减法练习',
    description: '一个有趣的数学练习游戏，帮助小朋友们练习加减法运算。',
    instructions: '根据题目输入正确答案，答对得分，答错不扣分。',
    category: '数学科学',
    author: '小芳',
    coverUrl: 'https://cdn2.scratch.mit.edu/get_image/project/587047018_480x360.png',
    projectFile: 'https://projects.scratch.mit.edu/587047018',
    isFeatured: true,
    status: 'approved',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0
  },
  {
    title: '贪吃蛇',
    description: '经典贪吃蛇游戏，控制小蛇吃食物变长，不要撞到墙壁或自己！',
    instructions: '方向键控制蛇的移动方向，吃到食物蛇会变长，撞墙或撞到自己游戏结束。',
    category: '游戏创作',
    author: '小龙',
    coverUrl: 'https://cdn2.scratch.mit.edu/get_image/project/27068032_480x360.png',
    projectFile: 'https://projects.scratch.mit.edu/27068032',
    isFeatured: false,
    status: 'approved',
    viewCount: 0,
    likeCount: 0,
    shareCount: 0
  }
];

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接数据库');

    const ScratchProject = mongoose.model('ScratchProject', new mongoose.Schema({
      title: String,
      description: String,
      instructions: String,
      category: String,
      author: String,
      coverUrl: String,
      projectFile: String,
      projectFileSize: Number,
      isFeatured: Boolean,
      viewCount: Number,
      likeCount: Number,
      status: String
    }, { timestamps: true }));

    let count = 0;
    for (const project of sampleProjects) {
      const existing = await ScratchProject.findOne({ title: project.title });
      if (!existing) {
        await ScratchProject.create(project);
        count++;
        console.log(`  ✓ 添加: ${project.title}`);
      } else {
        console.log(`  - 已存在: ${project.title}`);
      }
    }

    console.log(`\n✅ 完成！新增了 ${count} 个 Scratch 示例作品`);
  } catch (err) {
    console.error('❌ 错误:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
