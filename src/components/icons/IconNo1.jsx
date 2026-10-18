import React from 'react';

/**
 * Icon No.1: 클래식 보면대 & 오푸스 악보 & 우측 지휘봉 아이콘
 * 
 * [아이콘 히스토리]
 * - 사용자 지정 명칭: 'icon no.1'
 * - 사용자가 "icon no.1으로 돌려줘"라고 요청 시 즉시 복구할 수 있도록 영구 보존.
 * 
 * 구성 요소:
 * 1. 보면대 위 온전하게 펼쳐진 오푸스 악보 (Open Opus Score)
 * 2. 보면대 받침 선반 & 망원형 기둥 (Stand Shelf & Telescopic Pole)
 * 3. 보면대 삼각 다리 베이스 (Tripod Base)
 * 4. 마에스트로의 지휘봉 (Conductor's Baton)
 */
export default function IconNo1({ className = 'w-6 h-6', ...props }) {
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
      {/* 1. 보면대 위 온전하게 펼쳐진 오푸스 악보 */}
      {/* 좌측 페이지 */}
      <path d="M3.5 4.8h6.5c.8 0 1.2.6 1.2 1.4v7.6c0-.8-.6-1.4-1.2-1.4H3.5V4.8z" fill="currentColor" fillOpacity="0.12" />
      {/* 우측 페이지 */}
      <path d="M18 4.8h-6.5c-.8 0-1.2.6-1.2 1.4v7.6c0-.8.6-1.4 1.2-1.4H18V4.8z" fill="currentColor" fillOpacity="0.12" />
      
      {/* 악보 오선지 라인 */}
      <path d="M5.5 7.5h3.2" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M5.5 9.8h3.2" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M13 7.5h3.2" strokeWidth="1.2" strokeOpacity="0.75" />
      <path d="M13 9.8h3.2" strokeWidth="1.2" strokeOpacity="0.75" />

      {/* 2. 보면대 받침 선반 & 기둥 */}
      <path d="M2.5 13.8h16.5" strokeWidth="2" />
      <path d="M10.8 13.8v7" strokeWidth="2" />

      {/* 3. 보면대 삼각 다리 베이스 */}
      <path d="M6 21.5l4.8-.8 4.8.8" strokeWidth="2" />

      {/* 4. 마에스트로의 지휘봉 */}
      <path d="M18.8 21.2L21.8 3.5" strokeWidth="1.8" />
      <circle cx="18.8" cy="21.2" r="1" fill="currentColor" />
      <path d="M22.2 3.8c.6-.4 1.2.2 1 .8" strokeWidth="1.4" strokeOpacity="0.85" />
    </svg>
  );
}
