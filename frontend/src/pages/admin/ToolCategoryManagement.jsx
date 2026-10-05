import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { toolCategoryAPI, isAuthError } from '../../services/api.js';

export default function ToolCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteId, setDeleteId] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    _id: null,
    name: '',
    description: '',
    sort: 0,
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await toolCategoryAPI.getAdminList();
      if (res.status === 'success') {
        setCategories(res.data);
      }
    } catch (error) {
      if (isAuthError(error)) return;
      toast.error('加载分类失败');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ _id: null, name: '', description: '', sort: 0, status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setModalMode('edit');
    setFormData({
      _id: cat._id,
      name: cat.name,
      description: cat.description || '',
      sort: cat.sort || 0,
      status: cat.status || 'active'
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    try {
      const submitData = { ...formData };
      delete submitData._id;

      if (modalMode === 'add') {
        await toolCategoryAPI.create(submitData);
        toast.success('分类创建成功');
      } else {
        await toolCategoryAPI.update(formData._id, submitData);
        toast.success('分类更新成功');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async () => {
    try {
      await toolCategoryAPI.delete(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || '删除失败');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">器材分类管理</h2>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>新建分类</span>
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-16">排序</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">分类名称</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">描述</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-24">状态</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">加载中...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">暂无分类</td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{cat.sort}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 line-clamp-1">{cat.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      cat.status === 'active'
                        ? 'bg-gray-700 text-gray-200'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {cat.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(cat._id)}
                        className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {modalMode === 'add' ? '新建分类' : '编辑分类'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">分类名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">描述</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">排序</label>
                  <input
                    type="number"
                    name="sort"
                    value={formData.sort}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">状态</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
              >
                <Save size={16} />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="确认删除"
        message="确定要删除这个分类吗？如果分类下还有器材，将无法删除。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
