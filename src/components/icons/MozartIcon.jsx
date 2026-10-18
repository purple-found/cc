import React from 'react';

/**
 * MozartIcon (볼프강 아마데우스 모차르트 대표 심볼 아이콘)
 * 
 * 클래식 음악의 영원한 거장 볼프강 아마데우스 모차르트(W. A. Mozart, 1756~1791)의
 * 전 세계인이 한눈에 알아볼 수 있는 정통 클래식 마에스트로 초상 아이콘:
 * 1. 18세기 바로크/로코코풍 둥근 백발 가발(Powdered Wig) 상단 볼륨 돔
 * 2. 모차르트의 독보적 시그니처인 좌우 2단 원통형 가발 롤 (양옆 총 4개의 Boucles)
 * 3. 온화하고 지적인 천재의 눈매, 눈썹, 콧날 및 클래식 미소
 * 4. 목 아래로 우아하게 떨어지는 3단 레이스 프릴 자보(Ruffled Jabot)와 연주복 깃
 * 
 * 저작권 안내:
 * - 1791년 서거한 역사적 작곡가를 모티브로 순수 창작된 100% 오리지널 벡터 코드로 저작권 침해 우려 제로
 */
export default function MozartIcon({ className = 'w-6 h-6', ...props }) {
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
      {/* 1. 18세기 가발 돔 (상단 볼륨감) */}
      <path
        d="M6 10 C6 4.5, 8.8 2.5, 12 2.5 C15.2 2.5, 18 4.5, 18 10"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* 가발 상단 컬 웨이브 라인 */}
      <path d="M8.5 4.8 C10 4, 14 4, 15.5 4.8" strokeWidth="1.3" />

      {/* 2. 좌측 모차르트 시그니처 가발 롤 2단 (Boucles) */}
      <rect
        x="2.5"
        y="7.5"
        width="4.5"
        height="3"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="2"
        y="11"
        width="5"
        height="3"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      {/* 3. 우측 모차르트 시그니처 가발 롤 2단 (Boucles) */}
      <rect
        x="17"
        y="7.5"
        width="4.5"
        height="3"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="17"
        y="11"
        width="5"
        height="3"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      {/* 4. 얼굴 윤곽선 (볼과 단정한 턱선) */}
      <path
        d="M6.5 10 C6.5 14.5, 8.8 16.5, 12 16.5 C15.2 16.5, 17.5 14.5, 17.5 10"
        fill="currentColor"
        fillOpacity="0.08"
      />

      {/* 5. 또렷하고 온화한 이목구비 */}
      {/* 눈썹 */}
      <path d="M8.8 9 C9.5 8.6, 10.5 8.8, 10.8 9.3" strokeWidth="1.4" />
      <path d="M15.2 9 C14.5 8.6, 13.5 8.8, 13.2 9.3" strokeWidth="1.4" />
      {/* 눈 (클래식 눈매) */}
      <ellipse cx="9.8" cy="10.4" rx="0.9" ry="1" fill="currentColor" />
      <ellipse cx="14.2" cy="10.4" rx="0.9" ry="1" fill="currentColor" />
      {/* 콧날 */}
      <path d="M12 10.2 V12.4 L12.8 12.6" strokeWidth="1.4" />
      {/* 미소 */}
      <path d="M10.2 14.3 C11 15, 13 15, 13.8 14.3" strokeWidth="1.5" />

      {/* 6. 클래식 연주복 깃 & 3단 프릴 자보(Ruffled Jabot) */}
      <path d="M9.5 17 L7.5 21.5" strokeWidth="1.6" />
      <path d="M14.5 17 L16.5 21.5" strokeWidth="1.6" />
      <path
        d="M10.5 17 C11.2 18.2, 12.8 18.2, 13.5 17"
        fill="currentColor"
        fillOpacity="0.3"
        strokeWidth="1.4"
      />
      <path
        d="M11 18.5 C11.5 19.8, 12.5 19.8, 13 18.5"
        fill="currentColor"
        fillOpacity="0.3"
        strokeWidth="1.4"
      />
      <path d="M11.5 20 L12 21.5" strokeWidth="1.4" />
    </svg>
  );
}
