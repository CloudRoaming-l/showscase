import { useEffect, useState, useMemo } from 'react';
import { Sparkles, Trophy, Users, Image as ImageIcon, ArrowRight, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import PhotoCard from '../components/gallery/PhotoCard.jsx';
import PhotoLightbox from '../components/gallery/PhotoLightbox.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { photoAPI, studentAPI } from '../services/api.js';
import { CATEGORIES } from '../utils/sharedData.js';

export default function Home() {
  const toast = useToast();
  const [photos, setPhotos] = useState([]);
  const [students, setStudents] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [animatedStats, setAnimatedStats] = useState({
    students: 0,
    works: 0,
    awards: 0,
    categories: 0
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let animationTimer = null;

    async function fetchData() {
      try {
        setIsLoading(true);
        const [photosResult, featuredResult, studentsResult, statsResult] = await Promise.all([
          photoAPI.getPhotos({ limit: 100 }),
          photoAPI.getFeatured(),
          studentAPI.getStudents(),
          photoAPI.getStats()
        ]);

        if (!isMounted) return;

        const featuredPhotos = (featuredResult.data || []).slice(0, 4);
        const displayPhotos = featuredPhotos.length > 0
          ? featuredPhotos
          : (photosResult.data || []).slice(0, 4);

        setPhotos(displayPhotos);
        setStudents(studentsResult.data || []);

        // 计算所有作品的分类数量
        const allPhotos = photosResult.data || [];
        const counts = {};
        allPhotos.forEach((p) => {
          if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
        });
        setCategoryCounts(counts);

        const finalStudents = studentsResult.data?.length || 0;
        const finalWorks = statsResult.data?.totalPhotos || (photosResult.data?.length || 0);
        const finalCategories = statsResult.data?.totalCategories || 7;
        const duration = 1500;
        const steps = 30;
        const stepDuration = duration / steps;
        let step = 0;

        animationTimer = setInterval(() => {
          if (!isMounted) {
            clearInterval(animationTimer);
            return;
          }
          step++;
          const progress = step / steps;
          setAnimatedStats({
            students: Math.floor(finalStudents * progress),
            works: Math.floor(finalWorks * progress),
            awards: Math.floor(displayPhotos.length * progress),
            categories: Math.floor(finalCategories * progress)
          });
          if (step >= steps && animationTimer) {
            clearInterval(animationTimer);
          }
        }, stepDuration);
      } catch (error) {
        console.error('获取数据失败:', error);
        if (isMounted) {
          toast.error('加载数据失败，请刷新页面重试');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      if (animationTimer) {
        clearInterval(animationTimer);
      }
    };
  }, [toast]);

  const classes = useMemo(() => {
    const classSet = new Set();
    students.forEach(s => {
      if (s.className) classSet.add(s.className);
    });
    return ['all', ...Array.from(classSet).sort()];
  }, [students]);

  const classLabels = useMemo(() => {
    const labels = { all: '全部班级' };
    classes.forEach(c => { labels[c] = c; });
    return labels;
  }, [classes]);

  const filteredPhotos = useMemo(() => {
    if (selectedClass === 'all') return photos;
    const classStudents = students.filter(s => s.className === selectedClass);
    const studentNames = classStudents.map(s => s.name);
    return photos.filter(p => studentNames.includes(p.author));
  }, [photos, students, selectedClass]);

  const topStats = [
    { label: '学生人数', value: animatedStats.students, suffix: '+', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: '作品数量', value: animatedStats.works, suffix: '', icon: ImageIcon, color: 'from-purple-500 to-pink-500' },
    { label: '精选作品', value: animatedStats.awards, suffix: '', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
    { label: '作品分类', value: animatedStats.categories, suffix: '', icon: Sparkles, color: 'from-green-500 to-emerald-500' }
  ];

  const categoryColors = [
    'from-purple-500 to-blue-500',
    'from-pink-500 to-red-500',
    'from-yellow-500 to-orange-500',
    'from-cyan-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-yellow-500'
  ];
  const categories = CATEGORIES.map((cat, i) => ({
    name: cat,
    color: categoryColors[i] || categoryColors[0],
    count: categoryCounts[cat] || 0
  }));

  return (
    <div className="w-full">
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-accent-900/20 to-purple-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 py-20 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-gray-700/50 rounded-full px-4 py-2 mb-8">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="text-sm text-gray-300">孩子们的创意作品集</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            让每个孩子的
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-pink-400 to-accent-400 bg-clip-text text-transparent">
              创意被世界看见
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            收集{animatedStats.students}+学生的编程作品，展现他们的创造力与思维能力
            <br className="hidden md:block" />
            从机器人到AI，每个作品都是一段成长的故事
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/gallery"
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
            >
              <span>浏览全部作品</span>
              <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {topStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="card p-6 hover:scale-105 transition-transform duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {stat.value}
                    <span className="text-primary-400">{stat.suffix}</span>
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">作品分类</h2>
            <p className="text-gray-400">探索不同领域的学生创意</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/gallery?category=${encodeURIComponent(category.name)}`}
                className="card p-6 hover:scale-105 hover:border-primary-500/30 transition-all duration-300 cursor-pointer group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <ImageIcon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-white">{category.name}</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                    {category.count}
                  </span>
                  <span className="text-gray-500 text-sm">个作品</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp size={20} className="text-yellow-400" />
                <span className="text-sm text-yellow-400 font-medium">精选推荐</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">优秀作品展示</h2>
              <p className="text-gray-400 mt-2">最受关注的学生编程作品</p>
            </div>

            <div className="flex items-center gap-3 mt-6 md:mt-0">
              {classes.length > 1 && (
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <Filter size={16} />
                    <span>{classLabels[selectedClass] || selectedClass}</span>
                    <ChevronDown size={16} className={showClassDropdown ? 'rotate-180' : ''} />
                  </button>

                  {showClassDropdown && (
                    <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10">
                      {classes.map((cls) => (
                        <button
                          key={cls}
                          onClick={() => {
                            setSelectedClass(cls);
                            setShowClassDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                            selectedClass === cls ? 'text-primary-400 bg-gray-700/50' : 'text-gray-300'
                          }`}
                        >
                          {classLabels[cls] || cls}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Link
                to="/gallery"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <span>查看全部</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPhotos.length > 0 ? (
              filteredPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id || photo._id}
                  photo={photo}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">暂无作品，快去提交吧！</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedPhoto && (
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
