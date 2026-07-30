import { useState, useEffect } from 'react';
import {
  Save,
  Bell,
  Shield,
  Palette,
  Settings2,
  Tags,
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { categoryAPI, groupAPI, isAuthError } from '../../services/api.js';

// 日期格式化辅助
function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// 提取后端返回的错误消息
function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

// ============ 作品类型管理 Tab ============
function CategoryTab() {
  const toast = useToast();
  const [subType, setSubType] = useState('photo'); // 'photo' | 'scratch'
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 添加表单
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSort, setNewSort] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // 编辑状态
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSort, setEditSort] = useState(0);
  const [editStatus, setEditStatus] = useState('active');

  useEffect(() => {
    loadList();
    // 切换子标签时关闭添加表单与编辑状态
    setShowAddForm(false);
    setEditingId(null);
  }, [subType]);

  const loadList = async () => {
    try {
      setLoading(true);
      const result = await categoryAPI.getAdminList(subType);
      setList(result.data || []);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载作品类型列表失败:', error);
      toast.error(getErrorMessage(error, '加载作品类型列表失败'));
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setNewName('');
    setNewSort(0);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('请输入作品类型名称');
      return;
    }
    try {
      setSubmitting(true);
      await categoryAPI.create({
        name,
        type: subType,
        sort: Number(newSort) || 0
      });
      toast.success('作品类型添加成功');
      resetAddForm();
      setShowAddForm(false);
      loadList();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('添加作品类型失败:', error);
      toast.error(getErrorMessage(error, '添加作品类型失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || '');
    setEditSort(item.sort ?? 0);
    setEditStatus(item.status || 'active');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async () => {
    const name = editName.trim();
    if (!name) {
      toast.error('请输入作品类型名称');
      return;
    }
    try {
      setSubmitting(true);
      await categoryAPI.update(editingId, {
        name,
        sort: Number(editSort) || 0,
        status: editStatus
      });
      toast.success('作品类型更新成功');
      setEditingId(null);
      loadList();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('更新作品类型失败:', error);
      toast.error(getErrorMessage(error, '更新作品类型失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`确定要删除作品类型「${item.name}」吗？`)) return;
    try {
      await categoryAPI.delete(item.id);
      toast.success('作品类型删除成功');
      loadList();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('删除作品类型失败:', error);
      // 后端会返回关联作品数量的错误信息
      toast.error(getErrorMessage(error, '删除作品类型失败'));
    }
  };

  const subTabs = [
    { id: 'photo', name: '图片' },
    { id: 'scratch', name: 'Scratch' }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">作品类型管理</h3>
          <p className="text-gray-400 text-xs mt-1">管理图片与 Scratch 作品的类型，启用状态可控制前台展示</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadList}
            className="p-2.5 bg-gray-800/60 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="刷新"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              if (!showAddForm) resetAddForm();
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-primary-500/20"
          >
            <Plus size={16} />
            <span>添加作品类型</span>
          </button>
        </div>
      </div>

      {/* 子标签切换 */}
      <div className="flex space-x-1 bg-gray-800/40 p-1 rounded-lg w-fit">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubType(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${
              subType === t.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* 添加表单（内联） */}
      {showAddForm && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-primary-500/30">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">作品类型名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`请输入${subType === 'photo' ? '图片' : 'Scratch'}作品类型名称`}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                maxLength={30}
              />
            </div>
            <div className="md:w-32">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">排序值</label>
              <input
                type="number"
                min={0}
                value={newSort}
                onChange={(e) => setNewSort(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Save size={14} />
                <span>保存</span>
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetAddForm();
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm"
              >
                <X size={14} />
                <span>取消</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 列表 */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
            暂无作品类型，点击右上角「添加作品类型」创建
          </div>
        ) : (
          list.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                {isEditing ? (
                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">作品类型名称</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
                        maxLength={30}
                      />
                    </div>
                    <div className="md:w-32">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">排序值</label>
                      <input
                        type="number"
                        min={0}
                        value={editSort}
                        onChange={(e) => setEditSort(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="md:w-36">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">状态</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
                      >
                        <option value="active">启用</option>
                        <option value="inactive">禁用</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleUpdate}
                        disabled={submitting}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
                      >
                        <Save size={14} />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm"
                      >
                        <X size={14} />
                        <span>取消</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">{item.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">创建时间：{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="text-gray-400 text-sm w-16 text-center">排序 {item.sort ?? 0}</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-green-500/15 text-green-300'
                            : 'bg-gray-600/30 text-gray-400'
                        }`}
                      >
                        {item.status === 'active' ? '启用' : '禁用'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-gray-700/50 rounded-md transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============ 教学小组管理 Tab ============
function GroupTab() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 添加表单
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSort, setNewSort] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // 编辑状态
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSort, setEditSort] = useState(0);
  const [editStatus, setEditStatus] = useState('active');

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      setLoading(true);
      const result = await groupAPI.getAdminList();
      setList(result.data || []);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载教学小组列表失败:', error);
      toast.error(getErrorMessage(error, '加载教学小组列表失败'));
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setNewName('');
    setNewSort(0);
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('请输入教学小组名称');
      return;
    }
    try {
      setSubmitting(true);
      await groupAPI.create({
        name,
        sort: Number(newSort) || 0
      });
      toast.success('教学小组添加成功');
      resetAddForm();
      setShowAddForm(false);
      loadList();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('添加教学小组失败:', error);
      toast.error(getErrorMessage(error, '添加教学小组失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || '');
    setEditSort(item.sort ?? 0);
    setEditStatus(item.status || 'active');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async () => {
    const name = editName.trim();
    if (!name) {
      toast.error('请输入教学小组名称');
      return;
    }
    try {
      setSubmitting(true);
      await groupAPI.update(editingId, {
        name,
        sort: Number(editSort) || 0,
        status: editStatus
      });
      toast.success('教学小组更新成功');
      setEditingId(null);
      loadList();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('更新教学小组失败:', error);
      toast.error(getErrorMessage(error, '更新教学小组失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`确定要删除教学小组「${item.name}」吗？`)) return;
    try {
      await groupAPI.delete(item.id);
      toast.success('教学小组删除成功');
      loadList();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('删除教学小组失败:', error);
      toast.error(getErrorMessage(error, '删除教学小组失败'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">教学小组管理</h3>
          <p className="text-gray-400 text-xs mt-1">管理学生教学小组，用于作品按组归类展示</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadList}
            className="p-2.5 bg-gray-800/60 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="刷新"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              if (!showAddForm) resetAddForm();
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-primary-500/20"
          >
            <Plus size={16} />
            <span>添加教学小组</span>
          </button>
        </div>
      </div>

      {/* 添加表单（内联） */}
      {showAddForm && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-primary-500/30">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">教学小组名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="请输入教学小组名称"
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                maxLength={30}
              />
            </div>
            <div className="md:w-32">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">排序值</label>
              <input
                type="number"
                min={0}
                value={newSort}
                onChange={(e) => setNewSort(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Save size={14} />
                <span>保存</span>
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetAddForm();
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm"
              >
                <X size={14} />
                <span>取消</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 列表 */}
      <div className="space-y-2">
        {loading ? (
          <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
            暂无教学小组，点击右上角「添加教学小组」创建
          </div>
        ) : (
          list.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                {isEditing ? (
                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">教学小组名称</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
                        maxLength={30}
                      />
                    </div>
                    <div className="md:w-32">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">排序值</label>
                      <input
                        type="number"
                        min={0}
                        value={editSort}
                        onChange={(e) => setEditSort(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div className="md:w-36">
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">状态</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-primary-500"
                      >
                        <option value="active">启用</option>
                        <option value="inactive">禁用</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleUpdate}
                        disabled={submitting}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
                      >
                        <Save size={14} />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm"
                      >
                        <X size={14} />
                        <span>取消</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">{item.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">创建时间：{formatDate(item.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="text-gray-400 text-sm w-16 text-center">排序 {item.sort ?? 0}</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-green-500/15 text-green-300'
                            : 'bg-gray-600/30 text-gray-400'
                        }`}
                      >
                        {item.status === 'active' ? '启用' : '禁用'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-gray-700/50 rounded-md transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded-md transition-colors"
                          title="删除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: '学生作品展示墙',
    siteDescription: '少儿编程学生作品展示平台',
    contactEmail: 'admin@example.com',
    contactPhone: '400-123-4567',
    allowRegistration: false,
    requireApproval: true,
    notificationEmail: true,
    notificationAdmin: true,
    primaryColor: '#e24d4d',
    secondaryColor: '#0ea5e9'
  });

  const tabs = [
    { id: 'general', name: '常规设置', icon: Settings2 },
    { id: 'notification', name: '通知设置', icon: Bell },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'appearance', name: '外观设置', icon: Palette },
    { id: 'category', name: '作品类型管理', icon: Tags },
    { id: 'group', name: '教学小组管理', icon: Users }
  ];

  // 仅在原有 4 个设置 Tab 显示底部保存按钮
  const showSaveButton = ['general', 'notification', 'security', 'appearance'].includes(activeTab);

  useEffect(() => {
    const saved = localStorage.getItem('student_showcase_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('student_showcase_settings', JSON.stringify(settings));
      toast.success('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error('保存设置失败，请重试');
    }
  };

  return (
    <AdminLayout>
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="card p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      activeTab === tab.id
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="card p-5">
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white mb-4">常规设置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">网站名称</label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">网站描述</label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                        rows={3}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">联系邮箱</label>
                        <input
                          type="email"
                          value={settings.contactEmail}
                          onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                          className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">联系电话</label>
                        <input
                          type="text"
                          value={settings.contactPhone}
                          onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                          className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notification' && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-white mb-4">通知设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">邮件通知</p>
                      <p className="text-gray-400 text-xs mt-1">新作品发布时发送邮件通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationEmail}
                        onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">管理员通知</p>
                      <p className="text-gray-400 text-xs mt-1">重要事件发送站内通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationAdmin}
                        onChange={(e) => setSettings({ ...settings, notificationAdmin: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-white mb-4">安全设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">允许用户注册</p>
                      <p className="text-gray-400 text-xs mt-1">允许访客注册成为平台用户</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowRegistration}
                        onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">作品审核</p>
                      <p className="text-gray-400 text-xs mt-1">新作品需要管理员审核后才能展示</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireApproval}
                        onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-white mb-4">外观设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">主题色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-gray-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">强调色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-gray-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'category' && <CategoryTab />}

            {activeTab === 'group' && <GroupTab />}

            {showSaveButton && (
              <div className="mt-8 pt-5 border-t border-gray-700/50">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-4 py-2.5 font-medium rounded-lg transition-all bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm shadow-sm shadow-primary-500/20"
                >
                  <Save size={14} />
                  <span>保存设置</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
