import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Play, Pause, Calendar, User, Tag, X, Code, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { photoAPI } from '../services/api.js';
import { CATEGORIES } from '../utils/sharedData.js';

export default function DashboardShowcase() {
  // 数据状态
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    monthlyNew: 0,
    approvalRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // 分类占位图映射
  const getCategoryPlaceholder = (category) => {
    const placeholders = {
      '机器人编程': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=cute%20robot%20made%20of%20code%20blocks%20colorful%20scratched%20style%20kid%20friendly&image_size=landscape_16_9',
      '动画制作': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=colorful%20animated%20cartoon%20character%20motion%20frames%20kid%20friendly&image_size=landscape_16_9',
      '项目开发': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=computer%20programming%20project%20code%20on%20screen%20colorful%20modern&image_size=landscape_16_9',
      '游戏创作': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=pixel%20art%20video%20game%20retro%20style%20colorful%20fun&image_size=landscape_16_9',
      '人工智能': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=AI%20robot%20friendly%20chatbot%20colorful%20futuristic%20kid%20friendly&image_size=landscape_16_9',
      '网页设计': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=colorful%20website%20design%20mockup%20modern%20clean%20layout&image_size=landscape_16_9',
      '创意绘画': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=digital%20art%20colorful%20creative%20drawing%20kid%20artwork&image_size=landscape_16_9'
    };
    return placeholders[category] || 'https://neeko-copilot.bytedance.net/api/text2image?prompt=creative%20coding%20for%20kids%20colorful%20programming%20blocks%20fun&image_size=landscape_16_9';
  };

  // 交互状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 自动播放定时器
  const autoPlayRef = useRef(null);
  const AUTO_PLAY_INTERVAL = 5000; // 5秒切换一次

  // 分类列表
  const categories = [
    { id: 'all', name: '全部作品' },
    ...CATEGORIES.map((cat) => ({ id: cat, name: cat }))
  ];

  // 加载数据
  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  // 实时时间更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 筛选作品
  useEffect(() => {
    let filtered = photos;

    // 分类筛选
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // 搜索筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.author || '').toLowerCase().includes(term) ||
        (p.authorName || '').toLowerCase().includes(term)
      );
    }

    setFilteredPhotos(filtered);
    setCurrentIndex(0); // 筛选后重置到第一张
  }, [photos, activeCategory, searchTerm]);

  // 自动播放控制
  useEffect(() => {
    if (isAutoPlay && filteredPhotos.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
      }, AUTO_PLAY_INTERVAL);
    } else {
      clearInterval(autoPlayRef.current);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlay, filteredPhotos.length]);

  // 加载作品数据
  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await photoAPI.getPhotos({ limit: 500, status: 'approved' });
      setPhotos(result.data || []);
    } catch (error) {
      console.error('加载作品失败:', error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const result = await photoAPI.getStats();
      if (result.data) {
        setStats({
          total: result.data.totalPhotos || result.totalPhotos || 0,
          students: result.data.totalAuthors || result.totalAuthors || 0,
          monthlyNew: result.data.monthlyNew || 0,
          approvalRate: result.data.approvalRate || 95
        });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
      // 使用默认值
      setStats({ total: 0, students: 0, monthlyNew: 0, approvalRate: 95 });
    }
  };

  // 切换到上一张
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  // 切换到下一张
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  // 切换自动播放
  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchTerm('');
  };

  // 格式化时间
  const formatTime = (date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 当前展示的作品
  const currentPhoto = filteredPhotos[currentIndex];

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* 顶部信息栏 */}
      <header className="relative z-10 px-6 py-4 border-b border-cyan-500/20 bg-gray-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* 左侧：机构信息 */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-2xl font-bold">💻</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyan-400 tracking-wider">CodeKids 学员作品展示墙</h1>
              <p className="text-sm text-gray-400">少儿编程成果展 · 创意编程作品展</p>
            </div>
          </div>

          {/* 中间：搜索框 */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索作品名称或作者..."
                className="w-full bg-gray-800/40 border border-cyan-500/30 rounded-xl py-2.5 pl-11 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:bg-gray-800/60 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 右侧：时间 + 状态 */}
          <div className="text-right">
            <p className="text-lg font-mono text-cyan-400">{formatTime(currentTime)}</p>
            <div className="flex items-center space-x-2 justify-end">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-400">系统在线</span>
            </div>
          </div>
        </div>
      </header>

      {/* 统计数据卡片 */}
      <section className="relative z-10 px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '作品总数', value: stats.total, icon: Code, color: 'from-cyan-500 to-blue-500' },
            { label: '学员人数', value: stats.students, icon: Users, color: 'from-purple-500 to-pink-500' },
            { label: '本月新增', value: stats.monthlyNew, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
            { label: '通过率', value: `${stats.approvalRate}%`, icon: CheckCircle, color: 'from-yellow-500 to-orange-500' }
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative bg-gray-800/30 border border-cyan-500/20 rounded-xl p-4 overflow-hidden group hover:border-cyan-400/50 transition-all"
              >
                {/* 发光边框效果 */}
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white font-mono">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 分类筛选 */}
      <section className="relative z-20 px-6 py-3 bg-gradient-to-b from-[#1a1f3a] to-transparent">
        <div className="flex items-center space-x-3 overflow-x-auto pb-2">
          <Tag size={18} className="text-cyan-400 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-gray-800/60 text-gray-300 border border-cyan-500/20 hover:border-cyan-400/50 hover:text-cyan-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 作品展示区域 */}
      <section className="relative z-10 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-spin flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <p className="text-cyan-400">正在加载作品...</p>
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <span className="text-6xl mb-4">📭</span>
              <p className="text-xl text-gray-300 mb-2">暂无符合条件的作品</p>
              <p className="text-sm text-gray-500">尝试更换搜索关键词或分类筛选</p>
            </div>
          </div>
        ) : (
          <div className="relative min-h-[50vh] flex items-center justify-center">
            {/* 作品大图 */}
            <div className="relative w-full max-w-4xl aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800/40 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                {/* 图片 */}
                <img
                  src={currentPhoto?.imageUrl}
                  alt={currentPhoto?.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = getCategoryPlaceholder(currentPhoto?.category);
                  }}
                />

                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* 作品信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{currentPhoto?.title}</h2>
                  <div className="flex items-center space-x-4 text-gray-300">
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-cyan-400" />
                      <span>{currentPhoto?.authorName || currentPhoto?.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag size={16} className="text-purple-400" />
                      <span>{currentPhoto?.category}</span>
                    </div>
                    {currentPhoto?.createdAt && (
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} className="text-green-400" />
                        <span>{formatDate(currentPhoto.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 分类标签 */}
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium shadow-lg">
                  {currentPhoto?.category}
                </div>
              </div>

            {/* 左右切换按钮 */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-800/60 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/30 hover:border-cyan-400 transition-all group z-10"
            >
              <ChevronLeft size={24} className="text-cyan-400 group-hover:text-white" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-800/60 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/30 hover:border-cyan-400 transition-all group z-10"
            >
              <ChevronRight size={24} className="text-cyan-400 group-hover:text-white" />
            </button>

            {/* 底部控制栏 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
              {/* 进度指示器 */}
              <div className="flex items-center space-x-2">
                {filteredPhotos.slice(0, 10).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? 'bg-cyan-400 w-6'
                        : 'bg-gray-600 hover:bg-gray-400'
                    }`}
                  />
                ))}
                {filteredPhotos.length > 10 && (
                  <span className="text-sm text-gray-400 ml-2">+{filteredPhotos.length - 10}</span>
                )}
              </div>

              {/* 自动播放控制 */}
              <button
                onClick={toggleAutoPlay}
                className="w-10 h-10 rounded-full bg-gray-800/60 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/30 transition-all"
              >
                {isAutoPlay ? (
                  <Pause size={18} className="text-cyan-400" />
                ) : (
                  <Play size={18} className="text-cyan-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 底部标语 */}
      <footer className="relative z-10 px-6 py-4 border-t border-cyan-500/20">
        <div className="flex items-center justify-center space-x-4">
          <span className="text-cyan-400">💡</span>
          <p className="text-lg text-gray-300">点燃创意 · 绽放梦想 · 让每个孩子都能创造未来</p>
          <span className="text-purple-400">💡</span>
        </div>
      </footer>
    </div>
  );
}