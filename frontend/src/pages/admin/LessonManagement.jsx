import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, X, Save, Upload, FileText, Image } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { lessonAPI, stageAPI, attachmentAPI, isAuthError } from '../../services/api.js';

export default function LessonManagement() {
  const [lessons, setLessons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stages, setStages] = useState([]);
  const toast = useToast();

  const [formData, setFormData] = useState({
    _id: null,
    title: '',
    subtitle: '',
    stageId: '',
    lessonNumber: 1,
    tag: '',
    duration: '',
    ageRange: '',
    summary: '',
    content: '',
    coverImage: '',
    codeImages: [],
    wiringImages: [],
    teacherNotes: '',
    attachments: [],
    status: 'published'
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    loadLessons();
  }, [stageFilter, statusFilter, page]);

  const loadStages = async () => {
    try {
      const res = await stageAPI.getAdminList();
      if (res.status === 'success') {
        setStages(res.data);
      }
    } catch (error) {
      console.error('加载阶段失败:', error);
    }
  };

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 20 };
      if (stageFilter !== 'all') params.stageId = stageFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.keyword = searchTerm;

      const result = await lessonAPI.getAdminList(params);
      setLessons(result.data?.list || []);
      setTotalPages(result.data?.totalPages || 1);
      setTotalCount(result.data?.total || 0);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载课件失败:', error);
      toast.error('加载课件失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      loadLessons();
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      _id: null,
      title: '',
      subtitle: '',
      stageId: stages[0]?._id || '',
      lessonNumber: 1,
      tag: '',
      duration: '',
      ageRange: '',
      summary: '',
      content: '',
      coverImage: '',
      codeImages: [],
      wiringImages: [],
      teacherNotes: '',
      attachments: [],
      status: 'published'
    });
    setShowModal(true);
  };

  const openEditModal = async (lesson) => {
    try {
      const res = await lessonAPI.getAdminDetail(lesson.id);
      if (res.status === 'success') {
        const data = res.data;
        setModalMode('edit');
        setFormData({
          _id: data._id,
          title: data.title,
          subtitle: data.subtitle || '',
          stageId: data.stageId?._id || data.stageId || '',
          lessonNumber: data.lessonNumber || 1,
          tag: data.tag || '',
          duration: data.duration || '',
          ageRange: data.ageRange || '',
          summary: data.summary || '',
          content: data.content || '',
          coverImage: data.coverImage || '',
          codeImages: data.codeImages || [],
          wiringImages: data.wiringImages || [],
          teacherNotes: data.teacherNotes || '',
          attachments: data.attachments || [],
          status: data.status || 'published'
        });
        setShowModal(true);
      }
    } catch (error) {
      toast.error('加载课件详情失败');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFile(true);
      const result = await attachmentAPI.uploadMultiple(Array.from(files), 'lesson', formData._id);
      if (result.status === 'success') {
        const newAttachments = [...formData.attachments, ...result.data];
        setFormData({ ...formData, attachments: newAttachments });
        toast.success(`成功上传 ${result.data.length} 个文件`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '上传失败');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const removeAttachment = async (attId) => {
    try {
      await attachmentAPI.delete(attId);
      setFormData({
        ...formData,
        attachments: formData.attachments.filter(a => a._id !== attId)
      });
      toast.success('已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleImageUpload = (type, e) => {
    // 简单处理：直接用图片URL输入
    const url = prompt('请输入图片URL：');
    if (url) {
      const key = type === 'code' ? 'codeImages' : 'wiringImages';
      setFormData({
        ...formData,
        [key]: [...formData[key], url]
      });
    }
  };

  const removeImage = (type, index) => {
    const key = type === 'code' ? 'codeImages' : 'wiringImages';
    const arr = [...formData[key]];
    arr.splice(index, 1);
    setFormData({ ...formData, [key]: arr });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入课件标题');
      return;
    }
    if (!formData.stageId) {
      toast.error('请选择所属阶段');
      return;
    }

    try {
      const submitData = { ...formData };
      delete submitData._id;

      if (modalMode === 'add') {
        const result = await lessonAPI.create(submitData);
        if (result.status === 'success') {
          toast.success('课件创建成功');
          setShowModal(false);
          loadLessons();
        }
      } else {
        const result = await lessonAPI.update(formData._id, submitData);
        if (result.status === 'success') {
          toast.success('课件更新成功');
          setShowModal(false);
          loadLessons();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async () => {
    try {
      await lessonAPI.delete(deleteId);
      toast.success('删除成功');
      setDeleteId(null);
      loadLessons();
    } catch (error) {
      toast.error(error.response?.data?.message || '删除失败');
    }
  };

  const getStageName = (stageId) => {
    const stage = stages.find(s => s._id === stageId);
    return stage ? stage.name : '-';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <AdminLayout>
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="搜索课件标题..."
              className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 w-64"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-gray-500"
          >
            <option value="all">全部阶段</option>
            {stages.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
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
          <span>新建课件</span>
        </button>
      </div>

      {/* 列表 */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">标题</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-32">阶段</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-20">课时</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-24">标签</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-24">附件</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-20">状态</th>
              <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-28">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">加载中...</td>
              </tr>
            ) : lessons.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">暂无课件</td>
              </tr>
            ) : (
              lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm text-white font-medium">{lesson.title}</div>
                    {lesson.subtitle && (
                      <div className="text-xs text-gray-500 mt-0.5">{lesson.subtitle}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {getStageName(lesson.stageId?._id || lesson.stageId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">第 {lesson.lessonNumber} 节</td>
                  <td className="px-4 py-3">
                    {lesson.tag && (
                      <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                        {lesson.tag}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {lesson.attachments?.length || 0} 个
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      lesson.status === 'published'
                        ? 'bg-gray-700 text-gray-200'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {lesson.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(lesson)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(lesson.id)}
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
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {modalMode === 'add' ? '新建课件' : '编辑课件'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">课件标题 *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">副标题</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">所属阶段 *</label>
                  <select
                    name="stageId"
                    value={formData.stageId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  >
                    <option value="">请选择</option>
                    {stages.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">课时序号</label>
                  <input
                    type="number"
                    name="lessonNumber"
                    value={formData.lessonNumber}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">标签</label>
                  <select
                    name="tag"
                    value={formData.tag}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  >
                    <option value="">无</option>
                    <option value="入门">入门</option>
                    <option value="核心">核心</option>
                    <option value="趣味">趣味</option>
                    <option value="拓展">拓展</option>
                    <option value="项目课">项目课</option>
                    <option value="复习">复习</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">课时时长</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="例如：60分钟"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">适用年龄</label>
                  <input
                    type="text"
                    name="ageRange"
                    value={formData.ageRange}
                    onChange={handleInputChange}
                    placeholder="例如：7-10岁"
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

              {/* 课程简介 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">课程简介</label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                />
              </div>

              {/* 附件上传 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">附件文件（PPT/PDF/Word/Zip等）</label>
                <div className="border border-dashed border-gray-600 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    <Upload size={16} />
                    <span>{uploadingFile ? '上传中...' : '选择文件上传'}</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">支持 PPT、PDF、Word、Zip 等格式，单文件最大 50MB</p>
                </div>
                {formData.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.attachments.map((att) => (
                      <div key={att._id} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <FileText size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-300">{att.originalName}</span>
                          <span className="text-xs text-gray-500">{formatFileSize(att.fileSize)}</span>
                        </div>
                        <button
                          onClick={() => removeAttachment(att._id)}
                          className="text-gray-400 hover:text-gray-400 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 图形化程序截图 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">图形化程序截图（Mind+/米思齐）</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.codeImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 bg-gray-900 border border-gray-700 rounded overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage('code', idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={(e) => handleImageUpload('code', e)}
                    className="w-20 h-20 border border-dashed border-gray-600 rounded flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* 接线图 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">接线图</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.wiringImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 bg-gray-900 border border-gray-700 rounded overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage('wiring', idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={(e) => handleImageUpload('wiring', e)}
                    className="w-20 h-20 border border-dashed border-gray-600 rounded flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-400 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* 课程正文 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">课程正文（HTML，可选）</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none font-mono text-xs"
                />
              </div>

              {/* 教学备注 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">教学备注（仅自己可见）</label>
                <textarea
                  name="teacherNotes"
                  value={formData.teacherNotes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 resize-none"
                />
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
        message="确定要删除这个课件吗？相关附件也会被删除，此操作不可恢复。"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
