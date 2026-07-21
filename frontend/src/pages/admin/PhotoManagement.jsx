import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Eye, Plus, RefreshCw, X, Save, Upload, Star, StarOff, CheckCircle, XCircle, Clock, CheckSquare, Square, AlertCircle, Download, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import PhotoLightbox from '../../components/gallery/PhotoLightbox.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { photoAPI, studentAPI, isAuthError } from '../../services/api.js';
import { exportPhotos } from '../../utils/exportData.js';
import { CATEGORIES } from '../../utils/sharedData.js';

const categories = CATEGORIES;

export default function PhotoManagement() {
  const [photos, setPhotos] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteId, setDeleteId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const toast = useToast();
  const [formData, setFormData] = useState({
    _id: null,
    title: '',
    category: CATEGORIES[0],
    author: '',
    grade: '',
    description: '',
    imageUrl: '',
    isFeatured: false
  });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadData(); }, [statusFilter, activeFilter]);

  // 批量导入处理
  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('请输入要导入的数据');
      return;
    }

    try {
      // 尝试解析 JSON
      let data;
      try {
        data = JSON.parse(importData);
      } catch {
        toast.error('数据格式错误，请输入有效的 JSON 数组');
        return;
      }

      if (!Array.isArray(data)) {
        toast.error('数据格式错误，请输入 JSON 数组');
        return;
      }

      const result = await photoAPI.batchImport(data);
      setImportResult({
        success: result.data?.length || 0,
        warnings: result.warnings
      });
      toast.success(`成功导入 ${result.data?.length || 0} 个作品`);
      setShowImportModal(false);
      setImportData('');
      loadData();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error(error.response?.data?.message || '导入失败');
      if (error.response?.data?.warnings) {
        setImportResult({
          success: 0,
          warnings: error.response.data.warnings
        });
      }
    }
  };

  const handleParseCSV = () => {
    try {
      const lines = importData.trim().split('\n');
      if (lines.length < 2) {
        toast.error('CSV 数据格式错误');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const jsonData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        jsonData.push(obj);
      }

      setImportData(JSON.stringify(jsonData, null, 2));
      toast.success('CSV 解析成功，请检查数据后提交');
    } catch (error) {
      toast.error('CSV 解析失败');
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params = { limit: 200 };
      if (activeFilter !== 'all') params.category = activeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const [photosResult, adminPhotosResult, studentsResult] = await Promise.all([
        photoAPI.getPhotos({ limit: 100 }),
        photoAPI.getAdminPhotos(params),
        studentAPI.getStudents()
      ]);

      // 合并数据：优先使用 admin 数据（包含状态），否则用普通数据
      const adminPhotos = adminPhotosResult.data || [];
      setPhotos(adminPhotos);
      if (adminPhotosResult.statusCounts) {
        setStatusCounts(adminPhotosResult.statusCounts);
      }
      setStudents(studentsResult.data || []);
    } catch (error) {
      if (isAuthError(error)) return; // 401 由拦截器处理，不显示错误提示
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
    setTimeout(() => loadData(), 300);
  };

  const filteredPhotos = photos.filter((p) => {
    const matchSearch =
      searchTerm === '' ||
      (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.author && p.author.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  const totalPages = Math.ceil(filteredPhotos.length / pageSize) || 1;
  const paginatedPhotos = filteredPhotos.slice((page - 1) * pageSize, page * pageSize);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedIds(new Set());
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = '请输入作品名称';
    if (!formData.author) newErrors.author = '请选择作者';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = '请添加作品图片';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      _id: null,
      title: '',
      category: CATEGORIES[0],
      author: students.length > 0 ? students[0].name : '',
      grade: students.length > 0 ? (students[0].grade || '') : '',
      description: '',
      imageUrl: '',
      isFeatured: false
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (photo) => {
    setModalMode('edit');
    setFormData({
      _id: photo.id || photo._id,
      title: photo.title,
      category: photo.category,
      author: photo.author,
      grade: photo.grade || '',
      description: photo.description || '',
      imageUrl: photo.imageUrl,
      isFeatured: photo.isFeatured || false
    });
    setErrors({});
    setShowModal(true);
  };

  const handleAuthorChange = (authorName) => {
    const student = students.find(s => s.name === authorName);
    setFormData({
      ...formData,
      author: authorName,
      grade: student ? (student.grade || '') : ''
    });
  };

  const handleRandomImage = () => {
    const randomSeed = Math.floor(Math.random() * 1000);
    setFormData({ ...formData, imageUrl: `https://picsum.photos/seed/${randomSeed}/800/600` });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过10MB');
      return;
    }

    setUploading(true);
    try {
      const result = await photoAPI.uploadImage(file);
      if (result.status === 'success' && result.data?.url) {
        setFormData(prev => ({ ...prev, imageUrl: result.data.url }));
        toast.success('上传成功');
      } else {
        toast.error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      toast.error(error.message || '上传失败，请重试');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === 'add') {
        await photoAPI.createPhoto({
          title: formData.title,
          category: formData.category,
          author: formData.author,
          grade: formData.grade,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isFeatured: formData.isFeatured
        });
        toast.success('作品添加成功');
      } else {
        await photoAPI.updatePhoto(formData._id, {
          title: formData.title,
          category: formData.category,
          author: formData.author,
          grade: formData.grade,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isFeatured: formData.isFeatured
        });
        toast.success('作品更新成功');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    try {
      await photoAPI.deletePhoto(deleteId);
      toast.success('作品删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败，请重试');
    } finally {
      setDeleteId(null);
    }
  };

  const handleApprove = async (id) => {
    try {
      await photoAPI.approvePhoto(id);
      toast.success('作品已审核通过');
      loadData();
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核失败，请重试');
    }
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    try {
      await photoAPI.rejectPhoto(rejectTargetId, rejectReason);
      toast.success('作品已拒绝');
      setShowRejectModal(false);
      setRejectReason('');
      setRejectTargetId(null);
      loadData();
    } catch (error) {
      console.error('拒绝失败:', error);
      toast.error('拒绝失败，请重试');
    }
  };

  const handleToggleFeatured = async (photo) => {
    try {
      const id = photo.id || photo._id;
      await photoAPI.updatePhoto(id, { ...photo, isFeatured: !photo.isFeatured });
      toast.success(photo.isFeatured ? '已取消精选' : '已设为精选');
      loadData();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败，请重试');
    }
  };

  // 批量选择
  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPhotos.length && paginatedPhotos.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPhotos.map(p => p.id || p._id)));
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) {
      toast.warning('请先选择作品');
      return;
    }
    try {
      await photoAPI.batchApprove(Array.from(selectedIds));
      toast.success(`已通过 ${selectedIds.size} 个作品`);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error('批量审核失败:', error);
      toast.error('批量审核失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast.warning('请先选择作品');
      return;
    }
    try {
      await photoAPI.batchDelete(Array.from(selectedIds));
      toast.success(`已删除 ${selectedIds.size} 个作品`);
      setSelectedIds(new Set());
      loadData();
    } catch (error) {
      console.error('批量删除失败:', error);
      toast.error('批量删除失败');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: '待审核', class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
      approved: { label: '已通过', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
      rejected: { label: '已拒绝', class: 'bg-red-500/10 text-red-400 border-red-500/20' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${badge.class}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* 状态统计和筛选 */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/20'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
            }`}
          >
            全部 ({statusCounts.pending + statusCounts.approved + statusCounts.rejected})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
            }`}
          >
            <Clock size={14} />
            待审核 ({statusCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
            }`}
          >
            <CheckCircle size={14} />
            已通过 ({statusCounts.approved})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
            }`}
          >
            <XCircle size={14} />
            已拒绝 ({statusCounts.rejected})
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索作品名称或作者..."
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="all">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button onClick={handleAdd} className="flex items-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-primary-500/20">
              <Plus size={16} /><span>添加作品</span>
            </button>
            <button onClick={loadData} className="p-2.5 bg-gray-800/60 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => exportPhotos(filteredPhotos)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-green-500/80 hover:bg-green-500 text-white rounded-lg transition-colors text-sm font-medium"
              title="导出为 CSV"
            >
              <Download size={16} /><span>导出</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-purple-500/80 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-medium"
              title="批量导入"
            >
              <Upload size={16} /><span>导入</span>
            </button>
          </div>
        </div>

        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <div className="flex items-center space-x-2 text-primary-400 text-sm">
              <CheckSquare size={16} />
              <span>已选择 {selectedIds.size} 个作品</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchApprove}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
              >
                <CheckCircle size={14} /><span>批量通过</span>
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                <Trash2 size={14} /><span>批量删除</span>
              </button>
            </div>
          </div>
        )}

        {/* 数据表格 */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white transition-colors">
                      {selectedIds.size === filteredPhotos.length && filteredPhotos.length > 0
                        ? <CheckSquare size={16} className="text-primary-400" />
                        : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">作品</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">分类</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">作者</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">更新日期</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-700 rounded-lg" />
                          <div className="flex-1">
                            <div className="h-3.5 bg-gray-700 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-gray-700 rounded w-1/4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredPhotos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <AlertCircle size={40} className="mx-auto text-gray-700 mb-3" />
                      <p className="text-gray-500 text-sm">暂无符合条件的作品</p>
                      <p className="text-gray-600 text-xs mt-1">调整筛选条件或添加新作品</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPhotos.map((photo) => (
                    <tr key={photo.id || photo._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(photo.id || photo._id)} className="text-gray-400 hover:text-white transition-colors">
                          {selectedIds.has(photo.id || photo._id)
                            ? <CheckSquare size={16} className="text-primary-400" />
                            : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-10 h-10 rounded-lg object-cover cursor-pointer border border-gray-700/50 hover:border-primary-500/50 transition-colors"
                            onClick={() => setSelectedPhoto(photo)}
                          />
                          <div className="min-w-0">
                            <span className="text-white font-medium text-sm truncate block">{photo.title}</span>
                            {photo.isFeatured && <Star size={12} className="text-yellow-400 mt-0.5" />}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                          {photo.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{photo.author || '-'}</td>
                      <td className="px-4 py-3">{getStatusBadge(photo.status)}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(photo.updatedAt || photo.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          {photo.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(photo.id || photo._id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="通过">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => { setRejectTargetId(photo.id || photo._id); setShowRejectModal(true); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="拒绝">
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          <button onClick={() => setSelectedPhoto(photo)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors" title="查看">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleToggleFeatured(photo)} className={`p-1.5 rounded-lg transition-colors ${photo.isFeatured ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'}`} title={photo.isFeatured ? '取消精选' : '设为精选'}>
                            {photo.isFeatured ? <Star size={14} className="fill-current" /> : <StarOff size={14} />}
                          </button>
                          <button onClick={() => handleEdit(photo)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="编辑">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => setDeleteId(photo.id || photo._id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="删除">
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
            totalItems={filteredPhotos.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="card w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
              <h2 className="text-base font-semibold text-white">{modalMode === 'add' ? '添加作品' : '编辑作品'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">作品名称 <span className="text-red-400">*</span></label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none transition-colors ${errors.title ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'}`} placeholder="请输入作品名称" />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">作品分类</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500">
                    {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">作者 <span className="text-red-400">*</span></label>
                  <select value={formData.author} onChange={(e) => handleAuthorChange(e.target.value)} className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none transition-colors ${errors.author ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'}`}>
                    <option value="">选择作者</option>
                    {students.map((student) => (<option key={student.id || student._id} value={student.name}>{student.name} ({student.className || '-'})</option>))}
                  </select>
                  {errors.author && <p className="text-red-400 text-xs mt-1">{errors.author}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">年级</label>
                  <input type="text" value={formData.grade} readOnly className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 opacity-60" placeholder="自动从学生信息获取" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">作品图片 <span className="text-red-400">*</span></label>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <input type="text" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className={`flex-1 min-w-[200px] bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none transition-colors ${errors.imageUrl ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'}`} placeholder="请输入图片URL或点击上传" />
                  <label className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-500'} text-white`}>
                    <ImageIcon size={14} />
                    <span>{uploading ? '上传中...' : '上传图片'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                  </label>
                  <button type="button" onClick={handleRandomImage} className="flex items-center space-x-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"><Upload size={14} /><span>随机</span></button>
                </div>
                {errors.imageUrl && <p className="text-red-400 text-xs mt-1">{errors.imageUrl}</p>}
                <p className="text-gray-500 text-xs mt-1">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</p>
                {formData.imageUrl && <div className="mt-3"><img src={formData.imageUrl} alt="预览" className="max-w-sm max-h-40 rounded-lg border border-gray-700" /></div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">作品描述</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 resize-none" placeholder="请输入作品描述..." />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isFeatured" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500" />
                <label htmlFor="isFeatured" className="text-gray-300 text-sm">设为精选作品</label>
              </div>
            </div>
            <div className="flex space-x-2 p-5 border-t border-gray-700/50">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium">取消</button>
              <button onClick={handleSave} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-primary-500/20"><Save size={14} /><span>保存</span></button>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝原因弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
              <h2 className="text-base font-semibold text-white">拒绝原因</h2>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">拒绝原因（可选）</label>
                <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 resize-none" placeholder="请输入拒绝原因，帮助作者改进..." />
              </div>
            </div>
            <div className="flex space-x-2 p-5 border-t border-gray-700/50">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium">取消</button>
              <button onClick={handleReject} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-red-500/20"><XCircle size={14} /><span>确认拒绝</span></button>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {selectedPhoto && <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}

      {/* 批量导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="card w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
              <h2 className="text-base font-semibold text-white">批量导入作品</h2>
              <button onClick={() => { setShowImportModal(false); setImportData(''); setImportResult(null); }} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-300">导入数据（JSON 数组）</label>
                  <button onClick={handleParseCSV} className="text-xs text-primary-400 hover:text-primary-300">转换为 JSON</button>
                </div>
                <textarea
                  rows={12}
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 resize-none font-mono"
                  placeholder={'[\n  {"title": "作品名称", "category": "机器人编程", "author": "作者", "imageUrl": "图片URL"},\n  ...\n]'}
                />
                <p className="text-xs text-gray-500 mt-1">支持 JSON 数组格式，或粘贴 CSV 数据后点击"转换为 JSON"</p>
              </div>
              {importResult && (
                <div className={`p-3 rounded-lg ${importResult.success > 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <p className={`text-sm ${importResult.success > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {importResult.success > 0 ? `成功导入 ${importResult.success} 个作品` : '导入失败'}
                  </p>
                  {importResult.warnings && importResult.warnings.details && (
                    <div className="mt-2">
                      <p className="text-xs text-yellow-400">失败原因：</p>
                      <ul className="text-xs text-yellow-400/80 mt-1 list-disc list-inside">
                        {importResult.warnings.details.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="bg-gray-800/40 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">必填字段：title, category, author, imageUrl</p>
                <p className="text-xs text-gray-400">可选字段：description, grade, isFeatured</p>
                <p className="text-xs text-gray-400">分类可选：{categories.join('、')}</p>
              </div>
            </div>
            <div className="flex space-x-2 p-5 border-t border-gray-700/50">
              <button onClick={() => { setShowImportModal(false); setImportData(''); setImportResult(null); }} className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium">取消</button>
              <button onClick={handleImport} className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-primary-500/20"><Upload size={14} /><span>开始导入</span></button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      <ConfirmDialog isOpen={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="确认删除" message="确定要删除这个作品吗？此操作无法撤销。" type="danger" />
    </AdminLayout>
  );
}
