import { safeParseJSON, formatKSTDateTime } from '../utils/parser.js';
import { verifiedRealConcerts2026 } from '../data/verifiedRealConcerts2026.js';
import { initialHalls } from '../data/initialHalls.js';
import { initialPosts } from '../data/initialPosts.js';

const CONCERTS_KEY = 'opus_korea_verified_real_concerts_v6';
const HALLS_KEY = 'opus_korea_halls_v3';
const POSTS_KEY = 'opus_korea_posts_v3';
const THEME_KEY = 'opus_korea_theme_v3';

export const storageService = {
  // 공연 목록 조회 (100% 실존 공식 공연 연동)
  getConcerts() {
    try {
      const raw = localStorage.getItem(CONCERTS_KEY);
      if (!raw) {
        localStorage.setItem(CONCERTS_KEY, JSON.stringify(verifiedRealConcerts2026));
        return verifiedRealConcerts2026;
      }
      const parsed = safeParseJSON(raw, verifiedRealConcerts2026);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 실존 공식 공연 ID 목록 병합
        const existingIds = new Set(parsed.map(c => c.id));
        const missingOfficial = verifiedRealConcerts2026.filter(c => !existingIds.has(c.id));
        if (missingOfficial.length > 0) {
          const merged = [...parsed, ...missingOfficial];
          localStorage.setItem(CONCERTS_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      return verifiedRealConcerts2026;
    } catch (e) {
      console.warn('[저장소 안전 복구] 실존 공연 목록 기본값 복원', e);
      return verifiedRealConcerts2026;
    }
  },

  // 공연 목록 저장
  saveConcerts(concerts) {
    try {
      localStorage.setItem(CONCERTS_KEY, JSON.stringify(concerts));
    } catch (e) {
      console.error('[저장소 오류] 공연 목록 저장 실패', e);
    }
  },

  // 공연 단건 추가 (관리자 수동 등록)
  addConcert(concertData) {
    const list = this.getConcerts();
    const newConcert = {
      ...concertData,
      id: `conc-${Date.now()}`,
      source: '관리자 수동 등록',
      crawlerBlocked: true
    };
    const updated = [newConcert, ...list];
    this.saveConcerts(updated);
    return updated;
  },

  // 공연 삭제
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

  // 공연장 상태 목록
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

  // 커뮤니티 게시글 목록
  getPosts() {
    try {
      const raw = localStorage.getItem(POSTS_KEY);
      if (!raw) {
        localStorage.setItem(POSTS_KEY, JSON.stringify(initialPosts));
        return initialPosts;
      }
      const parsed = safeParseJSON(raw, initialPosts);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialPosts;
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

  // 게시글 추가
  addPost(postData) {
    const list = this.getPosts();
    const newPost = {
      ...postData,
      id: `post-${Date.now()}`,
      createdAt: formatKSTDateTime(new Date()),
      likes: 0,
      views: 1,
      comments: []
    };
    const updated = [newPost, ...list];
    this.savePosts(updated);
    return updated;
  },

  // 댓글 추가
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

  // 테마 모드
  getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  },

  saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  },

  // 공연 제보(Tip-off) 목록 조회 (일반 사용자 제보 -> 관리자 승인)
  getTips() {
    try {
      const raw = localStorage.getItem('opus_korea_tips_v3');
      if (!raw) return [];
      const parsed = safeParseJSON(raw, []);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveTips(tips) {
    try {
      localStorage.setItem('opus_korea_tips_v3', JSON.stringify(tips));
    } catch (e) {
      console.error('[저장소 오류] 제보 목록 저장 실패', e);
    }
  },

  // 일반 사용자의 공연 제보 등록
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

  // 관리자의 제보 승인 및 공식 공연 정식 등록
  approveTip(tipId) {
    const tips = this.getTips();
    const targetTip = tips.find(t => t.id === tipId);
    if (!targetTip) return { updatedTips: tips, updatedConcerts: this.getConcerts() };

    // 공식 공연 객체로 변환하여 등록
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
      ticketUrl: targetTip.ticketUrl || 'https://www.sac.or.kr',
      status: '예매중',
      description: `[관람객 제보 등록] ${targetTip.note || '공연 일정입니다.'}`,
      imageUrl: targetTip.imageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
      source: '관람객 제보 (관리자 승인)',
      crawlerBlocked: true
    };

    const updatedConcerts = this.addConcert(newConcert);
    // 제보 목록에서 승인 완료된 항목 제거
    const updatedTips = tips.filter(t => t.id !== tipId);
    this.saveTips(updatedTips);

    return { updatedTips, updatedConcerts, approvedConcert: newConcert };
  },

  // 관리자의 제보 반려/삭제
  deleteTip(tipId) {
    const list = this.getTips();
    const updated = list.filter(t => t.id !== tipId);
    this.saveTips(updated);
    return updated;
  },

  // 데이터 초기화
  resetAll() {
    localStorage.removeItem(CONCERTS_KEY);
    localStorage.removeItem(HALLS_KEY);
    localStorage.removeItem(POSTS_KEY);
    localStorage.removeItem('opus_korea_tips_v3');
  }
};
