import { useState } from 'react';
import { Trash2, User } from 'lucide-react';
import { useToast } from '../../components/common/Toast.jsx';
import { commentAPI, hasValidToken } from '../../services/api.js';

// 相对时间格式化
function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function CommentItem({ comment, onDelete }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const isAdmin = hasValidToken();

  const handleDelete = async () => {
    if (!confirm('确定要删除这条评论吗？')) return;
    setDeleting(true);
    try {
      await commentAPI.delete(comment.id);
      toast.success('评论已删除');
      onDelete?.(comment.id);
    } catch (error) {
      toast.error('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-3 py-3 group">
      {/* 头像 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-600/20 flex items-center justify-center">
        <User size={14} className="text-primary-400" />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-white">
            {comment.nickname || '匿名用户'}
          </span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>

      {/* 删除按钮（仅管理员可见） */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 disabled:opacity-30"
          title="删除评论"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
