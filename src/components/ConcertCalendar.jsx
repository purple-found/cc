import React, { useState, useMemo, memo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Music, ExternalLink, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { formatKoreanDate } from '../utils/parser';
import { getVenueOfficialUrl } from '../utils/venueUrls';

/**
 * 공연장 및 세부홀 규모(좌석수 및 위상) 정밀 차등 점수
 * 동일 복합 공연장 내에서 대형 메인홀과 소형홀 간의 대표성 차이를 명확히 구분
 */
function getHallTierScore(venue = '', hall = '') {
  const v = (venue || '').toLowerCase();
  const h = (hall || '').toLowerCase();
  const text = `${v} ${h}`;

  // 1. 단일 대형 전용 콘서트홀 (2,000석 규모)
  if (v.includes('롯데콘서트홀') || v.includes('아트센터 인천') || v.includes('아트센터인천') || v.includes('부산콘서트홀')) {
    return 60;
  }

  // 2. 초소형 살롱홀 및 연습실 (100석 내외)
  if (
    h.includes('인춘아트홀') ||
    h.includes('인춘') ||
    text.includes('인춘아트홀') ||
    text.includes('몰입공유연습실') ||
    text.includes('연습실') ||
    text.includes('살롱') ||
    text.includes('스튜디오') ||
    text.includes('b1')
  ) {
    return 5;
  }

  // 3. 소형 리사이틀홀 및 소공연장 (200~400석)
  if (
    h.includes('리사이틀홀') ||
    h.includes('소공연장') ||
    h.includes('소극장') ||
    h.includes('자유소극장') ||
    h.includes('소강당') ||
    text.includes('리사이틀홀') ||
    text.includes('소공연장')
  ) {
    return 15;
  }

  // 4. 중형 챔버홀 및 앙상블홀 (400~1,000석)
  if (
    h.includes('ibk') ||
    h.includes('토월') ||
    h.includes('챔버홀') ||
    h.includes('체임버홀') ||
    h.includes('앙상블홀') ||
    h.includes('m씨어터') ||
    h.includes('중극장') ||
    h.includes('중공연장') ||
    h.includes('금호아트홀') ||
    text.includes('ibk챔버홀') ||
    text.includes('토월극장') ||
    text.includes('체임버홀') ||
    text.includes('앙상블홀')
  ) {
    return 30;
  }

  // 5. 초대형 콘서트홀 및 대극장 (1,200~2,500석+ 메인 음악당)
  if (
    h.includes('콘서트홀') ||
    h.includes('대극장') ||
    h.includes('그랜드홀') ||
    h.includes('대공연장') ||
    h.includes('메인홀') ||
    h.includes('오페라극장') ||
    h.includes('오페라') ||
    h.includes('아트홀') ||
    h.includes('음악당') ||
    text.includes('콘서트홀') ||
    text.includes('대극장') ||
    text.includes('그랜드홀') ||
    text.includes('대공연장') ||
    text.includes('오페라극장')
  ) {
    return 70;
  }

  // 미분류 기본 공연장 (예술의전당 제야음악회 등 메인홀 기본값 보정)
  if (v.includes('예술의전당') && (text.includes('제야') || text.includes('송년') || text.includes('교향악단'))) {
    return 70;
  }

  return 20;
}

/**
 * 클래식 공연 대표성 / 아티스트 인지도 / 세부홀 규모 정밀 우선순위 알고리즘
 * 1. [Tier S] 세계적 거장 / 글로벌 헤드라이너 슈퍼스타 (+260점):
 *    - 비킹구르 올라프손, 조성진, 임윤찬, 프레디 켐프, 스미노 하야토, 아르헤리치 등 단독 메인홀 매진급 거장 및 주요 국공립/해외 명문 악단
 * 2. [Tier A] 국내외 저명 중견 연주자 / 실내악 명인 (+130점):
 *    - 백주영, 양성원, 송영훈, 아르토 노라스, 김규연 등
 * 3. [홀 규모] 대형 콘서트홀/대극장(+70점) vs IBK챔버홀(+30점) vs 리사이틀홀(+15점) vs 인춘아트홀(+5점)
 * 4. [편성 보정] 곡목 설명(description) 내 단순 단어 매칭 오작동을 차단하고, 공연 제목(title)과 출연진(performers)만 기준으로 오케스트라/협주곡 판별
 * 5. [성격 보정] 자선/기부/환우돕기/렉처/마티네/키즈(-45점) 및 동문/제자/귀국/학위(-60점) 후순위 조정
 */
function getConcertPriorityScore(c) {
  let score = 0;
  const title = (c.title || '').toLowerCase();
  const venue = (c.venue || '').toLowerCase();
  const hall = (c.hall || '').toLowerCase();
  const performers = (Array.isArray(c.performers) ? c.performers.join(' ') : (c.performers || '')).toLowerCase();
  const cast = (c.cast || '').toLowerCase();
  const coreText = `${title} ${venue} ${hall} ${performers} ${cast}`;

  // 1-A. [Tier S] 글로벌 슈퍼스타 솔리스트 / 세계적 지휘자 / 대표 명문 악단 (+260)
  const tierSSuperstars = [
    '비킹구르 올라프손', '올라프손', 'olafsson', 'ólafsson',
    '스미노 하야토', '스미노', 'sumino', 'cateen', 'hayato sumino',
    '프레디 켐프', '프레디 캠프', '프레디켐프', '프레디캠프', 'freddy kempf', 'kempf',
    '조성진', 'seong-jin cho', '임윤찬', 'yunchan lim', '손열음', 'yeol eum son',
    '마르타 아르헤리치', '아르헤리치', 'argerich', '샤를 뒤트와', 'dutoit',
    '테오도르 쿠렌치스', '쿠렌치스', 'currentzis', '유토피아 오케스트라',
    '유자 왕', 'yuja wang', '랑랑', 'lang lang', '키신', 'kissin', '트리포노프', 'trifonov',
    '니콜라이 루간스키', '루간스키', 'lugansky', '후지타 마오', 'fujita', '바딤 콜로덴코',
    '백건우', '김선욱', '선우예권', '박재홍', '임동혁', '이혁',
    '클라라 주미 강', '강주미', '양인모', '김봄소리', '사라 장', '장영주', '정경화', '조수미',
    '막심 벤게로프', 'vengerov', '파트리샤 코파친스카야', 'kopatchinskaja', '솔 가베타', 'sol gabetta',
    '한재민', '라이너 호넥', '라이너호넥', '레 벙 프랑세',
    '파보 예르비', 'paavo järvi', 'paavo jarvi', '에스토니안', '사이먼 래틀', 'rattle',
    '정명훈', '얍 판 츠베덴', '두다멜', 'dudamel', '메켈레', 'mäkelä', '조너선 노트',
    '빈 필', '베를린 필', '런던 심포니', '로열 콘세르트', '바이에른', '라이프치히', 'bbc 필하모닉',
    '서울시향', '서울시립교향악단', 'kbs교향악단', 'kbs 교향악단', '국립심포니', '국립오페라단'
  ];

  // 1-B. [Tier A] 국내외 저명 연주자 및 실내악 스타 (+130)
  const tierAArtists = [
    '양성원', '송영훈', '아르토 노라스', '노라스', 'arto noras', '김규연',
    '백주영', '이경선', '김대진', '신창용', '문태국', '신지아', '대니 구', '박수예',
    '리처드 용재 오닐', '용재 오닐', '용재오닐', '윤홍천', '손민수',
    '일리야 라쉬코프스키', '라쉬코프스키', '플로리안 노악', '에릭 르 사쥬', '폴 메이어',
    '파비오 비온디', '고잉홈프로젝트', '스베틀린 루세브', '조성현'
  ];

  let artistTier = 0;
  for (const kw of tierSSuperstars) {
    if (coreText.includes(kw)) {
      score += 260;
      artistTier = 2;
      break;
    }
  }
  if (artistTier === 0) {
    for (const kw of tierAArtists) {
      if (coreText.includes(kw)) {
        score += 130;
        artistTier = 1;
        break;
      }
    }
  }

  // 2. 세부홀 규모(좌석수)에 따른 차등 점수
  const hallScore = getHallTierScore(venue, hall);
  score += hallScore;

  // 3. 공연장 랜드마크 명성 기본 점수
  if ((venue.includes('예술의전당') && !venue.includes('대전') && !venue.includes('광주') && !venue.includes('천안') && !venue.includes('안동') && !venue.includes('의정부') && !venue.includes('익산') && !venue.includes('경주') && !venue.includes('화성') && !venue.includes('제천') && !venue.includes('서귀포') && !venue.includes('군산') && !venue.includes('청주')) || venue.includes('롯데콘서트홀') || venue.includes('세종문화회관')) {
    score += 25;
  } else if (
    venue.includes('부천아트센터') ||
    venue.includes('대구콘서트하우스') ||
    venue.includes('아트센터 인천') ||
    venue.includes('아트센터인천') ||
    venue.includes('부산콘서트홀') ||
    venue.includes('대전예술의전당') ||
    venue.includes('광주예술의전당') ||
    venue.includes('통영국제음악당')
  ) {
    score += 12;
  }

  // 4. 협주곡(Concerto) 및 오케스트라/음악제 편성 보정 (제목과 출연진 기준으로만 엄격 판정)
  if (title.includes('협주곡') || title.includes('concerto')) {
    score += 20;
  }
  if (
    title.includes('오케스트라') ||
    title.includes('교향악단') ||
    title.includes('필하모닉') ||
    title.includes('orchestra') ||
    title.includes('philharmonic') ||
    title.includes('symphony') ||
    c.performerType === '오케스트라'
  ) {
    score += 30;
  }
  if (
    title.includes('음악제') ||
    title.includes('페스티벌') ||
    title.includes('festival') ||
    title.includes('내한') ||
    title.includes('제야음악회') ||
    title.includes('송년음악회')
  ) {
    score += 20;
  }

  // 5. 슈퍼스타 리사이틀 가중치 (+25) vs 일반 독주회 (-25)
  const isRecital = title.includes('리사이틀') || title.includes('recital') || title.includes('독주회') || title.includes('독창회');
  if (isRecital) {
    if (artistTier >= 1) {
      score += 25;
    } else {
      score -= 25;
    }
  }

  // 6. 자선/기부/환우돕기/렉처/마티네/키즈/청소년 음악회 후순위 조정 (-45)
  if (
    title.includes('소아암') ||
    title.includes('환우') ||
    title.includes('돕기') ||
    title.includes('기부') ||
    title.includes('희망콘서트') ||
    title.includes('자선') ||
    title.includes('렉처') ||
    title.includes('해설이 있는') ||
    title.includes('마티네') ||
    title.includes('브런치') ||
    title.includes('키즈') ||
    title.includes('어린이') ||
    title.includes('청소년') ||
    title.includes('유스') ||
    title.includes('초등학교')
  ) {
    score -= 45;
  }

  // 7. 소규모 학위/동문회/제자 연주회/친목회 후순위 조정 (-60)
  if (
    title.includes('동문') ||
    title.includes('제자') ||
    title.includes('학위') ||
    title.includes('연구회') ||
    title.includes('동호회') ||
    title.includes('귀국') ||
    title.includes('창단')
  ) {
    score -= 60;
  }

  return score;
}

function ConcertCalendar({ concerts }) {
  // 기본 연월 설정 (2026년 10월)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 1-indexed (10 = 10월)
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedConcertId, setExpandedConcertId] = useState(null);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  // 월의 시작 요일 및 총 일수 계산 (메모이제이션)
  const firstDayOfWeek = useMemo(() => new Date(currentYear, currentMonth - 1, 1).getDay(), [currentYear, currentMonth]);
  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth, 0).getDate(), [currentYear, currentMonth]);

  // 날짜별 공연 매핑 및 대표 공연 우선순위 자동 정렬 (메모이제이션)
  const { concertsThisMonth, concertMap } = useMemo(() => {
    const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const monthlyList = concerts.filter((c) => c.date.startsWith(monthString));

    const map = {};
    monthlyList.forEach((c) => {
      if (!map[c.date]) map[c.date] = [];
      map[c.date].push(c);
    });

    // 각 날짜별로 가장 규모가 크고 대표적인 메이저 공연이 1순위(대표 공연)로 오도록 우선순위 정렬
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => getConcertPriorityScore(b) - getConcertPriorityScore(a));
    });

    return { concertsThisMonth: monthlyList, concertMap: map };
  }, [concerts, currentYear, currentMonth]);

  const selectedConcerts = useMemo(() => {
    return selectedDate ? (concertMap[selectedDate] || []) : [];
  }, [selectedDate, concertMap]);

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-concert-50 dark:bg-hall-800 text-concert-600 dark:text-concert-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-black text-xl text-stone-900 dark:text-stone-50">
              {currentYear}년 {currentMonth}월 캘린더
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              이 달에 예정된 클래식 공연 {concertsThisMonth.length}건
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-stone-100 dark:bg-hall-850 hover:bg-stone-200 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 transition-colors shrink-0"
            aria-label="이전 달 보기"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setCurrentYear(2026);
              setCurrentMonth(10);
              setSelectedDate(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-hall-850 hover:bg-stone-200 dark:hover:bg-hall-700 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors shrink-0"
          >
            이번 달 (2026.10)
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-stone-100 dark:bg-hall-850 hover:bg-stone-200 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 transition-colors shrink-0"
            aria-label="다음 달 보기"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-500 dark:text-stone-400 pb-2 border-b border-stone-100 dark:border-hall-800">
        {daysOfWeek.map((day, idx) => (
          <div key={day} className={idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] p-1.5 rounded-xl bg-stone-50/50 dark:bg-hall-950/30 opacity-40" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
          const dayConcerts = concertMap[dateString] || [];
          const isSelected = selectedDate === dateString;
          const hasConcert = dayConcerts.length > 0;

          return (
            <div
              key={dateString}
              onClick={() => setSelectedDate(hasConcert ? (isSelected ? null : dateString) : null)}
              className={`min-h-[85px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-concert-500 bg-concert-50 dark:bg-hall-800 shadow-md ring-2 ring-concert-500/30'
                  : hasConcert
                  ? 'border-stone-300/80 dark:border-hall-700 bg-stone-50 dark:bg-hall-850 hover:border-concert-400'
                  : 'border-stone-100 dark:border-hall-900 bg-stone-50/30 dark:bg-hall-950/40 text-stone-400 dark:text-stone-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${
                  hasConcert ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-600'
                }`}>
                  {dayNumber}
                </span>

                {hasConcert && (
                  <span className="w-5 h-5 rounded-full bg-concert-500 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                    {dayConcerts.length}
                  </span>
                )}
              </div>

              {hasConcert && (
                <div className="space-y-1 mt-1">
                  {dayConcerts.slice(0, 1).map((c) => (
                    <div
                      key={c.id}
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-hall-800 text-stone-800 dark:text-stone-200 truncate border border-stone-200 dark:border-hall-700 shadow-xs"
                      title={`${c.title} (${c.venue || '공연장'})`}
                    >
                      {c.title}
                    </div>
                  ))}
                  {dayConcerts.length > 1 && (
                    <p className="text-[9px] text-concert-600 dark:text-concert-400 font-bold px-1">
                      +{dayConcerts.length - 1}개 더보기
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Date Focus Panel */}
      {selectedDate && (
        <div className="mt-6 p-5 rounded-2xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm md:text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Music className="w-4 h-4 text-concert-500" />
              <span>{formatKoreanDate(selectedDate)} 공연 ({selectedConcerts.length}건)</span>
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              선택 해제
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedConcerts.map((c) => {
              const isExpanded = expandedConcertId === c.id;
              const cleanVenue = c.venue ? c.venue.replace(/\s*\([^)]*\)$/, '').trim() : '공식 공연장';
              const hallName = c.hall || (c.venue && c.venue.match(/\(([^)]+)\)/) ? c.venue.match(/\(([^)]+)\)/)[1].trim() : null);
              const showHallBadge = hallName && hallName !== '공연홀' && !cleanVenue.includes('롯데콘서트홀');

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-hall-900 border border-stone-200 dark:border-hall-800 transition-all shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-concert-50 dark:bg-hall-800 text-concert-700 dark:text-concert-300">
                          {c.performerType || '클래식'}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate max-w-[150px]">
                          {cleanVenue}
                        </span>
                        {showHallBadge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b88648]/20 dark:bg-[#b88648]/30 text-[#85531d] dark:text-[#f3d9b1] border border-[#b88648]/40 dark:border-[#b88648]/50 shrink-0">
                            {hallName}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                        {c.time} · {Array.isArray(c.performers) ? c.performers.join(', ') : (c.performers || '')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setExpandedConcertId(isExpanded ? null : c.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        title="프로그램 곡목 보기"
                      >
                        <Music className="w-3 h-3 text-concert-500" />
                        <span>{isExpanded ? '접기' : '곡목'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-stone-400" />
                        )}
                      </button>
                      <a
                        href={getVenueOfficialUrl(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-concert-500 hover:bg-concert-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0"
                        title="공식 예매처 바로가기"
                      >
                        <span>예매</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Inline Program Details */}
                  {isExpanded && (
                    <div className="pt-2.5 border-t border-stone-100 dark:border-hall-800 text-[11px] space-y-1.5 animate-fade-in bg-stone-50/70 dark:bg-hall-950 p-2.5 rounded-lg">
                      <div className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <Music className="w-3 h-3 text-concert-500" />
                        <span>연주 프로그램 (Program)</span>
                      </div>
                      {c.pieces && c.pieces.length > 0 ? (
                        <ul className="space-y-1 pl-1">
                          {c.pieces.map((p, pIdx) => (
                            <li key={pIdx} className="font-serif text-stone-700 dark:text-stone-300 flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-concert-500 shrink-0 mt-1.5" />
                              <span className="break-keep">{p}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-stone-400 dark:text-stone-500 font-serif">
                          공식 프로그램은 공연장 및 예매처 안내를 참조해 주세요.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ConcertCalendar);
