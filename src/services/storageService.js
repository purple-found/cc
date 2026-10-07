import { safeParseJSON } from '../utils/parser.js';
import { initialConcerts } from '../data/initialConcerts.js';
import { initialHalls } from '../data/initialHalls.js';
import { initialPosts } from '../data/initialPosts.js';

const CONCERTS_KEY = 'opus_korea_concerts_v2';
const HALLS_KEY = 'opus_korea_halls_v2';
const POSTS_KEY = 'opus_korea_posts_v2';
const THEME_KEY = 'opus_korea_theme_v2';

export const storageService = {
  // 공연 목록 조회
  getConcerts() {
    try {
      const raw = localStorage.getItem(CONCERTS_KEY);
      if (!raw) {
        localStorage.setItem(CONCERTS_KEY, JSON.stringify(initialConcerts));
        return initialConcerts;
      }
      const parsed = safeParseJSON(raw, initialConcerts);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialConcerts;
    } catch (e) {
      console.warn('[저장소 안전 복구] 공연 목록 기본값 복원', e);
      return initialConcerts;
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
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
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
              createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
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

  // 데이터 초기화
  resetAll() {
    localStorage.removeItem(CONCERTS_KEY);
    localStorage.removeItem(HALLS_KEY);
    localStorage.removeItem(POSTS_KEY);
  }
};
