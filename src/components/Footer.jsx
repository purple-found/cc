import React, { useRef } from 'react';
import BrandIcon from './BrandIcon';

export default function Footer({ onOpenAdminAuth }) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  // 모바일/웹 표준 이스터에그 방식: 푸터 로고 영역 2.5초 내 5회 연속 터치/클릭 시 관리자 인증창 호출
  const handleSecretTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (onOpenAdminAuth) onOpenAdminAuth();
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2500);
  };

  return (
    <footer className="mt-16 border-t border-stone-200/80 dark:border-hall-800 bg-[#fbf9f5] dark:bg-hall-950 py-10 transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            onClick={handleSecretTap}
            className="inline-flex items-center gap-3 select-none cursor-default"
          >
            <div className="velvet-icon-box w-8 h-8 rounded-md text-[#f6e5c5] flex items-center justify-center border border-[#6e3d24]/80 dark:border-[#7d4629]/70 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#96532a]/20 to-white/10 pointer-events-none" />
              <BrandIcon className="w-[23px] h-[23px] relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] text-[#f6e5c5]" />
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wider text-stone-900 dark:text-stone-100 block leading-none">
                CLASSICALENDER
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-1">
                선율이 머무는 곳, 클린더
              </span>
            </div>
          </div>

          <div className="text-xs text-stone-400 dark:text-stone-500 tracking-tight">
            <span>© 2026 CLASSICALENDER. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

