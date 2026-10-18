import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, LayoutGrid, List, CalendarDays, Filter } from 'lucide-react';

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
  // 1. 주요 랜드마크 공연장 기본 목록
  const primaryVenues = [
    { label: '전체 장소 (All Venues)', value: 'all' },
    { label: '예술의전당 (Seoul Arts Center)', value: '예술의전당' },
    { label: '롯데콘서트홀 (Lotte Concert Hall)', value: '롯데콘서트홀' },
    { label: '부천아트센터 (Bucheon Arts Center)', value: '부천아트센터' },
    { label: '부산콘서트홀 (Busan Concert Hall)', value: '부산콘서트홀' },
    { label: '아트센터인천 (Art Center Incheon)', value: '아트센터인천' },
    { label: '금호아트홀 연세 (Kumho Art Hall)', value: '금호아트홀' },
    { label: 'LG아트센터 서울 (LG Arts Center)', value: 'LG아트센터' },
    { label: '경기아트센터 (Gyeonggi Arts Center)', value: '경기아트센터' },
    { label: '대구콘서트하우스 (Daegu Concert House)', value: '대구콘서트하우스' },
    { label: '대전예술의전당 (Daejeon Arts Center)', value: '대전예술의전당' },
    { label: '광주예술의전당 (Gwangju Arts Center)', value: '광주예술의전당' },
    { label: '청주예술의전당 (Cheongju Arts Center)', value: '청주예술의전당' },
    { label: '부산문화회관 (Busan Cultural Center)', value: '부산문화회관' },
    { label: '통영국제음악당 (Tongyeong Music Hall)', value: '통영국제음악당' },
    { label: '강릉아트센터 (Gangneung Arts Center)', value: '강릉아트센터' },
    { label: '성남아트센터 (Seongnam Arts Center)', value: '성남아트센터' },
    { label: '고양아람누리 (Goyang Aram Nuri)', value: '고양아람누리' },
    { label: '수성아트피아 (Suseong Artpia)', value: '수성아트피아' },
    { label: '천안예술의전당 (Cheonan Arts Center)', value: '천안예술의전당' },
    { label: '세종예술의전당 (Sejong Arts Center)', value: '세종예술의전당' },
    { label: '안동문화예술의전당 (Andong Arts Center)', value: '안동문화예술의전당' }
  ];

  // 2. 실제 데이터에 존재하는 전국의 모든 소형/중형/지역 공연장 전수 자동 통합
  const venues = useMemo(() => {
    const primaryValues = new Set(primaryVenues.map((v) => v.value));
    const extraVenueSet = new Set();

    (concerts || []).forEach((c) => {
      const v = (c.venue || '').trim();
      if (v && !primaryValues.has(v) && v !== '공식 공연장') {
        extraVenueSet.add(v);
      }
    });

    const sortedExtras = Array.from(extraVenueSet).sort((a, b) => a.localeCompare(b, 'ko'));
    const extraVenueOptions = sortedExtras.map((name) => ({
      label: name,
      value: name
    }));

    return [...primaryVenues, ...extraVenueOptions];
  }, [concerts]);

  // 작곡가 목록: 바로크 -> 고전 -> 낭만 -> 근현대 음악사 시대순 완벽 정렬
  const composers = [
    { label: '전체 작곡가 (All Composers)', value: 'all' },
    // 1. 바로크 (Baroque)
    { label: '비발디 (Antonio Vivaldi)', value: '비발디' },
    { label: '바흐 (Johann Sebastian Bach)', value: '바흐' },
    { label: '헨델 (George Frideric Handel)', value: '헨델' },
    // 2. 고전파 (Classical)
    { label: '하이든 (Joseph Haydn)', value: '하이든' },
    { label: '모차르트 (Wolfgang Amadeus Mozart)', value: '모차르트' },
    { label: '베토벤 (Ludwig van Beethoven)', value: '베토벤' },
    // 3. 전기/중기 낭만파 (Romantic)
    { label: '슈베르트 (Franz Schubert)', value: '슈베르트' },
    { label: '멘델스존 (Felix Mendelssohn)', value: '멘델스존' },
    { label: '쇼팽 (Frédéric Chopin)', value: '쇼팽' },
    { label: '슈만 (Robert Schumann)', value: '슈만' },
    { label: '리스트 (Franz Liszt)', value: '리스트' },
    { label: '바그너 (Richard Wagner)', value: '바그너' },
    { label: '베르디 (Giuseppe Verdi)', value: '베르디' },
    // 4. 후기 낭만파 & 국민악파 (Late Romantic)
    { label: '브루크너 (Anton Bruckner)', value: '브루크너' },
    { label: '브람스 (Johannes Brahms)', value: '브람스' },
    { label: '차이콥스키 (Pyotr Ilyich Tchaikovsky)', value: '차이콥스키' },
    { label: '드보르자크 (Antonín Dvořák)', value: '드보르자크' },
    { label: '푸치니 (Giacomo Puccini)', value: '푸치니' },
    { label: '말러 (Gustav Mahler)', value: '말러' },
    { label: '드뷔시 (C. Debussy)', value: '드뷔시' },
    { label: '시벨리우스 (Jean Sibelius)', value: '시벨리우스' },
    // 5. 20세기 & 근현대 (20th Century & Modern)
    { label: '라흐마니노프 (Sergei Rachmaninoff)', value: '라흐마니노프' },
    { label: '라벨 (Maurice Ravel)', value: '라벨' },
    { label: '프로코피예프 (Sergei Prokofiev)', value: '프로코피예프' },
    { label: '쇼스타코비치 (Dmitri Shostakovich)', value: '쇼스타코비치' }
  ];

  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // 외부(예: 초기화)에서 filters.search가 변경될 경우 localSearch 동기화
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // 검색 실행 핸들러 (검색 버튼 클릭 또는 엔터 키)
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setFilters((prev) => ({ ...prev, search: localSearch.trim() }));
  };

  const handleReset = () => {
    setLocalSearch('');
    setFilters({
      search: '',
      venue: 'all',
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
    filters.composer !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.customDate
  );

  const isFiltered = hasActiveConditions || shouldShowConcerts;

  return (
    <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-5 shadow-sm space-y-4 transition-colors">
      {/* Top row: 검색창 바로 오른쪽에 초기화 & 보기 전환 버튼 항상 인라인 배치 */}
      <div className="flex items-center gap-2.5">
        {/* Bilingual Keyword Search (공연명, 작곡가, 연주자, 곡명 등) */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="공연명, 작곡가, 연주자, 곡명 한글/영문 검색"
            className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-concert-500 truncate"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-gradient-to-br from-[#24140e] via-[#3d2015] to-[#1a0c07] text-[#f6e5c5] border border-[#753d22]/80 hover:border-[#b88648]/80 hover:from-[#2e1a12] hover:to-[#221009] active:scale-95 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            title="검색 실행 (엔터키 또는 클릭)"
          >
            <span>검색</span>
          </button>
        </form>

        {/* View Mode & Reset Button (검색창 오른쪽 완벽 밀착) */}
        <div className="flex items-center gap-2 shrink-0">
          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors shrink-0 border border-stone-200/80 dark:border-hall-700"
              title="검색 조건 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">초기화</span>
            </button>
          )}

          <div className="flex items-center bg-stone-100 dark:bg-hall-850 p-1 rounded-xl border border-stone-200 dark:border-hall-700 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
              title="카드 목록보기"
              aria-label="카드 목록보기"
            >
              <LayoutGrid className="w-4 h-4 text-concert-500" />
            </button>

            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                viewMode === 'compact'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
              title="간략보기"
              aria-label="간략보기"
            >
              <List className="w-4 h-4 text-concert-500" />
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-hall-700 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
              title="달력 보기"
              aria-label="달력 보기"
            >
              <CalendarDays className="w-4 h-4 text-concert-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Select Dropdowns Row: 3분할 깔끔한 구조 (공연장 / 작곡가 / 시기) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-stone-100 dark:border-hall-800">
        {/* 장소 필터 (청주예술의전당 등 소형/지역 공연장 전수 포함) */}
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
              <option value="2026-10">2026년 10월</option>
              <option value="2026-11">2026년 11월</option>
              <option value="2026-12">2026년 12월</option>
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
            {shouldShowConcerts ? (
              <>
                총 <strong className="text-stone-900 dark:text-stone-100 font-bold">{totalCount}</strong>편의 클래식 공연 중{' '}
                <strong className="text-concert-600 dark:text-concert-400 font-bold">{filteredCount}</strong>편이 검색되었습니다.
              </>
            ) : (
              <>
                검색어를 입력하거나 필터를 선택하시면 맞춤 공연 일정이 표시됩니다. (등록된 총 공연:{' '}
                <strong className="text-stone-900 dark:text-stone-100 font-bold">{totalCount}</strong>편)
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
