import React from 'react';

/**
 * ChandelierStageIcon (벨벳 커튼 무대 & 크리스탈 샹들리에 대표 심볼 아이콘)
 * 
 * 클래식 콘서트홀과 유서 깊은 오페라하우스의 낭만과 설렘을 담은 심볼:
 * 1. 무대 양옆으로 우아하게 걷혀 올라간 클래식 벨벳 커튼 드레이프(Theater Curtains)
 * 2. 콘서트홀 천장에 고귀하게 매달려 빛나는 3구 촛대 & 크리스탈 샹들리에(Chandelier)
 * 3. 하단으로 떨어지는 영롱한 크리스탈 물방울 펜던트와 웅장한 무대 바닥(Stage Floor)
 * 
 * 100% 자체 제작 순수 창작 벡터 코드로 저작권 침해 우려 제로
 */
export default function ChandelierStageIcon({ className = 'w-7 h-7', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 1. 무대 커튼 드레이프 (Theater Curtain Drapes) */}
      {/* 좌측 커튼 곡선 */}
      <path d="M2 3.5 C6 5.5, 6 12, 3 20" strokeWidth="1.8" />
      {/* 우측 커튼 곡선 */}
      <path d="M22 3.5 C18 5.5, 18 12, 21 20" strokeWidth="1.8" />
      {/* 상단 커튼 발란스(Valance) */}
      <path d="M2 3.5 Q7 6, 12 3.5 Q17 6, 22 3.5" strokeWidth="1.5" />

      {/* 무대 바닥 플랫폼 (Stage Floor) */}
      <path d="M2 20.5 H22" strokeWidth="2" />
      <path d="M5 18 H19" strokeWidth="1.2" strokeOpacity="0.5" />

      {/* 2. 입체적 크리스탈 샹들리에 (Chandelier) */}
      {/* 천장 체인 */}
      <line x1="12" y1="3.5" x2="12" y2="6" strokeWidth="1.4" />

      {/* 샹들리에 촛대 암 (Curved Arms) */}
      <path
        d="M8.5 8.5 C8.5 11, 10 12, 12 12 C14 12, 15.5 11, 15.5 8.5"
        strokeWidth="1.5"
      />

      {/* 3구 촛대 불빛/보석 3개 */}
      <circle cx="8.5" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="5.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="6.8" r="0.9" fill="currentColor" stroke="none" />

      {/* 하단 크리스탈 물방울 드롭 3개 */}
      <line x1="12" y1="12" x2="12" y2="14" strokeWidth="1.4" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="13.2" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13.2" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
