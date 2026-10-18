import { safeParseJSON, formatKSTDateTime } from '../utils/parser.js';
import { initialHalls } from '../data/initialHalls.js';
import { initialPosts } from '../data/initialPosts.js';
import initialRealConcerts from '../data/initialRealConcerts.js';

// v14: 매일 새벽 3시 KOPIS 공식 OpenAPI 자동 수집 및 실시간 최신 공연 전수 동기화
const CONCERTS_KEY = 'opus_korea_concerts_v14';
const HALLS_KEY = 'opus_korea_halls_v3';
const POSTS_KEY = 'opus_korea_posts_v4';
const THEME_KEY = 'opus_korea_theme_v3';
const TIPS_KEY = 'opus_korea_tips_v3';
const BLOCKED_IPS_KEY = 'opus_korea_blocked_ips_v1';

// 이전 버전의 로컬 캐시 키 정리
try {
  if (typeof localStorage !== 'undefined') {
    [
      'opus_korea_verified_real_concerts_v5',
      'opus_korea_verified_real_concerts_v6',
      'opus_korea_concerts_v7',
      'opus_korea_concerts_v8',
      'opus_korea_concerts_v9',
      'opus_korea_concerts_v10',
      'opus_korea_concerts_v11',
      'opus_korea_concerts_v12',
      'opus_korea_concerts_v13'
    ].forEach((k) => {
      localStorage.removeItem(k);
    });
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
        // 최초 로드시 KOPIS 실존 공식 공연 999건 자동 캐싱 (세부 홀 정보 및 실제 레퍼토리 포함)
        localStorage.setItem(CONCERTS_KEY, JSON.stringify(initialRealConcerts || []));
        return initialRealConcerts || [];
      }
      const parsed = safeParseJSON(raw, initialRealConcerts || []);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return initialRealConcerts || [];
      }
      // 세부 홀(hall) 정보나 프로그램이 최신화되지 않은 경우 initialRealConcerts와 즉각 병합
      const initialMap = new Map((initialRealConcerts || []).map(c => [c.id || c.kopisId, c]));
      let hasUpdate = false;
      const synced = parsed.map(c => {
        const init = initialMap.get(c.id || c.kopisId);
        if (init) {
          const needsHallUpdate = init.hall && c.hall !== init.hall;
          const needsPiecesUpdate = init.pieces && (!c.pieces || c.pieces.length === 0 || c.pieces[0].endsWith('프로그램'));
          if (needsHallUpdate || needsPiecesUpdate) {
            hasUpdate = true;
            return {
              ...c,
              hall: init.hall !== undefined ? init.hall : c.hall,
              venue: init.venue || c.venue,
              pieces: init.pieces || c.pieces
            };
          }
        }
        return c;
      });
      if (hasUpdate) {
        localStorage.setItem(CONCERTS_KEY, JSON.stringify(synced));
      }
      return synced;
    } catch (e) {
      return initialRealConcerts || [];
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

  // 관리자: 부적절한 댓글 수정
  updateComment(postId, commentId, newContent) {
    const list = this.getPosts();
    const updated = list.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: (post.comments || []).map(c => {
            if (c.id === commentId) {
              return {
                ...c,
                content: newContent,
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

  approveTip(tipId) {
    const tips = this.getTips();
    const targetTip = tips.find(t => t.id === tipId);
    if (!targetTip) return { updatedTips: tips, updatedConcerts: this.getConcerts() };

    const newConcert = {
      title: targetTip.title,
      date: targetTip.date,
      time: targetTip.time || '19:30',
      venue: targetTip.venue,
      city: targetTip.city || '기타',
      performerType: targetTip.performerType || '오케스트라',
      performers: Array.isArray(targetTip.performers) ? targetTip.performers : [targetTip.performers || '출연진 정보'],
      composers: Array.isArray(targetTip.composers) ? targetTip.composers : [targetTip.composers || '클래식'],
      pieces: Array.isArray(targetTip.pieces) ? targetTip.pieces : [targetTip.pieces || '상세 프로그램'],
      price: targetTip.price || '추후 공지',
      ticketUrl: targetTip.ticketUrl || '',
      status: '예매중',
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

  // 전체 데이터 리셋
  resetAll() {
    localStorage.removeItem(CONCERTS_KEY);
    localStorage.removeItem(HALLS_KEY);
    localStorage.removeItem(POSTS_KEY);
    localStorage.removeItem(TIPS_KEY);
    localStorage.removeItem(BLOCKED_IPS_KEY);
  }
};
