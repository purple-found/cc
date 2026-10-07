import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorFallback({ onRetry, onReset }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-hall-900 border border-stone-200 dark:border-hall-800 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900/60">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="font-serif font-black text-xl text-stone-900 dark:text-stone-100">
            공연 정보를 안전하게 불러오는 중입니다
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
            일시적인 네트워크 지연이나 데이터 동기화 과정에서 문제가 발생했습니다.
            자동 복구 프로토콜을 통해 안전한 기본 화면으로 복구할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-md shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도하기</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-hall-800 hover:bg-stone-200 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all shrink-0"
          >
            <Home className="w-4 h-4" />
            <span>기본 데이터 복원</span>
          </button>
        </div>
      </div>
    </div>
  );
}
