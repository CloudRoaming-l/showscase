// 扩展共享数据管理 - 收藏/点赞/分享功能（使用 localStorage）

// 获取收藏作品
export function getFavorites() {
  const saved = localStorage.getItem('student_showcase_favorites');
  return saved ? JSON.parse(saved) : [];
}

// 保存收藏列表
export function saveFavorites(favorites) {
  localStorage.setItem('student_showcase_favorites', JSON.stringify(favorites));
}

// 添加收藏
export function addFavorite(photoId) {
  const favorites = getFavorites();
  if (!favorites.includes(photoId)) {
    favorites.push(photoId);
    saveFavorites(favorites);
  }
  return favorites;
}

// 取消收藏
export function removeFavorite(photoId) {
  const favorites = getFavorites();
  const updated = favorites.filter(id => id !== photoId);
  saveFavorites(updated);
  return updated;
}

// 检查是否已收藏
export function isFavorite(photoId) {
  const favorites = getFavorites();
  return favorites.includes(photoId);
}

// 获取点赞数
export function getLikes() {
  const saved = localStorage.getItem('student_showcase_likes');
  return saved ? JSON.parse(saved) : {};
}

// 保存点赞数
export function saveLikes(likes) {
  localStorage.setItem('student_showcase_likes', JSON.stringify(likes));
}

// 点赞
export function toggleLike(photoId) {
  const likes = getLikes();
  if (likes[photoId]) {
    likes[photoId]++;
  } else {
    likes[photoId] = 1;
  }
  saveLikes(likes);
  return likes[photoId];
}

// 获取作品点赞数
export function getLikeCount(photoId) {
  const likes = getLikes();
  return likes[photoId] || 0;
}

// 获取分享链接
export function getShareUrl(photoId) {
  return `${window.location.origin}/gallery?photo=${photoId}`;
}

// 复制到剪贴板
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_e) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
}
