import React from 'react';

/**
 * MozartIcon (볼프강 아마데우스 모차르트 대표 심볼 아이콘 - 미니멀 실루엣)
 * 
 * 클래식 음악의 영원한 거장 모차르트(W. A. Mozart, 1756~1791)의 미니멀 마에스트로 실루엣:
 * 1. 18세기 로코코풍 백발 가발(Powdered Wig)의 풍성한 상단 볼륨 돔
 * 2. 모차르트의 독보적 시그니처인 좌우 2단 원통형 가발 롤 (양옆 총 4개의 Boucles)
 * 3. 이목구비를 배제한 모던하고 정갈한 페이스리스(Faceless) 실루엣 윤곽
 * 4. 목 아래로 우아하게 떨어지는 클래식 레이스 프릴 자보(Ruffled Jabot)와 연주복 깃
 * 
 * 정제된 선 두께(strokeWidth 1.35)를 적용하여 섬세하고 세련된 클래식 판화 감성을 구현합니다.
 */
export default function MozartIcon({ className = 'w-7 h-7', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 1. 18세기 가발 돔 (상단 볼륨감) */}
      <path
        d="M5.5 10 C5.5 4, 8.5 2, 12 2 C15.5 2, 18.5 4, 18.5 10"
        fill="currentColor"
        fillOpacity="0.16"
      />
      {/* 가발 상단 볼륨 웨이브 라인 */}
      <path d="M8 4.6 C9.8 3.8, 14.2 3.8, 16 4.6" strokeWidth="1.1" />

      {/* 2. 좌측 모차르트 시그니처 가발 롤 2단 (Boucles) */}
      <rect
        x="1.8"
        y="7.2"
        width="5.2"
        height="3.2"
        rx="1.6"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="1.4"
        y="11"
        width="5.6"
        height="3.2"
        rx="1.6"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />

      {/* 3. 우측 모차르트 시그니처 가발 롤 2단 (Boucles) */}
      <rect
        x="17"
        y="7.2"
        width="5.2"
        height="3.2"
        rx="1.6"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect
        x="17"
        y="11"
        width="5.6"
        height="3.2"
        rx="1.6"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />

      {/* 4. 이목구비 없는 미니멀 실루엣 얼굴 윤곽선 (볼과 단정한 턱선) */}
      <path
        d="M6.2 10 C6.2 14.8, 8.6 16.8, 12 16.8 C15.4 16.8, 17.8 14.8, 17.8 10"
        fill="currentColor"
        fillOpacity="0.09"
      />

      {/* 5. 클래식 연주복 깃 & 3단 프릴 자보(Ruffled Jabot) */}
      <path d="M9.2 17.2 L7 22" strokeWidth="1.25" />
      <path d="M14.8 17.2 L17 22" strokeWidth="1.25" />
      <path
        d="M10.2 17.2 C11 18.4, 13 18.4, 13.8 17.2"
        fill="currentColor"
        fillOpacity="0.3"
        strokeWidth="1.15"
      />
      <path
        d="M10.8 18.7 C11.4 19.9, 12.6 19.9, 13.2 18.7"
        fill="currentColor"
        fillOpacity="0.3"
        strokeWidth="1.15"
      />
      <path d="M11.5 20.2 L12 22" strokeWidth="1.15" />
    </svg>
  );
}
