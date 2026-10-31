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
 * 한국 표준시(KST, UTC+9) 기준 날짜/시간 문자열 포맷팅 (YYYY-MM-DD HH:mm)
 * 브라우저 및 시스템 시차(UTC 등)와 관계없이 항상 대한민국 표준시(KST)로 정확히 표시
 */
export function formatKSTDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  try {
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    const getPart = (type) => parts.find((p) => p.type === type)?.value || '';
    return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`;
  } catch (e) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
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

// 1초 단위 KST 현재 시각 캐싱 (수천 건의 공연 정렬 시 new Date() 반복 생성 방지)
let _lastTick = 0;
let _cachedTodayStr = '';
let _cachedTimeStr = '';

function getCurrentDateAndTimeStrings() {
  const nowMs = Date.now();
  if (nowMs - _lastTick > 1000 || !_cachedTodayStr) {
    _lastTick = nowMs;
    const d = new Date(nowMs);
    const pad = (n) => String(n).padStart(2, '0');
    _cachedTodayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    _cachedTimeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return { todayStr: _cachedTodayStr, timeStr: _cachedTimeStr };
}

function normalizeTimeHHMM(timeString) {
  if (!timeString || typeof timeString !== 'string') return '23:59';
  const m = timeString.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return '23:59';
  return `${String(m[1]).padStart(2, '0')}:${m[2]}`;
}

/**
 * 공연 일시 경과 여부 확인 도우미 (초고속 문자열 비교 및 한 자리 시간 패딩 지원)
 * 공연일(date) 및 시작시간(time)을 기준으로 현재 시점 이후인지 판별
 */
export function isPastConcert(dateString, timeString = '23:59') {
  if (!dateString) return false;
  const { todayStr, timeStr } = getCurrentDateAndTimeStrings();
  if (dateString < todayStr) return true;
  if (dateString > todayStr) return false;
  const normTime = normalizeTimeHHMM(timeString);
  return normTime < timeStr;
}

/**
 * 공연이 오늘 날짜인지 확인하는 도우미
 * 로컬 시스템 날짜(YYYY-MM-DD) 기준
 */
export function isTodayConcert(dateString) {
  if (!dateString) return false;
  return dateString === getCurrentDateAndTimeStrings().todayStr;
}

/**
 * 공연 상태 표시 텍스트 계산
 * 상태 단일화: '지나간공연' / '오늘공연' / '공연예정' (예매중/예매완료 배제)
 */
export function getDisplayStatus(concert) {
  if (!concert) return '';
  if (isPastConcert(concert.date, concert.time)) {
    return '지나간공연';
  }
  if (isTodayConcert(concert.date)) {
    return '오늘공연';
  }
  return '공연예정';
}

/**
 * 공연장명 및 세부 홀 배지 표시 규격 통합 추출 도우미
 */
export function extractVenueAndHall(concert) {
  if (!concert) return { cleanVenue: '', hallName: null, showHallBadge: false };
  const rawVenue = concert.venue || '';
  const parenMatch = rawVenue.match(/\(([^)]+)\)/);
  const hallName = concert.hall || (parenMatch ? parenMatch[1].trim() : null);
  const cleanVenue = rawVenue.replace(/\s*\([^)]*\)/g, '').trim();
  const showHallBadge = Boolean(
    hallName &&
    hallName !== '공연홀' &&
    hallName !== cleanVenue &&
    !cleanVenue.includes('롯데콘서트홀') &&
    !cleanVenue.includes('꿈의숲아트센터')
  );
  return { cleanVenue, hallName, showHallBadge };
}



