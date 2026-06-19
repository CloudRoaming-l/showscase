import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { photoAPI, studentAPI } from '../../services/api.js';
import { CATEGORIES } from '../../utils/sharedData.js';

export default function PhotoForm() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    author: '',
    authorId: '',
    grade: '',
    description: '',
    imageUrl: '',
    isFeatured: false
  });
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const categories = CATEGORIES;
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初一', '初二', '初三'];

  // 加载学生列表用于选择作者
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const result = await studentAPI.getStudents();
        setStudents(result.data || []);
      } catch (error) {
        console.error('加载学生列表失败:', error);
      }
    };
    loadStudents();
  }, []);

  // 编辑模式：加载现有作品数据
  useEffect(() => {
    if (isEdit && id) {
      const loadPhoto = async () => {
        try {
          setInitLoading(true);
          const result = await photoAPI.getPhoto(id);
          const photo = result.data;
          if (photo) {
            setFormData({
              title: photo.title || '',
              category: photo.category || CATEGORIES[0],
              author: photo.author || '',
              authorId: photo.authorId ? (photo.authorId.id || photo.authorId._id || photo.authorId) : '',
              grade: photo.grade || '',
              description: photo.description || '',
              imageUrl: photo.imageUrl || '',
              isFeatured: photo.isFeatured || false
            });
          }
        } catch (error) {
          console.error('加载作品详情失败:', error);
          toast.error('加载作品详情失败');
        } finally {
          setInitLoading(false);
        }
      };
      loadPhoto();
    }
  }, [id, isEdit, toast]);

  // 作者变更时自动填充年级与 authorId
  const handleAuthorChange = (authorName) => {
    const student = students.find(s => s.name === authorName);
    setFormData(prev => ({
      ...prev,
      author: authorName,
      authorId: student ? (student.id || student._id || '') : '',
      grade: student ? (student.grade || '') : prev.grade
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = '请输入作品名称';
    if (!formData.category) newErrors.category = '请选择分类';
    if (!formData.author.trim()) newErrors.author = '请选择作者';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = '请输入图片地址';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isEdit) {
        await photoAPI.updatePhoto(id, formData);
        toast.success('作品更新成功');
      } else {
        await photoAPI.createPhoto(formData);
        toast.success('作品创建成功');
      }
      navigate('/admin/photos');
    } catch (error) {
      console.error('保存作品失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomImage = () => {
    const randomSeed = Math.floor(Math.random() * 1000);
    setFormData(prev => ({
      ...prev,
      imageUrl: `https://picsum.photos/seed/${randomSeed}/800/600`
    }));
  };

  if (initLoading) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-white">加载中...</h1>
          </div>
          <div className="card p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-12 bg-gray-700 rounded-lg" />
              <div className="h-12 bg-gray-700 rounded-lg" />
              <div className="h-32 bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? '编辑作品' : '新建作品'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                作品名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入作品名称"
                className={`w-full bg-gray-800/60 border rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.title ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                作品分类 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full bg-gray-800/60 border rounded-lg py-3 px-4 text-white focus:outline-none transition-colors ${
                  errors.category ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                作者 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.author}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className={`w-full bg-gray-800/60 border rounded-lg py-3 px-4 text-white focus:outline-none transition-colors ${
                  errors.author ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
              >
                <option value="">选择作者</option>
                {students.map((student) => (
                  <option key={student.id || student._id} value={student.name}>
                    {student.name} ({student.className || '-'})
                  </option>
                ))}
              </select>
              {errors.author && <p className="text-red-400 text-sm mt-1">{errors.author}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                年级 <span className="text-gray-500 text-xs">(自动填充)</span>
              </label>
              <input
                type="text"
                value={formData.grade}
                readOnly
                placeholder="从学生信息自动获取"
                className="w-full bg-gray-800/40 border border-gray-700 rounded-lg py-3 px-4 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              作品图片 <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="请输入图片URL或点击随机图片"
                className={`flex-1 bg-gray-800/60 border rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.imageUrl ? 'border-red-500' : 'border-gray-700 focus:border-primary-500'
                }`}
              />
              <button
                type="button"
                onClick={handleRandomImage}
                className="flex items-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Upload size={18} />
                <span>随机图片</span>
              </button>
            </div>
            {errors.imageUrl && <p className="text-red-400 text-sm mt-1">{errors.imageUrl}</p>}

            {formData.imageUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">图片预览：</p>
                <img
                  src={formData.imageUrl}
                  alt="预览"
                  className="max-w-xs rounded-lg border border-gray-700"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=图片加载失败';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">作品描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入作品描述..."
              rows={4}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="isFeatured" className="text-gray-300">设为精选作品</label>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  保存中...
                </span>
              ) : (
                <span>{isEdit ? '保存修改' : '创建作品'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
