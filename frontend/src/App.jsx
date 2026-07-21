import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import ParticleBackground from './components/effects/ParticleBackground.jsx';
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
import { hasValidToken, clearAuth } from './services/api.js';

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

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Routes>
          {/* 公开前台路由 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col bg-gray-900">
                <ParticleBackground />
                <Header />
                <main className="flex-1 pt-16 relative z-10">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/scratch" element={<ScratchGallery />} />
                    <Route path="/scratch/:id" element={<ScratchDetail />} />
                    <Route path="/showcase" element={<DashboardShowcase />} />
                    <Route path="/author" element={<Author />} />
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
