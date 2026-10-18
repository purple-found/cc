import React from 'react';

/**
 * DancingConductorIcon (마법처럼 춤추며 지휘하는 마에스트로 대표 심볼 아이콘)
 * 
 * 클래식 음악의 숭고한 선율과 축제 같은 현장의 유쾌함을 동시에 담은 심볼:
 * 1. 펄럭이는 제비꼬리 연미복(Tailcoat)과 감성적인 왼손 지휘 제스처
 * 2. 하늘 높이 힘차게 치켜든 지휘봉 (Conductor's Baton)
 * 3. 지휘봉 끝에서 팡 터져 나오는 마법 같은 스파클(✨)과 경쾌하게 솟아오르는 8분음표(♪)
 * 4. 지휘봉의 궤적을 따라 흐르는 아치형 멜로디 파동 (Melodic Wave)
 * 
 * 100% 순수 창작 오리지널 벡터 코드로 저작권 침해 우려 제로
 */
export default function DancingConductorIcon({ className = 'w-7 h-7', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 1. 지휘자 머리 (단정하고 날렵한 실루엣) */}
      <circle cx="6.5" cy="8.5" r="2" fill="currentColor" fillOpacity="0.2" />
      <path d="M5 8.5c0-.8.6-1.5 1.5-1.5s1.5.7 1.5 1.5" />

      {/* 2. 연미복 상체 & 휘날리는 제비꼬리 (Tailcoat) */}
      <path d="M7 10.5c1.2.8 2.2 2 2.2 3.8l-.8 4.2" />
      {/* 연미복 날렵한 뒷꼬리 2가닥 */}
      <path
        d="M6 11.5 C4.5 13, 3 15.5, 3.2 19 C3.8 17.5, 5.2 16, 6.5 15.2"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path d="M6.5 15.2 C5.8 17.5, 5.2 19.8, 6.2 21.5" />
      {/* 나비넥타이 */}
      <path d="M8 10.5l1-.6v1.2z" fill="currentColor" />

      {/* 3. 앞을 향해 부드럽게 뻗은 왼손 (감성적 지휘) */}
      <path d="M8.5 12.5 C10 13.5, 11.5 13.5, 12.8 12.8" strokeWidth="1.3" />

      {/* 4. 하늘을 향해 높이 치켜든 오른팔 & 지휘봉 (Baton) */}
      <path d="M7.5 11 C9 9.5, 11 8, 12.5 6.5" strokeWidth="1.6" />
      {/* 지휘봉 손잡이 */}
      <circle cx="12.5" cy="6.5" r="0.8" fill="currentColor" />
      {/* 지휘봉 바디 */}
      <path d="M12.5 6.5 L18 2.5" strokeWidth="1.5" />

      {/* 5. 지휘봉 끝에서 피어나는 마법 선율 & 음표 & 스파클 */}
      {/* 반짝이는 마법 스파클 (✨) */}
      <path
        d="M18.5 2 L19 1 L19.5 2 L20.5 2.5 L19.5 3 L19 4 L18.5 3 L17.5 2.5 Z"
        fill="currentColor"
      />

      {/* 유쾌하게 솟아오르는 8분음표 (♪) */}
      <ellipse cx="19.5" cy="11.5" rx="1.5" ry="1.2" fill="currentColor" />
      <path d="M21 11.5 V5.5 C21.8 6.5, 22.8 6.5, 23 6" strokeWidth="1.3" />

      {/* 부드러운 아치형 선율 궤적 (Melodic Wave) */}
      <path
        d="M13 4.5 C15.5 3.5, 18.5 4.5, 21 8.5"
        strokeWidth="1.1"
        strokeDasharray="2 1.5"
        strokeOpacity="0.8"
      />

      {/* 보조 마법 별빛 도트 */}
      <circle cx="15.5" cy="2" r="0.6" fill="currentColor" />
      <circle cx="22.5" cy="12.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
