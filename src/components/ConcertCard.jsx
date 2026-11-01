import React, { useState, memo } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getDisplayStatus, isPastConcert, extractVenueAndHall } from '../utils/parser.js';
import { getVenueOfficialUrl } from '../utils/venueUrls.js';
import { analyticsService } from '../services/analyticsService.js';

function formatComposerBadge(comp) {
  if (typeof comp !== 'string' || !comp.trim()) return '클래식';
  const clean = comp.replace(/\([^)]*\)/g, '').trim();
  if (!clean || clean === '클래식 명작' || clean === '클래식' || clean === '클래식 명곡') return '클래식 명작';
  const parts = clean.split(/\s+/);
  if (parts.length > 1 && parts[parts.length - 1] === '2세') {
    return `${parts[parts.length - 2]} 2세`;
  }
  return parts[parts.length - 1];
}

function ConcertCard({ concert }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPast = isPastConcert(concert.date, concert.time);
  const displayStatus = getDisplayStatus(concert);
  const { cleanVenue, hallName, showHallBadge } = extractVenueAndHall(concert);
  const officialUrl = getVenueOfficialUrl(concert);

  // 날짜 파싱 (예: 2026-10-05 -> 10.05)
  const dateParts = concert.date ? concert.date.split('-') : ['2026', '10', '01'];
  const monthDay = `${String(Number(dateParts[1])).padStart(2, '0')}.${String(Number(dateParts[2])).padStart(2, '0')}`;

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
    <article className="group bg-white dark:bg-hall-900 rounded-xl border border-stone-200/90 dark:border-hall-800 hover:border-stone-400 dark:hover:border-hall-600 transition-colors duration-200 flex flex-col justify-between p-5 space-y-4">
      {/* Top Header: Date Block & Minimal Status Tag */}
      <div className="space-y-2.5 pb-3 border-b border-stone-100 dark:border-hall-800">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className={`font-serif font-bold text-xl tracking-tight ${
              isPast ? 'text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-100'
            }`}>
              {monthDay}
            </span>
            <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
              {concert.time}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {displayStatus === '오늘공연' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-semibold bg-concert-700 text-white shrink-0">
                오늘 공연
              </span>
            )}
            {displayStatus === '공연예정' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-medium bg-stone-100 dark:bg-hall-850 text-stone-600 dark:text-stone-400 shrink-0">
                공연 예정
              </span>
            )}
            {displayStatus === '지나간공연' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-medium bg-stone-100 dark:bg-hall-850 text-stone-400 dark:text-stone-500 shrink-0">
                지난 공연
              </span>
            )}
          </div>
        </div>

        {/* Formation & Composer Tags (No Hashtags) */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
          <span className="px-2.5 py-0.5 rounded-sm text-[11px] font-semibold bg-[#f5efe6] dark:bg-hall-800 text-[#6e4726] dark:text-concert-300 shrink-0">
            {concert.performerType || '클래식'}
          </span>
          {(Array.isArray(concert.composers) ? concert.composers : (concert.composers ? [concert.composers] : ['클래식 명작'])).slice(0, 3).map((comp, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-sm text-[11px] font-medium bg-stone-100/80 dark:bg-hall-850 text-stone-600 dark:text-stone-300 shrink-0"
            >
              {formatComposerBadge(comp)}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-serif font-bold text-[15px] md:text-base text-stone-900 dark:text-stone-50 leading-snug tracking-tight">
            {(() => {
              const safeTitle = concert.title || '클래식 연주회';
              const dashIdx = safeTitle.indexOf(' - ');
              if (dashIdx !== -1) {
                const part1 = safeTitle.substring(0, dashIdx);
                const part2 = safeTitle.substring(dashIdx + 3);
                return (
                  <>
                    <span className="block">{part1}</span>
                    <span className="block text-xs md:text-sm font-normal text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2">
                      {part2}
                    </span>
                  </>
                );
              }
              return <span className="line-clamp-2">{safeTitle}</span>;
            })()}
          </h3>

          {/* Playbill Metadata Table (Typographic Labels instead of Icons) */}
          <dl className="mt-3.5 space-y-1.5 text-xs">
            <div className="flex items-baseline gap-2.5 min-w-0">
              <dt className="text-[11px] text-stone-400 dark:text-stone-500 font-medium w-7 shrink-0">
                장소
              </dt>
              <dd className="flex items-center gap-1.5 flex-wrap min-w-0 text-stone-700 dark:text-stone-200 font-medium">
                <span className="truncate max-w-[165px] sm:max-w-[195px]">
                  {cleanVenue || '공식 공연장'}
                </span>
                {showHallBadge && (
                  <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-stone-100 dark:bg-hall-800 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-hall-700 shrink-0">
                    {hallName}
                  </span>
                )}
              </dd>
            </div>

            <div className="flex items-baseline gap-2.5 min-w-0">
              <dt className="text-[11px] text-stone-400 dark:text-stone-500 font-medium w-7 shrink-0">
                출연
              </dt>
              <dd className="truncate text-stone-600 dark:text-stone-300">
                {Array.isArray(concert.performers) ? concert.performers.join(', ') : (concert.performers || '출연진 정보')}
              </dd>
            </div>

            <div className="flex items-baseline gap-2.5 min-w-0">
              <dt className="text-[11px] text-stone-400 dark:text-stone-500 font-medium w-7 shrink-0">
                티켓
              </dt>
              <dd className="truncate text-stone-600 dark:text-stone-300">
                {concert.price || '예매처 안내 참조'}
              </dd>
            </div>
          </dl>

          {/* Program Pieces Section */}
          <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-hall-800">
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-2">
              <span>연주 프로그램</span>
              {piecesList.length > 0 && (
                <span className="text-[10px] font-normal text-stone-400 dark:text-stone-500">
                  {piecesList.length}곡
                </span>
              )}
            </div>

            {piecesList.length > 0 ? (
              <div className="space-y-2">
                <ul className="space-y-1.5">
                  {displayedPieces.map((piece, idx) => (
                    <li
                      key={idx}
                      className="font-serif text-[11.5px] text-stone-700 dark:text-stone-300 leading-snug flex items-start gap-2"
                    >
                      <span className="text-stone-300 dark:text-stone-600 select-none shrink-0">—</span>
                      <span className="break-keep">{piece}</span>
                    </li>
                  ))}
                </ul>

                {hasManyPieces && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="w-full py-1.5 px-3 rounded-md bg-stone-50 hover:bg-stone-100 dark:bg-hall-850 dark:hover:bg-hall-800 text-stone-600 dark:text-stone-300 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer border border-stone-200/60 dark:border-hall-800 select-none"
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? '프로그램 접기' : `외 ${piecesList.length - 3}곡 더보기`}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="font-serif text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
                상세 프로그램은 공연장 안내 참조
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-stone-100 dark:border-hall-800">
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analyticsService.trackTicketClick(concert, officialUrl)}
            className="w-full py-2 px-3.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-50 dark:text-stone-100 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            title="공연장 공식 홈페이지 / 예매처 바로가기"
          >
            <span>예매 및 상세정보</span>
            <ExternalLink className="w-3 h-3 opacity-75" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default memo(ConcertCard);

