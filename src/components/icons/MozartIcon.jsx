import React from 'react';

/**
 * MozartIcon (볼프강 아마데우스 모차르트 대표 심볼 아이콘)
 * 
 * 클래식 음악의 영원한 거장 모차르트(W. A. Mozart, 1756~1791)의 시그니처 실루엣:
 * 1. 18세기 로코코풍 백발 가발(Powdered Wig)의 부드러운 상단 볼륨
 * 2. 모차르트의 상징인 귀 옆 2단 수평 가발 롤 (Boucles / Side Curls)
 * 3. 뒷머리를 묶은 솔리테어 리본 매듭과 꽁지머리 (Solitaire Queue & Ribbon)
 * 4. 지적이고 기품 있는 측면 얼굴 윤곽 (이마, 콧날, 입술, 턱선)
 * 5. 목을 감싸는 클래식 프릴 셔츠 자보(Jabot)와 옷깃
 * 
 * 저작권 안내:
 * - 1791년 서거한 역사적 인물 모차르트를 모티브로 한 100% 순수 창작 오리지널 벡터 디자인
 * - 외부 이미지 라이브러리 및 서드파티 저작권 종속성 제로 (퍼블릭 도메인 및 자유 라이선스)
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
      {/* 1. 클래식 가발 상단 볼륨 (곡선형 돔) */}
      <path d="M14 7C12.8 4.2 9.8 3.2 6.8 4.2 4.8 4.9 3.5 6.8 3.5 9c0 2 .9 3.5 2.2 4.5" />

      {/* 2. 모차르트 시그니처 2단 가발 롤 (Boucles) */}
      <path
        d="M7 8.2c2.2-.4 4.2.2 4.6 1.6.3 1.2-.8 1.9-2.6 1.9"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M6.8 11.2c2.2-.4 4.2.2 4.5 1.6.3 1.2-.8 1.9-2.5 1.9"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* 3. 단정하고 기품 있는 측면 얼굴 프로필 (이마, 콧날, 입술, 턱) */}
      <path d="M14 7c.4 1 .6 1.8 1.1 2.4l2.2.8c.4.1.4.5 0 .7-.5.4-1 .5-1.6.5h-.2c.3.4.2.8-.3 1-.5.2-1 0-1.4-.4-.3 1.2-.8 2.2-1.9 2.8" />

      {/* 4. 가발 뒷머리 솔리테어 리본 매듭과 꽁지머리 (Solitaire Queue) */}
      <circle cx="5" cy="14" r="0.9" fill="currentColor" />
      <path d="M4.4 14.8c-.7.8-1.2 2-1 3.2" strokeWidth="1.5" />
      <path d="M5.6 14.8c.3 1.2.4 2.5.2 3.8" strokeWidth="1.6" />

      {/* 5. 클래식 연주복 옷깃 & 레이스 자보(Jabot) */}
      <path d="M11.6 16.8c.8.7 2 1.2 3.2 1.6" />
      <path d="M10.2 18.4c1.2.8 1.8 1.8 1.9 3.2" />
      <path d="M13.2 19.8c.7.5 1.4 1.1 2 1.8" />
    </svg>
  );
}
