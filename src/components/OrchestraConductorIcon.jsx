import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 한눈에 클래식 공연 무대임을 알 수 있는 '클래식 콘서트홀 무대 & 벨벳 드레이프 커튼 (The Classic Stage)':
 * 1. 좌우 및 상단: 클래식 오페라하우스와 콘서트홀을 상징하는 우아한 벨벳 드레이프 커튼 (Velvet Stage Curtains & Valance)
 * 2. 중앙 하단: 커튼 사이로 펼쳐진 정통 클래식 연주 무대 플랫폼 (The Concert Stage Platform)
 * 3. 무대 위: 100인의 호흡을 이끄는 마에스트로의 지휘봉(Conductor's Baton)과 피어오르는 클래식 선율의 빛
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
      {/* 1. 상단 무대 밸런스 커튼 아치 (Upper Stage Curtain Valance) */}
      <path d="M2 3h20v2c-3.3 1.6-6.7 1.6-10 0-3.3 1.6-6.7 1.6-10 0V3z" fill="currentColor" fillOpacity="0.18" />

      {/* 2. 좌측 벨벳 드레이프 커튼 (Left Velvet Drape Curtain) */}
      <path d="M2 5c2 2 3.5 5.5 2 10.5-.6 2-1.4 3-2 3.5V5z" fill="currentColor" fillOpacity="0.12" />
      <path d="M2 12.5c1.4 0 2.4-.4 2.8-.7" strokeWidth="1.5" />

      {/* 3. 우측 벨벳 드레이프 커튼 (Right Velvet Drape Curtain) */}
      <path d="M22 5c-2 2-3.5 5.5-2 10.5.6 2 1.4 3 2 3.5V5z" fill="currentColor" fillOpacity="0.12" />
      <path d="M22 12.5c-1.4 0-2.4-.4-2.8-.7" strokeWidth="1.5" />

      {/* 4. 클래식 연주 무대 바닥 플랫폼 (The Concert Stage Platform) */}
      <path d="M4.5 18.5h15l1.5 2.5H3l1.5-2.5z" />

      {/* 5. 무대 위 마에스트로 지휘봉 & 클래식 선율의 울림 (Conductor's Baton & Rising Harmony) */}
      {/* 지휘대 포디움 */}
      <path d="M10.5 18.5h3" strokeWidth="2" />
      {/* 지휘봉 */}
      <path d="M11 18.5L14 8" strokeWidth="2" />
      <circle cx="10.8" cy="18.5" r="0.8" fill="currentColor" />
      {/* 지휘봉 끝에서 피어오르는 클래식 선율 아치 */}
      <path d="M14 7.5c1.6-1.2 3.2 0 2.2 2.2" strokeWidth="1.6" strokeOpacity="0.85" />
    </svg>
  );
}
