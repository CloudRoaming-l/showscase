import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, X, Save, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { toolAPI, toolCategoryAPI, isAuthError } from '../../services/api.js';

export default function ToolManagement() {
  const [tools, setTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const toast = useToast();

  const [formData, setFormData] = useState({
    _id: null,
    name: '',
    model: '',
    categoryId: '',
    image: '',
    summary: '',
    principle: '',
    specifications: '',
    usage: '',
    exampleCode: '',
    pinout: '',
    teacherNotes: '',
    price: '',
    purchaseNote: '',
    sort: 0,
    status: 'published'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTools();
  }, [categoryFilter, statusFilter, page]);

  const loadCategories = async () => {
    try {
      const res = await toolCategoryAPI.getAdminList();
      if (res.status === 'success') {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadTools = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20 };
      if (categoryFilter !== 'all') params.categoryId = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.keyword = searchTerm;

      const result = await toolAPI.getAdminList(params);
      setTools(result.data?.list || []);
      setTotalPages(result.data?.totalPages || 1);
      setTotalCount(result.data?.total || 0);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载器材失败:', error);
      toast.error('加载器材失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      loadTools();
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      _id: null,
      name: '',
      model: '',
      categoryId: categories[0]?._id || '',
      image: '',
      summary: '',
      principle: '',
      specifications: '',
      usage: '',
      exampleCode: '',
      pinout: '',
      teacherNotes: '',
      price: '',
      purchaseNote: '',
      sort: 0,
      status: 'published'
    });
    setShowModal(true);
  };

  const openEditModal = async (tool) => {
    try {
      const res = await toolAPI.getAdminDetail(tool.id);
      if (res.status === 'success') {
        const data = res.data;
        setModalMode('edit');
        setFormData({
          _id: data._id,
          name: data.name,
          model: data.model || '',
          categoryId: data.categoryId?._id || data.categoryId || '',
          image: data.image || '',
          summary: data.summary || '',
          principle: data.principle || '',
          specifications: data.specifications || '',
          usage: data.usage || '',
          exampleCode: data.exampleCode || '',
          pinout: data.pinout || '',
          teacherNotes: data.teacherNotes || '',
          price: data.price || '',
          purchaseNote: data.purchaseNote || '',
          sort: data.sort || 0,
          status: data.status || 'published'
        });
        setShowModal(true);
      }
    } catch (error) {
      toast.error('加载器材详情失败');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入器材名称');
      return;
    }
    if (!formData.categoryId) {
      toast.error('请选择器材分类');
      return;
    }

    try {
      const submitData = { ...formData };
      delete submitData._id;

      if (modalMode === 'add') {
        await toolAPI.create(submitData);
        toast.success('器材创建成功');
      } else {
        await toolAPI.update(formData._id, submitData);
        toast.success('器材更新成功');
      }
      setShowModal(false);
      loadTools();
    } catch (error) {
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async () => {
    try {
      await toolAPI.delete(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      loadTools();
    } catch (error) {
      toast.error(error.response?.data?.message || '删除失败');
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c._id === catId);
    return cat ? cat.name : '-';
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="搜索器材名称..."
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 w-64"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-gray-500"
          >
            <option value="all">全部分类</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-gray-500"
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>新建器材</span>
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-12">图片</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">名称</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-32">型号</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">分类</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-20">状态</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">加载中...</td>
              </tr>
            ) : tools.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-500">暂无器材</td>
              </tr>
            ) : (
              tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    {tool.image ? (
                      <img src={tool.image} alt="" className="w-10 h-10 object-cover rounded bg-gray-900" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
                        <ImageIcon size={16} className="text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white font-medium">{tool.name}</div>
                    {tool.summary && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tool.summary}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{tool.model || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {getCategoryName(tool.categoryId?._id || tool.categoryId)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      tool.status === 'published'
                        ? 'bg-gray-700 text-gray-200'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {tool.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(tool)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(tool.id)}
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

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-700">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {modalMode === 'add' ? '新建器材' : '编辑器材'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">器材名称 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">型号</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">分类 *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  >
                    <option value="">请选择</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">封面图 URL</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="输入图片URL"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">一句话简介</label>
                  <textarea
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                  />
                </div>
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
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">工作原理</label>
                <textarea
                  name="principle"
                  value={formData.principle}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">技术参数（支持HTML）</label>
                <textarea
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">使用方法</label>
                <textarea
                  name="usage"
                  value={formData.usage}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">示例代码</label>
                <textarea
                  name="exampleCode"
                  value={formData.exampleCode}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">引脚说明</label>
                <textarea
                  name="pinout"
                  value={formData.pinout}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">教学心得与注意事项</label>
                <textarea
                  name="teacherNotes"
                  value={formData.teacherNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">参考单价</label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="例如：¥29.9"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">采购备注</label>
                  <input
                    type="text"
                    name="purchaseNote"
                    value={formData.purchaseNote}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
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
        message="确定要删除这个器材吗？此操作不可恢复。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
