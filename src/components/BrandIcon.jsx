import React from 'react';
import IconNo1 from './icons/IconNo1';
import MozartIcon from './icons/MozartIcon';

/**
 * BrandIcon (오푸스 코리아 대표 브랜드 아이콘)
 * 
 * [아이콘 히스토리 & 스위칭 지원]
 * - 현재 적용 아이콘: 'mozart' (신규 모차르트 얼굴 벡터 아이콘)
 * - 이전 지휘대 아이콘: 'icon-no-1' (Icon No.1 지휘대와 악보, 지휘봉)
 * 
 * 사용자가 "icon no.1으로 돌려줘"라고 요청 시 ACTIVE_ICON_NAME을 'icon-no-1'로 전환하면 즉시 복구됩니다.
 */
export const ACTIVE_ICON_NAME = 'mozart'; // 'mozart' | 'icon-no-1'

export { IconNo1, MozartIcon };

export default function BrandIcon({ icon = ACTIVE_ICON_NAME, className = 'w-6 h-6', ...props }) {
  if (icon === 'icon-no-1') {
    return <IconNo1 className={className} {...props} />;
  }
  return <MozartIcon className={className} {...props} />;
}
