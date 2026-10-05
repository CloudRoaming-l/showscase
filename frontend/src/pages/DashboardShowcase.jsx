import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Play, Pause, Calendar, User, Tag, X, Users, CheckCircle, Maximize2, Minimize2, Clock, Grid3X3 } from 'lucide-react';
import { photoAPI, categoryAPI } from '../services/api.js';

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [categories, setCategories] = useState([{ id: 'all', name: '全部作品' }]);

  const autoPlayRef = useRef(null);
  const progressRef = useRef(null);
  const containerRef = useRef(null);
  const thumbStripRef = useRef(null);
  const AUTO_PLAY_INTERVAL = 6000;
  const [slideDirection, setSlideDirection] = useState('down');
  const [previousIndex, setPreviousIndex] = useState(0);

  useEffect(() => {
    loadData();
    loadStats();
    categoryAPI.getList('photo').then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        setCategories([
          { id: 'all', name: '全部作品' },
          ...res.data.map((c) => ({ id: c.name, name: c.name }))
        ]);
      }
    }).catch(() => {});
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
    setPreviousIndex(0);
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
    setPreviousIndex(currentIndex);
    setSlideDirection('up');
    setCurrentIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  }, [filteredPhotos.length, currentIndex]);

  const handleNext = useCallback(() => {
    setPreviousIndex(currentIndex);
    setSlideDirection('down');
    setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
  }, [filteredPhotos.length, currentIndex]);

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
      if (e.key === 'ArrowUp') handlePrev();
      else if (e.key === 'ArrowDown') handleNext();
      else if (e.key === ' ') { e.preventDefault(); toggleAutoPlay(); }
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const currentPhoto = filteredPhotos[currentIndex];

  const statCards = [
    { label: '作品总数', value: stats.total, icon: Grid3X3 },
    { label: '学员人数', value: stats.students, icon: Users },
    { label: '本月新增', value: stats.monthlyNew, icon: Calendar },
    { label: '通过率', value: `${stats.approvalRate}%`, icon: CheckCircle }
  ];

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col text-gray-100 overflow-hidden relative"
      style={{ background: '#0f0f0f' }}
    >
      {/* 微噪点质感背景 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 顶部导航 */}
      <header className="flex-shrink-0 px-8 py-4 border-b border-gray-800 bg-[#0f0f0f]/90 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center">
              <Grid3X3 size={18} className="text-gray-900" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-wide leading-tight text-white">
                造物课堂 · 作品展示
              </h1>
              <p className="text-xs text-gray-500 leading-tight">
                STUDENT SHOWCASE
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索作品名称或作者..."
                className="w-full bg-gray-900 border border-gray-800 rounded-md py-2 pl-9 pr-9 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 focus:bg-gray-900 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-sm font-mono text-gray-300 leading-tight">{formatTime(currentTime)}</p>
              <div className="flex items-center space-x-1.5 justify-end mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <span className="text-xs text-gray-500">LIVE</span>
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? '退出全屏 (F)' : '全屏显示 (F)'}
              className="w-9 h-9 rounded-md bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-gray-800 hover:border-gray-700 transition-all"
            >
              {isFullscreen ? <Minimize2 size={16} className="text-gray-400" /> : <Maximize2 size={16} className="text-gray-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* 主体 */}
      <section className="flex-1 min-h-0 px-8 py-4 relative z-10 flex gap-6">
        {/* 左侧：统计卡片 */}
        <div className="w-52 flex-shrink-0 flex flex-col gap-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-1">
            数据概览
          </div>
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-gray-900/60 border border-gray-800 rounded-md p-4 group hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-semibold text-white font-mono">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center">
                    <Icon size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 中间：大图展示 */}
        <div className="flex-1 min-w-0 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-700 border-t-gray-400 animate-spin mx-auto" />
              <p className="text-gray-500 mt-6 text-sm">加载中...</p>
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">暂无作品</p>
              <p className="text-sm text-gray-600">请调整搜索条件</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full flex-1 min-h-0 flex flex-col">
            <div className="w-full flex-1 min-h-0 flex items-center justify-center relative overflow-hidden">
              <style>{`
                @keyframes vs-enter-from-bottom { from { transform: translateY(100%);  } to { transform: translateY(0);     } }
                @keyframes vs-leave-to-top      { from { transform: translateY(0);      } to { transform: translateY(-100%); } }
                @keyframes vs-enter-from-top    { from { transform: translateY(-100%); } to { transform: translateY(0);     } }
                @keyframes vs-leave-to-bottom   { from { transform: translateY(0);      } to { transform: translateY(100%);  } }
                .vs-anim {
                  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
                  animation-duration: 520ms;
                  animation-fill-mode: both;
                  will-change: transform;
                }
              `}</style>
              <div
                className="relative flex items-center justify-center overflow-hidden rounded-lg"
                style={{
                  height: 'clamp(380px, 72svh, 720px)',
                  width:  'clamp(285px, 72svh * 0.75, 540px)',
                }}
              >
                {(() => {
                  const n = filteredPhotos.length;
                  const currPhoto = filteredPhotos[currentIndex];
                  const prevPhoto = filteredPhotos[previousIndex];
                  const sameSlide = currentIndex === previousIndex;

                  const renderSlideContent = (p, idx, isCurrent) => (
                    <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-900 border border-gray-700">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="relative z-10 w-full h-full object-cover"
                      />

                      {isCurrent && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                      )}
                      {!isCurrent && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                      )}

                      {isCurrent && (
                        <>
                          <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h2 className="text-xl font-semibold text-white mb-2 truncate">
                                  {p.title}
                                </h2>
                                <div className="flex items-center space-x-4 text-gray-300 text-sm flex-wrap gap-y-1.5">
                                  <div className="flex items-center space-x-1.5">
                                    <User size={14} className="text-gray-400" />
                                    <span>{p.authorName || p.author}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <Tag size={14} className="text-gray-400" />
                                    <span>{p.category}</span>
                                  </div>
                                  {p.createdAt && (
                                    <div className="flex items-center space-x-1.5">
                                      <Calendar size={14} className="text-gray-400" />
                                      <span>{formatDate(p.createdAt)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <div className="px-3 py-1 rounded bg-white/10 backdrop-blur-sm text-white text-xs border border-white/20">
                                  {p.category}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-black/50 backdrop-blur-sm text-gray-300 text-xs font-mono flex items-center space-x-2 z-20">
                            <span>{String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
                          </div>
                        </>
                      )}

                      {!isCurrent && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                          <h3 className="text-base font-medium text-white mb-0.5 truncate">
                            {p.title}
                          </h3>
                          <p className="text-xs text-gray-400 truncate">
                            {p.authorName || p.author}
                          </p>
                        </div>
                      )}
                    </div>
                  );

                  if (sameSlide || n <= 1) {
                    return (
                      <div className="absolute inset-0 z-20 rounded-lg shadow-2xl ring-1 ring-white/10">
                        {renderSlideContent(currPhoto, currentIndex, true)}
                      </div>
                    );
                  }

                  const enterAnim = slideDirection === 'down' ? 'vs-enter-from-bottom' : 'vs-enter-from-top';
                  const leaveAnim = slideDirection === 'down' ? 'vs-leave-to-top'      : 'vs-leave-to-bottom';

                  return (
                    <>
                      <div
                        key={`leave-${previousIndex}-${slideDirection}`}
                        className="absolute inset-0 z-10 vs-anim"
                        style={{ animationName: leaveAnim }}
                      >
                        {renderSlideContent(prevPhoto, previousIndex, false)}
                      </div>
                      <div
                        key={`curr-${currentIndex}-${slideDirection}`}
                        className="absolute inset-0 z-20 vs-anim rounded-lg shadow-2xl ring-1 ring-white/10"
                        style={{ animationName: enterAnim }}
                      >
                        {renderSlideContent(currPhoto, currentIndex, true)}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 上下翻页按钮 */}
              <button
                onClick={handlePrev}
                title="上一张 (↑)"
                className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-md bg-black/50 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center hover:bg-gray-800/70 hover:border-gray-600 transition-all group z-30"
              >
                <ChevronLeft size={22} className="text-gray-400 group-hover:text-white rotate-90" />
              </button>
              <button
                onClick={handleNext}
                title="下一张 (↓)"
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-md bg-black/50 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center hover:bg-gray-800/70 hover:border-gray-600 transition-all group z-30"
              >
                <ChevronRight size={22} className="text-gray-400 group-hover:text-white rotate-90" />
              </button>
            </div>

            {/* 底部控制栏 */}
            <div className="flex-shrink-0 mt-4 flex items-center gap-4">
              <div className="flex items-center space-x-3 flex-shrink-0">
                <button
                  onClick={toggleAutoPlay}
                  title="暂停/播放 (空格)"
                  className={`w-10 h-10 rounded-md flex items-center justify-center transition-all border ${
                    isAutoPlay
                      ? 'bg-white text-gray-900 border-white'
                      : 'bg-gray-900 border-gray-800 text-gray-500 hover:bg-gray-800 hover:border-gray-700'
                  }`}
                >
                  {isAutoPlay ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                <div className="text-xs text-gray-500">
                  {isAutoPlay ? '自动播放中' : '已暂停'}
                </div>
              </div>

              {/* 进度条 */}
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* 缩略图 */}
              <div
                ref={thumbStripRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto scroll-smooth py-1 hide-scrollbar"
              >
                {filteredPhotos.map((photo, idx) => (
                  <button
                    key={photo._id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-16 h-11 rounded overflow-hidden border transition-all duration-300 ${
                      idx === currentIndex
                        ? 'border-white ring-2 ring-white/30 scale-105'
                        : 'border-gray-800 opacity-50 hover:opacity-100 hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? '退出全屏 (F)' : '全屏显示 (F)'}
                className="flex-shrink-0 w-10 h-10 rounded-md bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-gray-800 hover:border-gray-700 transition-all"
              >
                {isFullscreen ? <Minimize2 size={16} className="text-gray-400" /> : <Maximize2 size={16} className="text-gray-400" />}
              </button>
            </div>
          </div>
        )}
        </div>

        {/* 右侧：分类筛选 */}
        <div className="w-40 flex-shrink-0 flex flex-col gap-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-1">
            分类
          </div>
          {categories.map((cat) => {
            const count = cat.id === 'all'
              ? filteredPhotos.length
              : filteredPhotos.filter(p => p.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all border flex items-center justify-between gap-2 ${
                  activeCategory === cat.id
                    ? 'bg-white text-gray-900 border-white font-medium'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-300 hover:bg-gray-900'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className={`text-xs ${activeCategory === cat.id ? 'text-gray-500' : 'text-gray-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 底部 */}
      <footer className="flex-shrink-0 px-8 py-3 border-t border-gray-800 bg-[#0f0f0f]/90 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
          <span>造物课堂 · 学生作品展示</span>
          <span className="text-gray-800">|</span>
          <span>INSPIRE · CREATE · SHARE</span>
        </div>
      </footer>
    </div>
  );
}
