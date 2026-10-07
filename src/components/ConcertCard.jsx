import React from 'react';
import { Calendar, MapPin, User, Music2, ExternalLink, MessageSquarePlus, Info, CheckCircle2, ShieldAlert, Sparkles, Clock } from 'lucide-react';
import { formatKoreanDate, getDisplayStatus, isPastConcert } from '../utils/parser.js';

export default function ConcertCard({ concert, onSelect, onOpenReview }) {
  const isBlocked = concert.crawlerBlocked;
  const isPast = isPastConcert(concert.date, concert.time);
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
            {isBlocked ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60 shrink-0">
                <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>수동 등록</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>공식 연동</span>
              </span>
            )}

            {displayStatus && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                displayStatus === '지나간 공연'
                  ? 'bg-stone-100 dark:bg-hall-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-hall-700'
                  : displayStatus === '매진'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60'
                  : displayStatus === '매진임박'
                  ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900/60'
                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/60'
              }`}>
                {displayStatus}
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
          {/* Title */}
          <h3 
            onClick={() => onSelect(concert)}
            className="font-serif font-bold text-base md:text-lg text-stone-900 dark:text-stone-50 line-clamp-2 hover:text-concert-600 dark:hover:text-concert-400 cursor-pointer transition-colors leading-snug"
          >
            {concert.title}
          </h3>

          {/* Details: Venue & Performers */}
          <div className="mt-3 space-y-1.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
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
