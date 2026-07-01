import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { authMiddleware, adminRequired } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(adminRequired);

router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '', role = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limit = parseInt(pageSize, 10);
    const skip = (pageNum - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      status: 'success',
      data: users,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('[getUsers] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户列表失败'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }
    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('[getUser] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户信息失败'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, name, role = 'teacher', status = 'active' } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({
        status: 'error',
        message: '用户名至少3个字符'
      });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: '密码至少6个字符'
      });
    }
    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: '无效的角色'
      });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: '用户名已存在'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.trim(),
      password: hashedPassword,
      name: name || username.trim(),
      role,
      status
    });

    await logActivity(req, 'create', 'user', user._id, user.username, `创建用户：${user.username}`);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({
      status: 'success',
      message: '用户创建成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('[createUser] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '创建用户失败'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, role, status } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    if (role && !['admin', 'teacher'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: '无效的角色'
      });
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    await user.save();

    await logActivity(req, 'update', 'user', user._id, user.username, `更新用户信息：${user.username}`);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({
      status: 'success',
      message: '用户更新成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('[updateUser] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '更新用户失败'
    });
  }
});

router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: '密码至少6个字符'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();

    await logActivity(req, 'reset_password', 'user', user._id, user.username, `重置用户密码：${user.username}`);

    res.json({
      status: 'success',
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('[resetPassword] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '重置密码失败'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: '用户不存在'
      });
    }

    if (user.username === 'admin') {
      return res.status(400).json({
        status: 'error',
        message: '默认管理员账号不能删除'
      });
    }

    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        status: 'error',
        message: '不能删除自己的账号'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity(req, 'delete', 'user', user._id, user.username, `删除用户：${user.username}`);

    res.json({
      status: 'success',
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('[deleteUser] 未处理异常:', error);
    res.status(500).json({
      status: 'error',
      message: '删除用户失败'
    });
  }
});

async function logActivity(req, action, targetType, targetId, targetName, description) {
  try {
    await ActivityLog.create({
      action,
      targetType,
      targetId,
      targetName,
      description,
      operator: req.user?.username || 'system',
      ip: (req.headers && req.headers['x-forwarded-for']) || req.ip || '',
      userAgent: (req.headers && req.headers['user-agent']) || '',
      status: 'success'
    });
  } catch (err) {
    console.error('[logActivity] 记录操作日志失败:', err.message);
  }
}

export default router;
