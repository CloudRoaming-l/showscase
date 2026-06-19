import { useState, useEffect, useMemo } from 'react';
import { Image, Users, Award, BarChart3, AlertCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { photoAPI, studentAPI, isAuthError } from '../../services/api.js';
import { CATEGORIES } from '../../utils/sharedData.js';

export default function Dashboard() {
  const toast = useToast();
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalStudents: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
    totalAuthors: 0
  });
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [photosResult, studentsResult, statsResult] = await Promise.all([
        photoAPI.getPhotos({ limit: 100 }),
        studentAPI.getStudents(),
        photoAPI.getStats()
      ]);

      const photos = photosResult.data || [];
      const students = studentsResult.data || [];
      const serverStats = statsResult?.data || statsResult || {};

      // 本地分类统计作为补充，覆盖可能缺失的后端数据
      const localCategoryCount = {};
      photos.forEach((p) => {
        if (p.category) localCategoryCount[p.category] = (localCategoryCount[p.category] || 0) + 1;
      });

      // 本地状态计数兜底
      const localPending = photos.filter((p) => p.status === 'pending').length;
      const localApproved = photos.filter((p) => p.status === 'approved').length;
      const localRejected = photos.filter((p) => p.status === 'rejected').length;

      setStats({
        totalPhotos: serverStats.totalPhotos ?? photos.length,
        totalStudents: students.length,
        pending: serverStats.pending ?? localPending,
        approved: serverStats.approved ?? localApproved,
        rejected: serverStats.rejected ?? localRejected,
        featured: serverStats.featured ?? photos.filter((p) => p.isFeatured).length,
        totalAuthors: serverStats.totalAuthors ?? new Set(photos.map((p) => p.author).filter(Boolean)).size,
        categories: CATEGORIES.length
      });

      const recent = [...photos]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((p) => ({
          id: p.id || p._id,
          title: p.title,
          author: p.author,
          category: p.category,
          status: p.status,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''
        }));
      setRecentPhotos(recent);

      const colors = [
        'from-purple-500 to-blue-500',
        'from-pink-500 to-red-500',
        'from-yellow-500 to-orange-500',
        'from-cyan-500 to-blue-500',
        'from-violet-500 to-purple-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-yellow-500'
      ];
      const maxCount = Math.max(...CATEGORIES.map((cat) => localCategoryCount[cat] || 0), 1);
      setCategoryData(
        CATEGORIES.map((cat, i) => ({
          name: cat,
          count: localCategoryCount[cat] || 0,
          color: colors[i] || colors[0],
          percentage: Math.round(((localCategoryCount[cat] || 0) / maxCount) * 100)
        }))
      );
    } catch (error) {
      if (isAuthError(error)) return; // 401 由拦截器处理
      console.error('加载数据失败:', error);
      toast.error('加载数据失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = useMemo(() => [
    {
      label: '作品总数',
      value: stats.totalPhotos,
      icon: Image,
      color: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    {
      label: '学生人数',
      value: stats.totalStudents,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20'
    },
    {
      label: '待审核',
      value: stats.pending,
      icon: AlertCircle,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      highlight: stats.pending > 0
    },
    {
      label: '精选作品',
      value: stats.featured,
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    }
  ], [stats]);

  const statusBadge = (status) => {
    if (status === 'pending')
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          待审核
        </span>
      );
    if (status === 'approved')
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          已通过
        </span>
      );
    if (status === 'rejected')
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          已拒绝
        </span>
      );
    return null;
  };

  const totalForStatusBar = Math.max(stats.pending + stats.approved + stats.rejected, 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`card p-5 ${stat.bg} border ${stat.border} ${stat.highlight ? 'ring-2 ring-amber-500/20' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {isLoading ? '--' : stat.value.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* 状态分布条 */}
        {!isLoading && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent-400" />
                  作品状态分布
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  共 {stats.approved + stats.pending + stats.rejected} 个作品
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-gray-400">已通过</span>
                <span className="text-white font-medium">{stats.approved}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <AlertCircle size={14} className="text-amber-400" />
                <span className="text-gray-400">待审核</span>
                <span className="text-white font-medium">{stats.pending}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <XCircle size={14} className="text-red-400" />
                <span className="text-gray-400">已拒绝</span>
                <span className="text-white font-medium">{stats.rejected}</span>
              </div>
            </div>

            <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
              {stats.approved > 0 && (
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${(stats.approved / totalForStatusBar) * 100}%` }}
                />
              )}
              {stats.pending > 0 && (
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${(stats.pending / totalForStatusBar) * 100}%` }}
                />
              )}
              {stats.rejected > 0 && (
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${(stats.rejected / totalForStatusBar) * 100}%` }}
                />
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 最近更新 */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">最近更新</h2>
                <p className="text-gray-500 text-xs mt-0.5">最近 5 条作品记录</p>
              </div>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-gray-700 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-700 rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-gray-700 rounded w-16" />
                  </div>
                ))
              ) : recentPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <Image size={40} className="mx-auto text-gray-700 mb-3" />
                  <p className="text-gray-500 text-sm">暂无作品数据</p>
                  <p className="text-gray-600 text-xs mt-1">在作品管理中添加作品开始使用</p>
                </div>
              ) : (
                recentPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                      <Image size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate">{photo.title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-gray-400 text-xs truncate">{photo.author || '-'}</span>
                        <span className="text-gray-600 text-xs">·</span>
                        <span className="text-gray-500 text-xs">{photo.category}</span>
                        {photo.status && <span className="text-gray-600 text-xs">·</span>}
                        {statusBadge(photo.status)}
                      </div>
                    </div>
                    <span className="text-gray-500 text-xs flex-shrink-0">{photo.createdAt}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 分类统计 */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">分类统计</h2>
                <p className="text-gray-500 text-xs mt-0.5">各分类作品分布</p>
              </div>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-3 bg-gray-700 rounded w-20" />
                      <div className="h-3 bg-gray-700 rounded w-8" />
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full" />
                  </div>
                ))
              ) : (
                categoryData.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-400 text-xs">{cat.name}</span>
                      <span className="text-white text-xs font-medium">{cat.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${cat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
