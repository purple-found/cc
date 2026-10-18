import React from 'react';
import { Calendar, MapPin, User, Music2, ExternalLink, Info, CheckCircle2, ShieldAlert, Sparkles, Clock, Flame } from 'lucide-react';
import { formatKoreanDate, getDisplayStatus, isPastConcert, isTodayConcert } from '../utils/parser.js';
import { getVenueOfficialUrl } from '../utils/venueUrls.js';
import { analyticsService } from '../services/analyticsService.js';

export default function ConcertCard({ concert, onSelect }) {
  const isBlocked = concert.crawlerBlocked;
  const isPast = isPastConcert(concert.date, concert.time);
  const isToday = isTodayConcert(concert.date);
  const displayStatus = getDisplayStatus(concert);

  // 날짜 파싱 (예: 2026-10-05 -> 10월 5일)
  const dateParts = concert.date ? concert.date.split('-') : ['2026', '10', '01'];
  const monthDay = `${Number(dateParts[1])}.${Number(dateParts[2])}`;

  return (
    <article className="group bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 shadow-sm hover:shadow-md hover:border-concert-400 dark:hover:border-concert-500 transition-all duration-200 flex flex-col justify-between p-5 space-y-4">
      {/* Top Header: Date Block & Status Badges (No AI Image, Clean Typography) */}
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

          {/* Status Badges */}
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {/* 오늘의 당일 공연 특별 뱃지 (아직 지나가지 않은 경우) */}
            {isToday && !isPast && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white shadow-xs animate-pulse shrink-0">
                <Sparkles className="w-3 h-3 text-white" />
                <span>오늘 공연</span>
              </span>
            )}

            {displayStatus && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                displayStatus === '지나간 공연'
                  ? 'bg-stone-200/90 dark:bg-stone-300 text-stone-900 border border-stone-300 dark:border-stone-400'
                  : displayStatus === '매진'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60'
                  : displayStatus === '매진임박'
                  ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60'
              }`}>
                {displayStatus === '지나간 공연' ? (
                  <Clock className="w-3 h-3 text-stone-700 shrink-0" />
                ) : displayStatus === '예매중' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : null}
                <span>{displayStatus}</span>
              </span>
            )}
          </div>
        </div>

        {/* Composers & Genre Tag List */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-hidden pt-0.5">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-concert-50 dark:bg-hall-800 text-concert-800 dark:text-concert-300 shrink-0">
            {concert.performerType}
          </span>
          {concert.composers.map((comp) => (
            <span
              key={comp}
              className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-hall-850 text-stone-700 dark:text-stone-300 shrink-0"
            >
              #{comp.split(' ')[0]}
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
              const dashIdx = concert.title.indexOf(' - ');
              if (dashIdx !== -1) {
                const part1 = concert.title.substring(0, dashIdx);
                const part2 = concert.title.substring(dashIdx + 3);
                return (
                  <>
                    <span className="block">{part1} -</span>
                    <span className="block text-sm md:text-base font-medium text-stone-700 dark:text-stone-200 mt-0.5 line-clamp-2">
                      {part2}
                    </span>
                  </>
                );
              }
              const singleDashIdx = concert.title.indexOf('-');
              if (singleDashIdx !== -1 && singleDashIdx > 0 && singleDashIdx < concert.title.length - 1) {
                const part1 = concert.title.substring(0, singleDashIdx);
                const part2 = concert.title.substring(singleDashIdx + 1).trim();
                return (
                  <>
                    <span className="block">{part1} -</span>
                    <span className="block text-sm md:text-base font-medium text-stone-700 dark:text-stone-200 mt-0.5 line-clamp-2">
                      {part2}
                    </span>
                  </>
                );
              }
              return <span className="line-clamp-2">{concert.title}</span>;
            })()}
          </h3>

          {/* Details: Venue & Performers */}
          <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <MapPin className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="truncate max-w-[170px] sm:max-w-[210px]">
                {concert.venue ? concert.venue.replace(/\s*\([^)]*\)$/, '').trim() : '공식 공연장'}
              </span>
              {(() => {
                const cleanVenue = concert.venue ? concert.venue.replace(/\s*\([^)]*\)$/, '').trim() : '';
                if (cleanVenue.includes('롯데콘서트홀') || cleanVenue.includes('꿈의숲아트센터')) return null;
                const hallName = concert.hall || (concert.venue && concert.venue.match(/\(([^)]+)\)/) ? concert.venue.match(/\(([^)]+)\)/)[1].trim() : null);
                if (hallName && hallName !== '공연홀') {
                  return (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#b88648]/20 dark:bg-[#b88648]/30 text-[#85531d] dark:text-[#f3d9b1] border border-[#b88648]/40 dark:border-[#b88648]/50 shrink-0 shadow-xs">
                      {hallName}
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="truncate">{concert.performers.join(', ')}</span>
            </div>
          </div>

          {/* All Program Pieces directly on each card */}
          <div className="mt-3.5 pt-3 border-t border-stone-100 dark:border-hall-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
              <Music2 className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span>프로그램 (Program)</span>
            </div>
            {concert.pieces && concert.pieces.length > 0 ? (
              <ul className="space-y-1.5 pl-0.5">
                {concert.pieces.map((piece, idx) => (
                  <li
                    key={idx}
                    className="font-serif text-[11.5px] text-stone-700 dark:text-stone-300 leading-snug flex items-start gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-concert-500 shrink-0 mt-1.5" />
                    <span className="break-keep">{piece}</span>
                  </li>
                ))}
              </ul>
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
            href={getVenueOfficialUrl(concert)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analyticsService.trackTicketClick(concert, getVenueOfficialUrl(concert))}
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
