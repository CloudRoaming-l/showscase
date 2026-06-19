import { useEffect, useState, useCallback } from 'react';
import { X, User, Calendar, Tag, ArrowLeft, ArrowRight, Heart, Share2, Copy, Check } from 'lucide-react';
import { isFavorite, addFavorite, removeFavorite, toggleLike, getLikeCount } from '../../utils/interaction';
import { CATEGORIES } from '../../utils/sharedData.js';

export default function PhotoLightbox({ photo, photos, currentIndex, onClose, onPrev, onNext }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const photoId = photo.id || photo._id;

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
    setZoom(1);
    setIsFavorited(isFavorite(photoId));
    setLikeCount(getLikeCount(photoId));

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, onPrev, onNext, photoId]);

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

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((prev) => {
      const next = prev + (e.deltaY < 0 ? 0.15 : -0.15);
      return Math.max(0.5, Math.min(3, next));
    });
  }, []);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setZoom((prev) => (prev === 1 ? 1.8 : 1));
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const stopPropagation = (e) => e.stopPropagation();

  const handleFavorite = (e) => {
    stopPropagation(e);
    if (isFavorited) {
      removeFavorite(photoId);
      setIsFavorited(false);
    } else {
      addFavorite(photoId);
      setIsFavorited(true);
    }
  };

  const handleLike = (e) => {
    stopPropagation(e);
    const newCount = toggleLike(photoId);
    setLikeCount(newCount);
  };

  const handleShare = (e) => {
    stopPropagation(e);
    const shareUrl = `${window.location.origin}/gallery?photo=${photoId}`;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }).finally(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          stopPropagation(e);
          onClose();
        }}
        className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
        title="关闭 (Esc)"
      >
        <X size={24} />
      </button>

      {onPrev && (
        <button
          onClick={(e) => {
            stopPropagation(e);
            onPrev();
          }}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors hidden md:flex"
          title="上一张 (←)"
        >
          <ArrowLeft size={24} />
        </button>
      )}

      {onNext && (
        <button
          onClick={(e) => {
            stopPropagation(e);
            onNext();
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors hidden md:flex"
          title="下一张 (→)"
        >
          <ArrowRight size={24} />
        </button>
      )}

      <div
        className="w-full max-w-5xl mx-4 max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col md:flex-row animate-[fadeIn_0.2s_ease-out]"
        onClick={stopPropagation}
      >
        <div
          className="flex-1 bg-black relative flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[500px]"
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
        >
          {!imageLoaded && !imageFailed && (
            <div className="absolute inset-0 animate-pulse bg-gray-800/50 flex items-center justify-center text-gray-500 text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                <span>加载中...</span>
              </div>
            </div>
          )}
          {imageFailed ? (
            <div className={`absolute inset-0 bg-gradient-to-br ${categoryColors[photo.category] || 'from-purple-600 to-blue-600'} flex flex-col items-center justify-center text-white p-8 text-center`}>
              <div className="w-16 h-16 rounded-full bg-white/15 border border-white/30 flex items-center justify-center mb-3">
                <X size={28} />
              </div>
              <span className="font-medium text-base">{photo.title || '图片加载失败'}</span>
              <span className="text-xs mt-2 opacity-75 max-w-xs break-all">{photo.imageUrl}</span>
              <button
                onClick={(e) => {
                  stopPropagation(e);
                  setImageFailed(false);
                  setImageLoaded(false);
                  // 重新触发加载
                  const img = new Image();
                  img.src = photo.imageUrl;
                  img.onload = () => setImageLoaded(true);
                  img.onerror = () => setImageFailed(true);
                }}
                className="mt-4 px-4 py-1.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-full text-xs transition-colors"
              >
                重试加载
              </button>
            </div>
          ) : (
            <img
              src={photo.imageUrl}
              alt={photo.title}
              referrerPolicy="no-referrer"
              className={`max-w-full max-h-[60vh] md:max-h-[80vh] object-contain transition-all duration-200 cursor-zoom-in select-none ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              onClick={() => setZoom(zoom === 1 ? 1.8 : 1)}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageFailed(true);
                setImageLoaded(true);
              }}
            />
          )}
          {photos && (
            <div className="absolute bottom-4 right-4 text-white/70 text-sm bg-black/40 px-3 py-1 rounded-full">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>

        <div className="w-full md:w-80 bg-gray-900 p-6 md:p-6 flex flex-col overflow-y-auto max-h-[40vh] md:max-h-none">
          <div
            className={`inline-block self-start px-3 py-1 rounded-full text-xs font-medium text-white mb-3 bg-gradient-to-r ${categoryColors[photo.category] || 'from-gray-500 to-gray-600'}`}
          >
            {photo.category}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{photo.title}</h2>

          <div className="space-y-3 mb-6 text-sm">
            <div className="flex items-center space-x-3 text-gray-400">
              <User size={16} className="text-primary-400" />
              <span className="text-white">{photo.authorName || photo.author}</span>
              {photo.grade && (
                <span className="text-gray-500">· {photo.grade}</span>
              )}
            </div>
            {photo.createdAt && (
              <div className="flex items-center space-x-3 text-gray-400">
                <Calendar size={16} className="text-primary-400" />
                <span>{formatDate(photo.createdAt)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 mb-6">
            <button
              onClick={handleLike}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              <Heart size={18} className="text-red-400" />
              <span className="text-sm">{photo.likeCount || likeCount}</span>
            </button>
            <button
              onClick={handleFavorite}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                isFavorited
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
            >
              <Heart size={18} className={isFavorited ? 'fill-current' : ''} />
              <span className="text-sm">{isFavorited ? '已收藏' : '收藏'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
              <span className="text-sm">{copied ? '已复制' : '分享'}</span>
            </button>
          </div>

          <div className="border-t border-gray-700 pt-4 mb-6 flex-1">
            <h3 className="text-sm font-semibold text-white mb-2">作品描述</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {photo.description || '暂无描述'}
            </p>
          </div>

          {photo.tags && photo.tags.length > 0 && (
            <div className="border-t border-gray-700 pt-4 mb-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                <Tag size={14} className="text-primary-400" />
                <span>标签</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {photo.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs text-white bg-gray-800 rounded-full px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              点击图片可缩放 · 按 ESC 关闭
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
