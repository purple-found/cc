import React, { useState, useEffect } from 'react';
import { Lock, X, KeyRound, ShieldAlert } from 'lucide-react';

export default function AdminAuthModal({ isOpen, onClose, onAuthenticate }) {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage('');
    }
  }, [isOpen]);

  // ESC 키 닫기 이벤트 (Gate 2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // 관리자 마스터 암호 (opus2026 또는 admin2026)
    if (password === 'opus2026' || password === 'admin2026') {
      onAuthenticate();
      onClose();
    } else {
      setErrorMessage('올바른 관리자 인증 암호가 아닙니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-hall-900 rounded-3xl max-w-sm w-full border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-hall-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300">
              <Lock className="w-4 h-4 text-concert-500" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              관리자 보안 인증
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-hall-800 text-stone-500"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          공연장 관리 및 등록 시스템에 접근하려면 관리자 암호를 입력하세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder=""
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
              />
            </div>

            {errorMessage && (
              <p className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-hall-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-600 dark:text-stone-300 text-xs font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-white text-xs font-bold transition-all shadow-md"
            >
              인증 확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
