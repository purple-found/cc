import React from 'react';

/**
 * OrchestraConductorIcon
 * 
 * 오케스트라 앙상블 & 지휘자 형상화 심볼 아이콘
 * - 전면 좌측: 포디움(지휘대) 위에 서서 양손과 지휘봉(바톤)을 든 지휘자 (Conductor)
 * - 후면 우측: 나란히 앉아 악기(현악기/건반)를 연주하는 2인의 단원 (Performers / Musicians)
 * - 규격 및 스타일: Lucide 및 SVG 표준 벡터 (stroke, fill-none, rounded, strokeWidth 1.75~2)
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
      {/* 1. 지휘자 (좌측 전면): 포디움 + 서 있는 지휘자 + 지휘봉 */}
      {/* 지휘자 머리 */}
      <circle cx="6" cy="6.5" r="1.5" />
      {/* 지휘자 몸통 & 포디움 연결선 */}
      <path d="M6 8v7.5" />
      {/* 지휘자 지휘대(포디움) 발판 */}
      <path d="M3.5 15.5h5" />
      {/* 지휘자의 역동적인 팔 & 지휘봉(바톤) */}
      <path d="M3.5 10.5c1.2-1 2.5-1 2.5 0l3-2.5" />

      {/* 2. 연주자 1 (중앙): 앉아서 연주하는 단원 */}
      {/* 연주자 1 머리 */}
      <circle cx="13" cy="8.5" r="1.3" />
      {/* 연주자 1 상체 및 연주하는 팔 */}
      <path d="M13 10v4.5" />
      <path d="M11.5 12c.8.8 2 .8 2.5 0" />
      {/* 연주자 1 의자/다리 */}
      <path d="M11.5 14.5h3v4.5" />

      {/* 3. 연주자 2 (우측): 나란히 앉아서 연주하는 단원 */}
      {/* 연주자 2 머리 */}
      <circle cx="19" cy="8.5" r="1.3" />
      {/* 연주자 2 상체 및 연주하는 팔 */}
      <path d="M19 10v4.5" />
      <path d="M17.5 12c.8.8 2 .8 2.5 0" />
      {/* 연주자 2 의자/다리 */}
      <path d="M17.5 14.5h3v4.5" />

      {/* 4. 무대 베이스 라인 */}
      <path d="M10 19h11.5" strokeOpacity="0.4" />
    </svg>
  );
}
