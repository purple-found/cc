import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 클래식 무대와 음악의 정통성을 한눈에 상징하는 '클래식 보면대 & 오푸스 악보 & 지휘봉':
 * 1. 무대 중앙의 보면대(Music Stand) 위에 당당하게 펼쳐진 클래식 오케스트라 총보 악보 책 (Opus Score)
 * 2. 섬세한 오선지 선율과 견고한 무대 삼각 다리 베이스 (Tripod Base & Shelf)
 * 3. 악보 위를 가로지르며 오케스트라를 하나로 지휘하는 마에스트로의 지휘봉 (Conductor's Baton)
 * 
 * 규격: Lucide 및 SVG 표준 벡터 규격 (viewBox 0 0 24 24, strokeWidth 1.8, strokeLinecap round)
 */
export default function OrchestraConductorIcon({ className = 'w-6 h-6', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 1. 보면대 위 펼쳐진 클래식 악보 책 (Open Opus Score) */}
      <path d="M4 5h7c.8 0 1.2.6 1.2 1.4v7.8c0-.8-.6-1.4-1.2-1.4H4V5z" />
      <path d="M20 5h-7c-.8 0-1.2.6-1.2 1.4v7.8c0-.8.6-1.4 1.2-1.4h7V5z" />
      {/* 악보 오선지 라인 */}
      <path d="M6 7.8h3.8" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M6 10.2h3.8" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M14.2 7.8h3.8" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M14.2 10.2h3.8" strokeWidth="1.2" strokeOpacity="0.75" />

      {/* 2. 보면대 받침 선반 & 중심 기둥 (Stand Shelf & Telescopic Pole) */}
      <path d="M2.5 14.2h19" strokeWidth="2" />
      <path d="M12 14.2v6.5" strokeWidth="2" />

      {/* 3. 보면대 삼각 다리 베이스 (Tripod Base) */}
      <path d="M7.5 21.5l4.5-.8 4.5.8" strokeWidth="2" />

      {/* 4. 마에스트로의 지휘봉 (Conductor's Baton) */}
      <path d="M4.5 17.5L19.5 2.5" strokeWidth="2" />
      <circle cx="4.5" cy="17.5" r="1.1" fill="currentColor" />
    </svg>
  );
}
