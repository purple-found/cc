import React from 'react';
import IconNo1 from './icons/IconNo1';
import MozartIcon from './icons/MozartIcon';
import DancingConductorIcon from './icons/DancingConductorIcon';
import ChandelierStageIcon from './icons/ChandelierStageIcon';

/**
 * BrandIcon (오푸스 코리아 대표 브랜드 아이콘 매니저)
 * 
 * [아이콘 히스토리 & 스위칭 지원]
 * - 'chandelier-stage': 벨벳 커튼 무대 & 크리스탈 샹들리에 (안 B, 현재 활성 기본값)
 * - 'icon-no-1': 지휘대와 악보, 지휘봉 (Icon No.1, 보존됨)
 * - 'mozart': 모차르트 페이스리스 실루엣 (보존됨)
 * - 'dancing-conductor': 춤추는 마에스트로 & 매직 음표 (보존됨)
 * 
 * 사용자가 언제든 "icon no.1으로 돌려줘"라고 요청 시 ACTIVE_ICON_NAME을 'icon-no-1'로 전환하면 즉시 복구됩니다.
 */
export const ACTIVE_ICON_NAME = 'chandelier-stage'; // 'chandelier-stage' | 'icon-no-1' | 'mozart' | 'dancing-conductor'

export { IconNo1, MozartIcon, DancingConductorIcon, ChandelierStageIcon };

export default function BrandIcon({ icon = ACTIVE_ICON_NAME, className = 'w-7 h-7', ...props }) {
  if (icon === 'icon-no-1') {
    return <IconNo1 className={className} {...props} />;
  }
  if (icon === 'mozart') {
    return <MozartIcon className={className} {...props} />;
  }
  if (icon === 'dancing-conductor') {
    return <DancingConductorIcon className={className} {...props} />;
  }
  return <ChandelierStageIcon className={className} {...props} />;
}
