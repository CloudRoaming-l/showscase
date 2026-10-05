import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Eye, Heart, Play, Share2, Info, Gamepad2, Lightbulb } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('description');
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const iframeRef = useRef(null);

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
      const result = await scratchAPI.shareProject(id);
      setShareCount(result.data.shareCount);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('分享失败:', error);
      }
    }
  };

  const backendOrigin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5001';

  const projectUrl = project?.projectFile
    ? (project.projectFile.startsWith('http')
        ? project.projectFile
        : `${backendOrigin}${project.projectFile}`)
    : '';

  const turbowarpUrl = `${backendOrigin}/turbowarp/embed.html?project_url=${encodeURIComponent(projectUrl)}&autoplay=${isPlaying ? 'true' : 'false'}`;

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-24 mb-6" />
            <div className="aspect-video bg-gray-200 rounded-lg mb-6" />
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">作品不存在</p>
          <button
            onClick={() => navigate('/scratch')}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
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
        <button
          onClick={() => navigate('/scratch')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          <span>返回作品列表</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* 播放器 */}
            <div className="bg-black rounded-lg overflow-hidden mb-6">
              {!isPlaying ? (
                <div className="aspect-[480/360] relative group">
                  {project.coverUrl ? (
                    <img
                      src={project.coverUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Gamepad2 size={64} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all cursor-pointer shadow-lg"
                    >
                      <Play size={28} className="text-gray-900 ml-1" />
                    </button>
                  </div>
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
                </div>
              )}

              <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      hasLiked
                        ? 'bg-gray-700 text-gray-200'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                    }`}
                  >
                    <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
                    <span>{likeCount}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Eye size={16} />
                    <span>{project.viewCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPlaying && (
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                    >
                      <Play size={16} />
                      <span>重新预览</span>
                    </button>
                  )}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                    title="分享"
                  >
                    <Share2 size={16} />
                    <span>{shareCount}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 作品介绍/操作说明 */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'description'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  作品介绍
                </button>
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'instructions'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  操作说明
                </button>
              </div>

              <div className="p-5">
                {activeTab === 'description' ? (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                    {project.description || '这个作品还没有介绍~'}
                  </div>
                ) : (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                    {project.instructions || '还没有添加操作说明~'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="space-y-4">
            {/* 作品信息 */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h1 className="text-xl font-semibold text-gray-900 mb-3">{project.title}</h1>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium">
                  {project.author?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{project.author}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {project.category}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{project.viewCount || 0}</div>
                  <div className="text-xs text-gray-400">浏览量</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{likeCount}</div>
                  <div className="text-xs text-gray-400">点赞数</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{shareCount}</div>
                  <div className="text-xs text-gray-400">分享数</div>
                </div>
              </div>
            </div>

            {/* 相关作品 */}
            {relatedProjects.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-1.5">
                  <Info size={14} className="text-gray-500" />
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
                      <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.coverUrl ? (
                          <img
                            src={p.coverUrl}
                            alt={p.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 size={16} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                          {p.title}
                        </p>
                        <p className="text-xs text-gray-400">{p.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 小贴士 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-1.5">
                <Lightbulb size={14} className="text-gray-500" />
                小贴士
              </h3>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>• 点击绿色旗子开始游戏</li>
                <li>• 点击红色按钮停止运行</li>
                <li>• 需要改编请在 Scratch 官方编辑器中打开 sb3 文件</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
