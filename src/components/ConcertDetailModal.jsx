import React, { useEffect } from 'react';
import { X, Calendar, MapPin, User, Music, Tag, ExternalLink, MessageSquarePlus, ShieldAlert, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { formatKoreanDate, getDisplayStatus, isPastConcert, isTodayConcert } from '../utils/parser.js';
import { getVenueOfficialUrl } from '../utils/venueUrls.js';

export default function ConcertDetailModal({ concert, onClose, onOpenReview, relatedPosts }) {
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

  const isPast = isPastConcert(concert.date, concert.time);
  const isToday = isTodayConcert(concert.date);
  const displayStatus = getDisplayStatus(concert);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-hall-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Clean Classical Typography (No AI image) */}
        <div className="relative p-6 sm:p-8 bg-stone-900 text-white rounded-t-3xl border-b border-stone-800">
          {/* Close button (Esc / Click) */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors"
            aria-label="모달 닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Badges */}
          <div className="space-y-3 pr-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-concert-500 text-white">
                {concert.performerType}
              </span>
              {isToday && !isPast && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>오늘 공연</span>
                </span>
              )}
              {displayStatus && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  displayStatus === '지나간 공연'
                    ? 'bg-stone-200 text-stone-900 border border-stone-300'
                    : displayStatus === '예매중'
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                }`}>
                  {displayStatus === '지나간 공연' ? (
                    <Clock className="w-3.5 h-3.5 text-stone-700 shrink-0" />
                  ) : displayStatus === '예매중' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : null}
                  <span>{displayStatus}</span>
                </span>
              )}
            </div>

            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white leading-snug">
              {(() => {
                const dashIdx = concert.title.indexOf(' - ');
                if (dashIdx !== -1) {
                  const part1 = concert.title.substring(0, dashIdx);
                  const part2 = concert.title.substring(dashIdx + 3);
                  return (
                    <>
                      <span className="block">{part1} -</span>
                      <span className="block text-lg sm:text-xl font-medium text-stone-200 mt-1">
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
                      <span className="block text-lg sm:text-xl font-medium text-stone-200 mt-1">
                        {part2}
                      </span>
                    </>
                  );
                }
                return concert.title;
              })()}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Facts Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-800 text-xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-concert-500 shrink-0" />
              <div>
                <span className="text-stone-400 dark:text-stone-500 block text-[10px]">공연 일시</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {formatKoreanDate(concert.date)} · {concert.time}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-concert-500 shrink-0" />
              <div>
                <span className="text-stone-400 dark:text-stone-500 block text-[10px]">공연 장소</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {concert.venue} ({concert.city})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-concert-500 shrink-0" />
              <div>
                <span className="text-stone-400 dark:text-stone-500 block text-[10px]">출연 / 협연</span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {concert.performers.join(', ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-concert-500 shrink-0" />
              <div>
                <span className="text-stone-400 dark:text-stone-500 block text-[10px]">티켓 가격</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
                  {concert.price}
                </span>
              </div>
            </div>
          </div>

          {/* Program List */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Music className="w-4 h-4 text-concert-500" />
              <span>연주 프로그램 (작품 목록)</span>
            </h3>

            <div className="space-y-2">
              {concert.pieces.map((piece, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200/80 dark:border-hall-800 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-concert-100 dark:bg-hall-700 text-concert-700 dark:text-concert-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-xs sm:text-sm font-serif font-medium text-stone-800 dark:text-stone-200 leading-relaxed">
                    {piece}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concert Description */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              공연 소개
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed break-keep">
              {concert.description}
            </p>
          </div>

          {/* Source origin info */}
          <div className="p-3 rounded-xl bg-stone-100 dark:bg-hall-850 text-xs text-stone-500 dark:text-stone-400">
            <strong>데이터 출처:</strong> {concert.sourceHall} ({concert.source})
          </div>

          {/* Community Reviews preview for this concert */}
          <div className="pt-2 border-t border-stone-200 dark:border-hall-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                이 공연에 남겨진 기대평 & 후기 ({relatedPosts.length}개)
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenReview(concert);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-concert-600 dark:text-concert-400 hover:underline"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>글 작성하기</span>
              </button>
            </div>

            {relatedPosts.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 py-3 text-center">
                아직 등록된 후기나 기대평이 없습니다. 첫 번째 이야기를 남겨보세요!
              </p>
            ) : (
              <div className="space-y-2">
                {relatedPosts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-800 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{p.title}</span>
                      <span className="text-[10px] text-stone-400">{p.author}</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 line-clamp-2">{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-hall-800">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-colors shrink-0"
            >
              닫기
            </button>

            <a
              href={getVenueOfficialUrl(concert)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-md shrink-0"
              title="해당 공연장의 공식 홈페이지 / 예매 시스템으로 이동합니다"
            >
              <span>공연장 공식 예매처 이동</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
