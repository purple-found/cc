import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 흔한 악기 단품(바이올린, 피아노 등)의 진부함을 탈피한 진정한 '오케스트라' 고유의 상징:
 * - 지휘대(Podium)를 중심으로 방사형으로 펼쳐지는 오케스트라 전용 부채꼴 무대 배열(Orchestral Fan/Arc Tiers)
 * - 현악기 층, 목관·금관 층, 타악기 층으로 웅장하게 확장되는 3단계 동심원 음향 아치
 * - 각 파트별 악단원들이 호흡을 맞추며 질서정연하게 자리한 앙상블 노드(Ensemble Nodes)
 * - 중앙에서 하늘을 향해 높고 유려하게 치솟아 100인의 소리를 하나로 이끄는 마에스트로의 지휘봉(Conductor's Baton)
 * 
 * 규격: Lucide 및 SVG 표준 벡터 규격 (viewBox 0 0 24 24, strokeWidth 1.7~1.8, strokeLinecap round)
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
      {/* 1. 오케스트라 무대 3단 부채꼴 음향 아치 (Orchestral Seating Arcs) */}
      {/* 1열: 전면 현악 섹션 (Violin / Viola / Cello / Bass) */}
      <path d="M7 16a6.5 6.5 0 0 1 10 0" strokeWidth="1.7" strokeOpacity="0.85" />
      {/* 2열: 중앙 목관 및 금관 섹션 (Woodwinds & Brass) */}
      <path d="M4.5 12.5a10 10 0 0 1 15 0" strokeWidth="1.7" strokeOpacity="0.9" />
      {/* 3열: 후면 대편성 금관 및 팀파니/타악기 섹션 (Percussion & Timpani) */}
      <path d="M2.5 9a13.5 13.5 0 0 1 19 0" strokeWidth="1.7" />

      {/* 2. 각 파트별 오케스트라 단원 앙상블 (Ensemble Musicians) */}
      {/* 1열 단원들 */}
      <circle cx="8.5" cy="14.8" r="0.8" fill="currentColor" />
      <circle cx="12" cy="14" r="0.8" fill="currentColor" />
      <circle cx="15.5" cy="14.8" r="0.8" fill="currentColor" />

      {/* 2열 단원들 */}
      <circle cx="5.8" cy="11.4" r="0.8" fill="currentColor" />
      <circle cx="9.8" cy="9.8" r="0.8" fill="currentColor" />
      <circle cx="14.2" cy="9.8" r="0.8" fill="currentColor" />
      <circle cx="18.2" cy="11.4" r="0.8" fill="currentColor" />

      {/* 3열 단원들 */}
      <circle cx="3.8" cy="8" r="0.8" fill="currentColor" />
      <circle cx="8" cy="6.2" r="0.8" fill="currentColor" />
      <circle cx="16" cy="6.2" r="0.8" fill="currentColor" />
      <circle cx="20.2" cy="8" r="0.8" fill="currentColor" />

      {/* 3. 지휘대(Podium) & 지휘자의 지휘봉(Conductor's Baton) */}
      {/* 지휘대 발판 */}
      <path d="M9.5 21.5h5" strokeWidth="2" />
      {/* 지휘봉 손잡이(Bulb) */}
      <circle cx="11.5" cy="19.5" r="1.1" fill="currentColor" />
      {/* 하늘을 가르는 유려한 지휘봉 샤프트 */}
      <path d="M11.5 19.5L14.2 3.8" strokeWidth="2" />
      {/* 지휘봉 끝에서 피어나는 선율 악센트 */}
      <path d="M15.5 3.5a1.8 1.8 0 0 1 1.8 1.8" strokeWidth="1.6" strokeOpacity="0.8" />
    </svg>
  );
}
