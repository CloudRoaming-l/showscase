import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

const colorMap = {
  success: 'border-green-500/50 bg-green-500/10 text-green-300',
  error: 'border-red-500/50 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  info: 'border-blue-500/50 bg-blue-500/10 text-blue-300'
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error', 4000),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info'),
    remove: removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg pointer-events-auto min-w-[240px] animate-slide-in ${colorMap[toast.type] || colorMap.info}`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm flex-1 text-white">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // 如果没有 Provider，返回一个简单的 fallback
    return {
      success: (m) => console.log('[Toast]', m),
      error: (m) => console.error('[Toast]', m),
      warning: (m) => console.warn('[Toast]', m),
      info: (m) => console.log('[Toast]', m),
      remove: () => {}
    };
  }
  return context;
}

export default ToastContext;
