import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 클래식 공연의 정통성과 무대의 품격을 한눈에 직관적으로 상징하는 픽토그램:
 * - 콘서트홀 무대 위 열린 상판(Open Lid)과 지지대(Prop Stick)를 갖춘 그랜드 피아노
 * - 리드미컬하고 섬세한 피아노 건반부(Keyboards) 및 무대 다리
 * - 그 위로 힘차고 우아하게 솟아오르는 마에스트로의 지휘봉(Conductor's Baton)과 선율
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
      {/* 1. 활짝 열린 콘서트 그랜드 피아노 상판 뚜껑 (Open Lid) */}
      <path d="M3.5 13L16 4.2c.8-.5 1.8-.4 2.4.2.5.5.6 1.3.2 1.8" />

      {/* 2. 뚜껑 지지대 (Prop Stick) */}
      <path d="M13.5 6l3.5 7" />

      {/* 3. 피아노 바디 케이스 (Piano Rim & Curved Body) */}
      <path d="M3.5 13h16c.8 0 1.5.7 1.5 1.5v1.5H3v-1.5c0-.8.7-1.5 1.5-1.5z" />

      {/* 4. 피아노 건반부 (Keyboard bed & Keys) */}
      <path d="M3 16h18v2.5H3z" />
      <path d="M7.5 16v1.8" />
      <path d="M12 16v1.8" />
      <path d="M16.5 16v1.8" />

      {/* 5. 피아노 다리 (Stage Legs) */}
      <path d="M5.5 18.5V21" />
      <path d="M18.5 18.5V21" />

      {/* 6. 마에스트로 지휘봉 & 클래식 선율 아치 (Conductor's Baton & Melody) */}
      <path d="M8 9.5l11-7" strokeWidth="2" />
      <circle cx="7.5" cy="10" r="1" fill="currentColor" />
      <path d="M19.5 2.5c.8.3 1.5 1 1.5 2" strokeOpacity="0.8" />
    </svg>
  );
}
