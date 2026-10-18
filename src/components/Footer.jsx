import React from 'react';
import { Shield, Heart } from 'lucide-react';
import BrandIcon from './BrandIcon';

export default function Footer({ onOpenAdminAuth }) {
  return (
    <footer className="mt-20 border-t border-stone-200 dark:border-hall-800 bg-white/60 dark:bg-hall-950/60 backdrop-blur-sm py-12 transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Footer Content Wrapper */}
        <div className="flex flex-col items-center justify-center">
          <div className="inline-flex flex-col gap-3">
            {/* Top row: Brand */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#24140e] via-[#3d2015] to-[#1a0c07] text-[#f6e5c5] flex items-center justify-center shadow-md shadow-[#1a0c07]/30 border border-[#753d22]/70 dark:border-[#874b26]/60 overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#874b26]/20 to-white/10 pointer-events-none" />
                <BrandIcon className="w-6.5 h-6.5 relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] text-[#f6e5c5]" />
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

        {/* Hidden admin access trigger positioned unobtrusively on bottom-right corner */}
        <div className="absolute right-4 sm:right-8 bottom-6">
          <button
            onClick={onOpenAdminAuth}
            className="p-1 text-stone-300 hover:text-stone-500 dark:text-hall-700 dark:hover:text-hall-400 transition-colors rounded opacity-40 hover:opacity-100 focus:outline-none shrink-0"
            title="운영진 관리"
            aria-label="운영진 관리"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
