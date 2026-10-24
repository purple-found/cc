import React, { useEffect } from 'react';
import { X, Music2, ExternalLink, Calendar, MapPin, User, Ticket } from 'lucide-react';
import { formatKoreanDate } from '../utils/parser.js';
import { getVenueOfficialUrl } from '../utils/venueUrls.js';
import { analyticsService } from '../services/analyticsService.js';

export default function ConcertDetailModal({ concert, onClose }) {
  // ESC 키 이벤트 바인딩 (Gate 2 준수)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!concert) return null;

  const cleanVenue = concert.venue ? concert.venue.replace(/\s*\([^)]*\)$/, '').trim() : '공식 공연장';
  const hallName = concert.hall || (concert.venue && concert.venue.match(/\(([^)]+)\)/) ? concert.venue.match(/\(([^)]+)\)/)[1].trim() : null);
  const showHallBadge = hallName && hallName !== '공연홀' && !cleanVenue.includes('롯데콘서트홀') && !cleanVenue.includes('꿈의숲아트센터');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-hall-900 rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl transition-all flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: 공연 정보 요약 */}
        <div className="relative p-5 sm:p-6 bg-stone-900 text-white rounded-t-3xl border-b border-stone-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors shrink-0 cursor-pointer"
            aria-label="모달 닫기"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pr-8 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-concert-500 text-white shrink-0">
                {concert.performerType || '클래식'}
              </span>
              <span className="text-xs text-stone-300 font-medium">
                {formatKoreanDate(concert.date)} · {concert.time || '19:30'}
              </span>
            </div>

            <h3 className="font-serif font-bold text-base sm:text-lg text-white leading-snug break-keep">
              {concert.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-stone-300 flex-wrap pt-0.5">
              <span>{cleanVenue}</span>
              {showHallBadge && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#b88648]/30 text-[#f3d9b1] border border-[#b88648]/50 shrink-0">
                  {hallName}
                </span>
              )}
              {concert.performers && concert.performers.length > 0 && (
                <span className="text-stone-400 truncate max-w-[240px]">
                  · {Array.isArray(concert.performers) ? concert.performers.join(', ') : concert.performers}
                </span>
              )}
            </div>

            {concert.price && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold pt-0.5">
                <Ticket className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{concert.price}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body: 오직 프로그램(작품 목록)만 순수하게 표시 */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-hall-800">
            <Music2 className="w-4 h-4 text-concert-500 shrink-0" />
            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
              연주 프로그램 (Program)
            </h4>
          </div>

          <div className="space-y-2.5">
            {concert.pieces && concert.pieces.length > 0 ? (
              concert.pieces.map((piece, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-stone-50 dark:bg-hall-850 border border-stone-200/80 dark:border-hall-800 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-concert-100 dark:bg-hall-700 text-concert-700 dark:text-concert-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-xs sm:text-sm font-serif font-medium text-stone-800 dark:text-stone-200 leading-relaxed break-keep">
                    {piece}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-stone-50 dark:bg-hall-850 border border-dashed border-stone-200 dark:border-hall-800 text-center space-y-2">
                <Music2 className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                <p className="font-serif text-xs text-stone-600 dark:text-stone-400 font-medium">
                  공식 전산망에 등록된 프로그램 목록이 없습니다.
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500">
                  상세 연주곡 및 프로그램 안내는 공식 예매처 페이지를 확인해 주세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: 닫기 & 공식 예매처 버튼 */}
        <div className="p-4 sm:p-5 bg-stone-50 dark:bg-hall-850 rounded-b-3xl border-t border-stone-200 dark:border-hall-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 dark:bg-hall-800 dark:hover:bg-hall-700 border border-stone-200 dark:border-hall-700 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors shrink-0 cursor-pointer"
          >
            닫기
          </button>

          <a
            href={getVenueOfficialUrl(concert)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analyticsService.trackTicketClick(concert, getVenueOfficialUrl(concert))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer"
            title="공연장 공식 홈페이지 / 예매처 바로가기"
          >
            <span>공식 예매처</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
