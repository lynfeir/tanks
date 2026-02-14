'use client';
import { useEffect } from 'react';
import useGameStore from '@/stores/gameStore';

const TOAST_COLORS = {
  info: 'border-blue-400 bg-blue-900/50',
  success: 'border-green-400 bg-green-900/50',
  warning: 'border-yellow-400 bg-yellow-900/50',
  error: 'border-red-400 bg-red-900/50',
};

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`animate-toast-in border-l-4 px-4 py-3 rounded-r-lg mb-2 text-sm font-medium ${TOAST_COLORS[toast.type] || TOAST_COLORS.info}`}
    >
      {toast.message}
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useGameStore((s) => s.toasts);
  const removeToast = useGameStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
