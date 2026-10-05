import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hardwareAPI, stageAPI, toolCategoryAPI } from '../../services/api.js';
import { useToast } from '../common/Toast.jsx';
import {
  BookOpen,
  Wrench,
  Library,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Lock,
  Home,
  Grid3x3
} from 'lucide-react';

export default function HardwareLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stages, setStages] = useState([]);
  const [toolCategories, setToolCategories] = useState([]);
  const [stageExpanded, setStageExpanded] = useState(true);
  const [toolExpanded, setToolExpanded] = useState(true);
  const [resourceExpanded, setResourceExpanded] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stagesRes, categoriesRes] = await Promise.all([
        stageAPI.getList(),
        toolCategoryAPI.getList()
      ]);
      if (stagesRes.status === 'success') {
        setStages(stagesRes.data);
      }
      if (categoriesRes.status === 'success') {
        setToolCategories(categoriesRes.data);
      }
    } catch (error) {
      // 如果是 403，说明密码验证失败，会被 PasswordGate 拦截
      if (error.response?.status !== 403) {
        console.error('加载导航数据失败:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/hardware/lessons?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  const handleLogout = () => {
    hardwareAPI.logout();
    toast.success('已退出');
    navigate('/hardware');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧导航 */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* 顶部 Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-gray-800 flex items-center justify-center">
                <Wrench size={14} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 leading-tight">造物课堂</div>
                <div className="text-xs text-gray-400 leading-tight">硬件教学库</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* 搜索框 */}
        {sidebarOpen && (
          <div className="p-3 border-b border-gray-100">
            <form onSubmit={handleSearch} className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索课件、器材..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-gray-50"
              />
            </form>
          </div>
        )}

        {/* 导航菜单 */}
        <nav className="p-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* 首页 */}
          <Link
            to="/hardware"
            end
            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === '/hardware'
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Home size={16} className="flex-shrink-0" />
            {sidebarOpen && <span>总览</span>}
          </Link>

          {/* 课程体系 */}
          <div>
            <button
              onClick={() => setStageExpanded(!stageExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <BookOpen size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">课程体系</span>}
              </div>
              {sidebarOpen && (
                stageExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
            </button>
            {stageExpanded && sidebarOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {stages.map((stage) => (
                  <Link
                    key={stage._id}
                    to={`/hardware/lessons?stageId=${stage._id}`}
                    className={`block px-3 py-1.5 rounded text-sm transition-colors ${
                      location.pathname.startsWith('/hardware/lessons') &&
                      location.search.includes(stage._id)
                        ? 'text-gray-900 bg-gray-100 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {stage.shortName || stage.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 器材档案库 */}
          <div>
            <button
              onClick={() => setToolExpanded(!toolExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Wrench size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">器材档案库</span>}
              </div>
              {sidebarOpen && (
                toolExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
            </button>
            {toolExpanded && sidebarOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                <Link
                  to="/hardware/tools"
                  end
                  className={`block px-3 py-1.5 rounded text-sm transition-colors ${
                    location.pathname === '/hardware/tools' && !location.search
                      ? 'text-gray-900 bg-gray-100 font-medium'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  全部器材
                </Link>
                {toolCategories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/hardware/tools?categoryId=${cat._id}`}
                    className={`block px-3 py-1.5 rounded text-sm transition-colors ${
                      location.search.includes(cat._id)
                        ? 'text-gray-900 bg-gray-100 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 资源库 */}
          <div>
            <button
              onClick={() => setResourceExpanded(!resourceExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Library size={16} className="flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">资源库</span>}
              </div>
              {sidebarOpen && (
                resourceExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
            </button>
            {resourceExpanded && sidebarOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                <div className="px-3 py-1.5 text-xs text-gray-400">代码片段（建设中）</div>
                <div className="px-3 py-1.5 text-xs text-gray-400">接线图库（建设中）</div>
                <div className="px-3 py-1.5 text-xs text-gray-400">赛事考级（建设中）</div>
                <div className="px-3 py-1.5 text-xs text-gray-400">网站导航（建设中）</div>
              </div>
            )}
          </div>

          {/* 教学工具 */}
          {sidebarOpen && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                教学工具
              </div>
              <div className="px-3 py-1.5 text-sm text-gray-400">
                器材采购清单（建设中）
              </div>
            </div>
          )}
        </nav>

        {/* 底部：返回作品展示 + 退出密码 */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-200 bg-white">
          <Link
            to="/scratch"
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Grid3x3 size={16} className="flex-shrink-0" />
            {sidebarOpen && <span>作品展示</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors mt-1"
          >
            <Lock size={16} className="flex-shrink-0" />
            {sidebarOpen && <span>退出访问</span>}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
