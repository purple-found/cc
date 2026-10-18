import React from 'react';
import { Calendar, MessageSquare, ShieldCheck, Sun, Moon, Sparkles } from 'lucide-react';
import BrandIcon from './BrandIcon';

export default function Header({ activeTab, setActiveTab, theme, setTheme, onOpenTipModal }) {
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-stone-50/90 dark:bg-hall-900/90 border-b border-stone-200 dark:border-hall-800 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('concerts')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#24140e] via-[#3d2015] to-[#1a0c07] text-[#f6e5c5] flex items-center justify-center shadow-lg shadow-[#1a0c07]/30 border border-[#753d22]/70 dark:border-[#874b26]/60 group-hover:scale-105 group-hover:border-[#b88648]/70 transition-all overflow-hidden shrink-0">
              {/* 벨벳 질감 새틴 광택 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#874b26]/20 to-white/10 pointer-events-none" />
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#b88648]/20 rounded-full blur-xs pointer-events-none" />
              <BrandIcon className="w-[35px] h-[35px] relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-[#f6e5c5]" />
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

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-stone-100/80 dark:bg-hall-850 p-1.5 rounded-xl border border-stone-200/80 dark:border-hall-700">
            <button
              onClick={() => setActiveTab('concerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                activeTab === 'concerts'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Calendar className="w-4 h-4 text-concert-500" />
              <span>공연 일정</span>
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${
                activeTab === 'community'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-concert-500" />
              <span>커뮤니티</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5">
            {/* General User: Suggest/Tip-off concert to Admin */}
            <button
              onClick={onOpenTipModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-concert-50 dark:bg-hall-800 border border-concert-300/80 dark:border-hall-700 text-concert-800 dark:text-concert-300 hover:bg-concert-100 dark:hover:bg-hall-700 transition-colors shrink-0"
              title="누락된 공연이나 정보를 관리자에게 제보해주세요"
            >
              <Sparkles className="w-3.5 h-3.5 text-concert-600 dark:text-concert-400" />
              <span>공연 제보하기</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-hall-700 bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-hall-700 transition-colors shrink-0"
              aria-label="화면 모드 전환"
              title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-stone-700" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-stone-200 dark:border-hall-800 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('concerts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'concerts'
                ? 'bg-concert-500 text-white'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>공연 일정</span>
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${
              activeTab === 'community'
                ? 'bg-concert-500 text-white'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>커뮤니티</span>
          </button>
        </div>
      </div>
    </header>
  );
}
