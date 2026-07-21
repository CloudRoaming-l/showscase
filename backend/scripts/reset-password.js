import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-showcase';
const NEW_PASSWORD = '0142013';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接数据库');

    const hashed = await bcrypt.hash(NEW_PASSWORD, 12);
    const result = await mongoose.connection.collection('users').updateOne(
      { username: 'admin' },
      { $set: { password: hashed } }
    );

    console.log(`✅ 密码修改成功，修改了 ${result.modifiedCount} 条记录`);
    console.log(`   用户名: admin`);
    console.log(`   新密码: ${NEW_PASSWORD}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}

main();
