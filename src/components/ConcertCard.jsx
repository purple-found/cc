import React, { useState, memo } from 'react';
import { MapPin, User, Music2, ExternalLink, Sparkles, Clock, Ticket, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { getDisplayStatus, isPastConcert, isTodayConcert, extractVenueAndHall } from '../utils/parser.js';
import { getVenueOfficialUrl } from '../utils/venueUrls.js';
import { analyticsService } from '../services/analyticsService.js';

function formatComposerBadge(comp) {
  if (typeof comp !== 'string' || !comp.trim()) return '클래식';
  const clean = comp.trim();
  if (clean === '클래식 명작' || clean === '클래식') return clean;
  const parts = clean.split(/\s+/);
  if (parts.length > 1 && parts[parts.length - 1] === '2세') {
    return `${parts[parts.length - 2]} 2세`;
  }
  return parts[parts.length - 1];
}

function ConcertCard({ concert }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPast = isPastConcert(concert.date, concert.time);
  const isToday = isTodayConcert(concert.date);
  const displayStatus = getDisplayStatus(concert);
  const { cleanVenue, hallName, showHallBadge } = extractVenueAndHall(concert);
  const officialUrl = getVenueOfficialUrl(concert);

  // 날짜 파싱 (예: 2026-10-05 -> 10월 5일)
  const dateParts = concert.date ? concert.date.split('-') : ['2026', '10', '01'];
  const monthDay = `${Number(dateParts[1])}.${Number(dateParts[2])}`;

  // 곡목 데이터 정규화 (배열 또는 줄바꿈 텍스트)
  const piecesList = Array.isArray(concert.pieces) && concert.pieces.length > 0
    ? concert.pieces
    : (typeof concert.program === 'string' && concert.program.trim().length > 0
        ? concert.program.split('\n').map(p => p.trim()).filter(Boolean)
        : []);

  // 4줄(곡목) 이상인 경우 3개만 먼저 보여주고 '더보기' 펼치기 버튼 활성화
  const hasManyPieces = piecesList.length >= 4;
  const displayedPieces = hasManyPieces && !isExpanded ? piecesList.slice(0, 3) : piecesList;

  return (
    <article className="group bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 shadow-sm hover:shadow-md hover:border-concert-400 dark:hover:border-concert-500 transition-all duration-200 flex flex-col justify-between p-5 space-y-4">
      {/* Top Header: Date Block & Status Badges */}
      <div className="space-y-3 pb-3 border-b border-stone-100 dark:border-hall-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Elegant Date Badge */}
          <div className="flex items-center gap-2">
            <span className={`font-serif font-black text-xl tracking-tight ${
              isPast ? 'text-stone-400 dark:text-stone-500' : 'text-concert-700 dark:text-concert-300'
            }`}>
              {monthDay}
            </span>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
              {concert.time}
            </span>
          </div>

          {/* Status Badge: 공연예정 / 오늘공연 / 지나간공연 단일 표준 배지 */}
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {displayStatus === '오늘공연' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-xs shrink-0 animate-pulse">
                <Sparkles className="w-3 h-3 text-white shrink-0" />
                <span>오늘공연</span>
              </span>
            )}
            {displayStatus === '공연예정' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
                <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>공연예정</span>
              </span>
            )}
            {displayStatus === '지나간공연' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-stone-200/90 dark:bg-stone-300 text-stone-900 border border-stone-300 dark:border-stone-400 shrink-0">
                <Clock className="w-3 h-3 text-stone-700 shrink-0" />
                <span>지나간공연</span>
              </span>
            )}
          </div>
        </div>

        {/* Composers & Genre Tag List */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden pt-0.5">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-concert-50 dark:bg-hall-800 text-concert-800 dark:text-concert-300 shrink-0">
            {concert.performerType || '클래식'}
          </span>
          {(Array.isArray(concert.composers) ? concert.composers : (concert.composers ? [concert.composers] : ['클래식 명작'])).map((comp, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-hall-850 text-stone-700 dark:text-stone-300 shrink-0"
            >
              #{formatComposerBadge(comp)}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Title: Break line after '-' */}
          <h3 
            className="font-serif font-bold text-base md:text-lg text-stone-900 dark:text-stone-50 leading-snug"
          >
            {(() => {
              const safeTitle = concert.title || '클래식 연주회';
              const dashIdx = safeTitle.indexOf(' - ');
              if (dashIdx !== -1) {
                const part1 = safeTitle.substring(0, dashIdx);
                const part2 = safeTitle.substring(dashIdx + 3);
                return (
                  <>
                    <span className="block">{part1} -</span>
                    <span className="block text-sm md:text-base font-medium text-stone-700 dark:text-stone-200 mt-0.5 line-clamp-2">
                      {part2}
                    </span>
                  </>
                );
              }
              const singleDashIdx = safeTitle.indexOf('-');
              if (singleDashIdx !== -1 && singleDashIdx > 0 && singleDashIdx < safeTitle.length - 1) {
                const part1 = safeTitle.substring(0, singleDashIdx);
                const part2 = safeTitle.substring(singleDashIdx + 1).trim();
                return (
                  <>
                    <span className="block">{part1} -</span>
                    <span className="block text-sm md:text-base font-medium text-stone-700 dark:text-stone-200 mt-0.5 line-clamp-2">
                      {part2}
                    </span>
                  </>
                );
              }
              return <span className="line-clamp-2">{safeTitle}</span>;
            })()}
          </h3>

          {/* Details: Venue & Performers */}
          <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <MapPin className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="truncate max-w-[170px] sm:max-w-[210px]">
                {cleanVenue || '공식 공연장'}
              </span>
              {showHallBadge && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#b88648]/20 dark:bg-[#b88648]/30 text-[#85531d] dark:text-[#f3d9b1] border border-[#b88648]/40 dark:border-[#b88648]/50 shrink-0 shadow-xs">
                  {hallName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="truncate">
                {Array.isArray(concert.performers) ? concert.performers.join(', ') : (concert.performers || '출연진 정보')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="truncate font-semibold text-stone-700 dark:text-stone-200">
                {concert.price || '공식 예매처 참조'}
              </span>
            </div>
          </div>

          {/* Program Pieces with 4+ lines Collapsible Toggle */}
          <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-hall-800">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
              <div className="flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-concert-500 shrink-0" />
                <span>프로그램 (Program)</span>
              </div>
              {piecesList.length > 0 && (
                <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500">
                  총 {piecesList.length}곡
                </span>
              )}
            </div>

            {piecesList.length > 0 ? (
              <div className="space-y-2">
                <ul className="space-y-1.5 pl-0.5">
                  {displayedPieces.map((piece, idx) => (
                    <li
                      key={idx}
                      className="font-serif text-[11.5px] text-stone-700 dark:text-stone-300 leading-snug flex items-start gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-concert-500 shrink-0 mt-1.5" />
                      <span className="break-keep">{piece}</span>
                    </li>
                  ))}
                </ul>

                {hasManyPieces && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="w-full py-1.5 px-3 rounded-lg bg-stone-100 hover:bg-stone-200/80 dark:bg-hall-800 dark:hover:bg-hall-750 text-stone-700 dark:text-stone-200 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-stone-200/70 dark:border-hall-700 select-none"
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? '곡목 접기' : `외 ${piecesList.length - 3}개 곡목 더보기`}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="font-serif text-[11px] leading-relaxed text-stone-400 dark:text-stone-500 pl-0.5">
                공식 프로그램은 공연장 및 예매처 안내 참조
              </p>
            )}
          </div>
        </div>

        {/* Action Button: 공식 예매처 바로가기 */}
        <div className="pt-2.5 border-t border-stone-100 dark:border-hall-800">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analyticsService.trackTicketClick(concert, officialUrl)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-concert-500 hover:bg-concert-600 active:scale-[0.99] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-concert-500/20"
            title="공연장 공식 홈페이지 / 예매처 바로가기"
          >
            <span>공식 예매처 바로가기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default memo(ConcertCard);

