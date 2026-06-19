import { useState, useEffect } from 'react';
import { Save, Bell, Shield, Palette, Settings2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { useToast } from '../../components/common/Toast.jsx';

export default function Settings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    siteName: '学生作品展示墙',
    siteDescription: '少儿编程学生作品展示平台',
    contactEmail: 'admin@example.com',
    contactPhone: '400-123-4567',
    allowRegistration: false,
    requireApproval: true,
    notificationEmail: true,
    notificationAdmin: true,
    primaryColor: '#e24d4d',
    secondaryColor: '#0ea5e9'
  });

  const tabs = [
    { id: 'general', name: '常规设置', icon: Settings2 },
    { id: 'notification', name: '通知设置', icon: Bell },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'appearance', name: '外观设置', icon: Palette }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('student_showcase_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem('student_showcase_settings', JSON.stringify(settings));
      toast.success('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      toast.error('保存设置失败，请重试');
    }
  };

  return (
    <AdminLayout>
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="card p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      activeTab === tab.id
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="card p-5">
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-white mb-4">常规设置</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">网站名称</label>
                      <input
                        type="text"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">网站描述</label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                        rows={3}
                        className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">联系邮箱</label>
                        <input
                          type="email"
                          value={settings.contactEmail}
                          onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                          className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">联系电话</label>
                        <input
                          type="text"
                          value={settings.contactPhone}
                          onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                          className="w-full bg-gray-800/60 border border-gray-700 rounded-lg py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notification' && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-white mb-4">通知设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">邮件通知</p>
                      <p className="text-gray-400 text-xs mt-1">新作品发布时发送邮件通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationEmail}
                        onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">管理员通知</p>
                      <p className="text-gray-400 text-xs mt-1">重要事件发送站内通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notificationAdmin}
                        onChange={(e) => setSettings({ ...settings, notificationAdmin: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-white mb-4">安全设置</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">允许用户注册</p>
                      <p className="text-gray-400 text-xs mt-1">允许访客注册成为平台用户</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowRegistration}
                        onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div>
                      <p className="text-white font-medium text-sm">作品审核</p>
                      <p className="text-gray-400 text-xs mt-1">新作品需要管理员审核后才能展示</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireApproval}
                        onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <h3 className="text-base font-semibold text-white mb-4">外观设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">主题色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-gray-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">强调色</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-gray-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-5 border-t border-gray-700/50">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-4 py-2.5 font-medium rounded-lg transition-all bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm shadow-sm shadow-primary-500/20"
              >
                <Save size={14} />
                <span>保存设置</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
