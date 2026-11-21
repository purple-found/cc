import { safeParseJSON, formatKSTDateTime } from '../utils/parser.js';
import { initialHalls } from '../data/initialHalls.js';
import { initialPosts } from '../data/initialPosts.js';
import initialRealConcerts from '../data/initialRealConcerts.js';

// v48: 현재 달 1일 ~ 향후 2년 예정 공연 최적화, 4단계 자동 추출 프로그램(pieces) 실시간 동기화 및 '클래식 명작' 더미 제거
const CONCERTS_KEY = 'opus_korea_concerts_v48';
const HALLS_KEY = 'opus_korea_halls_v4';
const POSTS_KEY = 'opus_korea_posts_v4';
const THEME_KEY = 'opus_korea_theme_v3';
const TIPS_KEY = 'opus_korea_tips_v3';
const BLOCKED_IPS_KEY = 'opus_korea_blocked_ips_v1';

// 이전 버전의 로컬 캐시 키 정리 (QuotaExceededError 원천 방지)
try {
  if (typeof localStorage !== 'undefined') {
    ['opus_korea_verified_real_concerts_v5', 'opus_korea_verified_real_concerts_v6', 'opus_korea_halls_v3'].forEach(k => {
      localStorage.removeItem(k);
    });
    for (let v = 7; v <= 47; v++) {
      localStorage.removeItem(`opus_korea_concerts_v${v}`);
    }
  }
} catch {}

