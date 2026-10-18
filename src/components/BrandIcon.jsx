import React from 'react';
import IconNo1 from './icons/IconNo1';
import MozartIcon from './icons/MozartIcon';
import DancingConductorIcon from './icons/DancingConductorIcon';
import ChandelierStageIcon from './icons/ChandelierStageIcon';
import ClassicalenderIcon from './icons/ClassicalenderIcon';

/**
 * BrandIcon (CLASSICALENDER 대표 브랜드 아이콘 매니저)
 * 
 * [아이콘 히스토리 & 스위칭 지원]
 * - 'classicalender': 캘린더 & 클래식 8분음표 (CLASSICALENDER 대표 심볼, 현재 활성 기본값)
 * - 'chandelier-stage': 벨벳 커튼 무대 & 크리스탈 샹들리에 (보존됨)
 * - 'dancing-conductor': 춤추는 마에스트로 & 매직 음표 (보존됨)
 * - 'mozart': 모차르트 페이스리스 실루엣 (보존됨)
 * - 'icon-no-1': 지휘대와 악보, 지휘봉 (Icon No.1, 보존됨)
 * 
 * 사용자가 언제든 "icon no.1으로 돌려줘"라고 요청 시 ACTIVE_ICON_NAME을 'icon-no-1'로 전환하면 즉시 복구됩니다.
 */
export const ACTIVE_ICON_NAME = 'classicalender'; // 'classicalender' | 'chandelier-stage' | 'dancing-conductor' | 'mozart' | 'icon-no-1'

export { IconNo1, MozartIcon, DancingConductorIcon, ChandelierStageIcon, ClassicalenderIcon };

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
  if (icon === 'chandelier-stage') {
    return <ChandelierStageIcon className={className} {...props} />;
  }
  return <ClassicalenderIcon className={className} {...props} />;
}
