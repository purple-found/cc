import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 한눈에 클래식 공연임을 직관적으로 알아볼 수 있는 정통 클래식 심볼:
 * - 유려한 S/C자 허리 곡선(C-bout)과 상·하단 공명 바디를 지닌 클래식 바이올린/첼로
 * - 정교한 나선형 스크롤(Scroll) 헤드 및 튜닝 펙(Tuning Pegs), 기다란 지판(Fingerboard)
 * - 공명통 중앙의 상징적인 f-홀(f-holes)과 브릿지/현 라인
 * - 현악기를 우아하게 가로지르는 클래식 연주 활(Bow)의 조화
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
      {/* 1. 바이올린 헤드 스크롤 (Scroll Head) */}
      <path d="M12 2c-.8 0-1.5.5-1.5 1.2 0 .7.6 1.3 1.5 1.3.6 0 1.2-.4 1.2-1" />

      {/* 2. 조율 펙 (Tuning Pegs) & 펙박스 */}
      <path d="M10.5 4.5h3" />
      <path d="M9.5 5.8h5" strokeWidth="1.5" />

      {/* 3. 네크 & 지판 (Neck & Fingerboard) */}
      <path d="M11 6.8v4.5h2V6.8" />

      {/* 4. 바이올린 공명 바디 (Violin Body - 상단 볼록, C-bout 허리 잘록, 하단 볼록) */}
      <path d="M11 11.3c-2.4 0-4.2 1.4-4.2 3.4 0 1.4 1.2 1.8 1.2 2.8 0 1.2-1.5 2-1 3.5.7 1.5 3 2 5 2s4.3-.5 5-2c.5-1.5-1-2.3-1-3.5 0-1 1.2-1.4 1.2-2.8 0-2-1.8-3.4-4.2-3.4h-2z" />

      {/* 5. 상징적 f-홀 (Acoustic f-holes) */}
      <path d="M9.8 15.5c-.4.4-.4 1.2 0 1.6" strokeWidth="1.6" />
      <path d="M14.2 15.5c.4.4.4 1.2 0 1.6" strokeWidth="1.6" />

      {/* 6. 중앙 현 (Strings) & 테일피스 (Tailpiece) */}
      <path d="M12 6.8v13.5" strokeWidth="1.2" strokeOpacity="0.8" />
      <path d="M11 20.8l1 1.7 1-1.7z" fill="currentColor" fillOpacity="0.4" strokeWidth="1" />

      {/* 7. 클래식 연주 활 (Violin Bow) - 사선으로 우아하게 가로지르는 활대와 활털 */}
      <path d="M3.5 19.5L20.5 3.5" strokeWidth="1.8" />
      <circle cx="4.2" cy="18.8" r="0.8" fill="currentColor" />
    </svg>
  );
}
