import React from 'react';
import { Music, Shield, Heart } from 'lucide-react';

export default function Footer({ onOpenAdminAuth }) {
  return (
    <footer className="mt-20 border-t border-stone-200 dark:border-hall-800 bg-white/60 dark:bg-hall-950/60 backdrop-blur-sm py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Brand (Identical to page top left OPUS KOREA) */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-concert-500 text-white flex items-center justify-center shadow-md shadow-concert-500/20">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-xl tracking-tight text-stone-900 dark:text-stone-100">
                  OPUS KOREA
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                선율이 머무는 곳, 클래식 모아보기
              </p>
            </div>
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