export const storageService = {
  // ───────────────────────── 공연 (Concerts) ─────────────────────────
  // 공연 목록 조회 (KOPIS 전산망 실존 공식 공연 기본 제공)
  getConcerts() {
    try {
      if (typeof localStorage === 'undefined') {
        return initialRealConcerts || [];
      }
      const raw = localStorage.getItem(CONCERTS_KEY);
      if (!raw) {
        // 최초 로드시 KOPIS 실존 공식 공연 전수 캐싱
        localStorage.setItem(CONCERTS_KEY, JSON.stringify(initialRealConcerts || []));
        return initialRealConcerts || [];
      }
      const parsed = safeParseJSON(raw, initialRealConcerts || []);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return initialRealConcerts || [];
      }
      // initialRealConcerts에서 정리된 과거 월(지난달 이전) KOPIS 데이터는 캐시에서도 자동 정리하되, 관리자 수동 등록/제보 승인 공연은 보존
      const initialMap = new Map((initialRealConcerts || []).map(c => [c.id || c.kopisId, c]));
      let hasUpdate = false;
      const filteredParsed = parsed.filter(c => {
        const key = c.id || c.kopisId;
        const isKopisItem = String(key || '').startsWith('kopis-') || Boolean(c.kopisId);
        if (isKopisItem && !initialMap.has(key) && !initialMap.has(c.kopisId)) {
          hasUpdate = true;
          return false;
        }
        return true;
      });

      // 새벽 3시 배치로 업데이트된 작품 목록(pieces), 작곡가(composers), 세부 홀(hall), 연주 편성(performerType)을 로컬 캐시와 즉시 동기화
      const synced = filteredParsed.map(c => {
        const init = initialMap.get(c.id || c.kopisId) || initialMap.get(c.kopisId);
        if (init) {
          const needsHallUpdate = init.hall && c.hall !== init.hall;
          const needsTypeUpdate = init.performerType && c.performerType !== init.performerType;
          const initPieces = Array.isArray(init.pieces) ? init.pieces : [];
          const curPieces = Array.isArray(c.pieces) ? c.pieces : [];
          const needsPiecesUpdate =
            (initPieces.length > 0 && JSON.stringify(initPieces) !== JSON.stringify(curPieces)) ||
            (Array.isArray(c.composers) && c.composers.includes('클래식 명작'));
          if (needsHallUpdate || needsTypeUpdate || needsPiecesUpdate) {
            hasUpdate = true;
            return {
              ...c,
              hall: init.hall !== undefined ? init.hall : c.hall,
              venue: init.venue || c.venue,
              performerType: init.performerType || c.performerType,
              composers: (init.composers || []).filter(comp => comp && comp !== '클래식 명작'),
              pieces: initPieces.length > 0 ? initPieces : curPieces,
              introImages: init.introImages || c.introImages,
              description: init.description || c.description
            };
          }
        }
        return c;
      });

      // initialRealConcerts에 새로 추가된 신규 공연 즉시 병합
      const existingIds = new Set(synced.map(c => c.id || c.kopisId));
      const missingConcerts = (initialRealConcerts || []).filter(c => !existingIds.has(c.id || c.kopisId));
      if (missingConcerts.length > 0) {
        hasUpdate = true;
        synced.push(...missingConcerts);
      }

      // 모든 공연 객체의 필수 배열 필드(composers, pieces, performers) 무결점 보장 ('클래식 명작' 더미 배제)
      const safeSynced = synced.map(c => ({
        ...c,
        composers: Array.isArray(c.composers) ? c.composers.filter(comp => comp && comp !== '클래식 명작') : [],
        pieces: Array.isArray(c.pieces) ? c.pieces : [],
        performers: Array.isArray(c.performers) && c.performers.length > 0 ? c.performers : [c.title || '출연진']
      }));

      if (hasUpdate) {
        localStorage.setItem(CONCERTS_KEY, JSON.stringify(safeSynced));
      }
      return safeSynced;
    } catch (e) {
      return (initialRealConcerts || []).map(c => ({
        ...c,
        composers: Array.isArray(c.composers) ? c.composers.filter(comp => comp && comp !== '클래식 명작') : [],
        pieces: Array.isArray(c.pieces) ? c.pieces : [],
        performers: Array.isArray(c.performers) && c.performers.length > 0 ? c.performers : [c.title || '출연진']
      }));
    }
  },

  // 공연 목록 저장
  saveConcerts(concerts) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CONCERTS_KEY, JSON.stringify(concerts || []));
      }
    } catch (e) {
      console.error('[저장소 오류] 공연 목록 저장 실패', e);
    }
  },

  // 전체 공연 데이터 삭제 (사용자 요청 1번)
  clearAllConcerts() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CONCERTS_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.error('[저장소 오류] 공연 전체 삭제 실패', e);
    }
    return [];
  },

  // 공연 단건 추가 (관리자 수동 등록)
  addConcert(concertData) {
    const list = this.getConcerts();
    const newConcert = {
      ...concertData,
      id: `conc-${Date.now()}`,
      source: concertData.source || '관리자 수동 등록',
      crawlerBlocked: true
    };
    const updated = [newConcert, ...list];
    this.saveConcerts(updated);
    return updated;
  },

  // 공연 단건 삭제
  deleteConcert(id) {
    const list = this.getConcerts();
    const updated = list.filter(c => c.id !== id);
    this.saveConcerts(updated);
    return updated;
  },

  // 공연 수정 (관리자 수동 교정/편집)
  updateConcert(id, updatedData) {
    const list = this.getConcerts();
    const updated = list.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...updatedData,
          id, // id 불변 유지
          source: c.source === '관리자 수동 등록' ? '관리자 수동 등록' : '공식 정보 (관리자 교정 완료)'
        };
      }
      return c;
    });
    this.saveConcerts(updated);
    return updated;
  },

  // 1년 이상 지난 공연 자동 정리 (매월 1일 새벽 2시 또는 정기 실행)
  cleanupOldConcerts(years = 1) {
    try {
      const list = this.getConcerts();
      const now = new Date();
      const cutoffDate = new Date(now.getFullYear() - years, now.getMonth(), now.getDate(), 0, 0, 0);
      const pad = n => String(n).padStart(2, '0');
      const cutoffStr = `${cutoffDate.getFullYear()}-${pad(cutoffDate.getMonth() + 1)}-${pad(cutoffDate.getDate())}`;

      const remaining = [];
      const removed = [];

      for (const concert of list) {
        const dateStr = concert.date || concert.endDate;
        if (!dateStr) {
          remaining.push(concert);
          continue;
        }
        const d = new Date(String(dateStr).slice(0, 10));
        if (!isNaN(d.getTime()) && d < cutoffDate) {
          removed.push(concert);
        } else {
          remaining.push(concert);
        }
      }

      if (removed.length > 0) {
        this.saveConcerts(remaining);
      }

      return {
        success: true,
        removedCount: removed.length,
        remainingCount: remaining.length,
        cutoffDate: cutoffStr,
        removedConcerts: removed
      };
    } catch (e) {
      console.error('[저장소 오류] 1년 이상 지난 공연 정리 실패:', e);
      return { success: false, removedCount: 0, remainingCount: 0, error: e.message };
    }
  },

  // 매월 1일 새벽 2시 또는 월초 클라이언트 실행 시 자동 클린업
  checkAndRunMonthlyCleanup() {
    try {
      if (typeof localStorage === 'undefined') return null;
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastCleanup = localStorage.getItem('classicalender_last_monthly_cleanup');

      if (lastCleanup !== currentMonthKey) {
        const result = this.cleanupOldConcerts(1);
        localStorage.setItem('classicalender_last_monthly_cleanup', currentMonthKey);
        localStorage.setItem('classicalender_last_monthly_cleanup_at', now.toISOString());
        return result;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  // ───────────────────────── 공연장 (Halls) ─────────────────────────
  getHalls() {
    try {
      const raw = localStorage.getItem(HALLS_KEY);
      if (!raw) {
        localStorage.setItem(HALLS_KEY, JSON.stringify(initialHalls));
        return initialHalls;
      }
      const parsed = safeParseJSON(raw, initialHalls);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialHalls;
    } catch (e) {
      return initialHalls;
    }
  },

  saveHalls(halls) {
    try {
      localStorage.setItem(HALLS_KEY, JSON.stringify(halls));
    } catch (e) {
      console.error('[저장소 오류] 공연장 저장 실패', e);
    }
  },

  // ───────────────────────── 커뮤니티 (Community Posts & Comments) ─────────────────────────
  getPosts() {
    try {
      const raw = localStorage.getItem(POSTS_KEY);
      if (!raw) {
        localStorage.setItem(POSTS_KEY, JSON.stringify(initialPosts));
        return initialPosts;
      }
      const parsed = safeParseJSON(raw, initialPosts);
      return Array.isArray(parsed) ? parsed : initialPosts;
    } catch (e) {
      return initialPosts;
    }
  },

  savePosts(posts) {
    try {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('[저장소 오류] 게시글 저장 실패', e);
    }
  },

  // 게시글 추가 (작성자 IP 자동 기록)
  addPost(postData) {
    const list = this.getPosts();
    const newPost = {
      ...postData,
      id: `post-${Date.now()}`,
      ip: postData.ip || '121.134.45.10',
      createdAt: formatKSTDateTime(new Date()),
      likes: 0,
      views: 1,
      comments: []
    };
    const updated = [newPost, ...list];
    this.savePosts(updated);
    return updated;
  },

  // 관리자: 부적절한 게시글 수정 (제목, 본문, 카테고리 교정)
  updatePost(postId, updatedFields) {
    const list = this.getPosts();
    const updated = list.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          ...updatedFields,
          editedAt: formatKSTDateTime(new Date()),
          editedByAdmin: true
        };
      }
      return post;
    });
    this.savePosts(updated);
    return updated;
  },

  // 관리자: 부적절한 게시글 삭제
  deletePost(postId) {
    const list = this.getPosts();
    const updated = list.filter(p => p.id !== postId);
    this.savePosts(updated);
    return updated;
  },

  // 댓글 추가 (작성자 IP 자동 기록)
  addComment(postId, commentData) {
    const list = this.getPosts();
    const updated = list.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...(post.comments || []),
            {
              id: `c-${Date.now()}`,
              author: commentData.author || '클래식 동행',
              ip: commentData.ip || '121.134.45.10',
              content: commentData.content,
              createdAt: formatKSTDateTime(new Date())
            }
          ]
        };
      }
      return post;
    });
    this.savePosts(updated);
    return updated;
  },

  // 관리자: 부적절한 댓글 수정 (문자열 또는 { content } 객체 모두 안전 처리)
  updateComment(postId, commentId, newContent) {
    const cleanContent =
      typeof newContent === 'object' && newContent !== null
        ? String(newContent.content || '')
        : String(newContent || '');
    const list = this.getPosts();
    const updated = list.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: (post.comments || []).map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                content: cleanContent,
                editedAt: formatKSTDateTime(new Date()),
                editedByAdmin: true
              };
            }
            return c;
          })
        };
      }
      return post;
    });
    this.savePosts(updated);
    return updated;
  },

  // 관리자: 부적절한 댓글 삭제
  deleteComment(postId, commentId) {
    const list = this.getPosts();
    const updated = list.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: (post.comments || []).filter(c => c.id !== commentId)
        };
      }
      return post;
    });
    this.savePosts(updated);
    return updated;
  },

  // 게시글 조회수 증가
  incrementPostView(postId) {
    const list = this.getPosts();
    const updated = list.map(post => {
      if (post.id === postId) {
        return { ...post, views: (Number(post.views) || 0) + 1 };
      }
      return post;
    });
    this.savePosts(updated);
    return updated;
  },

  // 좋아요 토글
  toggleLike(postId) {
    const list = this.getPosts();
    const updated = list.map(post => {
      if (post.id === postId) {
        return { ...post, likes: post.likes + 1 };
      }
      return post;
    });
    this.savePosts(updated);
    return updated;
  },

  // ───────────────────────── 차단 IP 관리 (IP Blocklist) ─────────────────────────
  getBlockedIps() {
    try {
      const raw = localStorage.getItem(BLOCKED_IPS_KEY);
      if (!raw) return [];
      const parsed = safeParseJSON(raw, []);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveBlockedIps(list) {
    try {
      localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(list || []));
    } catch (e) {
      console.error('[저장소 오류] 차단 IP 목록 저장 실패', e);
    }
  },

  isIpBlocked(ip) {
    if (!ip || typeof ip !== 'string') return false;
    const cleanIp = ip.trim();
    const blocked = this.getBlockedIps();
    return blocked.some(b => b.ip === cleanIp);
  },

  blockIp(ip, reason = '커뮤니티 이용 규칙 위반 (정치/욕설/비방 등)') {
    if (!ip || typeof ip !== 'string') return this.getBlockedIps();
    const cleanIp = ip.trim();
    const list = this.getBlockedIps();
    if (list.some(b => b.ip === cleanIp)) {
      return list; // 이미 차단됨
    }
    const newEntry = {
      id: `block-${Date.now()}`,
      ip: cleanIp,
      reason: reason || '커뮤니티 운영 규칙 위반',
      blockedAt: formatKSTDateTime(new Date())
    };
    const updated = [newEntry, ...list];
    this.saveBlockedIps(updated);
    return updated;
  },

  unblockIp(ip) {
    if (!ip) return this.getBlockedIps();
    const cleanIp = String(ip).trim();
    const list = this.getBlockedIps();
    const updated = list.filter(b => b.ip !== cleanIp);
    this.saveBlockedIps(updated);
    return updated;
  },

  // ───────────────────────── 테마 (Theme) ─────────────────────────
  getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  },

  saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  },

  // ───────────────────────── 공연 제보 (Tips) ─────────────────────────
  getTips() {
    try {
      const raw = localStorage.getItem(TIPS_KEY);
      if (!raw) return [];
      const parsed = safeParseJSON(raw, []);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveTips(tips) {
    try {
      localStorage.setItem(TIPS_KEY, JSON.stringify(tips));
    } catch (e) {
      console.error('[저장소 오류] 제보 목록 저장 실패', e);
    }
  },

  addTip(tipData) {
    const list = this.getTips();
    const newTip = {
      ...tipData,
      id: `tip-${Date.now()}`,
      status: 'pending',
      createdAt: formatKSTDateTime(new Date())
    };
    const updated = [newTip, ...list];
    this.saveTips(updated);
    return updated;
  },

  updateTip(tipId, updatedData) {
    const tips = this.getTips();
    const updated = tips.map((t) => {
      if (t.id === tipId) {
        return { ...t, ...updatedData };
      }
      return t;
    });
    this.saveTips(updated);
    return updated;
  },

  approveTip(tipId, overrideData = null) {
    const tips = this.getTips();
    const foundTip = tips.find(t => t.id === tipId);
    if (!foundTip) return { updatedTips: tips, updatedConcerts: this.getConcerts() };

    const targetTip = overrideData ? { ...foundTip, ...overrideData } : foundTip;

    const parseArrayField = (val, fallback) => {
      if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map(v => v.trim()).filter(Boolean);
      }
      return fallback;
    };

    const parsePiecesField = (val) => {
      if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
      if (typeof val === 'string' && val.trim()) {
        return val.split('\n').map(v => v.trim()).filter(Boolean);
      }
      return [];
    };

    const newConcert = {
      title: targetTip.title,
      date: targetTip.date,
      time: targetTip.time || '19:30',
      venue: targetTip.venue,
      city: targetTip.city || '기타',
      performerType: targetTip.performerType || '오케스트라',
      performers: parseArrayField(targetTip.performers, ['출연진 정보']),
      composers: parseArrayField(targetTip.composers, []),
      pieces: parsePiecesField(targetTip.pieces),
      price: targetTip.price || '추후 공지',
      ticketUrl: targetTip.ticketUrl || '',
      status: '공연예정',
      description: `[관람객 제보 등록] ${targetTip.note || '공연 일정입니다.'}`,
      imageUrl: targetTip.imageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
      source: '관람객 제보 (관리자 승인)',
      crawlerBlocked: true
    };

    const updatedConcerts = this.addConcert(newConcert);
    const updatedTips = tips.filter(t => t.id !== tipId);
    this.saveTips(updatedTips);

    return { updatedTips, updatedConcerts, approvedConcert: newConcert };
  },

  deleteTip(tipId) {
    const list = this.getTips();
    const updated = list.filter(t => t.id !== tipId);
    this.saveTips(updated);
    return updated;
  },

  // ───────────────────────── 도배 방지 레이트 리밋 (Anti-Spam Rate Limits) ─────────────────────────
  // 커뮤니티 게시글: 10초 쿨다운
  checkPostRateLimit() {
    try {
      if (typeof localStorage === 'undefined') return { allowed: true };
      const last = localStorage.getItem('classicalender_last_post_time');
      const now = Date.now();
      const COOLDOWN_MS = 10000; // 10초
      if (last) {
        const diff = now - parseInt(last, 10);
        if (diff < COOLDOWN_MS) {
          const remaining = Math.ceil((COOLDOWN_MS - diff) / 1000);
          return { allowed: false, remainingSeconds: remaining };
        }
      }
      localStorage.setItem('classicalender_last_post_time', String(now));
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  },

  // 커뮤니티 댓글: 5초 쿨다운
  checkCommentRateLimit() {
    try {
      if (typeof localStorage === 'undefined') return { allowed: true };
      const last = localStorage.getItem('classicalender_last_comment_time');
      const now = Date.now();
      const COOLDOWN_MS = 5000; // 5초
      if (last) {
        const diff = now - parseInt(last, 10);
        if (diff < COOLDOWN_MS) {
          const remaining = Math.ceil((COOLDOWN_MS - diff) / 1000);
          return { allowed: false, remainingSeconds: remaining };
        }
      }
      localStorage.setItem('classicalender_last_comment_time', String(now));
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  },

  // 공연 제보하기: 1분 (60초) 쿨다운
  checkTipRateLimit() {
    try {
      if (typeof localStorage === 'undefined') return { allowed: true };
      const last = localStorage.getItem('classicalender_last_tip_time');
      const now = Date.now();
      const COOLDOWN_MS = 60000; // 1분 (60초)
      if (last) {
        const diff = now - parseInt(last, 10);
        if (diff < COOLDOWN_MS) {
          const remaining = Math.ceil((COOLDOWN_MS - diff) / 1000);
          return { allowed: false, remainingSeconds: remaining };
        }
      }
      localStorage.setItem('classicalender_last_tip_time', String(now));
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  },

  // 전체 데이터 리셋
  resetAll() {
    localStorage.removeItem(CONCERTS_KEY);
    localStorage.removeItem(HALLS_KEY);
    localStorage.removeItem(POSTS_KEY);
    localStorage.removeItem(TIPS_KEY);
    localStorage.removeItem(BLOCKED_IPS_KEY);
  }
};
