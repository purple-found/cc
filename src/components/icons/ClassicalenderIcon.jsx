import React from 'react';

/**
 * ClassicalenderIcon (CLASSICALENDER 대표 브랜드 심볼 아이콘)
 * 
 * CLASSIC(클래식 음악) + CALENDAR(공연 일정 캘린더)의 완벽한 융합:
 * 1. 2개의 링 바인더와 헤더 바가 돋보이는 모던 캘린더 프레임
 * 2. 캘린더 시트 중앙에 기품 있게 자리 잡은 클래식 8분음표(♪)
 * 3. 캘린더 속 공연의 설렘을 상징하는 황금빛 스파클(✨)
 * 
 * 100% 자체 제작 순수 창작 벡터 코드로 저작권 침해 우려 제로
 */
export default function ClassicalenderIcon({ className = 'w-7 h-7', ...props }) {
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
      {/* 1. 캘린더 바디 프레임 */}
      <rect x="3" y="4.5" width="18" height="16.5" rx="3" strokeWidth="1.8" />
      {/* 상단 링 바인더 2개 */}
      <line x1="8" y1="2.5" x2="8" y2="5.5" strokeWidth="2" />
      <line x1="16" y1="2.5" x2="16" y2="5.5" strokeWidth="2" />
      {/* 캘린더 헤더 바 구분선 */}
      <line x1="3" y1="9" x2="21" y2="9" strokeWidth="1.4" strokeOpacity="0.8" />

      {/* 2. 캘린더 시트 안의 클래식 8분음표 (♪) */}
      <ellipse cx="10" cy="16" rx="2.2" ry="1.8" fill="currentColor" stroke="none" />
      <path d="M12 16 V11 C13.2 12.2, 14.8 12.5, 15.5 12" strokeWidth="1.8" />

      {/* 3. 작은 반짝임 스파클 (✨) */}
      <path
        d="M16 14.5 L16.5 13.5 L17 14.5 L18 15 L17 15.5 L16.5 16.5 L16 15.5 L15 15 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
