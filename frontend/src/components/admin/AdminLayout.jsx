import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Image,
  Play,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Clock,
  ExternalLink,
  Home,
  LayoutDashboard as DashboardIcon,
  UserCog
} from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useToast } from '../common/Toast.jsx';
import { authAPI, isAuthError } from '../../services/api.js';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const result = await authAPI.getCurrentUser();
      if (result.status === 'success') {
        setCurrentUser(result.data);
      }
    } catch (error) {
      if (!isAuthError(error)) {
        console.error('获取用户信息失败:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { name: '仪表盘', path: '/admin', icon: LayoutDashboard },
    { name: '作品管理', path: '/admin/photos', icon: Image },
    { name: 'Scratch作品', path: '/admin/scratch', icon: Play },
    { name: '学生管理', path: '/admin/students', icon: Users },
    ...(isAdmin ? [{ name: '账号管理', path: '/admin/users', icon: UserCog }] : []),
    ...(isAdmin ? [{ name: '操作日志', path: '/admin/activity-logs', icon: Clock }] : []),
    { name: '系统设置', path: '/admin/settings', icon: Settings }
  ];

  const currentItem = navItems.find((item) => location.pathname.startsWith(item.path)) || navItems[0];

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">加载中...</div>;
  }

  if (!isAdmin && location.pathname.startsWith('/admin/users')) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('登出接口调用失败:', error);
    } finally {
      localStorage.removeItem('admin_token');
      toast.success('已安全退出登录');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <aside
        className={`fixed left-0 top-0 h-full bg-gray-800 border-r border-gray-700 transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold text-white">管理后台</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 shadow-sm shadow-primary-500/10 border border-primary-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20 ${
              sidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">退出登录</span>}
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <header className="h-16 bg-gray-800/50 border-b border-gray-700 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-white">{currentItem.name}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* 返回主站按钮 */}
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                target="_blank"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300 hover:text-white hover:border-primary-500 transition-all text-sm"
                title="返回首页"
              >
                <Home size={16} />
                <span className="hidden md:inline">首页</span>
              </Link>
              <Link
                to="/showcase"
                target="_blank"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300 hover:text-white hover:border-accent-500 transition-all text-sm"
                title="大屏展示"
              >
                <DashboardIcon size={16} />
                <span className="hidden md:inline">大屏展示</span>
              </Link>
              <Link
                to="/gallery"
                target="_blank"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300 hover:text-white hover:border-green-500 transition-all text-sm"
                title="作品列表"
              >
                <ExternalLink size={16} />
                <span className="hidden md:inline">作品列表</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-sm shadow-primary-500/20">
                <Users size={16} className="text-white" />
              </div>
              <span className="text-gray-400 text-sm hidden md:block">
                {currentUser?.name || currentUser?.username || '管理员'}
              </span>
              {isAdmin && (
                <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                  管理员
                </span>
              )}
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
