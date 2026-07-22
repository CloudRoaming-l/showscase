import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-showcase';

const adminConfig = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  name: process.env.ADMIN_NAME || '管理员',
  role: 'admin'
};

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    console.log(`✅ 已连接数据库: ${MONGODB_URI}`);

    const existing = await User.findOne({ username: adminConfig.username });
    if (existing) {
      console.log(`ℹ️ 管理员账号 "${adminConfig.username}" 已存在，跳过创建`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminConfig.password, 12);
    await User.create({
      username: adminConfig.username,
      password: hashedPassword,
      name: adminConfig.name,
      role: adminConfig.role,
      status: 'active'
    });

    console.log(`✅ 管理员账号创建成功:`);
    console.log(`   用户名: ${adminConfig.username}`);
    console.log(`   密码: ${adminConfig.password}`);
    console.log(`   姓名: ${adminConfig.name}`);
    console.log(`⚠️ 请在首次登录后立即修改密码！`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建管理员失败:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();