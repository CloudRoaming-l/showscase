import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '确定要执行此操作吗？',
  confirmText = '确定',
  cancelText = '取消',
  type = 'warning'
}) {
  if (!isOpen) return null;

  const borderColor = type === 'danger' ? 'border-red-500/50' : 'border-yellow-500/50';
  const btnColor = type === 'danger'
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-primary-500 hover:bg-primary-600';
  const iconColor = type === 'danger' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className={`card p-6 max-w-md w-full border ${borderColor}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-white/5 ${iconColor}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-400 mb-6">{message}</p>

        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 ${btnColor} text-white rounded-lg transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
