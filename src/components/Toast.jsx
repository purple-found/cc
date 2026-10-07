import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
        toast.type === 'error'
          ? 'bg-rose-950/90 text-rose-200 border-rose-800'
          : toast.type === 'info'
          ? 'bg-blue-950/90 text-blue-200 border-blue-800'
          : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
      }`}>
        {toast.type === 'error' ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : toast.type === 'info' ? (
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span>{toast.message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/10 text-white/70"
          aria-label="알림 닫기"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
