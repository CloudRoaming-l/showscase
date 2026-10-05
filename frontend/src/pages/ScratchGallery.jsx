import { useEffect, useState, useMemo } from 'react';
import { Search, Eye, Heart, Share2, Play, Clock, Filter, ChevronDown, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scratchAPI, categoryAPI, groupAPI } from '../services/api.js';
import { useToast } from '../components/common/Toast.jsx';
import Pagination from '../components/common/Pagination.jsx';

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
  const [categories, setCategories] = useState([{ value: 'all', label: '全部' }]);
  const [groups, setGroups] = useState([{ value: 'all', label: '全部教学小组' }]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [page, selectedCategory, sortBy, selectedGroupId]);

  useEffect(() => {
    categoryAPI.getList('scratch').then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        const list = [{ value: 'all', label: '全部' }, ...res.data.map((c) => ({ value: c.name, label: c.name }))];
        setCategories(list);
      }
    }).catch(() => {});

    groupAPI.getList().then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        const list = [{ value: 'all', label: '全部教学小组' }, ...res.data.map((g) => ({ value: g.id, label: g.name }))];
        setGroups(list);
      }
    }).catch(() => {});
  }, []);

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
      if (selectedGroupId !== 'all') {
        params.groupId = selectedGroupId;
      }
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

  const handleGroupChange = (gid) => {
    setSelectedGroupId(gid);
    setShowGroupDropdown(false);
    setPage(1);
  };

  const currentCategoryLabel = useMemo(() => {
    const cat = categories.find(c => c.value === selectedCategory);
    return cat ? cat.label : '全部';
  }, [selectedCategory, categories]);

  const currentGroupLabel = useMemo(() => {
    const g = groups.find(g => g.value === selectedGroupId);
    return g ? g.label : '全部教学小组';
  }, [selectedGroupId, groups]);

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
          <h1 className="text-2xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Play size={20} className="text-gray-700" />
            Scratch 编程作品
          </h1>
          <p className="text-sm text-gray-500">
            运行并体验学生们创作的 Scratch 互动作品，共 {totalCount} 个作品
          </p>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* 搜索框 */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索作品名称、作者..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
                />
              </div>
            </form>

            {/* 作品类型筛选 */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors min-w-[120px]"
              >
                <Filter size={14} />
                <span className="flex-1 text-left">{currentCategoryLabel}</span>
                <ChevronDown size={14} className={showCategoryDropdown ? 'rotate-180' : ''} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-sm z-50 overflow-hidden">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryChange(cat.value)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        selectedCategory === cat.value
                          ? 'text-gray-900 bg-gray-100 font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 教学小组筛选 */}
            <div className="relative">
              <button
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors min-w-[140px]"
              >
                <Users size={14} />
                <span className="flex-1 text-left">{currentGroupLabel}</span>
                <ChevronDown size={14} className={showGroupDropdown ? 'rotate-180' : ''} />
              </button>

              {showGroupDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-sm z-50 overflow-hidden">
                  {groups.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => handleGroupChange(g.value)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        selectedGroupId === g.value
                          ? 'text-gray-900 bg-gray-100 font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 排序 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortBy('newest')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  sortBy === 'newest'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Clock size={14} />
                <span>最新</span>
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Sparkles size={14} />
                <span>热门</span>
              </button>
            </div>
          </div>
        </div>

        {/* 作品列表 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-md overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="flex gap-3 pt-1">
                    <div className="h-3 bg-gray-100 rounded w-10" />
                    <div className="h-3 bg-gray-100 rounded w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/scratch/${project.id}`)}
                  className="bg-white border border-gray-200 rounded-md overflow-hidden cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  {/* 封面 */}
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {project.coverUrl ? (
                      <img
                        src={project.coverUrl}
                        alt={project.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <Play size={36} className="text-gray-300" />
                      </div>
                    )}

                    {/* 播放按钮遮罩 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Play size={24} className="text-white ml-0.5" />
                      </div>
                    </div>

                    {/* 精选标签 */}
                    {project.isFeatured && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900 text-white text-xs rounded">
                        精选
                      </div>
                    )}

                    {/* 作品类型标签 */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                      {project.category}
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 mb-1 truncate text-sm">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      作者：{project.author}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {formatCount(project.viewCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} />
                        {formatCount(project.likeCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={12} />
                        {formatCount(project.shareCount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
              <Play size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-600 text-base mb-1">暂无作品</p>
            <p className="text-gray-400 text-sm">搜索其他关键词或换个作品类型试试吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
