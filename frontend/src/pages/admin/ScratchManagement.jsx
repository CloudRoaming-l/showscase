import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, RefreshCw, X, Save, Upload, Star, StarOff, Play, Clock, Eye, Share2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { scratchAPI, isAuthError } from '../../services/api.js';

const CATEGORIES = ['Scratch编程', '游戏创作', '动画制作', '互动故事', '数学科学'];

export default function ScratchManagement() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const toast = useToast();

  const [formData, setFormData] = useState({
    _id: null,
    title: '',
    description: '',
    instructions: '',
    category: CATEGORIES[0],
    author: '',
    coverUrl: '',
    projectFile: '',
    projectFileSize: 0,
    isFeatured: false
  });
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, page]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (searchTerm) params.search = searchTerm;

      const result = await scratchAPI.getAdminProjects(params);
      setProjects(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotalCount(result.pagination?.total || 0);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      loadData();
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      _id: null,
      title: '',
      description: '',
      instructions: '',
      category: CATEGORIES[0],
      author: '',
      coverUrl: '',
      projectFile: '',
      projectFileSize: 0,
      isFeatured: false
    });
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setModalMode('edit');
    setFormData({
      _id: project.id,
      title: project.title,
      description: project.description || '',
      instructions: project.instructions || '',
      category: project.category || CATEGORIES[0],
      author: project.author,
      coverUrl: project.coverUrl || '',
      projectFile: project.projectFile,
      projectFileSize: project.projectFileSize || 0,
      isFeatured: !!project.isFeatured
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await scratchAPI.uploadProject(file);
      if (result.status === 'success') {
        setFormData({
          ...formData,
          projectFile: result.data.url,
          projectFileSize: result.data.size
        });
        toast.success('项目文件上传成功');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCoverUploading(true);
      const result = await scratchAPI.uploadCover(file);
      if (result.status === 'success') {
        setFormData({
          ...formData,
          coverUrl: result.data.url
        });
        toast.success('封面上传成功');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '封面上传失败');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入作品名称');
      return;
    }
    if (!formData.author.trim()) {
      toast.error('请输入作者名称');
      return;
    }
    if (!formData.projectFile) {
      toast.error('请上传 Scratch 项目文件');
      return;
    }

    try {
      if (modalMode === 'add') {
        await scratchAPI.createProject(formData);
        toast.success('作品创建成功');
      } else {
        await scratchAPI.updateProject(formData._id, formData);
        toast.success('作品更新成功');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async () => {
    try {
      await scratchAPI.deleteProject(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      loadData();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const toggleFeatured = async (project) => {
    try {
      await scratchAPI.updateProject(project.id, { isFeatured: !project.isFeatured });
      toast.success(project.isFeatured ? '已取消精选' : '已设为精选');
      loadData();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: { text: '待审核', color: 'text-amber-400 bg-amber-500/10' },
      approved: { text: '已通过', color: 'text-emerald-400 bg-emerald-500/10' },
      rejected: { text: '已拒绝', color: 'text-red-400 bg-red-500/10' }
    };
    const info = map[status] || map.pending;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${info.color}`}>
        {info.text}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 顶部操作栏 */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="搜索作品名称、作者..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 text-sm"
                />
              </div>
              <button
                onClick={loadData}
                className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                title="刷新"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50"
              >
                <option value="all">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500/50"
              >
                <option value="all">全部分类</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all text-sm font-medium"
              >
                <Plus size={18} />
                添加作品
              </button>
            </div>
          </div>
        </div>

        {/* 作品列表 */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">加载中...</div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <Play size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500">暂无 Scratch 作品</p>
              <p className="text-gray-600 text-sm mt-1">点击"添加作品"开始上传吧</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">作品</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">作者</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">分类</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">浏览/点赞/分享</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-9 rounded bg-gray-700/50 overflow-hidden flex-shrink-0">
                              {project.coverUrl ? (
                                <img src={project.coverUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play size={16} className="text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate max-w-[200px]">
                                {project.title}
                                {project.isFeatured && (
                                  <Star size={14} className="inline ml-1 text-yellow-400 fill-yellow-400" />
                                )}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{project.author}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 text-xs rounded-full">
                            {project.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">{statusBadge(project.status)}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          <span className="inline-flex items-center gap-1">
                            <Eye size={14} /> {project.viewCount || 0}
                          </span>
                          <span className="mx-2 text-gray-600">/</span>
                          <span className="inline-flex items-center gap-1">
                            <Star size={14} /> {project.likeCount || 0}
                          </span>
                          <span className="mx-2 text-gray-600">/</span>
                          <span className="inline-flex items-center gap-1">
                            <Share2 size={14} /> {project.shareCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleFeatured(project)}
                              className={`p-1.5 rounded transition-colors ${
                                project.isFeatured
                                  ? 'text-yellow-400 hover:bg-yellow-500/10'
                                  : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                              }`}
                              title={project.isFeatured ? '取消精选' : '设为精选'}
                            >
                              {project.isFeatured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                            </button>
                            <button
                              onClick={() => window.open(`/scratch/${project.id}`, '_blank')}
                              className="p-1.5 rounded text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                              title="预览"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(project)}
                              className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="编辑"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteId(project.id)}
                              className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="px-4 py-4 border-t border-gray-800/50">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {modalMode === 'add' ? '添加 Scratch 作品' : '编辑 Scratch 作品'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* 作品名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">作品名称 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入作品名称"
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>

              {/* 作者 + 分类 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">作者 *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="请输入作者名称"
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-primary-500/50"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 项目文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Scratch 项目文件 * <span className="text-gray-500 text-xs">(.sb3 / .sb2 / .json)</span>
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-primary-500/50 transition-colors">
                  <input
                    type="file"
                    id="project-file"
                    accept=".sb3,.sb2,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {formData.projectFile ? (
                    <div>
                      <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
                        <Play size={20} />
                        <span className="font-medium">文件已上传</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {(formData.projectFileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={() => document.getElementById('project-file')?.click()}
                        className="mt-3 text-sm text-primary-400 hover:text-primary-300"
                      >
                        重新上传
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="project-file" className="cursor-pointer">
                      <Upload size={32} className="mx-auto text-gray-500 mb-2" />
                      <p className="text-gray-400 mb-1">
                        {uploading ? '上传中...' : '点击上传项目文件'}
                      </p>
                      <p className="text-xs text-gray-600">支持 .sb3, .sb2, .json 格式</p>
                    </label>
                  )}
                </div>
              </div>

              {/* 封面图上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  封面图 <span className="text-gray-500 text-xs">(可选，建议 480x360)</span>
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-primary-500/50 transition-colors">
                  <input
                    type="file"
                    id="cover-file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  {formData.coverUrl ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={formData.coverUrl}
                        alt="封面预览"
                        className="w-24 h-18 object-cover rounded"
                      />
                      <div className="text-left">
                        <p className="text-emerald-400 text-sm font-medium">封面已上传</p>
                        <button
                          onClick={() => document.getElementById('cover-file')?.click()}
                          className="mt-1 text-sm text-primary-400 hover:text-primary-300"
                        >
                          重新上传
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="cover-file" className="cursor-pointer block">
                      <div className="w-24 h-18 mx-auto bg-gray-800/50 rounded flex items-center justify-center mb-2">
                        <Upload size={20} className="text-gray-500" />
                      </div>
                      <p className="text-gray-400 text-sm">
                        {coverUploading ? '上传中...' : '点击上传封面图'}
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* 作品介绍 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">作品介绍</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简单介绍一下这个作品..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
                />
              </div>

              {/* 操作说明 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">操作说明</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="例如：方向键移动、空格键跳跃..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
                />
              </div>

              {/* 精选 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/20"
                />
                <label htmlFor="featured-check" className="text-sm text-gray-300 cursor-pointer">
                  设为精选作品（首页推荐展示）
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || coverUploading}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all text-sm font-medium disabled:opacity-50"
              >
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="确认删除"
        message="确定要删除这个作品吗？删除后无法恢复。"
        confirmText="删除"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
