import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/Home.jsx';
import Gallery from './pages/Gallery.jsx';
import DashboardShowcase from './pages/DashboardShowcase.jsx';
import ScratchGallery from './pages/ScratchGallery.jsx';
import ScratchDetail from './pages/ScratchDetail.jsx';
import Author from './pages/Author.jsx';
import Login from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import PhotoManagement from './pages/admin/PhotoManagement.jsx';
import ScratchManagement from './pages/admin/ScratchManagement.jsx';
import StudentManagement from './pages/admin/StudentManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import ActivityLogManagement from './pages/admin/ActivityLogManagement.jsx';
import Settings from './pages/admin/Settings.jsx';
import LessonManagement from './pages/admin/LessonManagement.jsx';
import StageManagement from './pages/admin/StageManagement.jsx';
import ToolCategoryManagement from './pages/admin/ToolCategoryManagement.jsx';
import ToolManagement from './pages/admin/ToolManagement.jsx';
import { hasValidToken, clearAuth, hardwareAPI } from './services/api.js';
// 硬件知识库
import HardwareLayout from './components/hardware/HardwareLayout.jsx';
import PasswordGate from './components/hardware/PasswordGate.jsx';
import HardwareHome from './pages/hardware/HardwareHome.jsx';
import LessonList from './pages/hardware/LessonList.jsx';
import LessonDetail from './pages/hardware/LessonDetail.jsx';
import ToolLibrary from './pages/hardware/ToolLibrary.jsx';
import ToolDetail from './pages/hardware/ToolDetail.jsx';

// 受保护路由：需要有效 JWT token 才能访问
const ProtectedRoute = ({ children }) => {
  if (!hasValidToken()) {
    // 如果有残留的无效 token，清理掉
    clearAuth();
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// 访客路由：已登录状态下不应该再访问登录页（例如直接地址栏输入 /admin/login）
const GuestRoute = ({ children }) => {
  if (hasValidToken()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// 硬件知识库密码保护路由
const HardwareProtected = ({ children }) => {
  if (!hardwareAPI.hasAccess()) {
    return <PasswordGate />;
  }
  return children;
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
          {/* 大屏展示页：独立全屏布局，不使用公共 Header/Footer/ParticleBackground */}
          <Route path="/showcase" element={<DashboardShowcase />} />

          {/* 硬件知识库：独立布局，密码保护 */}
          <Route
            path="/hardware/*"
            element={
              <HardwareProtected>
                <HardwareLayout>
                  <Routes>
                    <Route index element={<HardwareHome />} />
                    <Route path="lessons" element={<LessonList />} />
                    <Route path="lessons/:id" element={<LessonDetail />} />
                    <Route path="tools" element={<ToolLibrary />} />
                    <Route path="tools/:id" element={<ToolDetail />} />
                  </Routes>
                </HardwareLayout>
              </HardwareProtected>
            }
          />

          {/* 公开前台路由 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />
                <main className="flex-1 pt-14">
                  <Routes>
                    <Route path="/" element={<Navigate to="/scratch" replace />} />
                    <Route path="/scratch" element={<ScratchGallery />} />
                    <Route path="/scratch/:id" element={<ScratchDetail />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />

          {/* 登录页 */}
          <Route
            path="/admin/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          {/* 管理后台路由 */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/photos"
            element={
              <ProtectedRoute>
                <PhotoManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scratch"
            element={
              <ProtectedRoute>
                <ScratchManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute>
                <StudentManagement />
              </ProtectedRoute>
            }
          />
          {/* 硬件知识库管理 */}
          <Route
            path="/admin/lessons"
            element={
              <ProtectedRoute>
                <LessonManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stages"
            element={
              <ProtectedRoute>
                <StageManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tools"
            element={
              <ProtectedRoute>
                <ToolManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tool-categories"
            element={
              <ProtectedRoute>
                <ToolCategoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity-logs"
            element={
              <ProtectedRoute>
                <ActivityLogManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </ErrorBoundary>
  );
}
