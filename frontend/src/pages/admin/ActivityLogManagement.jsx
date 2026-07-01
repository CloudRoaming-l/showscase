import { useState, useEffect } from 'react';
import { Search, RefreshCw, Filter, Clock, User, FileText, Image, Trash2, CheckCircle, XCircle, AlertCircle, Download, ChevronDown } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { activityLogAPI, isAuthError } from '../../services/api.js';

const actionLabels = {
  create: '创建',
  update: '更新',
  delete: '删除',
  approve: '审核通过',
  reject: '审核拒绝',
  batch_approve: '批量通过',
  batch_delete: '批量删除',
  login: '登录',
  other: '其他'
};

const actionColors = {
  create: 'text-green-400 bg-green-500/10',
  update: 'text-blue-400 bg-blue-500/10',
  delete: 'text-red-400 bg-red-500/10',
  approve: 'text-green-400 bg-green-500/10',
  reject: 'text-red-400 bg-red-500/10',
  batch_approve: 'text-green-400 bg-green-500/10',
  batch_delete: 'text-red-400 bg-red-500/10',
  login: 'text-purple-400 bg-purple-500/10',
  other: 'text-gray-400 bg-gray-500/10'
};

const targetTypeLabels = {
  photo: '作品',
  student: '学生',
  user: '用户',
  system: '系统'
};

export default function ActivityLogManagement() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, byAction: [], byTargetType: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [page, pageSize, actionFilter, targetFilter]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: pageSize };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (targetFilter !== 'all') params.targetType = targetFilter;
      if (searchTerm) params.operator = searchTerm;

      const [logsResult, statsResult] = await Promise.all([
        activityLogAPI.getLogs(params),
        activityLogAPI.getStats()
      ]);

      setLogs(logsResult.data || []);
      setStats(statsResult.data || { total: 0, today: 0, byAction: [], byTargetType: [] });
      setTotalPages(logsResult.pagination?.pages || 1);
      setTotalItems(logsResult.pagination?.total || logsResult.data?.length || 0);
    } catch (error) {
      if (isAuthError(error)) return;
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
    setTimeout(() => loadData(), 300);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (days === 1) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (days < 7) {
      return `${days}天前`;
    }
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const getActionIcon = (action) => {
    const icons = {
      create: FileText,
      update: FileText,
      delete: Trash2,
      approve: CheckCircle,
      reject: XCircle,
      batch_approve: CheckCircle,
      batch_delete: Trash2,
      login: User,
      other: AlertCircle
    };
    return icons[action] || AlertCircle;
  };

  const getTargetIcon = (targetType) => {
    const icons = {
      photo: Image,
      student: User,
      user: User,
      system: AlertCircle
    };
    return icons[targetType] || FileText;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-gray-400 text-sm">总操作次数</div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div className="text-2xl font-bold text-white">{stats.today}</div>
            <div className="text-gray-400 text-sm">今日操作</div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="text-2xl font-bold text-white">{stats.byAction?.length || 0}</div>
            <div className="text-gray-400 text-sm">操作类型</div>
          </div>
          <div className="card p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <div className="text-2xl font-bold text-white">{stats.byTargetType?.length || 0}</div>
            <div className="text-gray-400 text-sm">涉及对象</div>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索操作人..."
              className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gray-800/60 hover:bg-gray-700 border border-gray-700 rounded-lg text-white text-sm transition-colors"
              >
                <Filter size={16} />
                <span>
                  {actionFilter !== 'all' || targetFilter !== 'all'
                    ? '已筛选'
                    : '筛选'}
                </span>
                <ChevronDown size={16} className={showFilterDropdown ? 'rotate-180' : ''} />
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-20 p-3 space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">操作类型</label>
                    <select
                      value={actionFilter}
                      onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                    >
                      <option value="all">全部</option>
                      {Object.entries(actionLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">对象类型</label>
                    <select
                      value={targetFilter}
                      onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm"
                    >
                      <option value="all">全部</option>
                      {Object.entries(targetTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={loadData}
              className="p-2.5 bg-gray-800/60 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* 日志列表 */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50 border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">对象</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">描述</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="h-4 bg-gray-700 rounded w-1/4" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Clock size={40} className="mx-auto text-gray-700 mb-3" />
                      <p className="text-gray-500 text-sm">暂无操作日志</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    const TargetIcon = getTargetIcon(log.targetType);
                    return (
                      <tr key={log.id || log._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-gray-500 text-sm whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium ${actionColors[log.action] || actionColors.other}`}>
                            <ActionIcon size={12} />
                            <span>{actionLabels[log.action] || log.action}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <TargetIcon size={14} className="text-gray-500" />
                            <span className="text-gray-400 text-sm">
                              {targetTypeLabels[log.targetType] || log.targetType}
                            </span>
                            {log.targetName && (
                              <span className="text-gray-300 text-sm truncate max-w-[150px]">
                                《{log.targetName}》
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm max-w-[300px] truncate">
                          {log.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">
                          {log.operator || '系统'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
