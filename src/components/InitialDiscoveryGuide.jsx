import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function InitialDiscoveryGuide({
  totalCount = 0,
  onSelectVenue,
  onSelectComposer,
  onSelectDateRange,
  onShowAll
}) {
  const quickVenues = [
    { label: '예술의전당', sub: '서울 서초', value: '예술의전당' },
    { label: '롯데콘서트홀', sub: '서울 송파', value: '롯데콘서트홀' },
    { label: '부천아트센터', sub: '경기 부천', value: '부천아트센터' },
    { label: '아트센터인천', sub: '인천 연수', value: '아트센터인천' },
    { label: '부산콘서트홀', sub: '부산 진구', value: '부산콘서트홀' },
    { label: '대구콘서트하우스', sub: '대구 중구', value: '대구콘서트하우스' }
  ];

  const quickComposers = [
    { label: '베토벤', sub: 'L. v. Beethoven', value: '베토벤' },
    { label: '모차르트', sub: 'W. A. Mozart', value: '모차르트' },
    { label: '쇼팽', sub: 'F. Chopin', value: '쇼팽' },
    { label: '브람스', sub: 'J. Brahms', value: '브람스' },
    { label: '말러', sub: 'G. Mahler', value: '말러' },
    { label: '라흐마니노프', sub: 'S. Rachmaninoff', value: '라흐마니노프' }
  ];

  const quickDates = [
    { label: '2026년 11월', sub: '해외 명문 악단 내한', value: '2026-11' },
    { label: '2026년 12월', sub: '송년 · 제야 음악회', value: '2026-12' },
    { label: '2027년 시즌', sub: '신년 · 상반기 일정', value: '2027' }
  ];

  return (
    <div className="bg-white dark:bg-hall-900 rounded-xl border border-stone-200/90 dark:border-hall-800 overflow-hidden transition-colors">
      {/* Editorial Top Header Bar */}
      <div className="px-6 py-5 sm:px-8 border-b border-stone-200/80 dark:border-hall-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-serif tracking-widest uppercase text-stone-400 dark:text-stone-500 block mb-1">
            Curated Index
          </span>
          <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100 tracking-tight">
            공연장, 작곡가 또는 시즌별로 일정을 찾아보세요
          </h2>
        </div>

        <button
          type="button"
          onClick={onShowAll}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-50 dark:text-stone-100 text-xs font-medium transition-colors shrink-0 cursor-pointer"
        >
          <span>전체 공연 일정 열람 ({totalCount.toLocaleString()}편)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3-Column Architectural Directory */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200/80 dark:divide-hall-800">
        {/* Column 1: Venues */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-baseline justify-between border-b border-stone-100 dark:border-hall-800 pb-2.5">
            <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              주요 공연장
            </span>
            <span className="text-[11px] font-serif text-stone-400 dark:text-stone-500">
              01
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickVenues.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => onSelectVenue(v.value)}
                className="text-left px-3 py-2.5 rounded-lg bg-stone-50/70 dark:bg-hall-850/70 hover:bg-stone-100 dark:hover:bg-hall-800 border border-stone-200/70 dark:border-hall-800 hover:border-stone-400 dark:hover:border-hall-600 transition-colors cursor-pointer group"
              >
                <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white truncate">
                  {v.label}
                </span>
                <span className="block text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                  {v.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Column 2: Composers */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-baseline justify-between border-b border-stone-100 dark:border-hall-800 pb-2.5">
            <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              시대별 주요 작곡가
            </span>
            <span className="text-[11px] font-serif text-stone-400 dark:text-stone-500">
              02
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickComposers.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onSelectComposer(c.value)}
                className="text-left px-3 py-2.5 rounded-lg bg-stone-50/70 dark:bg-hall-850/70 hover:bg-stone-100 dark:hover:bg-hall-800 border border-stone-200/70 dark:border-hall-800 hover:border-stone-400 dark:hover:border-hall-600 transition-colors cursor-pointer group"
              >
                <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white truncate">
                  {c.label}
                </span>
                <span className="block text-[10px] font-serif italic text-stone-400 dark:text-stone-500 mt-0.5 truncate">
                  {c.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Seasons */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-baseline justify-between border-b border-stone-100 dark:border-hall-800 pb-2.5">
            <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              시즌 일정
            </span>
            <span className="text-[11px] font-serif text-stone-400 dark:text-stone-500">
              03
            </span>
          </div>
          <div className="space-y-2">
            {quickDates.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => onSelectDateRange(d.value)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-stone-50/70 dark:bg-hall-850/70 hover:bg-stone-100 dark:hover:bg-hall-800 border border-stone-200/70 dark:border-hall-800 hover:border-stone-400 dark:hover:border-hall-600 transition-colors cursor-pointer group"
              >
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-stone-950 dark:group-hover:text-white">
                  {d.label}
                </span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500">
                  {d.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
