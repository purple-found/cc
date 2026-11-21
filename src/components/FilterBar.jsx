import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, LayoutGrid, List, CalendarDays, Filter } from 'lucide-react';
import { analyticsService } from '../services/analyticsService.js';

export default function FilterBar({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  totalCount,
  filteredCount,
  concerts = [],
  shouldShowConcerts = true,
  onReset
}) {
  // 1. 등록된 모든 공연장 전수 통합 및 단일 ㄱㄴㄷ(가나다) 순 완전 정렬
  const venues = useMemo(() => {
    const landmarkLabelMap = new Map([
      ['강릉아트센터', '강릉아트센터'],
      ['경기아트센터', '경기아트센터'],
      ['고양아람누리', '고양아람누리'],
      ['광주예술의전당', '광주예술의전당'],
      ['금호아트홀 연세', '금호아트홀 연세'],
      ['대구콘서트하우스', '대구콘서트하우스'],
      ['대전예술의전당', '대전예술의전당'],
      ['롯데콘서트홀', '롯데콘서트홀'],
      ['부산문화회관', '부산문화회관'],
      ['부산콘서트홀', '부산콘서트홀'],
      ['부천아트센터', '부천아트센터'],
      ['성남아트센터', '성남아트센터'],
      ['세종예술의전당', '세종예술의전당'],
      ['수성아트피아', '수성아트피아'],
      ['아트센터인천', '아트센터인천'],
      ['안동문화예술의전당', '안동문화예술의전당'],
      ['예술의전당', '예술의전당 (서울)'],
      ['천안예술의전당', '천안예술의전당'],
      ['청주예술의전당', '청주예술의전당'],
      ['통영국제음악당', '통영국제음악당'],
      ['LG아트센터', 'LG아트센터 서울']
    ]);

    const allVenueSet = new Set(landmarkLabelMap.keys());

    (concerts || []).forEach((c) => {
      let v = (c.venue || '').trim();
      if (v === '예술의전당 [서울]') {
        v = '예술의전당';
      }
      if (v.startsWith('아트센터 인천')) {
        v = v.replace('아트센터 인천', '아트센터인천');
      }
      if (v === '롯데콘서트홀 (롯데콘서트홀)') {
        v = '롯데콘서트홀';
      }
      if (v.includes('금호아트홀')) {
        v = '금호아트홀 연세';
      }
      if (v.includes('강릉아트센터')) {
        v = '강릉아트센터';
      }
      if (v.includes('꿈의숲아트센터')) {
        v = '꿈의숲아트센터';
      }
      if (v && v !== '공식 공연장') {
        allVenueSet.add(v);
      }
    });

    const sortedAllVenues = Array.from(allVenueSet)
      .map((venueValue) => ({
        label: landmarkLabelMap.get(venueValue) || venueValue,
        value: venueValue
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ko'));

    return [
      { label: '전체 공연장', value: 'all' },
      ...sortedAllVenues
    ];
  }, [concerts]);

  // 작곡가 목록: 바로크 -> 고전 -> 낭만 -> 근현대 음악사 시대순 정렬
  const composers = [
    { label: '전체 작곡가', value: 'all' },
    { label: '비발디', value: '비발디' },
    { label: '바흐', value: '바흐' },
    { label: '헨델', value: '헨델' },
    { label: '하이든', value: '하이든' },
    { label: '모차르트', value: '모차르트' },
    { label: '베토벤', value: '베토벤' },
    { label: '슈베르트', value: '슈베르트' },
    { label: '멘델스존', value: '멘델스존' },
    { label: '쇼팽', value: '쇼팽' },
    { label: '슈만', value: '슈만' },
    { label: '리스트', value: '리스트' },
    { label: '바그너', value: '바그너' },
    { label: '베르디', value: '베르디' },
    { label: '브루크너', value: '브루크너' },
    { label: '브람스', value: '브람스' },
    { label: '차이콥스키', value: '차이콥스키' },
    { label: '드보르자크', value: '드보르자크' },
    { label: '푸치니', value: '푸치니' },
    { label: '말러', value: '말러' },
    { label: '드뷔시', value: '드뷔시' },
    { label: '시벨리우스', value: '시벨리우스' },
    { label: '라흐마니노프', value: '라흐마니노프' },
    { label: '라벨', value: '라벨' },
    { label: '프로코피예프', value: '프로코피예프' },
    { label: '쇼스타코비치', value: '쇼스타코비치' }
  ];

  const [localSearch, setLocalSearch] = useState(filters.search || '');

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // 검색 실행 핸들러 (검색 버튼 클릭 또는 엔터 키)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = localSearch.trim();
    setFilters((prev) => ({ ...prev, search: query }));
    if (query) {
      analyticsService.trackSearch(query, filters);
    }
  };

  const handleReset = () => {
    setLocalSearch('');
    setFilters({
      search: '',
      venue: 'all',
      performerType: 'all',
      composer: 'all',
      performer: 'all',
      dateRange: 'all',
      customDate: ''
    });
    if (onReset) onReset();
  };

  const hasActiveConditions = Boolean(
    filters.search ||
    localSearch ||
    filters.venue !== 'all' ||
    (filters.performerType && filters.performerType !== 'all') ||
    filters.composer !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.customDate
  );

  const isFiltered = hasActiveConditions || shouldShowConcerts;

  return (
    <div className="bg-white dark:bg-hall-900 rounded-xl border border-stone-200/90 dark:border-hall-800 p-5 space-y-4 transition-colors">
      {/* Top row: 검색창 & 보기 전환 */}
      <div className="flex items-center gap-2.5">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="공연명, 작곡가, 연주자, 곡명 검색 (한글·영문)"
            className="w-full pl-10 pr-20 py-2.5 rounded-lg bg-stone-50/70 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-stone-500 dark:focus:border-concert-400 transition-colors truncate"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-concert-500 dark:hover:bg-concert-600 text-stone-50 dark:text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            title="검색 실행"
          >
            <span>검색</span>
          </button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-hall-800 rounded-lg transition-colors shrink-0 border border-stone-200 dark:border-hall-700"
              title="검색 조건 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">초기화</span>
            </button>
          )}

          <div className="flex items-center bg-stone-100/80 dark:bg-hall-850 p-1 rounded-lg border border-stone-200/80 dark:border-hall-700 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md text-xs font-medium transition-all shrink-0 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-2xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
              title="카드 보기"
              aria-label="카드 보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-md text-xs font-medium transition-all shrink-0 ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-2xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
              title="목록 보기"
              aria-label="목록 보기"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md text-xs font-medium transition-all shrink-0 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-2xs'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
              title="달력 보기"
              aria-label="달력 보기"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Select Dropdowns Row: 4분할 구조 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-100 dark:border-hall-800">
        <div>
          <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 tracking-tight">
            공연장
          </label>
          <select
            value={filters.venue}
            onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-stone-50/70 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-500 dark:focus:border-concert-400 truncate"
          >
            {venues.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 tracking-tight">
            연주 편성
          </label>
          <select
            value={filters.performerType || 'all'}
            onChange={(e) => setFilters({ ...filters, performerType: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-stone-50/70 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-500 dark:focus:border-concert-400 truncate"
          >
            <option value="all">전체 편성</option>
            <option value="오케스트라">오케스트라</option>
            <option value="실내악">실내악</option>
            <option value="독주회">독주회 · 리사이틀</option>
            <option value="오페라">오페라</option>
            <option value="성악/합창">성악 · 합창</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 tracking-tight">
            작곡가
          </label>
          <select
            value={filters.composer}
            onChange={(e) => setFilters({ ...filters, composer: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-stone-50/70 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-500 dark:focus:border-concert-400 truncate"
          >
            {composers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1.5 tracking-tight">
            공연 시기
          </label>
          <div className="flex gap-1.5">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, customDate: '' })}
              className="flex-1 px-3 py-2 rounded-lg bg-stone-50/70 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-500 dark:focus:border-concert-400"
            >
              <option value="all">전체 일정</option>
              <option value="2026-11">2026년 11월</option>
              <option value="2026-12">2026년 12월</option>
              <option value="2027">2027년 전체</option>
              <option value="2027-01">2027년 1월</option>
              <option value="2027-02">2027년 2월</option>
              <option value="2027-03">2027년 3월</option>
              <option value="custom">날짜 직접 선택</option>
            </select>

            {filters.dateRange === 'custom' && (
              <input
                type="date"
                value={filters.customDate}
                onChange={(e) => setFilters({ ...filters, customDate: e.target.value })}
                className="w-32 px-2 py-1 text-xs rounded-lg bg-stone-50/70 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:border-stone-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Filter result status counter */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1">
        <span>
          {shouldShowConcerts ? (
            <>
              검색 결과 <strong className="text-stone-900 dark:text-stone-100 font-semibold">{filteredCount}</strong>편
            </>
          ) : (
            <span>공연장·편성·작곡가 또는 시기를 선택해 일정을 열람하세요.</span>
          )}
        </span>
      </div>
    </div>
  );
}
