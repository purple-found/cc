import React from 'react';
import { Calendar, MapPin, ExternalLink, ChevronRight, Music2 } from 'lucide-react';
import { formatKoreanDate } from '../utils/parser.js';
import { getVenueOfficialUrl } from '../utils/venueUrls.js';
import { analyticsService } from '../services/analyticsService.js';

export default function ConcertCompactList({ concerts = [], onSelectConcert }) {
  if (concerts.length === 0) {
    return (
      <div className="p-16 text-center bg-white dark:bg-hall-900 rounded-3xl border border-stone-200 dark:border-hall-800">
        <p className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
          선택한 조건의 클래식 공연이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 shadow-sm overflow-hidden transition-colors">
      <div className="divide-y divide-stone-100 dark:divide-hall-800">
        {concerts.map((concert) => {
          const cleanVenue = concert.venue ? concert.venue.replace(/\s*\([^)]*\)$/, '').trim() : '공식 공연장';
          const hallName = concert.hall || (concert.venue && concert.venue.match(/\(([^)]+)\)/) ? concert.venue.match(/\(([^)]+)\)/)[1].trim() : null);
          const showHallBadge = hallName && hallName !== '공연홀' && !cleanVenue.includes('롯데콘서트홀') && !cleanVenue.includes('꿈의숲아트센터');

          return (
            <div
              key={concert.id}
              className="p-3.5 sm:p-4 hover:bg-stone-50/80 dark:hover:bg-hall-850/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Left: Date & Title & Performers */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                {/* Date Badge */}
                <div className="flex sm:flex-col items-center justify-center bg-concert-50 dark:bg-hall-800 text-concert-800 dark:text-concert-300 rounded-xl px-2.5 py-1.5 sm:w-16 shrink-0 border border-concert-200/60 dark:border-hall-700 text-center">
                  <span className="text-[11px] sm:text-xs font-bold leading-tight">
                    {concert.date ? concert.date.slice(5).replace('-', '.') : ''}
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-stone-400 ml-1.5 sm:ml-0 font-medium">
                    {concert.time || '19:30'}
                  </span>
                </div>

                {/* Main Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-hall-750 text-stone-600 dark:text-stone-300">
                      {concert.performerType || '클래식'}
                    </span>
                    {/* Venue & Hall */}
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium truncate max-w-[160px] sm:max-w-none">
                      {cleanVenue}
                    </span>
                    {showHallBadge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b88648]/20 dark:bg-[#b88648]/30 text-[#85531d] dark:text-[#f3d9b1] border border-[#b88648]/40 dark:border-[#b88648]/50 shrink-0">
                        {hallName}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4
                    onClick={() => onSelectConcert(concert)}
                    className="font-serif font-bold text-sm sm:text-[15px] text-stone-900 dark:text-stone-100 group-hover:text-concert-600 dark:group-hover:text-concert-400 cursor-pointer transition-colors truncate"
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
                  onClick={() => onSelectConcert(concert)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="프로그램 안내 보기"
                >
                  <Music2 className="w-3.5 h-3.5 text-concert-500" />
                  <span>프로그램</span>
                  <ChevronRight className="w-3 h-3 text-stone-400" />
                </button>

                <a
                  href={getVenueOfficialUrl(concert)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => analyticsService.trackTicketClick(concert, getVenueOfficialUrl(concert))}
                  className="px-3 py-1.5 rounded-lg bg-concert-500 hover:bg-concert-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                  title="공식 예매처 바로가기"
                >
                  <span>예매처</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
