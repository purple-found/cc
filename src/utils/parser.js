/**
 * 견고한 다단계 안전 파서 (Robust Parser)
 * [GATE 6] 데이터 파싱 및 외부 통신 다단계 내결함성 보장
 * JSON 파싱 시 따옴표 누락, 줄바꿈, 이스케이프 오류로 인한 앱 다운 100% 방어
 */

export function safeParseJSON(input, fallbackValue = null) {
  if (input === null || input === undefined) {
    return fallbackValue;
  }

  if (typeof input === 'object') {
    return input;
  }

  if (typeof input !== 'string') {
    return fallbackValue;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return fallbackValue;
  }

  // 1단계: 표준 파싱 시도
  try {
    return JSON.parse(trimmed);
  } catch (err1) {
    // 2단계: 마크다운 코드 블록 제거 및 줄바꿈/이스케이프 정제 시도
    try {
      let cleaned = trimmed
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // 사소한 따옴표 및 제어문자 정제
      cleaned = cleaned
        .replace(/,\s*([\]}])/g, '$1') // trailing comma 제거
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // 비가시 제어문자 제거

      return JSON.parse(cleaned);
    } catch (err2) {
      // 3단계: 단일 인용부호(')를 이중 인용부호(")로 교정 후 재시도
      try {
        let singleQuoteFixed = trimmed
          .replace(/'/g, '"')
          .replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(singleQuoteFixed);
      } catch (err3) {
        console.warn('[내결함성 파서] 데이터 복구 모드로 전환되어 기본값을 안전하게 반환합니다.');
        return fallbackValue;
      }
    }
  }
}

/**
 * 텍스트 안전 인코딩 및 줄바꿈 정리
 */
export function sanitizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>?/gm, '') // 태그 불일치 및 XSS 방어
    .trim();
}

/**
 * 날짜 포맷팅 도우미 (YYYY.MM.DD (요일))
 */
export function formatKoreanDate(dateString) {
  if (!dateString) return '일정 미정';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dayName = days[d.getDay()];
    return `${year}.${month}.${day} (${dayName})`;
  } catch (e) {
    return dateString;
  }
}
