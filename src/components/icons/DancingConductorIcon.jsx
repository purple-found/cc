import React from 'react';

/**
 * DancingConductorIcon (마에스트로 & 매직 음표 심볼 - 미니멀 에디션)
 * 
 * [단순화 & 직관성 극대화]
 * 복잡한 잔선을 전면 생략하고, 한눈에 클래식 음악임을 알아볼 수 있는
 * 3가지 핵심 요소만 굵고 명쾌한 볼드 라인(stroke-width: 2.0)으로 표현:
 * 
 * 1. 단정한 두상과 우아하게 흩날리는 연미복 제비꼬리 실루엣
 * 2. 하늘 높이 힘차게 뻗은 지휘봉과 끝에서 반짝이는 별빛(✨)
 * 3. 지휘봉을 향해 경쾌하게 솟아오르는 큼직하고 선명한 8분음표(♪)
 */
export default function DancingConductorIcon({ className = 'w-7 h-7', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 1. 지휘자 헤드 (선명한 솔리드 서클) */}
      <circle cx="6" cy="7.5" r="2.2" fill="currentColor" stroke="none" />

      {/* 2. 연미복 바디 & 날렵하게 뻗은 제비꼬리 (단 1개의 우아하고 볼드한 스윙 곡선) */}
      <path d="M6 10 C7.5 13, 8 16.5, 7 20 C6 21.5, 4 21.5, 3 20" strokeWidth="2" />

      {/* 3. 하늘로 힘차게 뻗은 지휘 팔 & 지휘봉 */}
      <path d="M6.5 11 L11 7 L16 3" strokeWidth="2" />

      {/* 4. 지휘봉 끝에서 반짝이는 별빛 스파클 (✨) */}
      <path
        d="M16 2.5 L17 1 L18 2.5 L19.5 3 L18 3.5 L17 5 L16 3.5 L14.5 3 Z"
        fill="currentColor"
        stroke="none"
      />

      {/* 5. 큼직하고 선명한 8분음표 (♪) - 작은 화면에서도 1초 만에 음악으로 인식 */}
      <ellipse cx="17.5" cy="14" rx="2.5" ry="2" fill="currentColor" stroke="none" />
      <path d="M20 14 V6.5 C21.5 8, 23 7.5, 23.5 7" strokeWidth="2" />
    </svg>
  );
}
