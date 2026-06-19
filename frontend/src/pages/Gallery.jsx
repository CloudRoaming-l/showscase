import { useState, useEffect, useMemo, useCallback } from 'react';
import { Grid, Filter, Search, X, Heart, Star, Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import PhotoCard from '../components/gallery/PhotoCard.jsx';
import PhotoLightbox from '../components/gallery/PhotoLightbox.jsx';
import { useToast } from '../components/common/Toast.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { photoAPI } from '../services/api.js';
import { getFavorites } from '../utils/interaction';
import { CATEGORIES } from '../utils/sharedData.js';

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(() => searchParams.get('category') || 'all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [page, setPage] = useState(() => parseInt(searchParams.get('page'), 10) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([
    { id: 'all', name: '全部作品' },
    ...CATEGORIES.map((cat) => ({ id: cat, name: cat }))
  ]);
  const [submitForm, setSubmitForm] = useState({ show: false });
  const toast = useToast();

  const PAGE_SIZE = 20;

  // URL 参数变化 → 同步到本地状态（可在浏览器后退/前进时生效）
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'all';
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page'), 10) || 1;
    setActiveFilter((prev) => (prev !== urlCategory ? urlCategory : prev));
    if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    if (urlPage !== page) setPage(urlPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 本地状态变化 → 同步到 URL（保持浏览器历史一致性）
  useEffect(() => {
    const params = {};
    if (activeFilter !== 'all') params.category = activeFilter;
    if (debouncedTerm) params.search = debouncedTerm;
    if (page > 1) params.page = String(page);
    const stringified = new URLSearchParams(params).toString();
    const current = searchParams.toString();
    if (stringified !== current) {
      if (stringified) setSearchParams(new URLSearchParams(params));
      else setSearchParams(new URLSearchParams(''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, debouncedTerm, page]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, showFavorites, page, debouncedTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 从后端拉取共享常量（分类列表）
  useEffect(() => {
    photoAPI.getConfig?.().then((res) => {
      if (res?.data?.categories && Array.isArray(res.data.categories)) {
        const list = [{ id: 'all', name: '全部作品' }, ...res.data.categories.map((c) => ({ id: c, name: c }))];
        setCategories(list);
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: PAGE_SIZE
      };
      if (activeFilter !== 'all' && !showFavorites) {
        params.category = activeFilter;
      }

      let data = [];
      if (showFavorites) {
        // 收藏模式：先拉全部再过滤
        const result = await photoAPI.getPhotos({ limit: 500 });
        const allPhotos = result.data || [];
        const favorites = getFavorites();
        data = allPhotos.filter(p =>
          favorites.includes(String(p.id)) || favorites.includes(String(p._id))
        );
      } else {
        const result = await photoAPI.getPhotos(params);
        data = result.data || [];
        const total = result.pagination?.total || data.length;
        setTotalPages(Math.ceil(total / PAGE_SIZE));
      }

      setPhotos(data);
    } catch (error) {
      console.error('加载数据失败:', error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (debouncedTerm === '') return true;
      const term = debouncedTerm.toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(term) ||
        (p.author || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term)
      );
    });
  }, [photos, debouncedTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedTerm('');
  }, []);

  const handleClearFilter = useCallback(() => {
    setActiveFilter('all');
  }, []);

  const pid = (p) => p.id || p._id;

  const handlePrev = useCallback(() => {
    if (!selectedPhoto) return;
    const idx = filteredPhotos.findIndex((p) => pid(p) === pid(selectedPhoto));
    if (idx > 0) setSelectedPhoto(filteredPhotos[idx - 1]);
  }, [filteredPhotos, selectedPhoto]);

  const handleNext = useCallback(() => {
    if (!selectedPhoto) return;
    const idx = filteredPhotos.findIndex((p) => pid(p) === pid(selectedPhoto));
    if (idx < filteredPhotos.length - 1) setSelectedPhoto(filteredPhotos[idx + 1]);
  }, [filteredPhotos, selectedPhoto]);

  const [submitData, setSubmitData] = useState({
    title: '',
    author: '',
    description: '',
    category: CATEGORIES[0],
    imageUrl: ''
  });

  const handleSubmitPhoto = async () => {
    if (!submitData.title || !submitData.author || !submitData.imageUrl) {
      toast.error('请填写作品名称、作者和图片链接');
      return;
    }

    try {
      await photoAPI.createPhoto({
        title: submitData.title,
        author: submitData.author,
        description: submitData.description,
        category: submitData.category,
        imageUrl: submitData.imageUrl,
        isFeatured: false
      });
      toast.success('作品提交成功，感谢您的分享！');
      setSubmitForm({ show: false });
      setSubmitData({ title: '', author: '', description: '', category: CATEGORIES[0], imageUrl: '' });
      // 刷新列表
      loadData();
    } catch (err) {
      toast.error('作品提交失败，请稍后重试');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <Grid size={28} className="text-primary-400" />
            <h1 className="text-3xl md:text-4xl font-bold">作品展示</h1>
            <span className="text-gray-500 text-lg">（{filteredPhotos.length} 个作品）</span>
          </div>
          <button
            onClick={() => setSubmitForm({ show: true })}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-lg shadow-lg shadow-primary-500/30 transition-all"
          >
            <Plus size={18} />
            <span>提交作品</span>
          </button>
        </div>
        <p className="text-gray-400">浏览优秀学生作品，感受孩子们的创造力</p>
      </div>

      <div className="relative mb-8">
        <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索作品名称或作者..."
          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-all duration-200 focus:bg-gray-800"
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            title="清空搜索"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2 mb-8 overflow-x-auto pb-2">
        <Filter size={20} className="text-gray-400 mr-2 flex-shrink-0" />

        <button
          onClick={() => {
            setShowFavorites(!showFavorites);
            setActiveFilter('all');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 flex items-center space-x-2 ${
            showFavorites
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Heart size={16} className={showFavorites ? 'fill-current' : ''} />
          <span>我的收藏</span>
        </button>

        <button
          onClick={() => {
            setShowFavorites(false);
            setActiveFilter('all');
            setPage(1);
          }}
          className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 flex items-center space-x-2 ${
            !showFavorites && activeFilter === 'all'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Star size={16} />
          <span>精选作品</span>
        </button>

        {categories.slice(1).map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setShowFavorites(false);
              setActiveFilter(category.id);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              !showFavorites && activeFilter === category.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {category.name}
          </button>
        ))}

        {activeFilter !== 'all' && !showFavorites && (
          <button
            onClick={handleClearFilter}
            className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            清除筛选
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-800/40 rounded-2xl overflow-hidden animate-pulse h-80"
            >
              <div className="h-52 bg-gray-700/50" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-700/50 rounded w-3/4" />
                <div className="h-3 bg-gray-700/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPhotos.map((photo) => (
            <PhotoCard
              key={photo.id || photo._id}
              photo={photo}
              onClick={() => setSelectedPhoto(photo)}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredPhotos.length === 0 && (() => {
        let icon = '🔍';
        let title = '暂无符合条件的作品';
        let subtitle = '尝试更换搜索关键词或筛选条件';
        if (showFavorites) {
          icon = '💖';
          title = '还没有收藏任何作品';
          subtitle = '浏览下方作品并点击心形图标来收藏';
        } else if (debouncedTerm) {
          icon = '📭';
          title = `没有找到与“${debouncedTerm}”相关的作品`;
          subtitle = '尝试更换关键词或取消搜索';
        } else if (activeFilter !== 'all') {
          icon = '🖼️';
          title = `"${activeFilter}" 分类下还没有作品`;
          subtitle = '快来成为第一个分享者吧';
        }

        return (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 select-none">{icon}</div>
            <p className="text-gray-300 text-xl mb-2">{title}</p>
            <p className="text-gray-500 text-sm">{subtitle}</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              {(debouncedTerm || activeFilter !== 'all' || showFavorites) && (
                <button
                  onClick={() => {
                    handleClearSearch();
                    handleClearFilter();
                    setShowFavorites(false);
                  }}
                  className="px-5 py-2 bg-primary-500/20 border border-primary-500/30 text-primary-300 hover:bg-primary-500/30 rounded-lg transition-colors text-sm"
                >
                  重置筛选
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* 分页：智能省略号 */}
      {!isLoading && totalPages > 1 && !showFavorites && (() => {
        const pages = [];
        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          if (page > 4) pages.push('...');
          const start = Math.max(2, page - 2);
          const end = Math.min(totalPages - 1, page + 2);
          for (let i = start; i <= end; i++) pages.push(i);
          if (page < totalPages - 3) pages.push('...');
          pages.push(totalPages);
        }

        return (
          <div className="flex items-center justify-center space-x-2 mt-12 flex-wrap gap-y-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800/60 text-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-700 hover:text-white transition-colors text-sm"
            >
              上一页
            </button>
            {pages.map((p, idx) =>
              p === '...' ? (
                <span key={`dots-${idx}`} className="px-2 text-gray-500 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg transition-colors text-sm ${
                    page === p
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-800/60 text-gray-300 rounded-lg disabled:opacity-30 hover:bg-gray-700 hover:text-white transition-colors text-sm"
            >
              下一页
            </button>
          </div>
        );
      })()}

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          photos={filteredPhotos}
          currentIndex={filteredPhotos.findIndex((p) => pid(p) === pid(selectedPhoto))}
          onClose={() => setSelectedPhoto(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}

      {/* 提交作品弹窗 */}
      {submitForm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="card p-6 max-w-lg w-full border border-gray-700">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                  <Plus size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">提交作品</h3>
              </div>
              <button
                onClick={() => setSubmitForm({ show: false })}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">作品名称 *</label>
                <input
                  type="text"
                  value={submitData.title}
                  onChange={(e) => setSubmitData({ ...submitData, title: e.target.value })}
                  placeholder="请输入作品名称"
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">作者 *</label>
                <input
                  type="text"
                  value={submitData.author}
                  onChange={(e) => setSubmitData({ ...submitData, author: e.target.value })}
                  placeholder="请输入作者姓名"
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">分类 *</label>
                <select
                  value={submitData.category}
                  onChange={(e) => setSubmitData({ ...submitData, category: e.target.value })}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  {categories.slice(1).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">图片链接 *</label>
                <input
                  type="url"
                  value={submitData.imageUrl}
                  onChange={(e) => setSubmitData({ ...submitData, imageUrl: e.target.value })}
                  placeholder="请输入作品图片的 URL（可使用 https://picsum.photos/随机 占位）"
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">可以使用 https://picsum.photos/800/600?random=1 做测试</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">作品描述</label>
                <textarea
                  rows={3}
                  value={submitData.description}
                  onChange={(e) => setSubmitData({ ...submitData, description: e.target.value })}
                  placeholder="请简要描述作品（可选）"
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setSubmitForm({ show: false })}
                className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitPhoto}
                className="px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/30"
              >
                提交作品
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
