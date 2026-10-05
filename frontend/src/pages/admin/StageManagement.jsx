import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, X, Save } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { stageAPI, isAuthError } from '../../services/api.js';

export default function StageManagement() {
  const [stages, setStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteId, setDeleteId] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    _id: null,
    name: '',
    shortName: '',
    description: '',
    ageRange: '',
    sort: 0,
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await stageAPI.getAdminList();
      if (res.status === 'success') {
        setStages(res.data);
      }
    } catch (error) {
      if (isAuthError(error)) return;
      toast.error('加载阶段失败');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      _id: null, name: '', shortName: '', description: '',
      ageRange: '', sort: 0, status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (stage) => {
    setModalMode('edit');
    setFormData({
      _id: stage._id,
      name: stage.name,
      shortName: stage.shortName || '',
      description: stage.description || '',
      ageRange: stage.ageRange || '',
      sort: stage.sort || 0,
      status: stage.status || 'active'
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入阶段名称');
      return;
    }

    try {
      const submitData = { ...formData };
      delete submitData._id;

      if (modalMode === 'add') {
        await stageAPI.create(submitData);
        toast.success('阶段创建成功');
      } else {
        await stageAPI.update(formData._id, submitData);
        toast.success('阶段更新成功');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async () => {
    try {
      await stageAPI.delete(deleteId);
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
        <h2 className="text-xl font-semibold text-white">课程阶段管理</h2>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>新建阶段</span>
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-16">排序</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">阶段名称</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-24">简称</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">适用年龄</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-24">状态</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">加载中...</td>
              </tr>
            ) : stages.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">暂无阶段</td>
              </tr>
            ) : (
              stages.map((stage) => (
                <tr key={stage._id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">{stage.sort}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{stage.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{stage.shortName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{stage.ageRange || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      stage.status === 'active'
                        ? 'bg-gray-700 text-gray-200'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {stage.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(stage)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(stage._id)}
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
                {modalMode === 'add' ? '新建阶段' : '编辑阶段'}
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
                <label className="block text-sm text-gray-400 mb-1">阶段名称 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="例如：L1 电子启蒙"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">简称</label>
                <input
                  type="text"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleInputChange}
                  placeholder="例如：L1"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">阶段描述</label>
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
                  <label className="block text-sm text-gray-400 mb-1">适用年龄</label>
                  <input
                    type="text"
                    name="ageRange"
                    value={formData.ageRange}
                    onChange={handleInputChange}
                    placeholder="例如：7-9岁"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
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
        message="确定要删除这个阶段吗？如果阶段下还有课件，将无法删除。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
