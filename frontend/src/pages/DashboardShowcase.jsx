import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Play, Pause, Calendar, User, Tag, X, Code, Users, TrendingUp, CheckCircle, Maximize2, Minimize2, Sparkles, Star, Zap, Cpu, Radio } from 'lucide-react';
import { photoAPI } from '../services/api.js';
import { CATEGORIES } from '../utils/sharedData.js';

export default function DashboardShowcase() {
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    monthlyNew: 0,
    approvalRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const getCategoryPlaceholder = (category) => {
    const placeholders = {
      '机器人编程': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=futuristic%20robot%20cyberpunk%20neon%20coding%20interface%20sci-fi&image_size=landscape_16_9',
      '动画制作': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=neon%20animation%20timeline%20futuristic%20motion%20graphics%20sci-fi&image_size=landscape_16_9',
      '项目开发': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=holographic%20code%20interface%20futuristic%20programming%20sci-fi&image_size=landscape_16_9',
      '游戏创作': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=cyberpunk%20game%20interface%20neon%20pixel%20futuristic&image_size=landscape_16_9',
      '人工智能': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=futuristic%20AI%20neural%20network%20holographic%20sci-fi%20neon&image_size=landscape_16_9',
      '网页设计': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=futuristic%20web%20design%20holographic%20UI%20neon%20sci-fi&image_size=landscape_16_9',
      '创意绘画': 'https://neeko-copilot.bytedance.net/api/text2image?prompt=digital%20art%20neon%20creative%20holographic%20canvas%20sci-fi&image_size=landscape_16_9'
    };
    return placeholders[category] || 'https://neeko-copilot.bytedance.net/api/text2image?prompt=futuristic%20coding%20education%20neon%20interface%20sci-fi&image_size=landscape_16_9';
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  const autoPlayRef = useRef(null);
  const progressRef = useRef(null);
  const containerRef = useRef(null);
  const thumbStripRef = useRef(null);
  const AUTO_PLAY_INTERVAL = 6000;

  const categories = [
    { id: 'all', name: '全部作品' },
    ...CATEGORIES.map((cat) => ({ id: cat, name: cat }))
  ];

  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let filtered = photos;

    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.title || '').toLowerCase().includes(term) ||
        (p.author || '').toLowerCase().includes(term) ||
        (p.authorName || '').toLowerCase().includes(term)
      );
    }

    setFilteredPhotos(filtered);
    setCurrentIndex(0);
  }, [photos, activeCategory, searchTerm]);

  useEffect(() => {
    if (isAutoPlay && filteredPhotos.length > 1) {
      setProgress(0);
      const startTime = Date.now();
      
      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / AUTO_PLAY_INTERVAL) * 100, 100);
        setProgress(newProgress);
      }, 50);

      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
      }, AUTO_PLAY_INTERVAL);
    } else {
      clearInterval(autoPlayRef.current);
      clearInterval(progressRef.current);
      setProgress(0);
    }
    return () => {
      clearInterval(autoPlayRef.current);
      clearInterval(progressRef.current);
    };
  }, [isAutoPlay, filteredPhotos.length, currentIndex]);

  useEffect(() => {
    if (thumbStripRef.current) {
      const thumbs = thumbStripRef.current.children;
      if (thumbs[currentIndex]) {
        thumbs[currentIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex]);

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
      setStats({ total: 0, students: 0, monthlyNew: 0, approvalRate: 95 });
    }
  };

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === ' ') { e.preventDefault(); toggleAutoPlay(); }
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const currentPhoto = filteredPhotos[currentIndex];

  const statCards = [
    { label: '作品总数', value: stats.total, icon: Cpu, color: 'cyan' },
    { label: '学员人数', value: stats.students, icon: Users, color: 'purple' },
    { label: '本月新增', value: stats.monthlyNew, icon: Zap, color: 'amber' },
    { label: '通过率', value: `${stats.approvalRate}%`, icon: CheckCircle, color: 'emerald' }
  ];

  const colorMap = {
    cyan: { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'shadow-cyan-500/30', gradient: 'from-cyan-500 to-blue-500' },
    purple: { border: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/30', gradient: 'from-purple-500 to-pink-500' },
    amber: { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/30', gradient: 'from-amber-500 to-orange-500' },
    emerald: { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/30', gradient: 'from-emerald-500 to-teal-500' }
  };

  const categoryGradients = {
    '机器人编程': 'from-cyan-500 to-blue-500',
    '动画制作': 'from-pink-500 to-purple-500',
    '项目开发': 'from-violet-500 to-indigo-500',
    '游戏创作': 'from-amber-500 to-red-500',
    '人工智能': 'from-emerald-500 to-cyan-500',
    '网页设计': 'from-blue-500 to-cyan-500',
    '创意绘画': 'from-rose-500 to-pink-500'
  };

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col text-white overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, #050a14 0%, #0a1020 50%, #070d18 100%)'
      }}
    >
      {/* 科技网格背景 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* 扫描线效果 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.05) 2px, rgba(6, 182, 212, 0.05) 4px)'
        }}
      />

      {/* 发光光晕 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="flex-shrink-0 px-8 py-4 border-b border-cyan-500/30 bg-gray-950/80 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/40 animate-pulseSlow border border-cyan-400/50">
                <Radio size={24} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-gray-950 animate-pulse shadow-lg shadow-cyan-400/50" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                <span className="text-cyan-400">CODE</span>
                <span className="text-purple-400">KIDS</span>
                <span className="text-white ml-2">作品展示墙</span>
              </h1>
              <p className="text-xs text-cyan-300/70 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                SYSTEM ONLINE // CREATIVE VISUALIZATION MODULE
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-lg">
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索作品名称或作者..."
                className="w-full bg-gray-900/60 border border-cyan-500/30 rounded-lg py-2.5 pl-11 pr-10 text-white placeholder-cyan-300/30 focus:outline-none focus:border-cyan-400 focus:bg-gray-900/80 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all text-sm"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300/50 hover:text-cyan-400 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-base font-mono text-cyan-400 glow-number">{formatTime(currentTime)}</p>
              <div className="flex items-center space-x-2 justify-end mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-xs text-cyan-300/50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>ONLINE</span>
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? '退出全屏 (F)' : '全屏显示 (F)'}
              className="w-10 h-10 rounded-lg bg-gray-900/60 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all group"
            >
              {isFullscreen ? <Minimize2 size={18} className="text-cyan-400" /> : <Maximize2 size={18} className="text-cyan-400" />}
            </button>
          </div>
        </div>
      </header>

      <section className="flex-shrink-0 px-8 py-4 relative z-10">
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            const colors = colorMap[stat.color];
            return (
              <div
                key={idx}
                className={`relative ${colors.bg} ${colors.border} border rounded-lg p-4 overflow-hidden group hover:scale-[1.02] transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]`}
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-25 transition-opacity`} />
                <div className="flex items-center justify-between relative">
                  <div>
                    <p className="text-xs text-cyan-300/60 mb-1.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stat.label.toUpperCase()}</p>
                    <p className={`text-2xl font-bold ${colors.text} font-mono glow-number`}>
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg ${colors.glow}`}>
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex-shrink-0 px-8 py-3 relative z-10">
        <div className="flex items-center space-x-3 overflow-x-auto pb-1">
          <div className="flex items-center space-x-2 flex-shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <Tag size={16} className="text-cyan-400" />
            <span className="text-sm text-cyan-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>FILTER</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 flex-shrink-0 border ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105'
                  : 'bg-gray-900/60 text-cyan-300/70 border-cyan-500/20 hover:border-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              }`}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {activeCategory === cat.id ? `> ${cat.name} <` : cat.name}
            </button>
          ))}
        </div>
      </section>

      <section className="flex-1 min-h-0 px-8 py-4 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin flex items-center justify-center">
                  <Cpu size={36} className="text-cyan-400" />
                </div>
                <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
              </div>
              <p className="text-cyan-400 mt-6 text-lg" style={{ fontFamily: 'JetBrains Mono, monospace' }}>LOADING DATA...</p>
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-8xl mb-6 opacity-60">🌌</div>
              <p className="text-xl text-cyan-200 mb-2">未检测到符合条件的数据</p>
              <p className="text-sm text-cyan-300/50" style={{ fontFamily: 'JetBrains Mono, monospace' }}>请调整搜索参数或分类筛选</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full flex flex-col">
            <div className="flex-1 min-h-0 flex items-center justify-center relative">
              <div className="relative w-full h-full max-w-5xl rounded-xl overflow-hidden bg-gray-950/60 border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.15)]">
                {/* 边角装饰 */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg z-20" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg z-20" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg z-20" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg z-20" />

                <img
                  src={currentPhoto?.imageUrl}
                  alt={currentPhoto?.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = getCategoryPlaceholder(currentPhoto?.category);
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'JetBrains Mono, monospace', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>
                        {currentPhoto?.title}
                      </h2>
                      <div className="flex items-center space-x-5 text-cyan-100/80 flex-wrap gap-y-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        <div className="flex items-center space-x-2">
                          <User size={18} className="text-cyan-400" />
                          <span className="text-base">{currentPhoto?.authorName || currentPhoto?.author}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Tag size={18} className="text-purple-400" />
                          <span className="text-base">{currentPhoto?.category}</span>
                        </div>
                        {currentPhoto?.createdAt && (
                          <div className="flex items-center space-x-2">
                            <Calendar size={18} className="text-emerald-400" />
                            <span className="text-base">{formatDate(currentPhoto.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${categoryGradients[currentPhoto?.category] || 'from-gray-500 to-gray-600'} text-white text-sm font-medium shadow-lg border border-white/20`}>
                        {currentPhoto?.category}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 text-sm font-mono flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{String(currentIndex + 1).padStart(2, '0')} / {String(filteredPhotos.length).padStart(2, '0')}</span>
                </div>

                <div className="absolute top-6 right-6 flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-purple-500/30">
                    <Star size={16} className="text-purple-400 fill-purple-400" />
                    <span className="text-sm text-cyan-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{currentPhoto?.likeCount || 0}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrev}
                title="上一张 (←)"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-gray-950/80 border border-cyan-500/40 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all group z-10 backdrop-blur-sm"
              >
                <ChevronLeft size={28} className="text-cyan-400 group-hover:text-white" />
              </button>
              <button
                onClick={handleNext}
                title="下一张 (→)"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-lg bg-gray-950/80 border border-cyan-500/40 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all group z-10 backdrop-blur-sm"
              >
                <ChevronRight size={28} className="text-cyan-400 group-hover:text-white" />
              </button>
            </div>

            <div className="flex-shrink-0 mt-4 flex items-center gap-4">
              <div className="flex items-center space-x-3 flex-shrink-0">
                <button
                  onClick={toggleAutoPlay}
                  title="暂停/播放 (空格)"
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all border ${
                    isAutoPlay
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-gray-900/60 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400'
                  }`}
                >
                  {isAutoPlay ? (
                    <Pause size={20} className="text-cyan-400" />
                  ) : (
                    <Play size={20} className="text-cyan-400" />
                  )}
                </button>
                <div className="text-sm text-cyan-300/70" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {isAutoPlay ? 'AUTOPLAY // ON' : 'AUTOPLAY // OFF'}
                </div>
              </div>

              {/* 自动播放进度条 */}
              <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-cyan-500/20">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div
                ref={thumbStripRef}
                className="flex-1 flex items-center gap-3 overflow-x-auto scroll-smooth py-2 hide-scrollbar"
              >
                {filteredPhotos.map((photo, idx) => (
                  <button
                    key={photo._id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      idx === currentIndex
                        ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                        : 'border-cyan-500/20 opacity-50 hover:opacity-100 hover:border-cyan-400/60'
                    }`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = getCategoryPlaceholder(photo.category);
                      }}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? '退出全屏 (F)' : '全屏显示 (F)'}
                className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-900/60 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
              >
                {isFullscreen ? <Minimize2 size={20} className="text-cyan-400" /> : <Maximize2 size={20} className="text-cyan-400" />}
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="flex-shrink-0 px-8 py-3 border-t border-cyan-500/20 bg-gray-950/60 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50" />
            <span className="text-cyan-300/80 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>CREATIVE VISUALIZATION ACTIVE</span>
          </div>
          <div className="h-4 w-px bg-cyan-500/30" />
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-purple-300/80 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>INSPIRE · CREATE · FUTURE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}