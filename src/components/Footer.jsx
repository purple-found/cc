import React from 'react';
import { Music, Shield, Heart } from 'lucide-react';

export default function Footer({ onOpenAdminAuth }) {
  return (
    <footer className="mt-20 border-t border-stone-200 dark:border-hall-800 bg-white/60 dark:bg-hall-950/60 backdrop-blur-sm py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Top row: Brand */}
          <div className="flex items-center justify-between">
            {/* Logo & Brand (Scaled to 80% size for refined footer proportion) */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-concert-500 text-white flex items-center justify-center shadow-md shadow-concert-500/20 shrink-0">
                <Music className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base tracking-tight text-stone-900 dark:text-stone-100">
                    OPUS KOREA
                  </span>
                </div>
                <p className="text-[10px] sm:text-[10.5px] text-stone-500 dark:text-stone-400 font-medium leading-tight">
                  선율이 머무는 곳, 클래식 모아보기
                </p>
              </div>
            </div>

            {/* Hidden admin access trigger on far right */}
            <button
              onClick={onOpenAdminAuth}
              className="p-1 text-stone-300 hover:text-stone-500 dark:text-hall-700 dark:hover:text-hall-400 transition-colors rounded opacity-40 hover:opacity-100 focus:outline-none shrink-0"
              title="운영진 관리"
              aria-label="운영진 관리"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom row: Copyright aligned perfectly with top music icon's starting point */}
          <div className="text-xs text-stone-400 dark:text-stone-500 tracking-tight">
            <span>© 2026 OPUS KOREA. 모든 음악의 울림과 함께합니다.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
