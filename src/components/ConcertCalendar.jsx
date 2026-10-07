import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Music } from 'lucide-react';
import { formatKoreanDate } from '../utils/parser';

export default function ConcertCalendar({ concerts, onSelectConcert }) {
  // 기본 연월 설정 (2025년 5월)
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(5); // 1-indexed (5 = 5월)
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

  // 날짜별 공연 매핑
  const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const concertsThisMonth = concerts.filter((c) => c.date.startsWith(monthString));

  const concertMap = {};
  concertsThisMonth.forEach((c) => {
    if (!concertMap[c.date]) concertMap[c.date] = [];
    concertMap[c.date].push(c);
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
              {currentYear}년 {currentMonth}월 클래식 캘린더
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
              setCurrentYear(2025);
              setCurrentMonth(5);
              setSelectedDate(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-hall-850 hover:bg-stone-200 dark:hover:bg-hall-700 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors shrink-0"
          >
            이번 달
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
                      title={c.title}
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
