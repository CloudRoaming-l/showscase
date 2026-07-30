import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { useToast } from '../common/Toast.jsx';
import { commentAPI } from '../../services/api.js';
import CommentItem from './CommentItem.jsx';

export default function CommentSection({ targetType, targetId }) {
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadComments = useCallback(async (pageNum = 1) => {
    try {
      const result = await commentAPI.getList({
        targetType,
        targetId,
        page: pageNum,
        limit: 10
      });
      if (pageNum === 1) {
        setComments(result.data);
      } else {
        setComments(prev => [...prev, ...result.data]);
      }
      setTotal(result.pagination.total);
      setHasMore(result.pagination.page < result.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      // 静默失败，不弹错误提示
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    setLoading(true);
    loadComments(1);
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('请输入评论内容');
      return;
    }
    setSubmitting(true);
    try {
      const result = await commentAPI.create({
        targetType,
        targetId,
        nickname: nickname.trim() || '匿名用户',
        content: content.trim()
      });
      setComments(prev => [result.data, ...prev]);
      setTotal(prev => prev + 1);
      setContent('');
      toast.success('评论发布成功');
    } catch (error) {
      const msg = error.response?.data?.message || '发布失败，请稍后再试';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (deletedId) => {
    setComments(prev => prev.filter(c => c.id !== deletedId));
    setTotal(prev => Math.max(0, prev - 1));
  };

  const handleLoadMore = () => {
    loadComments(page + 1);
  };

  return (
    <div className="mt-6">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={18} className="text-primary-400" />
        <h3 className="text-base font-semibold text-white">
          评论 {total > 0 && <span className="text-gray-400 text-sm">({total})</span>}
        </h3>
      </div>

      {/* 评论输入框 */}
      <form onSubmit={handleSubmit} className="mb-5 space-y-3">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称（可选，默认匿名用户）"
          maxLength={20}
          className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 placeholder-gray-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          rows={3}
          maxLength={500}
          className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 placeholder-gray-500 resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{content.length}/500</span>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-sm shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>{submitting ? '发送中...' : '发布评论'}</span>
          </button>
        </div>
      </form>

      {/* 评论列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
          <Loader2 size={16} className="animate-spin mr-2" />
          加载中...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          还没有评论，快来抢沙发吧～
        </div>
      ) : (
        <div className="divide-y divide-gray-800/50">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={handleDelete}
            />
          ))}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={handleLoadMore}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                加载更多评论
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
