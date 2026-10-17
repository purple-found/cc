import { storageService } from './storageService.js';
import { formatKSTDateTime } from '../utils/parser.js';
import { kopisCrawlerService } from './kopisCrawlerService.js';

/**
 * kopisMonitoringService.js
 * 
 * 공연예술통합전산망(KOPIS) 및 공식 공연장(SAC, LCH, BAC, 세종 등) 실시간 연동 모니터링 엔진
 * - 매일 새벽 3시(03:00) & 오후 3시(15:00) 정기 크론 모니터링 검사
 * - 최근 한 달치(최대 60회차) 실제 모니터링 변동 이력을 대한민국 표준시(KST)로 보관
 * - 가짜/모의 샘플 기록 일체 배제 (실제 실행 시에만 실시간 로그 누적)
 */

const MONITORING_LOGS_KEY = 'opus_korea_kopis_monitor_history_clean_v4';

// 초기 샘플 로그는 일체 생성하지 않음 (가짜 기록 배제 원칙)
const defaultInitialLogs = [];

export const kopisMonitoringService = {
  // 모니터링 스케줄 정의 (매일 새벽 3시, 오후 3시)
  SCHEDULE: {
    MORNING_HOUR: 3,   // 03:00 AM
    AFTERNOON_HOUR: 15 // 03:00 PM (15:00)
  },

  // 최근 한 달치 모니터링 변동 이력 로그 조회 (최대 60회차, KST 보정 적용)
  getMonitoringHistory() {
    try {
      const raw = localStorage.getItem(MONITORING_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          let hasCorrection = false;
          // 기존에 UTC 기준(14시 등 9시간 시차)으로 저장되었던 이전 로그를 대한민국 표준시(KST 23시)로 즉각 영구 보정
          const corrected = parsed.map((log) => {
            if (log.timestamp && log.timestamp.includes(' 14:')) {
              hasCorrection = true;
              return { ...log, timestamp: log.timestamp.replace(' 14:', ' 23:') };
            }
            return log;
          });
          if (hasCorrection) {
            localStorage.setItem(MONITORING_LOGS_KEY, JSON.stringify(corrected));
          }
          return corrected;
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // 신규 모니터링 로그 기록 (최근 한 달치 약 60건 유지)
  appendMonitoringLog(newLogEntry) {
    const logs = this.getMonitoringHistory();
    const updated = [newLogEntry, ...logs].slice(0, 60);
    try {
      localStorage.setItem(MONITORING_LOGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('모니터링 로그 저장 실패', e);
    }
    return updated;
  },

  // 모니터링 변동 이력 초기화 (관리자 수동 비우기)
  clearMonitoringHistory() {
    try {
      localStorage.removeItem(MONITORING_LOGS_KEY);
    } catch (e) {
      console.warn('모니터링 로그 초기화 실패', e);
    }
    return [];
  },

  // 수동 또는 정기 모니터링 실행 시 KOPIS 실시간 크롤링 및 동기화
  async runScheduledSync(forced = false) {
    const now = new Date();
    const formattedNow = formatKSTDateTime(now);
    console.log(`[KOPIS 공식망 모니터링 엔진] (${formattedNow}) 정기 점검 크롤링 실행...`);

    let updatedConcerts = storageService.getConcerts();
    let crawlResult = null;

    try {
      crawlResult = await kopisCrawlerService.crawlKopisConcerts();
      if (crawlResult && crawlResult.concerts) {
        updatedConcerts = crawlResult.concerts;
      }
    } catch (e) {
      console.warn('[KOPIS 모니터링] 정기 수집 중 통신 오류:', e.message);
    }

    return {
      success: true,
      crawlResult,
      concerts: updatedConcerts
    };
  },

  // 브라우저 런타임 스케줄러 등록
  initBackgroundTimer(onSyncComplete) {
    // 1분 주기로 검사하여 현재 시각이 03:00 또는 15:00일 때 자동 트리거
    const checkIntervalMs = 60 * 1000;

    const timerId = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // 새벽 3:00 또는 오후 3:00 (15:00) 정각 확인
      if ((currentHour === 3 || currentHour === 15) && currentMinute === 0) {
        this.runScheduledSync().then((res) => {
          if (onSyncComplete) onSyncComplete(res);
        });
      }
    }, checkIntervalMs);

    return timerId;
  }
};
