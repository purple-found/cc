import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Music } from 'lucide-react';
import { formatKoreanDate } from '../utils/parser';

/**
 * 클래식 공연 대표성 / 규모 / 인기 우선순위 점수 계산 알고리즘
 * 1. 대형 콘서트홀(예: 롯데콘서트홀, 예술의전당 콘서트홀 2,000석+) vs 소형 리사이틀홀
 * 2. 세계적 거장 지휘자 / 슈퍼스타 솔리스트 / 최정상 악단 가중치 (+90)
 * 3. '리사이틀' 지능형 가중치: 슈퍼스타 단독 리사이틀(+80, 총 +230점급 최고 흥행), 대형 콘서트홀 리사이틀(+35)
 * 4. 대규모 오케스트라 / 교향악단 / 페스티벌 가중치 (+45)
 * 5. 개인 학위/동문회/연구회/소규모 독주회 상대적 후순위 조정 (-40)
 */
function getConcertPriorityScore(c) {
  let score = 0;
  const title = (c.title || '').toLowerCase();
  const venue = (c.venue || '').toLowerCase();
  const desc = (c.description || '').toLowerCase();
  const performers = (Array.isArray(c.performers) ? c.performers.join(' ') : (c.performers || '')).toLowerCase();
  const fullText = `${title} ${venue} ${performers} ${desc}`;

  // 1. 전국구 최고 수준 대형 콘서트홀 (2,000석+ 메인 음악당)
  const isMajorHall =
    venue.includes('롯데콘서트홀') ||
    venue.includes('예술의전당 [서울]') ||
    venue.includes('예술의전당(서울)') ||
    venue.includes('세종대극장') ||
    venue.includes('대구콘서트하우스') ||
    venue.includes('부천아트센터') ||
    venue.includes('아트센터 인천') ||
    venue.includes('콘서트홀') ||
    venue.includes('대극장') ||
    venue.includes('오페라극장') ||
    venue.includes('음악당');

  if (isMajorHall) {
    score += 60;
  } else if (venue.includes('챔버홀') || venue.includes('체임버홀') || venue.includes('소극장')) {
    score += 20;
  } else if (venue.includes('리사이틀홀') || venue.includes('인춘아트홀') || venue.includes('소강당')) {
    score += 5;
  }

  // 서울 3대 클래식 메카 가중치 (예술의전당, 롯데콘서트홀, 세종문화회관)
  const isSeoulMecca =
    venue.includes('예술의전당 [서울]') ||
    venue.includes('예술의전당(서울)') ||
    venue.includes('롯데콘서트홀') ||
    venue.includes('세종문화회관');
  if (isSeoulMecca) {
    score += 25;
  }

  // 2. 세계적 거장 및 슈퍼스타 솔리스트/지휘자/대표 국공립 악단
  const superstarKeywords = [
    '스미노 하야토', '스미노', 'sumino', 'cateen', 'hayato sumino',
    '김규연', '아르토 노라스', '노라스', 'arto noras', '프레디 켐프', '켐프',
    '조성진', 'seong-jin cho', '임윤찬', 'yunchan lim', '손열음', 'yeol eum son',
    '백건우', '김선욱', '선우예권', '박재홍', '신창용', '임동혁',
    '양성원', '송영훈', '백주영', '이경선', '김대진',
    '클라라 주미 강', '강주미', '양인모', '김봄소리', '사라 장', '장영주', '정경화', '신지아', '대니 구',
    '막심 벤게로프', 'vengerov', '파트리샤 코파친스카야', 'kopatchinskaja', '솔 가베타', 'sol gabetta',
    '한재민', '문태국', '유자 왕', 'yuja wang', '랑랑', 'lang lang', '키신', 'kissin', '트리포노프', 'trifonov',
    '파보 예르비', 'paavo järvi', 'paavo jarvi', '에스토니안', '사이먼 래틀', 'rattle',
    '정명훈', '얍 판 츠베덴', '두다멜', 'dudamel', '메켈레', 'mäkelä',
    '빈 필', '베를린 필', '런던 심포니', '로열 콘세르트', '바이에른', '라이프치히',
    '서울시향', '서울시립교향악단', 'kbs교향악단', '국립심포니', '국립오페라단'
  ];

  let hasSuperstar = false;
  for (const kw of superstarKeywords) {
    if (fullText.includes(kw)) {
      score += 90;
      hasSuperstar = true;
      break;
    }
  }

  // 3. '리사이틀' / '독주회'의 지능형 다이내믹 가중치
  // 슈퍼스타/저명 솔리스트의 리사이틀은 클래식계 최고 흥행 이벤트 (+80)
  const isRecital = title.includes('리사이틀') || title.includes('recital') || title.includes('독주회') || title.includes('독창회');
  if (isRecital) {
    if (hasSuperstar) {
      score += 80;
    } else if (isMajorHall) {
      score += 35;
    } else {
      score -= 10;
    }
  }

  // 4. 대형 오케스트라 및 음악제/페스티벌 가중치
  if (
    fullText.includes('오케스트라') ||
    fullText.includes('교향악단') ||
    fullText.includes('필하모닉') ||
    fullText.includes('orchestra') ||
    fullText.includes('philharmonic') ||
    fullText.includes('symphony')
  ) {
    score += 45;
  }
  if (
    fullText.includes('음악제') ||
    fullText.includes('페스티벌') ||
    fullText.includes('festival') ||
    fullText.includes('내한') ||
    fullText.includes('정기연주회')
  ) {
    score += 40;
  }
  if (fullText.includes('협주곡') || fullText.includes('concerto') || fullText.includes('합창단')) {
    score += 15;
  }

  // 5. 소규모 학위/동문회/제자 연주회/친목회 후순위 조정
  if (title.includes('동문') || title.includes('제자') || title.includes('학위') || title.includes('연구회') || title.includes('동호회') || title.includes('귀국')) {
    score -= 40;
  }

  return score;
}

export default function ConcertCalendar({ concerts, onSelectConcert }) {
  // 기본 연월 설정 (2026년 10월)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 1-indexed (10 = 10월)
  const [selectedDate, setSelectedDate] = useState(null);

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

  // 월의 시작 요일 및 총 일수 계산
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0(일) ~ 6(토)
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // 날짜별 공연 매핑 및 대표 공연 우선순위 자동 정렬
  const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const concertsThisMonth = concerts.filter((c) => c.date.startsWith(monthString));

  const concertMap = {};
  concertsThisMonth.forEach((c) => {
    if (!concertMap[c.date]) concertMap[c.date] = [];
    concertMap[c.date].push(c);
  });

  // 각 날짜별로 가장 규모가 크고 대표적인 메이저 공연이 1순위(대표 공연)로 오도록 우선순위 정렬
  Object.keys(concertMap).forEach((dateKey) => {
    concertMap[dateKey].sort((a, b) => getConcertPriorityScore(b) - getConcertPriorityScore(a));
  });

  const selectedConcerts = selectedDate ? (concertMap[selectedDate] || []) : [];

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
            {selectedConcerts.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectConcert(c)}
                className="p-3.5 rounded-xl bg-white dark:bg-hall-900 border border-stone-200 dark:border-hall-800 hover:border-concert-500 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {c.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate">
                    {c.time} · {c.venue}
                  </p>
                  <p className="text-[11px] text-concert-600 dark:text-concert-400 font-medium truncate mt-0.5">
                    {c.performers.join(', ')}
                  </p>
                </div>
                <button
                  className="px-3 py-1.5 rounded-lg bg-concert-50 dark:bg-hall-800 text-concert-700 dark:text-concert-300 text-xs font-semibold shrink-0"
                >
                  상세보기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
