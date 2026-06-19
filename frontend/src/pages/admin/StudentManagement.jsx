import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, RefreshCw, User, X, Save, ImageIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { photoAPI, studentAPI, isAuthError } from '../../services/api.js';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();
  const [formData, setFormData] = useState({
    _id: null,
    name: '',
    grade: '',
    className: '',
    phone: '',
    joinDate: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentsResult, photosResult] = await Promise.all([
        studentAPI.getStudents(),
        photoAPI.getPhotos({ limit: 500 })
      ]);
      setStudents(studentsResult.data || []);
      setPhotos(photosResult.data || []);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载数据失败:', error);
      toast.error('加载数据失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkCount = (studentName) => {
    return photos.filter(p => p.author === studentName).length;
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.className && s.className.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = '请输入学生姓名';
    if (!formData.grade) newErrors.grade = '请选择年级';
    if (!formData.className.trim()) newErrors.className = '请输入班级';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      _id: null,
      name: '',
      grade: '',
      className: '',
      phone: '',
      joinDate: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (student) => {
    setModalMode('edit');
    setFormData({
      _id: student._id || student.id,
      name: student.name,
      grade: student.grade || '',
      className: student.className || '',
      phone: student.phone || '',
      joinDate: student.joinDate || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (modalMode === 'add') {
        await studentAPI.createStudent(formData);
        toast.success('学生添加成功');
      } else {
        await studentAPI.updateStudent(formData._id, formData);
        toast.success('学生信息更新成功');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    try {
      await studentAPI.deleteStudent(deleteConfirm);
      toast.success('学生删除成功');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('删除失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索学生姓名或班级..."
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAdd}
              className="flex items-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-primary-500/20"
            >
              <Plus size={16} />
              <span>添加学生</span>
            </button>
            <button
              onClick={loadData}
              className="p-2.5 bg-gray-800/60 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-700/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">学生信息</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">年级</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">班级</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">联系电话</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">入学时间</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">作品数</th>
                  <th className="px-5 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-700 rounded-full" />
                          <div className="flex-1">
                            <div className="h-3.5 bg-gray-700 rounded w-24 mb-2" />
                            <div className="h-3 bg-gray-700 rounded w-16" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <User size={40} className="mx-auto text-gray-700 mb-3" />
                      <p className="text-gray-500 text-sm">暂无符合条件的学生</p>
                      <p className="text-gray-600 text-xs mt-1">调整搜索条件或添加新学生</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student._id || student.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-white" />
                          </div>
                          <span className="text-white font-medium text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-sm">{student.grade || '-'}</td>
                      <td className="px-5 py-3 text-gray-400 text-sm">{student.className || '-'}</td>
                      <td className="px-5 py-3 text-gray-500 text-sm">{student.phone || '-'}</td>
                      <td className="px-5 py-3 text-gray-500 text-sm">
                        {student.joinDate || (student.createdAt ? student.createdAt.split('T')[0] : '-')}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex px-2 py-1 bg-primary-500/10 text-primary-400 rounded text-xs font-medium">
                          {getWorkCount(student.name)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(student._id || student.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
              <h2 className="text-base font-semibold text-white">
                {modalMode === 'add' ? '添加学生' : '编辑学生'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                  }`}
                  placeholder="请输入学生姓名"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    年级 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none transition-colors ${
                      errors.grade ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                    }`}
                  >
                    <option value="">选择年级</option>
                    <option value="一年级">一年级</option>
                    <option value="二年级">二年级</option>
                    <option value="三年级">三年级</option>
                    <option value="四年级">四年级</option>
                    <option value="五年级">五年级</option>
                    <option value="六年级">六年级</option>
                  </select>
                  {errors.grade && <p className="text-red-400 text-xs mt-1">{errors.grade}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    班级 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className={`w-full bg-gray-800/60 border rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none transition-colors ${
                      errors.className ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                    }`}
                    placeholder="如：编程一班"
                  />
                  {errors.className && <p className="text-red-400 text-xs mt-1">{errors.className}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">联系电话</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                  placeholder="如：138****1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">入学时间</label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex space-x-2 p-5 border-t border-gray-700/50">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm shadow-primary-500/20"
              >
                <Save size={14} />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="确认删除"
        message="确定要删除这个学生吗？此操作无法撤销。"
        type="danger"
      />
    </AdminLayout>
  );
}
