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
    <footer className="mt-20 border-t border-stone-200 dark:border-hall-800 bg-white/60 dark:bg-hall-950/60 backdrop-blur-sm py-12 transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Footer Content Wrapper */}
        <div className="flex flex-col items-center justify-center">
          <div
            onClick={handleSecretTap}
            className="inline-flex flex-col gap-3 select-none cursor-default"
          >
            {/* Top row: Brand */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#24140e] via-[#3d2015] to-[#1a0c07] text-[#f6e5c5] flex items-center justify-center shadow-md shadow-[#1a0c07]/30 border border-[#753d22]/70 dark:border-[#874b26]/60 overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#874b26]/20 to-white/10 pointer-events-none" />
                <BrandIcon className="w-[25px] h-[25px] relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] text-[#f6e5c5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base tracking-tight text-stone-900 dark:text-stone-100">
                    CLASSICALENDER
                  </span>
                </div>
                <p className="text-[10px] sm:text-[10.5px] text-stone-500 dark:text-stone-400 font-medium leading-tight">
                  선율이 머무는 곳, 클린더
                </p>
              </div>
            </div>

            {/* Bottom row: Copyright aligned with music icon starting line */}
            <div className="text-xs text-stone-400 dark:text-stone-500 tracking-tight text-left">
              <span>© 2026 CLASSICALENDER. 모든 음악의 울림과 함께합니다.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

