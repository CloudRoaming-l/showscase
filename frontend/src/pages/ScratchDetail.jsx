import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Eye, Heart, Play, Share2, Maximize2, Info, Gamepad2, ChevronLeft, ChevronRight, Download, Sparkles } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { scratchAPI } from '../services/api.js';
import { useToast } from '../components/common/Toast.jsx';

export default function ScratchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const iframeRef = useRef(null);
  const playerContainerRef = useRef(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const result = await scratchAPI.getProject(id);
      setProject(result.data);
      setLikeCount(result.data?.likeCount || 0);
      setShareCount(result.data?.shareCount || 0);

      const likedIds = JSON.parse(localStorage.getItem('scratch_liked') || '[]');
      setHasLiked(likedIds.includes(id));

      fetchRelated(result.data);
    } catch (error) {
      console.error('获取作品详情失败:', error);
      toast.error('加载作品失败，请刷新重试');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelated = async (current) => {
    try {
      const result = await scratchAPI.getProjects({ limit: 6, category: current.category });
      const related = (result.data || []).filter(p => p.id !== id);
      setRelatedProjects(related.slice(0, 4));
    } catch (err) {
      console.error('获取相关作品失败:', err);
    }
  };

  const handleLike = async () => {
    if (hasLiked) {
      toast.info('你已经点赞过啦');
      return;
    }
    try {
      const result = await scratchAPI.likeProject(id);
      setLikeCount(result.data.likeCount);
      setHasLiked(true);
      const likedIds = JSON.parse(localStorage.getItem('scratch_liked') || '[]');
      likedIds.push(id);
      localStorage.setItem('scratch_liked', JSON.stringify(likedIds));
      toast.success('点赞成功！');
    } catch (error) {
      if (error.response?.status === 429) {
        toast.info(error.response?.data?.message || '你已经点赞过这个作品了，24小时后再来吧~');
      } else {
        toast.error('点赞失败，请稍后重试');
      }
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.title,
          text: `看看这个 Scratch 作品：${project.title}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('链接已复制到剪贴板');
      }
      // 分享成功后上报
      const result = await scratchAPI.shareProject(id);
      setShareCount(result.data.shareCount);
    } catch (error) {
      // 用户取消分享或复制时不报错
      if (error.name !== 'AbortError') {
        console.error('分享失败:', error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 后端地址：用于 iframe 同源加载项目文件
  // 通过后端代理 Turbowarp（/turbowarp/*），让 iframe 和项目 URL 都走同一个 HTTP origin，
  // 避免 iframe (https) -> 本地 http 资源的 mixed content 阻止，以及跨域 fetch 失败
  const backendOrigin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5001';

  const projectUrl = project?.projectFile
    ? (project.projectFile.startsWith('http')
        ? project.projectFile
        : `${backendOrigin}${project.projectFile}`)
    : '';

  // iframe 加载后端代理的 Turbowarp embed.html（同源 HTTP）
  // Turbowarp 通过 URLSearchParams(location.search) 解析 project_url，
  // 所以必须用 ? 传参（不是 # hash）
  const turbowarpEmbedUrl = `${backendOrigin}/turbowarp/embed.html`;
  const turbowarpUrl = `${turbowarpEmbedUrl}?project_url=${encodeURIComponent(projectUrl)}&autoplay=${isPlaying ? 'true' : 'false'}`;

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700/50 rounded w-24 mb-6" />
            <div className="aspect-video bg-gray-800 rounded-xl mb-6" />
            <div className="h-8 bg-gray-700/50 rounded w-1/3 mb-4" />
            <div className="h-5 bg-gray-700/50 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">作品不存在</p>
          <button
            onClick={() => navigate('/scratch')}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            返回作品列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/scratch')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>返回作品列表</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：播放器 */}
          <div className="lg:col-span-2">
            {/* 播放器区域 */}
            <div
              ref={playerContainerRef}
              className="relative bg-black rounded-xl overflow-hidden shadow-2xl mb-6"
            >
              {!isPlaying ? (
                <div className="aspect-[480/360] relative group">
                  {project.coverUrl ? (
                    <img
                      src={project.coverUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400/30 to-pink-500/30 flex items-center justify-center">
                      <Gamepad2 size={80} className="text-white/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all cursor-pointer"
                    >
                      <Play size={36} className="text-white ml-1" />
                    </button>
                  </div>
                  {project.isFeatured && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-medium rounded-full flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>精选作品</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[480/360] relative bg-[#0f172a]">
                  <iframe
                    ref={iframeRef}
                    src={turbowarpUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title={project.title}
                  />
                  <button
                    onClick={toggleFullscreen}
                    className="absolute top-0 right-0 w-24 h-10 bg-[#1a1e2d] hover:bg-[#252a3d] flex items-center justify-center transition-colors z-10"
                    title="全屏"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g fill="#8892a8">
                        <g transform="translate(3 3)">
                          <path d="M13.338093,4.35035264 L12.4488644,3.45883199 L9.31483512,5.83342741 C8.95713791,6.10825708 8.4389784,6.03619808 8.1648553,5.66752413 C7.94254816,5.37090918 7.94756261,4.96201625 8.1648553,4.6821592 L10.5333457,1.54005165 L9.66584641,0.668640487 C9.41679554,0.418947674 9.59397267,0.00502737208 9.93495506,0.00502737208 L13.6122161,0 C13.8244944,0.00502737208 14,0.180985395 14,0.388783441 L14,4.08055034 C14,4.42241164 13.5821294,4.59501808 13.338093,4.35035264"/>
                          <path d="M0.661906989,9.64928834 L1.55113557,10.5408826 L4.68516488,8.16609118 C5.04286209,7.89123882 5.5610216,7.9649797 5.8351447,8.33200815 C6.05745184,8.62864758 6.05243739,9.03757425 5.8351447,9.3174544 L3.4649828,12.4598213 L4.33415359,13.3313043 C4.58320446,13.5810178 4.40602733,13.9949722 4.06504494,13.9949722 L0.387783893,14 C0.175505641,13.9949722 0,13.8189997 0,13.6111845 L0,9.9191129 C0,9.57722339 0.417870574,9.4046027 0.661906989,9.64928834"/>
                          <path d="M0.661906989,4.35035264 L1.55113557,3.45883199 L4.68516488,5.83342741 C5.04286209,6.10825708 5.5610216,6.03619808 5.8351447,5.66752413 C6.05745184,5.37090918 6.05243739,4.96201625 5.8351447,4.6821592 L3.4649828,1.54005165 L4.33415359,0.668640487 C4.58320446,0.418947674 4.40602733,0.00502737208 4.06504494,0.00502737208 L0.387783893,0 C0.175505641,0.00502737208 0,0.180985395 0,0.388783441 L0,4.08055034 C0,4.42241164 0.417870574,4.59501808 0.661906989,4.35035264"/>
                          <path d="M13.338093,9.64928834 L12.4488644,10.5408826 L9.31483512,8.16609118 C8.95713791,7.89123882 8.4389784,7.9649797 8.1648553,8.33200815 C7.94254816,8.62864758 7.94756261,9.03757425 8.1648553,9.3174544 L10.5333457,12.4598213 L9.66584641,13.3313043 C9.41679554,13.5810178 9.59397267,13.9949722 9.93495506,13.9949722 L13.6122161,14 C13.8244944,13.9949722 14,13.8189997 14,13.6111845 L14,9.9191129 C14,9.57722339 13.5821294,9.4046027 13.338093,9.64928834"/>
                        </g>
                      </g>
                    </svg>
                  </button>
                </div>
              )}

              {/* 控制栏 */}
              <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      hasLiked
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                    <span className="text-sm">{likeCount}</span>
                  </button>

                  <div className="flex items-center gap-2 text-gray-400">
                    <Eye size={18} />
                    <span className="text-sm">{project.viewCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                    title="分享"
                  >
                    <Share2 size={18} />
                    <span className="text-sm">{shareCount}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 作品信息标签页 */}
            <div className="card">
              <div className="flex border-b border-gray-700/50">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'description'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  作品介绍
                </button>
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'instructions'
                      ? 'text-primary-400 border-b-2 border-primary-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  操作说明
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'description' ? (
                  <div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {project.description || '这个作品还没有介绍~'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {project.instructions || '还没有添加操作说明~'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：作品信息 */}
          <div className="space-y-6">
            {/* 作品基本信息 */}
            <div className="card p-6">
              <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                  {project.author?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-white">{project.author}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-full">
                  {project.category}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{project.viewCount || 0}</div>
                  <div className="text-sm text-gray-400">浏览量</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{likeCount}</div>
                  <div className="text-sm text-gray-400">点赞数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{shareCount}</div>
                  <div className="text-sm text-gray-400">分享数</div>
                </div>
              </div>
            </div>

            {/* 相关作品 */}
            {relatedProjects.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Info size={18} className="text-primary-400" />
                  相关作品
                </h3>
                <div className="space-y-3">
                  {relatedProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        navigate(`/scratch/${p.id}`);
                        window.scrollTo(0, 0);
                      }}
                      className="flex gap-3 cursor-pointer group"
                    >
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        {p.coverUrl ? (
                          <img
                            src={p.coverUrl}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 size={20} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                          {p.title}
                        </p>
                        <p className="text-xs text-gray-500">{p.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作提示 */}
            <div className="card p-6 border-primary-500/20 border">
              <h3 className="font-semibold mb-3 text-primary-400">💡 小贴士</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• 点击绿色旗子开始游戏</li>
                <li>• 点击红色按钮停止运行</li>
                <li>• 全屏按钮获得更好体验</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
