import React from 'react';
import { Music, Shield, Heart } from 'lucide-react';

export default function Footer({ onOpenAdminAuth }) {
  return (
    <footer className="mt-20 border-t border-stone-200 dark:border-hall-800 bg-white/60 dark:bg-hall-950/60 backdrop-blur-sm py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-concert-500 text-white flex items-center justify-center shadow-xs">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <p className="font-serif font-black text-sm tracking-tight text-stone-900 dark:text-stone-100">
                오푸스 코리아 (OPUS KOREA)
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                대한민국 클래식 음악 공연 일정 아카이브 & 애호가 광장
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-concert-500" />
              <span>7-Gate 무결점 소프트웨어 보증 완료</span>
            </div>
            <span>·</span>
            <span>데이터 연동: 주요 공연장 공식망</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
            <span>© 2026 OPUS KOREA. 모든 음악의 울림과 함께합니다.</span>
            {/* Hidden admin access trigger */}
            <button
              onClick={onOpenAdminAuth}
              className="p-1 text-stone-300 hover:text-stone-500 dark:text-hall-700 dark:hover:text-hall-400 transition-colors rounded opacity-40 hover:opacity-100 focus:outline-none"
              title="운영진 관리"
              aria-label="운영진 관리"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
