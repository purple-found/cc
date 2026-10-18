/**
 * venueMatcher.js
 * 공연장 및 세부 홀(Hall) 다차원 정밀 매칭 엔진
 * 
 * - 서울 예술의전당과 지방 예술의전당(대전, 광주, 청주 등) 엄격 구분
 * - 세부 홀(콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀, 아트홀 등) 괄호 포함 필터 및 c.hall 필드 상호 교차 검증
 * - 2026년 및 2027년 내년 공연 데이터 표기 차이 완벽 흡수
 */

const REGIONAL_SAC_PREFIXES = [
  '대전', '광주', '청주', '세종', '천안', '안동', '경주',
  '군산', '서귀포', '제천', '진천', '익산', '의정부', '화성', '안산', '계룡', '전남광주'
];

/**
 * 특정 공연이 서울 예술의전당(Seoul Arts Center) 소속인지 판별
 */
export function isSeoulArtsCenterConcert(concert) {
  if (!concert) return false;
  const v = (concert.venue || '').trim();
  const city = (concert.city || '').trim();

  // 지방 접두어가 명시된 경우 제외
  for (const prefix of REGIONAL_SAC_PREFIXES) {
    if (v.startsWith(prefix) || v.includes(`${prefix}예술의전당`)) {
      return false;
    }
  }

  // 1) 명시적 표기
  if (
    v.includes('예술의전당 [서울]') ||
    v.includes('예술의전당(서울)') ||
    v.includes('Seoul Arts Center') ||
    v === '예술의전당'
  ) {
    return true;
  }

  // 2) '예술의전당'으로 시작하고 타 지명 접두어가 없는 경우
  if (/^예술의전당(\s|$|\[|\()/.test(v)) {
    return true;
  }

  // 3) 도시가 '서울'이면서 예술의전당인 경우
  if (city === '서울' && v.includes('예술의전당') && !v.includes('문화예술의전당')) {
    return true;
  }

  return false;
}

/**
 * 필터 문자열이 서울 예술의전당 계열 필터인지 판별
 */
export function isSacVenueFilter(filterVenue) {
  if (!filterVenue || filterVenue === 'all') return false;

  for (const prefix of REGIONAL_SAC_PREFIXES) {
    if (filterVenue.startsWith(prefix) || filterVenue.includes(`${prefix}예술의전당`)) {
      return false;
    }
  }

  return (
    filterVenue.startsWith('예술의전당 [서울]') ||
    filterVenue.startsWith('예술의전당(서울)') ||
    filterVenue === '예술의전당' ||
    filterVenue.startsWith('예술의전당 (Seoul Arts Center)') ||
    /^예술의전당(\s|$|\[|\()/.test(filterVenue)
  );
}

/**
 * 공연 데이터와 선택된 공연장 필터 간의 정밀 매칭 검사
 * @param {Object} concert 공연 객체
 * @param {string} filterVenue 선택된 필터값
 * @returns {boolean} 매칭 여부
 */
export function matchesVenueFilter(concert, filterVenue) {
  if (!filterVenue || filterVenue === 'all') return true;
  if (!concert) return false;

  const concertVenue = (concert.venue || '').trim();
  const concertHall = (concert.hall || '').trim();
  const concertTitle = (concert.title || '').trim();

  // 1. 서울 예술의전당 계열 필터 처리
  if (isSacVenueFilter(filterVenue)) {
    // 1-1) 대상 공연이 서울 예술의전당 공연이어야 함
    if (!isSeoulArtsCenterConcert(concert)) {
      return false;
    }

    // 1-2) 세부 홀 지정 여부 검사
    const hallMatch = filterVenue.match(/\((콘서트홀|IBK챔버홀|리사이틀홀|인춘아트홀|오페라극장|CJ토월극장)\)/i);
    if (hallMatch) {
      const targetHall = hallMatch[1];
      // 콘서트의 hall, venue, title 중 해당 홀이 포함되어 있는지 교차 확인
      const hasHall =
        (concertHall && concertHall.includes(targetHall)) ||
        (concertVenue && concertVenue.includes(targetHall)) ||
        (concertTitle && concertTitle.includes(targetHall));

      return Boolean(hasHall);
    }

    // 세부 홀이 지정되지 않은 '예술의전당' 전체 필터인 경우 모든 SAC 홀 매칭
    return true;
  }

  // 2. 지방 예술의전당 필터 처리
  for (const prefix of REGIONAL_SAC_PREFIXES) {
    if (filterVenue.startsWith(prefix)) {
      if (!concertVenue.includes(prefix) || !concertVenue.includes('예술의전당')) {
        return false;
      }
      break;
    }
  }

  // 3. 대구콘서트하우스 전용 정밀 매칭 (소공연장/챔버홀 vs 대공연장/그랜드홀 철저 분리)
  if (filterVenue.includes('대구콘서트하우스')) {
    const normConcert = concertVenue.replace(/\s+/g, '');
    if (!normConcert.includes('대구콘서트하우스')) return false;

    // 소공연장 / 챔버홀 필터
    if (filterVenue.includes('소공연장') || filterVenue.includes('챔버홀')) {
      const isChamber =
        concertHall.includes('챔버홀') ||
        concertHall.includes('소공연장') ||
        concertVenue.includes('챔버홀') ||
        concertVenue.includes('소공연장');
      return isChamber;
    }

    // 대공연장 / 그랜드홀 필터
    if (filterVenue.includes('대공연장') || filterVenue.includes('그랜드홀')) {
      const isGrand =
        concertHall.includes('그랜드홀') ||
        concertHall.includes('대공연장') ||
        concertVenue.includes('그랜드홀') ||
        concertVenue.includes('대공연장');
      return isGrand;
    }

    // 로비 및 야외 필터
    if (filterVenue.includes('로비')) {
      return concertHall.includes('로비') || concertVenue.includes('로비');
    }

    // 대구콘서트하우스 전체
    return true;
  }

  // 4. 부산콘서트홀 전용 정밀 매칭 (콘서트홀 vs 챔버홀 철저 분리)
  if (filterVenue.includes('부산콘서트홀')) {
    const normConcert = concertVenue.replace(/\s+/g, '');
    if (!normConcert.includes('부산콘서트홀')) return false;

    // 챔버홀 필터
    if (filterVenue.includes('챔버홀') || filterVenue.includes('소공연장')) {
      return (
        concertHall.includes('챔버홀') ||
        concertHall.includes('소공연장') ||
        /\(챔버홀\)|\(소공연장\)/.test(concertVenue)
      );
    }

    // 콘서트홀(메인홀) 필터
    if (filterVenue.includes('(콘서트홀)') || filterVenue.includes('대공연장')) {
      return (
        (concertHall === '콘서트홀' || concertHall.includes('대공연장') || /\(콘서트홀\)|\(대공연장\)/.test(concertVenue)) &&
        !concertHall.includes('챔버홀') &&
        !concertVenue.includes('챔버홀')
      );
    }

    // 부산콘서트홀 전체
    return true;
  }

  // 5. 괄호가 포함된 일반 세부 홀 필터 처리 (예: '대전예술의전당 (아트홀)', '부천아트센터 (콘서트홀)', '성남아트센터 (앙상블씨어터)')
  const generalHallMatch = filterVenue.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (generalHallMatch) {
    const baseVenue = generalHallMatch[1].trim();
    const targetHall = generalHallMatch[2].trim();

    const normBase = baseVenue.replace(/\s+/g, '').toLowerCase();
    const normConcertVenue = concertVenue.replace(/\s+/g, '').toLowerCase();

    // 기본 공연장명이 일치해야 함
    if (!normConcertVenue.includes(normBase)) {
      return false;
    }

    // 세부 홀 매칭 (c.hall 또는 c.venue)
    const normTargetHall = targetHall.replace(/\s+/g, '').toLowerCase();
    const normConcertHall = concertHall.replace(/\s+/g, '').toLowerCase();
    return normConcertVenue.includes(normTargetHall) || normConcertHall.includes(normTargetHall);
  }

  // 5. 일반 공연장명 단순 정규화 매칭
  const normFilter = filterVenue.replace(/\s+/g, '').toLowerCase();
  const normConcert = concertVenue.replace(/\s+/g, '').toLowerCase();
  return normConcert.includes(normFilter) || (normFilter.includes(normConcert) && !normFilter.includes('('));
}
