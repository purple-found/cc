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
            <div className="w-8 h-8 rounded-md bg-[#1f130d] dark:bg-hall-850 text-[#f3e3c6] flex items-center justify-center border border-[#4a2c1d] dark:border-hall-700 shrink-0">
              <BrandIcon className="w-[22px] h-[22px] text-[#f3e3c6]" />
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

