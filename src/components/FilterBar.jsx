import React from 'react';
import { Search, RotateCcw, LayoutGrid, CalendarDays, Filter } from 'lucide-react';

export default function FilterBar({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  totalCount,
  filteredCount
}) {
  const venues = [
    '전체 장소',
    '예술의전당 콘서트홀',
    '롯데콘서트홀',
    '부천아트센터 콘서트홀',
    '세종문화회관 대극장',
    '아트센터인천 콘서트홀',
    '통영국제음악당 콘서트홀',
    '대구콘서트하우스 그랜드홀'
  ];

  const composers = [
    '전체 작곡가',
    '쇼팽',
    '라벨',
    '말러',
    '라흐마니노프',
    '베토벤',
    '브람스',
    '바흐',
    '차이콥스키',
    '모차르트'
  ];

  const performers = [
    '전체 연주자/단체',
    '조성진',
    '임윤찬',
    '서울시립교향악단',
    'KBS교향악단',
    '베를린 필하모닉 오케스트라',
    '클라라 주미 강',
    '백건우',
    '손열음'
  ];

  const handleReset = () => {
    setFilters({
      search: '',
      venue: '전체 장소',
      composer: '전체 작곡가',
      performer: '전체 연주자/단체',
      dateRange: 'all',
      customDate: ''
    });
  };

  const isFiltered =
    filters.search ||
    filters.venue !== '전체 장소' ||
    filters.composer !== '전체 작곡가' ||
    filters.performer !== '전체 연주자/단체' ||
    filters.dateRange !== 'all' ||
    filters.customDate;

  return (
    <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-5 shadow-sm space-y-4 transition-colors">
      {/* Top row: Search input & View mode toggles */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Keyword Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="공연명, 연주곡(작품), 작곡가, 협연자 검색..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-concert-500"
          />
        </div>

        {/* View Mode & Reset Button */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
              title="검색 조건 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>필터 초기화</span>
            </button>
          )}

          <div className="flex items-center bg-stone-100 dark:bg-hall-850 p-1 rounded-xl border border-stone-200 dark:border-hall-700 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-concert-500" />
              <span className="shrink-0">목록 보기</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-concert-500" />
              <span className="shrink-0">달력 보기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select Dropdowns Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-stone-100 dark:border-hall-800">
        {/* 장소 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            공연장 / 홀
          </label>
          <select
            value={filters.venue}
            onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500 truncate"
          >
            {venues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* 작곡가 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            작곡가
          </label>
          <select
            value={filters.composer}
            onChange={(e) => setFilters({ ...filters, composer: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500 truncate"
          >
            {composers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 연주자 / 단체 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            연주자 / 단체
          </label>
          <select
            value={filters.performer}
            onChange={(e) => setFilters({ ...filters, performer: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500 truncate"
          >
            {performers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* 날짜 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            공연 시기
          </label>
          <div className="flex gap-1.5">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, customDate: '' })}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500"
            >
              <option value="all">전체 일정</option>
              <option value="2025-05">2025년 5월</option>
              <option value="2025-06">2025년 6월</option>
              <option value="2025-07">2025년 7월</option>
              <option value="custom">특정일 직접 지정</option>
            </select>

            {filters.dateRange === 'custom' && (
              <input
                type="date"
                value={filters.customDate}
                onChange={(e) => setFilters({ ...filters, customDate: e.target.value })}
                className="w-32 px-2 py-1 text-xs rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Filter result status counter */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-1">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-concert-500" />
          <span>
            총 <strong className="text-stone-900 dark:text-stone-100 font-bold">{totalCount}</strong>편의 공연 중{' '}
            <strong className="text-concert-600 dark:text-concert-400 font-bold">{filteredCount}</strong>편이 선택되었습니다.
          </span>
        </div>
      </div>
    </div>
  );
}
