import { useEffect, useState, useMemo } from 'react';
import { Search, Eye, Heart, Share2, Play, Sparkles, Clock, Filter, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { scratchAPI } from '../services/api.js';
import { useToast } from '../components/common/Toast.jsx';
import Pagination from '../components/common/Pagination.jsx';

const CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'Scratch编程', label: 'Scratch编程' },
  { value: '游戏创作', label: '游戏创作' },
  { value: '动画制作', label: '动画制作' },
  { value: '互动故事', label: '互动故事' },
  { value: '数学科学', label: '数学科学' }
];

export default function ScratchGallery() {
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, [page, selectedCategory, sortBy]);

  // 搜索防抖：输入停止 500ms 后自动搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchProjects();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: 12,
        category: selectedCategory === 'all' ? '' : selectedCategory,
        search: searchQuery,
        sortBy
      };
      const result = await scratchAPI.getProjects(params);
      setProjects(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotalCount(result.pagination?.total || 0);
    } catch (error) {
      console.error('获取Scratch作品失败:', error);
      toast.error('加载作品失败，请刷新重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setShowCategoryDropdown(false);
    setPage(1);
  };

  const currentCategoryLabel = useMemo(() => {
    const cat = CATEGORIES.find(c => c.value === selectedCategory);
    return cat ? cat.label : '全部';
  }, [selectedCategory]);

  const formatCount = (count) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* 顶部标题 */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                  <Play size={24} className="text-white" />
                </span>
                Scratch 编程作品
              </h1>
              <p className="text-gray-400">
                运行并体验学生们创作的 Scratch 互动作品，共 <span className="text-primary-400 font-medium">{totalCount}</span> 个作品
              </p>
            </div>
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索作品名称、作者..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </form>

            {/* 分类筛选 */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-5 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white hover:bg-gray-700/50 transition-colors min-w-[140px]"
              >
                <Filter size={18} />
                <span className="flex-1 text-left">{currentCategoryLabel}</span>
                <ChevronDown size={16} className={showCategoryDropdown ? 'rotate-180' : ''} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 z-20 overflow-hidden">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryChange(cat.value)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                        selectedCategory === cat.value
                          ? 'text-primary-400 bg-gray-700/50'
                          : 'text-gray-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 排序 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                }`}
              >
                <Clock size={18} />
                <span>最新</span>
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
                }`}
              >
                <Sparkles size={18} />
                <span>热门</span>
              </button>
            </div>
          </div>
        </div>

        {/* 作品列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-gray-700/50 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-700/50 rounded w-3/4" />
                  <div className="h-4 bg-gray-700/50 rounded w-1/2" />
                  <div className="flex gap-3">
                    <div className="h-4 bg-gray-700/50 rounded w-12" />
                    <div className="h-4 bg-gray-700/50 rounded w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/scratch/${project.id}`)}
                  className="card cursor-pointer hover:scale-[1.02] hover:border-primary-500/30 transition-all duration-300 group"
                >
                  {/* 封面 */}
                  <div className="relative aspect-video overflow-hidden rounded-t-xl bg-gradient-to-br from-gray-800 to-gray-900">
                    {project.coverUrl ? (
                      <img
                        src={project.coverUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400/20 to-pink-500/20">
                        <Play size={48} className="text-white/40" />
                      </div>
                    )}

                    {/* 播放按钮遮罩 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <Play size={28} className="text-white ml-1" />
                      </div>
                    </div>

                    {/* 精选标签 */}
                    {project.isFeatured && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>精选</span>
                      </div>
                    )}

                    {/* 分类标签 */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
                      {project.category}
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 truncate group-hover:text-primary-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      作者：{project.author}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {formatCount(project.viewCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} />
                        {formatCount(project.likeCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={14} />
                        {formatCount(project.shareCount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-800/50 flex items-center justify-center">
              <Play size={40} className="text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg mb-2">暂无作品</p>
            <p className="text-gray-500 text-sm">搜索其他关键词或换个分类试试吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
