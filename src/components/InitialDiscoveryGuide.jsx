import React from 'react';
import { Music, MapPin, Sparkles, Calendar, Eye } from 'lucide-react';

export default function InitialDiscoveryGuide({
  totalCount = 0,
  onSelectVenue,
  onSelectComposer,
  onSelectDateRange,
  onShowAll
}) {
  const quickVenues = [
    { label: '예술의전당', value: '예술의전당' },
    { label: '롯데콘서트홀', value: '롯데콘서트홀' },
    { label: '부천아트센터', value: '부천아트센터' },
    { label: '부산콘서트홀', value: '부산콘서트홀' },
    { label: '대구콘서트하우스', value: '대구콘서트하우스' }
  ];

  const quickComposers = [
    { label: '쇼팽', value: '쇼팽' },
    { label: '베토벤', value: '베토벤' },
    { label: '라흐마니노프', value: '라흐마니노프' },
    { label: '말러', value: '말러' },
    { label: '브람스', value: '브람스' }
  ];

  const quickDates = [
    { label: '2026년 10월', value: '2026-10' },
    { label: '2026년 11월', value: '2026-11' },
    { label: '2026년 12월', value: '2026-12' }
  ];

  return (
    <div className="bg-white/90 dark:bg-hall-900/90 rounded-3xl border border-stone-200/90 dark:border-hall-800 p-8 sm:p-12 text-center shadow-xs backdrop-blur-xs space-y-8 transition-colors">
      {/* Icon & Hero Instruction */}
      <div className="space-y-3.5 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/15 via-concert-500/15 to-amber-700/20 dark:from-amber-400/20 dark:to-concert-600/30 border border-concert-500/30 dark:border-concert-500/40 flex items-center justify-center text-concert-600 dark:text-concert-400 mx-auto shadow-xs">
          <Music className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-stone-100 tracking-tight">
          원하시는 공연을 검색하거나 조건을 선택해보세요
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed break-keep">
          상단 검색창에 검색어를 입력하거나 공연장·작곡가·공연시기 필터를 선택하시면<br />맞춤 공연 일정이 빠르게 펼쳐집니다.
        </p>
      </div>

      {/* Quick Recommendation Section */}
      <div className="max-w-2xl mx-auto space-y-4 pt-2">
        <div className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-concert-500" />
          <span>자주 찾는 조건으로 빠른 탐색</span>
        </div>

        {/* 1. Quick Venues */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 mr-1 flex items-center gap-1 shrink-0">
            <MapPin className="w-3 h-3 text-concert-500" /> 공연장
          </span>
          {quickVenues.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => onSelectVenue(v.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-hall-850 hover:bg-concert-50 dark:hover:bg-hall-800 text-stone-700 dark:text-stone-300 hover:text-concert-700 dark:hover:text-concert-300 border border-stone-200 dark:border-hall-700 hover:border-concert-300 text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* 2. Quick Composers */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 mr-1 flex items-center gap-1 shrink-0">
            <Music className="w-3 h-3 text-concert-500" /> 작곡가
          </span>
          {quickComposers.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onSelectComposer(c.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-hall-850 hover:bg-concert-50 dark:hover:bg-hall-800 text-stone-700 dark:text-stone-300 hover:text-concert-700 dark:hover:text-concert-300 border border-stone-200 dark:border-hall-700 hover:border-concert-300 text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 3. Quick Dates */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3 text-concert-500" /> 시기
          </span>
          {quickDates.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onSelectDateRange(d.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-hall-850 hover:bg-concert-50 dark:hover:bg-hall-800 text-stone-700 dark:text-stone-300 hover:text-concert-700 dark:hover:text-concert-300 border border-stone-200 dark:border-hall-700 hover:border-concert-300 text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Show All Concerts Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onShowAll}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 dark:from-hall-800 dark:via-hall-750 dark:to-hall-800 text-stone-100 hover:text-white border border-stone-700/60 dark:border-hall-700 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
        >
          <Eye className="w-4 h-4 text-concert-400 shrink-0" />
          <span>전체 공연 한눈에 보기 ({totalCount}편)</span>
        </button>
      </div>
    </div>
  );
}
