import { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  UserCog,
  X,
  Save,
  KeyRound,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { userAPI, isAuthError } from '../../services/api.js';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const toast = useToast();
  const [formData, setFormData] = useState({
    _id: null,
    username: '',
    password: '',
    name: '',
    role: 'teacher',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await userAPI.getUsers({ pageSize: 100 });
      setUsers(result.data || []);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载用户列表失败:', error);
      toast.error('加载用户列表失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }
    if (modalMode === 'add' && !formData.password) {
      newErrors.password = '请输入密码';
    } else if (modalMode === 'add' && formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }
    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      _id: null,
      username: '',
      password: '',
      name: '',
      role: 'teacher',
      status: 'active'
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setModalMode('edit');
    setFormData({
      _id: user._id || user.id,
      username: user.username,
      password: '',
      name: user.name || '',
      role: user.role,
      status: user.status
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === 'add') {
        await userAPI.createUser({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          status: formData.status
        });
        toast.success('用户创建成功');
      } else {
        await userAPI.updateUser(formData._id, {
          name: formData.name,
          role: formData.role,
          status: formData.status
        });
        toast.success('用户更新成功');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      if (isAuthError(error)) return;
      const message = error.response?.data?.message || '保存失败，请重试';
      toast.error(message);
    }
  };

  const handleDelete = async (user) => {
    try {
      await userAPI.deleteUser(user._id || user.id);
      toast.success('用户删除成功');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      if (isAuthError(error)) return;
      const message = error.response?.data?.message || '删除失败，请重试';
      toast.error(message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('密码至少6个字符');
      return;
    }
    try {
      await userAPI.resetPassword(passwordModal._id || passwordModal.id, newPassword);
      toast.success('密码重置成功');
      setPasswordModal(null);
      setNewPassword('');
    } catch (error) {
      if (isAuthError(error)) return;
      const message = error.response?.data?.message || '密码重置失败，请重试';
      toast.error(message);
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userAPI.updateUser(user._id || user.id, { status: newStatus });
      toast.success(`账号已${newStatus === 'active' ? '启用' : '停用'}`);
      loadData();
    } catch (error) {
      if (isAuthError(error)) return;
      toast.error('操作失败，请重试');
    }
  };

  const getRoleLabel = (role) => {
    return role === 'admin' ? '管理员' : '教师';
  };

  const getRoleBadgeClass = (role) => {
    return role === 'admin'
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    teacher: users.filter((u) => u.role === 'teacher').length,
    active: users.filter((u) => u.status === 'active').length
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">总账号数</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <UserCog size={20} className="text-primary-400" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">管理员</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.admin}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield size={20} className="text-purple-400" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">教师账号</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.teacher}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <UserCheck size={20} className="text-blue-400" />
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">已启用</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <UserCheck size={20} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索用户名或姓名..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64 pl-9 pr-4 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">全部角色</option>
                <option value="admin">管理员</option>
                <option value="teacher">教师</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:text-white hover:border-gray-500 transition-all text-sm"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span>刷新</span>
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all text-sm shadow-sm shadow-primary-500/20"
              >
                <Plus size={14} />
                <span>添加用户</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">用户名</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">姓名</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">角色</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">状态</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">最后登录</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">创建时间</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium text-sm">操作</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user._id || user.id}
                      className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {(user.name || user.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white text-sm font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{user.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getRoleBadgeClass(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusBadgeClass(
                            user.status
                          )}`}
                        >
                          {user.status === 'active' ? '已启用' : '已停用'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('zh-CN') : '从未登录'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPasswordModal(user)}
                            className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="重置密码"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => toggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.status === 'active'
                                ? 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10'
                                : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10'
                            }`}
                            title={user.status === 'active' ? '停用账号' : '启用账号'}
                          >
                            {user.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user)}
                            disabled={user.username === 'admin'}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {modalMode === 'add' ? '添加用户' : '编辑用户'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  用户名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={modalMode === 'edit'}
                  className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-700'
                  } ${modalMode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="请输入用户名"
                />
                {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
              </div>
              {modalMode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    密码 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="请输入密码（至少6位）"
                  />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="请输入姓名"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="teacher">教师</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:text-white hover:border-gray-500 transition-all text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all text-sm shadow-sm shadow-primary-500/20"
              >
                <Save size={14} />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">重置密码</h3>
              <button
                onClick={() => {
                  setPasswordModal(null);
                  setNewPassword('');
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                为用户 <span className="text-white font-medium">{passwordModal.username}</span> 重置密码
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  新密码 <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  placeholder="请输入新密码（至少6位）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => {
                  setPasswordModal(null);
                  setNewPassword('');
                }}
                className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:text-white hover:border-gray-500 transition-all text-sm"
              >
                取消
              </button>
              <button
                onClick={handleResetPassword}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all text-sm shadow-sm shadow-primary-500/20"
              >
                <KeyRound size={14} />
                <span>确认重置</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="确认删除"
        message={`确定要删除用户「${deleteConfirm?.username}」吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AdminLayout>
  );
}
