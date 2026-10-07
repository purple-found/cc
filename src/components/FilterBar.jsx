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
    { label: '전체 장소 (All Venues)', value: 'all' },
    { label: '예술의전당 (Seoul Arts Center)', value: '예술의전당' },
    { label: '롯데콘서트홀 (Lotte Concert Hall)', value: '롯데콘서트홀' },
    { label: '부천아트센터 (Bucheon Arts Center)', value: '부천아트센터' },
    { label: '세종문화회관 (Sejong Center)', value: '세종문화회관' },
    { label: '아트센터인천 (Art Center Incheon)', value: '아트센터인천' },
    { label: '대전예술의전당 (Daejeon Arts Center)', value: '대전예술의전당' },
    { label: '광주예술의전당 (Gwangju Arts Center)', value: '광주예술의전당' },
    { label: '부산문화회관 (Busan Cultural Center)', value: '부산문화회관' },
    { label: '대구콘서트하우스 (Daegu Concert House)', value: '대구콘서트하우스' },
    { label: '통영국제음악당 (Tongyeong Music Hall)', value: '통영국제음악당' },
    { label: '경기아트센터 (Gyeonggi Arts Center)', value: '경기아트센터' },
    { label: '국립극장 (National Theater of Korea)', value: '국립극장' },
    { label: '금호아트홀 연세 (Kumho Art Hall)', value: '금호아트홀' },
    { label: 'LG아트센터 서울 (LG Arts Center)', value: 'LG아트센터' },
    { label: '강릉아트센터 (Gangneung Arts Center)', value: '강릉아트센터' }
  ];

  const composers = [
    { label: '전체 작곡가 (All Composers)', value: 'all' },
    { label: '말러 (Gustav Mahler)', value: '말러' },
    { label: '쇼팽 (Frédéric Chopin)', value: '쇼팽' },
    { label: '베토벤 (Ludwig van Beethoven)', value: '베토벤' },
    { label: '브람스 (Johannes Brahms)', value: '브람스' },
    { label: '라흐마니노프 (Sergei Rachmaninoff)', value: '라흐마니노프' },
    { label: '차이콥스키 (Pyotr Ilyich Tchaikovsky)', value: '차이콥스키' },
    { label: '바흐 (Johann Sebastian Bach)', value: '바흐' },
    { label: '모차르트 (Wolfgang Amadeus Mozart)', value: '모차르트' },
    { label: '라벨 (Maurice Ravel)', value: '라벨' },
    { label: '슈만 (Robert Schumann)', value: '슈만' },
    { label: '브루크너 (Anton Bruckner)', value: '브루크너' }
  ];

  const performers = [
    { label: '전체 연주자/단체 (All Performers)', value: 'all' },
    { label: '조성진 (Seong-Jin Cho)', value: '조성진' },
    { label: '임윤찬 (Yunchan Lim)', value: '임윤찬' },
    { label: '서울시립교향악단 (Seoul Philharmonic)', value: '서울시립교향악단' },
    { label: '빈 필하모닉 (Wiener Philharmoniker)', value: '빈 필하모닉' },
    { label: '런던 심포니 (London Symphony)', value: '런던 심포니' },
    { label: 'KBS교향악단 (KBS Symphony)', value: 'KBS교향악단' },
    { label: '클라라 주미 강 (Clara-Jumi Kang)', value: '클라라 주미 강' },
    { label: '백건우 (Kun-Woo Paik)', value: '백건우' },
    { label: '손열음 (Yeol Eum Son)', value: '손열음' },
    { label: '노부스 콰르텟 (Novus String Quartet)', value: '노부스 콰르텟' }
  ];

  const handleReset = () => {
    setFilters({
      search: '',
      venue: 'all',
      composer: 'all',
      performer: 'all',
      dateRange: 'all',
      customDate: ''
    });
  };

  const isFiltered =
    filters.search ||
    filters.venue !== 'all' ||
    filters.composer !== 'all' ||
    filters.performer !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.customDate;

  return (
    <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-5 shadow-sm space-y-4 transition-colors">
      {/* Top row: Search input & View mode toggles */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Bilingual Keyword Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="공연명, 작곡가, 연주자, 곡명 한글/영문 검색 (e.g. Mahler, 조성진, Beethoven, SAC, Emperor)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-concert-500"
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
              <span>초기화 (Reset)</span>
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
              <span className="shrink-0">목록 보기 (Cards)</span>
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
              <span className="shrink-0">달력 보기 (Calendar)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select Dropdowns Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-stone-100 dark:border-hall-800">
        {/* 장소 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            공연장 / 홀 (Concert Venue)
          </label>
          <select
            value={filters.venue}
            onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500 truncate"
          >
            {venues.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* 작곡가 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            작곡가 (Composer)
          </label>
          <select
            value={filters.composer}
            onChange={(e) => setFilters({ ...filters, composer: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500 truncate"
          >
            {composers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 연주자 / 단체 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            연주자 / 단체 (Performer)
          </label>
          <select
            value={filters.performer}
            onChange={(e) => setFilters({ ...filters, performer: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500 truncate"
          >
            {performers.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* 날짜 필터 */}
        <div>
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">
            공연 시기 (Season / Date)
          </label>
          <div className="flex gap-1.5">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, customDate: '' })}
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500"
            >
              <option value="all">전체 일정 (All)</option>
              <option value="2026-10">2026년 10월 (현재 진행)</option>
              <option value="2026-11">2026년 11월 (예정)</option>
              <option value="custom">특정일 직접 지정 (Pick Date)</option>
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
            총 <strong className="text-stone-900 dark:text-stone-100 font-bold">{totalCount}</strong>편의 클래식 공연 중{' '}
            <strong className="text-concert-600 dark:text-concert-400 font-bold">{filteredCount}</strong>편이 검색되었습니다. (Bilingual Search Active)
          </span>
        </div>
      </div>
    </div>
  );
}
