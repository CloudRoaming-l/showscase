import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, User, Calendar, Award, Grid, Filter, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PhotoCard from '../components/gallery/PhotoCard.jsx';
import PhotoLightbox from '../components/gallery/PhotoLightbox.jsx';
import { photoAPI, studentAPI } from '../services/api.js';
import { useToast } from '../components/common/Toast.jsx';
import { CATEGORIES } from '../utils/sharedData.js';

export default function Author() {
  const [authorName, setAuthorName] = useState('');
  const [author, setAuthor] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    if (name) {
      const decoded = decodeURIComponent(name);
      setAuthorName(decoded);
      loadAuthorData(decoded);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadAuthorData = async (name) => {
    try {
      setIsLoading(true);
      const photosResult = await photoAPI.getPhotos({ limit: 100 });
      const allPhotos = photosResult.data || [];
      const authorPhotos = allPhotos.filter(
        (p) => (p.author === name) || (p.authorName === name)
      );
      setPhotos(authorPhotos);

      // 尝试从 authorId 关联的学生信息，或从学生库中匹配获取
      let studentInfo = null;
      const firstWithAuthorId = authorPhotos.find((p) => p.authorId && typeof p.authorId === 'object' && p.authorId.name);
      if (firstWithAuthorId) {
        studentInfo = firstWithAuthorId.authorId;
      } else {
        try {
          const studentsResult = await studentAPI.getStudents();
          const students = studentsResult.data || [];
          studentInfo = students.find((s) => s.name === name) || null;
        } catch (err) {
          // 学生 API 不可用时不阻塞
        }
      }
      setAuthor(studentInfo);
    } catch (error) {
      console.error('加载作者数据失败:', error);
      toast.error('加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const categoriesUsed = useMemo(() => {
    const set = new Set();
    photos.forEach((p) => p.category && set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') return photos;
    return photos.filter((p) => p.category === activeCategory);
  }, [photos, activeCategory]);

  const photoCards = useMemo(() => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPhotos.map((photo) => (
          <PhotoCard
            key={photo.id || photo._id}
            photo={photo}
            onClick={() => setSelectedPhoto(photo)}
          />
        ))}
      </div>
    );
  }, [filteredPhotos]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/gallery')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>返回作品画廊</span>
        </button>

        {/* 作者信息卡片 */}
        <div className="card p-6 mb-8 border border-primary-500/20 bg-gradient-to-br from-primary-900/20 via-gray-900/40 to-accent-900/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              {author?.avatar ? (
                <img
                  src={author.avatar}
                  alt={authorName}
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                  <User size={40} className="text-white" />
                )}
            </div>
            <div className="text-center md:text-left md:flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{authorName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 text-sm">
                <div className="flex items-center space-x-1.5">
                  <Grid size={16} />
                  <span>{photos.length} 个作品</span>
                </div>
                {author?.grade && (
                  <div className="flex items-center space-x-1.5">
                    <Award size={16} className="text-accent-400" />
                    <span>{author.grade}</span>
                  </div>
                )}
                {author?.className && (
                  <div className="flex items-center space-x-1.5">
                    <Calendar size={16} className="text-primary-400" />
                    <span>{author.className}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 作品分类概览 */}
            {!isLoading && categoriesUsed.length > 1 && (
              <div className="w-full md:w-auto md:ml-auto flex flex-wrap gap-2 justify-center">
                {categoriesUsed
                  .filter((c) => c !== 'all')
                  .slice(0, 4)
                  .map((cat) => {
                    const count = photos.filter((p) => p.category === cat).length;
                    return (
                      <div
                        key={cat}
                        className="px-3 py-1.5 rounded-full bg-gray-800/60 border border-gray-700 text-xs"
                      >
                        <span className="text-gray-400">{cat}</span>
                        <span className="text-white ml-1 font-medium">{count}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* 筛选栏 */}
        {!isLoading && photos.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <ImageIcon size={20} className="text-primary-400" />
                <span>作品集</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {filteredPhotos.length} / {photos.length} 个作品
              </p>
            </div>

            {categoriesUsed.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                {categoriesUsed.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      activeCategory === cat
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {cat === 'all' ? '全部' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-gray-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-800/60 flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-400 mb-1">这位作者还没有作品</p>
            <Link
              to="/gallery"
              className="text-primary-400 hover:text-primary-300 text-sm"
            >
              返回画廊
            </Link>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-12">
          <p className="text-gray-400 text-sm">该分类下暂无作品</p>
        </div>
      ) : (
          photoCards
        )}
      </div>

      {/* 图片灯箱 */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          photos={photos}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
