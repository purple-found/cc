import React from 'react';
import { Calendar, MapPin, User, Music2, ExternalLink, MessageSquarePlus, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatKoreanDate } from '../utils/parser';

export default function ConcertCard({ concert, onSelect, onOpenReview }) {
  const isBlocked = concert.crawlerBlocked;

  return (
    <article className="group bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/80 dark:border-hall-800 shadow-sm hover:shadow-md hover:border-concert-400/50 dark:hover:border-concert-500/50 transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Banner Image & Status Badges */}
      <div className="relative h-44 w-full overflow-hidden bg-stone-100 dark:bg-hall-850">
        <img
          src={concert.imageUrl}
          alt={concert.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Source Badge (Gate 1 자연어) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-nowrap shrink-0">
          {isBlocked ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-900/90 text-amber-200 border border-amber-500/30 backdrop-blur-sm shrink-0">
              <ShieldAlert className="w-3 h-3 text-amber-300" />
              <span>수동 등록 공연</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-900/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>공식 전산 연동</span>
            </span>
          )}

          {concert.status && (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm shrink-0 ${
              concert.status === '매진'
                ? 'bg-rose-900/80 text-rose-200 border border-rose-500/30'
                : concert.status === '매진임박'
                ? 'bg-orange-900/80 text-orange-200 border border-orange-500/30'
                : 'bg-teal-900/80 text-teal-200 border border-teal-500/30'
            }`}>
              {concert.status}
            </span>
          )}
        </div>

        {/* Composer Tags (Over image bottom) */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 overflow-hidden">
          {concert.composers.map((comp) => (
            <span
              key={comp}
              className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white/90 text-stone-900 dark:bg-hall-950/90 dark:text-concert-300 backdrop-blur-md shrink-0 shadow-sm"
            >
              #{comp}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Info (Ensure 12px+ safety padding, Gate 4) */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title */}
          <h3 
            onClick={() => onSelect(concert)}
            className="font-serif font-bold text-base md:text-lg text-stone-900 dark:text-stone-50 line-clamp-2 hover:text-concert-600 dark:hover:text-concert-400 cursor-pointer transition-colors leading-snug"
          >
            {concert.title}
          </h3>

          {/* Date, Time, Venue */}
          <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {formatKoreanDate(concert.date)} · {concert.time}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="truncate">{concert.venue}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-concert-500 shrink-0" />
              <span className="truncate">{concert.performers.join(', ')}</span>
            </div>
          </div>

          {/* Key Piece summary */}
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-hall-800">
            <div className="flex items-start gap-1.5 text-xs text-stone-600 dark:text-stone-400">
              <Music2 className="w-3.5 h-3.5 text-concert-500 shrink-0 mt-0.5" />
              <p className="line-clamp-2 font-serif text-[11.5px] leading-relaxed">
                {concert.pieces[0]} {concert.pieces.length > 1 && `외 ${concert.pieces.length - 1}곡`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Gate 2: Zero Dead-button, nowrap) */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-hall-800">
          <button
            onClick={() => onSelect(concert)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="shrink-0">상세 프로그램</span>
          </button>

          <button
            onClick={() => onOpenReview(concert)}
            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-concert-50 hover:bg-concert-100 dark:bg-hall-800 dark:hover:bg-hall-750 text-concert-700 dark:text-concert-300 text-xs font-semibold transition-colors border border-concert-200/80 dark:border-hall-700 shrink-0"
            title="이 공연에 기대평 및 관람 후기 남기기"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="shrink-0">기대평</span>
          </button>

          <a
            href={concert.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-semibold transition-colors shrink-0 flex items-center justify-center"
            title="공식 예매처 바로가기"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
