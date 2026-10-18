/**
 * analyticsService.js
 * Google Analytics 4 (GA4) 통합 분석 및 방문자 행동 추적 서비스
 * 
 * - SPA(단일 페이지 앱) 환경 탭 전환 및 가상 페이지뷰 추적
 * - 공연 검색, 상세 조회, 예매처 이동, 커뮤니티 작성, 제보 접수 등 핵심 비즈니스 이벤트 로깅
 * - 환경 변수(VITE_GA_MEASUREMENT_ID) 및 관리자 직접 입력(localStorage) 동시 지원
 * - 광고 차단기(AdBlock) 또는 미설정 시에도 에러 없이 안전하게 작동하는 내결함성 설계
 */

const GA_STORAGE_KEY = 'opus_korea_ga4_measurement_id';
const DEFAULT_FALLBACK_ID = 'G-CL4SS1CK0R'; // 초기 기본 식별자

class AnalyticsService {
  constructor() {
    this.measurementId = this.loadMeasurementId();
    this.isInitialized = false;
  }

  /**
   * 저장소 또는 환경변수에서 GA4 측정 ID 조회
   */
  loadMeasurementId() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(GA_STORAGE_KEY);
        if (stored && stored.trim().startsWith('G-')) {
          return stored.trim();
        }
      }
    } catch {}

    const envId = (import.meta.env && import.meta.env.VITE_GA_MEASUREMENT_ID) || '';
    if (envId && envId.trim().startsWith('G-')) {
      return envId.trim();
    }

    return DEFAULT_FALLBACK_ID;
  }

  /**
   * 관리자가 직접 측정 ID를 변경 및 저장
   */
  setMeasurementId(id) {
    const cleanId = (id || '').trim();
    this.measurementId = cleanId;
    try {
      if (typeof localStorage !== 'undefined') {
        if (cleanId) {
          localStorage.setItem(GA_STORAGE_KEY, cleanId);
        } else {
          localStorage.removeItem(GA_STORAGE_KEY);
        }
      }
    } catch {}

    // 새로운 ID로 재초기화
    if (cleanId && cleanId.startsWith('G-')) {
      this.init(cleanId);
    }
  }

  getMeasurementId() {
    return this.measurementId;
  }

  isConfigured() {
    return Boolean(this.measurementId && this.measurementId.startsWith('G-') && this.measurementId !== DEFAULT_FALLBACK_ID);
  }

  /**
   * Google tag (gtag.js) 스크립트 동적 주입 및 초기화
   */
  init(id = this.measurementId) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!id || !id.startsWith('G-')) return;

    try {
      // 이미 스크립트가 로드되었는지 확인
      const existingScript = document.getElementById('ga4-gtag-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'ga4-gtag-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        document.head.appendChild(script);
      }

      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
      };

      window.gtag('js', new Date());
      // SPA이므로 자동 기본 page_view 전송 대신 컴포넌트 탭 전환 시 직접 전송
      window.gtag('config', id, {
        send_page_view: false,
        anonymize_ip: true
      });

      this.isInitialized = true;
    } catch (e) {
      console.warn('[방문자 통계 서비스]: 통계 초기화 대기 모드로 작동합니다.');
    }
  }

  /**
   * 단일 페이지 애플리케이션(SPA) 탭 전환 가상 페이지뷰 전송
   */
  trackPageView(pagePath, pageTitle) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    try {
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        send_to: this.measurementId
      });
    } catch {}
  }

  /**
   * 커스텀 비즈니스 이벤트 전송 도우미
   */
  trackEvent(eventName, eventParams = {}) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    try {
      window.gtag('event', eventName, {
        ...eventParams,
        send_to: this.measurementId
      });
    } catch {}
  }

  /**
   * 공연 검색 이벤트 로깅
   */
  trackSearch(query, filters = {}) {
    this.trackEvent('search', {
      search_term: query || '',
      venue_filter: filters.venue || 'all',
      composer_filter: filters.composer || 'all',
      date_filter: filters.dateRange || 'all'
    });
  }

  /**
   * 공연 상세 정보 열람 이벤트 로깅
   */
  trackSelectConcert(concert) {
    if (!concert) return;
    this.trackEvent('select_content', {
      content_type: 'concert',
      item_id: concert.id || concert.kopisId,
      item_name: concert.title,
      venue: concert.venue,
      hall: concert.hall || '메인홀',
      city: concert.city
    });
  }

  /**
   * 공식 예매처 바로가기 클릭 이벤트 로깅
   */
  trackTicketClick(concert, url) {
    if (!concert) return;
    this.trackEvent('begin_checkout', {
      item_id: concert.id || concert.kopisId,
      item_name: concert.title,
      destination_url: url || concert.ticketUrl,
      venue: concert.venue
    });
  }

  /**
   * 관람객 공연 제보 접수 이벤트
   */
  trackTipSubmit(tipData) {
    this.trackEvent('generate_lead', {
      lead_type: 'concert_tip',
      concert_title: tipData.title,
      venue: tipData.venue
    });
  }

  /**
   * 커뮤니티 글 작성 이벤트
   */
  trackCommunityPost(category, title) {
    this.trackEvent('create_post', {
      category: category,
      post_title_length: (title || '').length
    });
  }
}

export const analyticsService = new AnalyticsService();
