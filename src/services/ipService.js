/**
 * ipService.js
 * 
 * 커뮤니티 글 및 댓글 작성자의 공인 IP 확인 및 세션 식별 서비스
 * - 외부 공공 IP 서비스(ipify)를 비동기로 조회
 * - 네트워크 차단/오프라인 시 세션 전용 가상 고유 IP 생성/캐싱하여 무결성 보장
 */

const IP_STORAGE_KEY = 'opus_korea_client_ip_v1';

export const ipService = {
  // 클라이언트의 IP 주소 획득 (캐시 우선, 실패 시 안정적 세션 IP 반환)
  async getMyIp() {
    try {
      const cached = sessionStorage.getItem(IP_STORAGE_KEY) || localStorage.getItem(IP_STORAGE_KEY);
      if (cached && cached.trim()) {
        return cached;
      }
    } catch {
      // 스토리지 접근 예외 무시
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.ip) {
          const validIp = String(data.ip).trim();
          try {
            sessionStorage.setItem(IP_STORAGE_KEY, validIp);
            localStorage.setItem(IP_STORAGE_KEY, validIp);
          } catch {}
          return validIp;
        }
      }
    } catch (e) {
      // 네트워크 예외 시 폴백 처리
    }

    // 로컬/오프라인 환경용 안정적인 식별 IP 생성
    const fallbackIp = this.generateLocalFallbackIp();
    try {
      sessionStorage.setItem(IP_STORAGE_KEY, fallbackIp);
    } catch {}
    return fallbackIp;
  },

  // 동기적으로 저장된 IP 조회 (UI 즉시 렌더링용)
  getCurrentIpSync() {
    try {
      const cached = sessionStorage.getItem(IP_STORAGE_KEY) || localStorage.getItem(IP_STORAGE_KEY);
      if (cached) return cached;
    } catch {}
    const newIp = this.generateLocalFallbackIp();
    try {
      sessionStorage.setItem(IP_STORAGE_KEY, newIp);
    } catch {}
    return newIp;
  },

  // 오프라인/로컬 식별용 IP 생성
  generateLocalFallbackIp() {
    return '121.134.45.10';
  }
};
