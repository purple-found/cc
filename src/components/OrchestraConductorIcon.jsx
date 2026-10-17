import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 오케스트라 사운드의 영혼이자 웅장한 브라스 하모니의 상징인 '프렌치 호른 (French Horn)':
 * - 황동 금관 악기 특유의 우아하고 둥근 나선형 튜빙 코일 (Coiled Brass Body)
 * - 우측 상단으로 웅장하고 유려하게 피어나는 활짝 벌어진 나팔 (Flaring Orchestral Bell)
 * - 중앙에 정밀하게 배치된 3개의 로터리 밸브 레버 (Rotary Valves) 및 마우스피스
 * - 메트로놈, 계기판 바늘, 자동차 등과 완전히 구별되는 클래식 오케스트라 고유의 품격 있는 미학
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
      {/* 1. 호른의 메인 나선형 원형 튜빙 (Main Brass Coil) */}
      <circle cx="10.5" cy="13.5" r="7.5" />

      {/* 2. 내부 보조 공명 튜빙 (Inner Valve Loop) */}
      <circle cx="10.5" cy="13.5" r="4.2" strokeOpacity="0.85" />

      {/* 3. 우측 상단으로 웅장하게 벌어지는 나팔 벨 (Flaring Bell) */}
      <path d="M14 8C17 6.2 19.5 5 22 4.2v7.6C19.5 11 17 9.8 14 8z" />

      {/* 4. 나팔 벨 림 마감 (Bell Rim Acoustic Curve) */}
      <path d="M22 4.2c.8 1.2.8 6.4 0 7.6" strokeWidth="1.4" />

      {/* 5. 3개의 로터리 밸브 레버 (Rotary Valves & Keys) */}
      <path d="M9 11v5" strokeWidth="1.6" />
      <path d="M10.5 10.5v6" strokeWidth="1.6" />
      <path d="M12 11v5" strokeWidth="1.6" />

      {/* 6. 리드 파이프 & 마우스피스 (Leadpipe & Mouthpiece) */}
      <path d="M3 13.5H1.5" strokeWidth="2" />
    </svg>
  );
}
