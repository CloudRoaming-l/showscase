import { useState } from 'react';
import { hardwareAPI } from '../../services/api.js';
import { useToast } from '../common/Toast.jsx';
import { Lock } from 'lucide-react';

export default function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('请输入访问密码');
      return;
    }

    setLoading(true);
    try {
      const result = await hardwareAPI.login(password);
      if (result.status === 'success') {
        toast.success('验证成功');
        if (onSuccess) onSuccess();
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gray-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">造物课堂 · 硬件教学知识库</h1>
            <p className="text-sm text-gray-500">请输入访问密码以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入访问密码"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '验证中...' : '进入知识库'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <a
              href="/scratch"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              返回作品展示页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
