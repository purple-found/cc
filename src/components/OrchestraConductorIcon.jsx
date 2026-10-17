import React from 'react';

/**
 * OrchestraConductorIcon (Opus Korea 상징 아이콘)
 * 
 * 클래식 콘서트홀의 웅장한 '무대와 객석 (Stage & Auditorium)'을 상징하는 정통 픽토그램:
 * 1. 상단: 클래식 콘서트홀의 메인 무대(Stage Platform)와 어쿠스틱 음향 쉘(Acoustic Shell) & 보면대
 * 2. 하단: 무대를 장엄하게 감싸며 층층이 올라가는 테라스형 부채꼴 객석 열(Tiered Auditorium Seating)
 * 3. 중앙: 무대로 집중되는 객석 메인 통로(Center Aisle)
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
      {/* 1. 상단 무대 음향 쉘 아치 (Proscenium & Acoustic Shell) */}
      <path d="M4 4.5c4-1.8 12-1.8 16 0" strokeWidth="1.6" strokeOpacity="0.75" />

      {/* 2. 연주 무대 플랫폼 (The Concert Stage Platform) */}
      <path d="M5.5 7.5h13l1.5 4.2H4L5.5 7.5z" />
      {/* 무대 위 포디움 & 보면대 (Conductor Podium & Music Stand) */}
      <path d="M10.5 7.5h3" strokeWidth="1.8" />
      <path d="M12 7.5v2.8" strokeWidth="1.6" />

      {/* 3. 부채꼴 객석 1열 (Floor Stalls / Orchestra Seats) */}
      <path d="M5 14.5c2.2 1.6 4.5 2.2 7 2.2s4.8-.6 7-2.2" />

      {/* 4. 부채꼴 객석 2열 (1st Balcony Tier) */}
      <path d="M3.5 17.8c2.6 2 5.5 2.8 8.5 2.8s5.9-.8 8.5-2.8" />

      {/* 5. 부채꼴 객석 3열 (2nd Balcony Tier) */}
      <path d="M2.5 21c3 2.2 6.2 3 9.5 3s6.5-.8 9.5-3" strokeOpacity="0.7" />

      {/* 6. 객석 중앙 통로 (Auditorium Center Aisle) */}
      <path d="M12 14.5v6.5" strokeWidth="1.5" strokeOpacity="0.85" strokeDasharray="1 2.2" />
    </svg>
  );
}
