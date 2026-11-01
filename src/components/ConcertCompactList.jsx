import React, { useState, memo } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { extractVenueAndHall } from '../utils/parser.js';
import { getVenueOfficialUrl } from '../utils/venueUrls.js';
import { analyticsService } from '../services/analyticsService.js';

function ConcertCompactList({ concerts = [] }) {
  const [expandedConcertId, setExpandedConcertId] = useState(null);

  if (concerts.length === 0) {
    return (
      <div className="p-14 text-center bg-white dark:bg-hall-900 rounded-xl border border-stone-200 dark:border-hall-800">
        <p className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
          선택한 조건에 해당하는 공연이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-hall-900 rounded-xl border border-stone-200/90 dark:border-hall-800 overflow-hidden transition-colors">
      <div className="divide-y divide-stone-100 dark:divide-hall-800">
        {concerts.map((concert) => {
          const isExpanded = expandedConcertId === concert.id;
          const { cleanVenue, hallName, showHallBadge } = extractVenueAndHall(concert);

          return (
            <div
              key={concert.id}
              className="p-4 hover:bg-stone-50/70 dark:hover:bg-hall-850/50 transition-colors group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Date & Title & Performers */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  {/* Date Block */}
                  <div className="flex sm:flex-col items-baseline sm:items-center justify-center sm:w-14 shrink-0 text-left sm:text-center">
                    <span className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                      {concert.date ? concert.date.slice(5).replace('-', '.') : ''}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 ml-1.5 sm:ml-0 font-normal">
                      {concert.time || '19:30'}
                    </span>
                  </div>

                  {/* Main Info */}
                  <div className="min-w-0 flex-1 border-l border-stone-100 dark:border-hall-800 pl-3.5">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#f5efe6] dark:bg-hall-800 text-[#6e4726] dark:text-concert-300">
                        {concert.performerType || '클래식'}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate max-w-[160px] sm:max-w-none">
                        {cleanVenue}
                      </span>
                      {showHallBadge && (
                        <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-stone-100 dark:bg-hall-800 text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-hall-700 shrink-0">
                          {hallName}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => setExpandedConcertId(isExpanded ? null : concert.id)}
                      className="font-serif font-bold text-sm sm:text-[15px] text-stone-900 dark:text-stone-100 group-hover:text-concert-700 dark:group-hover:text-concert-300 cursor-pointer transition-colors truncate"
                      title={concert.title}
                    >
                      {concert.title}
                    </h4>

                    {/* Performers snippet */}
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {Array.isArray(concert.performers) ? concert.performers.join(', ') : concert.performers}
                    </p>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setExpandedConcertId(isExpanded ? null : concert.id)}
                    className="px-3 py-1.5 rounded-md bg-stone-100/80 hover:bg-stone-200/70 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title={isExpanded ? '프로그램 접기' : '프로그램 보기'}
                  >
                    <span>{isExpanded ? '접기' : '프로그램'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-stone-400" />
                    )}
                  </button>

                  <a
                    href={getVenueOfficialUrl(concert)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => analyticsService.trackTicketClick(concert, getVenueOfficialUrl(concert))}
                    className="px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-50 dark:text-stone-100 text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
                    title="공식 예매처 바로가기"
                  >
                    <span>예매처</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>
                </div>
              </div>

              {/* Inline Program Details Drawer */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-hall-800 bg-stone-50/60 dark:bg-hall-950/60 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-[11px] text-stone-500 dark:text-stone-400">
                      연주 프로그램
                    </span>
                    {concert.price && (
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        티켓: {concert.price}
                      </span>
                    )}
                  </div>

                  {concert.pieces && concert.pieces.length > 0 ? (
                    <ul className="space-y-1.5">
                      {concert.pieces.map((piece, pIdx) => (
                        <li key={pIdx} className="font-serif text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
                          <span className="text-stone-300 dark:text-stone-600 select-none shrink-0">—</span>
                          <span className="break-keep">{piece}</span>
                        </li>
                      ))}
                    </ul>
                  ) : concert.program ? (
                    <p className="font-serif text-xs text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                      {concert.program}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 dark:text-stone-500 font-serif">
                      상세 프로그램은 공연장 안내를 참조해 주세요.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ConcertCompactList);
