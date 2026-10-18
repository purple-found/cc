import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 클래식 무대의 정수를 상징하는 '클래식 보면대 & 온전한 오푸스 악보 & 우측 지휘봉':
 * 1. 악보 책 (Open Opus Score): 보면대 위에 당당하고 온전하게 펼쳐진 두 페이지의 클래식 악보와 오선지 선율 (취소선/X표 연상 제로!)
 * 2. 보면대 구조 (Music Stand & Tripod): 단단한 가로 선반과 지지대, 그리고 무대 삼각 다리 베이스
 * 3. 마에스트로의 지휘봉 (Conductor's Baton): 악보를 가로지르지 않고 보면대 우측에 정갈하게 기대어 세워진 품격 있는 실루엣
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
      {/* 1. 보면대 위 온전하게 펼쳐진 오푸스 악보 (Open Opus Score) - 중앙에 취소선이 전혀 없음! */}
      {/* 좌측 페이지 */}
      <path d="M3.5 4.8h6.5c.8 0 1.2.6 1.2 1.4v7.6c0-.8-.6-1.4-1.2-1.4H3.5V4.8z" fill="currentColor" fillOpacity="0.12" />
      {/* 우측 페이지 */}
      <path d="M18 4.8h-6.5c-.8 0-1.2.6-1.2 1.4v7.6c0-.8.6-1.4 1.2-1.4H18V4.8z" fill="currentColor" fillOpacity="0.12" />
      
      {/* 악보 오선지 라인 */}
      <path d="M5.5 7.5h3.2" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M5.5 9.8h3.2" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M13 7.5h3.2" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M13 9.8h3.2" strokeWidth="1.2" strokeOpacity="0.75" />

      {/* 2. 보면대 받침 선반 & 기둥 (Stand Shelf & Telescopic Pole) */}
      <path d="M2.5 13.8h16.5" strokeWidth="2" />
      <path d="M10.8 13.8v7" strokeWidth="2" />

      {/* 3. 보면대 삼각 다리 베이스 (Tripod Base) */}
      <path d="M6 21.5l4.8-.8 4.8.8" strokeWidth="2" />

      {/* 4. 마에스트로의 지휘봉 (Conductor's Baton): 악보 중앙이 아니라 보면대 우측 옆에 단정하게 세워진 형태! */}
      <path d="M18.8 21.2L21.8 3.5" strokeWidth="1.8" />
      <circle cx="18.8" cy="21.2" r="1" fill="currentColor" />
      {/* 지휘봉 팁 끝의 섬세한 선율 아치 */}
      <path d="M22.2 3.8c.6-.4 1.2.2 1 .8" strokeWidth="1.4" strokeOpacity="0.85" />
    </svg>
  );
}
