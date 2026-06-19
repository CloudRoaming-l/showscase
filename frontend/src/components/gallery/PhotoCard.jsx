import { useState, useEffect, useRef } from 'react';
import { Eye, User, Calendar, Heart, Share2, Copy, Check } from 'lucide-react';
import { isFavorite, addFavorite, removeFavorite, toggleLike, getLikeCount, getShareUrl } from '../../utils/interaction';
import { CATEGORIES } from '../../utils/sharedData.js';

export default function PhotoCard({ photo, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageInView, setImageInView] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef(null);

  // Intersection Observer 懒加载
  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIsFavorited(isFavorite(photo.id || photo._id));
    setLikeCount(getLikeCount(photo.id || photo._id));
  }, [photo.id, photo._id]);

  const categoryColorList = [
    'from-purple-500 to-blue-500',
    'from-pink-500 to-red-500',
    'from-yellow-500 to-orange-500',
    'from-cyan-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-yellow-500'
  ];
  const categoryColors = CATEGORIES.reduce((acc, cat, i) => {
    acc[cat] = categoryColorList[i] || categoryColorList[0];
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    const id = photo.id || photo._id;
    if (isFavorited) {
      removeFavorite(id);
      setIsFavorited(false);
    } else {
      addFavorite(id);
      setIsFavorited(true);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    const id = photo.id || photo._id;
    const newCount = toggleLike(id);
    setLikeCount(newCount);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const id = photo.id || photo._id;
    const shareUrl = getShareUrl(id);
    try {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      ref={imgRef}
      className="card overflow-hidden rounded-xl bg-gray-800/90 border border-gray-700/50 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative h-52 overflow-hidden">
        {(!imageLoaded || !imageInView) && !imageFailed && (
          <div className="absolute inset-0 bg-gray-700/50 animate-pulse flex items-center justify-center text-gray-500 text-xs">
            加载中...
          </div>
        )}
        {imageFailed ? (
          <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[photo.category] || 'from-purple-600 to-blue-600'} opacity-90 flex flex-col items-center justify-center text-white p-4 text-center`}>
            <div className="w-14 h-14 rounded-full bg-white/15 border border-white/30 flex items-center justify-center mb-2 backdrop-blur-sm">
              <Eye size={24} />
            </div>
            <span className="text-sm font-medium opacity-95">{photo.title || '图片加载失败'}</span>
            <span className="text-xs mt-1 opacity-70">{photo.author || '图片链接不可访问'}</span>
          </div>
        ) : (
          imageInView && (
            <img
              src={photo.imageUrl}
              alt={photo.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageFailed(true);
                setImageLoaded(true);
              }}
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${categoryColors[photo.category] || 'from-gray-500 to-gray-600'}`}>
          {photo.category}
        </div>

        <div className={`absolute bottom-3 left-3 right-3 flex items-center justify-between transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-red-500/30 hover:border-red-500/50 transition-all"
            >
              <Heart size={14} className="text-red-400" />
              <span className="text-xs">{photo.likeCount || likeCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-cyan-500/30 hover:border-cyan-500/50 transition-all"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
              <span className="text-xs">{copied ? '已复制' : '分享'}</span>
            </button>
          </div>
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full border transition-all ${
              isFavorited
                ? 'bg-red-500/30 border-red-500/50 text-red-400'
                : 'bg-white/10 border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/30'
            }`}
          >
            <Heart size={16} className={isFavorited ? 'fill-current' : ''} />
          </button>
        </div>

        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
            <Eye size={20} className="text-white" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors line-clamp-1">
          {photo.title}
        </h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {photo.description}
        </p>
        <div className="flex items-center justify-between text-sm border-t border-gray-700/50 pt-3">
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <User size={12} className="text-white" />
            </div>
            <a
              href={`/author?name=${encodeURIComponent(photo.authorName || photo.author)}`}
              className="truncate max-w-[90px] hover:text-purple-400 transition-colors cursor-pointer"
            >
              {photo.authorName || photo.author}
            </a>
          </div>
          {photo.createdAt && (
            <div className="flex items-center space-x-1 text-gray-500">
              <Calendar size={12} />
              <span className="text-xs">{formatDate(photo.createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
