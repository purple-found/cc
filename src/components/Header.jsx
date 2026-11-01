import React from 'react';
import { Sun, Moon } from 'lucide-react';
import BrandIcon from './BrandIcon';

export default function Header({ activeTab, setActiveTab, theme, setTheme, onOpenTipModal }) {
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#fbf9f5]/95 dark:bg-hall-950/95 border-b border-stone-200/80 dark:border-hall-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3.5">
          {/* Left: Brand Identity & Editorial Navigation */}
          <div className="flex items-center gap-8">
            <div
              onClick={() => setActiveTab('concerts')}
              className="flex items-center gap-3 cursor-pointer group shrink-0"
            >
              <div className="velvet-icon-box w-10 h-10 rounded-lg text-[#f6e5c5] flex items-center justify-center border border-[#6e3d24]/80 dark:border-[#7d4629]/70 shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#96532a]/20 to-white/10 pointer-events-none" />
                <BrandIcon className="w-[30px] h-[30px] relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] text-[#f6e5c5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg tracking-wider text-stone-900 dark:text-stone-100 leading-none">
                  CLASSICALENDER
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 tracking-tight mt-1">
                  선율이 머무는 곳, 클린더
                </span>
              </div>
            </div>

            {/* Editorial Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 pl-4 border-l border-stone-200 dark:border-hall-800">
              <button
                onClick={() => setActiveTab('concerts')}
                className={`py-1 text-sm transition-colors shrink-0 cursor-pointer border-b-2 ${
                  activeTab === 'concerts'
                    ? 'border-stone-900 dark:border-concert-300 text-stone-900 dark:text-stone-50 font-semibold'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 font-medium'
                }`}
              >
                공연 일정
              </button>

              <button
                onClick={() => setActiveTab('community')}
                className={`py-1 text-sm transition-colors shrink-0 cursor-pointer border-b-2 ${
                  activeTab === 'community'
                    ? 'border-stone-900 dark:border-concert-300 text-stone-900 dark:text-stone-50 font-semibold'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 font-medium'
                }`}
              >
                커뮤니티
              </button>
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTipModal}
              className="text-xs font-medium px-3.5 py-2 rounded-md bg-white dark:bg-hall-900 border border-stone-300/90 dark:border-hall-700 text-stone-700 dark:text-stone-300 hover:border-stone-800 dark:hover:border-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors shrink-0 cursor-pointer"
              title="서비스 이용 문의나 누락된 공연 정보를 전달합니다"
            >
              문의 및 공연 제보
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-stone-200 dark:border-hall-800 bg-white dark:bg-hall-900 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-400 dark:hover:border-hall-700 transition-colors shrink-0 cursor-pointer"
              aria-label="화면 모드 전환"
              title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-stone-700" />
              ) : (
                <Sun className="w-4 h-4 text-concert-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center gap-6 py-2 border-t border-stone-200/70 dark:border-hall-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('concerts')}
            className={`py-1 text-xs shrink-0 border-b-2 ${
              activeTab === 'concerts'
                ? 'border-stone-900 dark:border-concert-300 text-stone-900 dark:text-stone-100 font-semibold'
                : 'border-transparent text-stone-500 dark:text-stone-400 font-medium'
            }`}
          >
            공연 일정
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`py-1 text-xs shrink-0 border-b-2 ${
              activeTab === 'community'
                ? 'border-stone-900 dark:border-concert-300 text-stone-900 dark:text-stone-100 font-semibold'
                : 'border-transparent text-stone-500 dark:text-stone-400 font-medium'
            }`}
          >
            커뮤니티
          </button>
        </div>
      </div>
    </header>
  );
}
