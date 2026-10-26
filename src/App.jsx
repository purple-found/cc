import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ConcertCard from './components/ConcertCard';
import ConcertCompactList from './components/ConcertCompactList';
import ConcertCalendar from './components/ConcertCalendar';
import TipConcertModal from './components/TipConcertModal';
import InitialDiscoveryGuide from './components/InitialDiscoveryGuide';
import CommunityBoard from './components/CommunityBoard';
import AdminCenter from './components/AdminCenter';
import AdminAuthModal from './components/AdminAuthModal';
import Toast from './components/Toast';
import ErrorFallback from './components/ErrorFallback';
import Footer from './components/Footer';
import { storageService } from './services/storageService';
import { kopisMonitoringService } from './services/kopisMonitoringService.js';
import { kopisCrawlerService } from './services/kopisCrawlerService.js';
import { isPastConcert } from './utils/parser.js';
import { matchesBilingualConcert, prewarmSearchIndex } from './utils/bilingualSearch.js';
import { matchesVenueFilter } from './utils/venueMatcher.js';
import { analyticsService } from './services/analyticsService.js';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('concerts');
  const [theme, setTheme] = useState(() => storageService.getTheme());
  const [viewMode, setViewMode] = useState('cards');

  // Core Data States
  const [concerts, setConcerts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tips, setTips] = useState([]);
  const [blockedIps, setBlockedIps] = useState(() => storageService.getBlockedIps());
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasFatalError, setHasFatalError] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    venue: 'all',
    performerType: 'all',
    composer: 'all',
    performer: 'all',
    dateRange: 'all',
    customDate: ''
  });
  const [showAllConcerts, setShowAllConcerts] = useState(false);

  const hasActiveCondition = Boolean(
    filters.search ||
    filters.venue !== 'all' ||
    (filters.performerType && filters.performerType !== 'all') ||
    filters.composer !== 'all' ||
    filters.performer !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.customDate
  );

  const shouldShowConcerts = hasActiveCondition || showAllConcerts;

  // Modal & Target states
  const [reviewTargetConcert, setReviewTargetConcert] = useState(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const [toast, setToast] = useState(null);

  // 테마 클래스 반영
  useEffect(() => {
    storageService.saveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 초기 데이터 로드 (Gate 3, Gate 6, KOPIS 실시간 자동 동기화)
  const loadData = async () => {
    try {
      const c = storageService.getConcerts();
      const p = storageService.getPosts();
      const t = storageService.getTips();
      setConcerts(c);
      setPosts(p);
      setTips(t);
      setIsDataLoaded(true);
      setHasFatalError(false);

      // 백그라운드에서 검색 인덱스 1회 사전 생성 (검색 버튼 클릭 시 10ms 초고속 반응 보장)
      setTimeout(() => {
        prewarmSearchIndex(c);
      }, 50);

      // 공연 데이터가 비어있는 경우 KOPIS 정부 전산망에서 공식 실시간 데이터 자동 수집
      if (c.length === 0) {
        try {
          const res = await kopisCrawlerService.crawlKopisConcerts();
          if (res.success && res.concerts && res.concerts.length > 0) {
            setConcerts(res.concerts);
            showToast(`KOPIS 공식 전산망에서 ${res.concerts.length}건의 실제 공연을 성공적으로 수집했습니다.`);
          }
        } catch (crawlErr) {
          console.warn('[KOPIS 자동 수집 알림]:', crawlErr.message);
        }
      }
    } catch (err) {
      console.error('데이터 초기화 중 오류 발생:', err);
      setHasFatalError(true);
    }
  };

  useEffect(() => {
    // GA4 방문자 분석 서비스 초기화
    analyticsService.init();

    // 매월 1일 주기: 1년 이상 경과된 과거 공연 자동 정리 점검
    storageService.checkAndRunMonthlyCleanup();

    loadData();

    // 매일 새벽 3시 / 오후 3시 (15:00) KOPIS 및 공식망 자동 모니터링 배치 타이머 등록
    const timerId = kopisMonitoringService.initBackgroundTimer((res) => {
      loadData();
      showToast('KOPIS 및 공식망 자동 모니터링 검사 완료 (최신 공연 일정 반영)');
    });

    return () => clearInterval(timerId);
  }, []);

  // 탭 변경 시 GA4 가상 페이지뷰 추적
  useEffect(() => {
    const tabTitles = {
      concerts: '클래식 공연 탐색 | CLASSICALENDER',
      community: '클래식 커뮤니티 | CLASSICALENDER',
      admin: '관리자 센터 | CLASSICALENDER'
    };
    analyticsService.trackPageView(`/${activeTab}`, tabTitles[activeTab] || 'CLASSICALENDER');
  }, [activeTab]);

  // 토스트 도우미
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 일반 사용자의 공연 제보 핸들러
  const handleSubmitTip = (tipData) => {
    const updatedTips = storageService.addTip(tipData);
    setTips(updatedTips);
    analyticsService.trackTipSubmit(tipData);
    showToast('소중한 공연 제보가 관리자에게 전달되었습니다. 검토 후 공식 일정으로 등록됩니다.');
  };

  // 관리자의 제보 승인 및 공식 일정 반영 핸들러
  const handleApproveTip = (tipId) => {
    const { updatedTips, updatedConcerts, approvedConcert } = storageService.approveTip(tipId);
    setTips(updatedTips);
    setConcerts(updatedConcerts);
    showToast(`제보 공연 '${approvedConcert.title}'이(가) 공식 일정으로 정식 등록되었습니다!`);
  };

  // 관리자의 제보 반려/삭제 핸들러
  const handleDeleteTip = (tipId) => {
    const updatedTips = storageService.deleteTip(tipId);
    setTips(updatedTips);
    showToast('제보가 반려/삭제되었습니다.', 'info');
  };

  // 공연 추가 핸들러 (Admin 직접 등록)
  const handleAddConcert = (newConcert) => {
    const updated = storageService.addConcert(newConcert);
    setConcerts(updated);
    showToast(`'${newConcert.title}' 공연이 성공적으로 등록되었습니다.`);
  };

  // 공연 수정 핸들러 (Admin 수동 편집/교정)
  const handleUpdateConcert = (id, updatedData) => {
    const updated = storageService.updateConcert(id, updatedData);
    setConcerts(updated);
    showToast(`'${updatedData.title || '공연'}' 정보가 성공적으로 수정되었습니다.`);
  };

  // 공연 삭제 핸들러 (Admin)
  const handleDeleteConcert = (id) => {
    const updated = storageService.deleteConcert(id);
    setConcerts(updated);
    showToast('공연이 삭제되었습니다.', 'info');
  };

  // 공연 전체 삭제 핸들러 (Admin)
  const handleClearAllConcerts = () => {
    const updated = storageService.clearAllConcerts();
    setConcerts(updated);
    showToast('모든 공연 데이터가 성공적으로 삭제되었습니다.', 'info');
  };

  // 게시판 핸들러
  const handleAddPost = (newPost) => {
    const updated = storageService.addPost(newPost);
    setPosts(updated);
    analyticsService.trackCommunityPost(newPost.category, newPost.title);
    showToast('소중한 이야기가 등록되었습니다.');
  };

  const handleAddComment = (postId, comment) => {
    const updated = storageService.addComment(postId, comment);
    setPosts(updated);
    showToast('댓글이 등록되었습니다.');
  };

  const handleToggleLike = (postId) => {
    const updated = storageService.toggleLike(postId);
    setPosts(updated);
    showToast('공감을 보냈습니다! ❤️');
  };

  // 관리자 커뮤니티 관리 핸들러 (글/댓글 수정 및 삭제, IP 차단/해제)
  const handleUpdatePost = (postId, updatedData) => {
    const updated = storageService.updatePost(postId, updatedData);
    setPosts(updated);
    showToast('게시글이 성공적으로 수정되었습니다.');
  };

  const handleDeletePost = (postId) => {
    const updated = storageService.deletePost(postId);
    setPosts(updated);
    showToast('게시글이 삭제되었습니다.', 'info');
  };

  const handleUpdateComment = (postId, commentId, updatedData) => {
    const updated = storageService.updateComment(postId, commentId, updatedData);
    setPosts(updated);
    showToast('댓글이 성공적으로 수정되었습니다.');
  };

  const handleDeleteComment = (postId, commentId) => {
    const updated = storageService.deleteComment(postId, commentId);
    setPosts(updated);
    showToast('댓글이 삭제되었습니다.', 'info');
  };

  const handleBlockIp = (ip, reason) => {
    const updated = storageService.blockIp(ip, reason);
    setBlockedIps(updated);
    showToast(`IP (${ip}) 이용자가 차단되었습니다.`, 'info');
  };

  const handleUnblockIp = (ip) => {
    const updated = storageService.unblockIp(ip);
    setBlockedIps(updated);
    showToast(`IP (${ip}) 차단이 해제되었습니다.`);
  };

  // 필터링된 공연 목록 계산 (한국어/영어 양방향 다차원 검색)
  const filteredConcerts = useMemo(() => {
    return concerts.filter((c) => {
      // 1. 한국어/영문 완벽 양방향 통합 검색 (작품명, 작곡가, 연주자, 공연장, 세부홀, 도시, 설명)
      // 예: 작품에 '쇼팽' -> 'chopin' 검색 시 매칭, 작품에 'stravinsky' -> '스트라빈스키' 검색 시 매칭
      if (filters.search) {
        if (!matchesBilingualConcert(c, filters.search)) {
          return false;
        }
      }

      // 2. 공연장 및 세부 홀 정밀 다차원 필터 (서울 예술의전당/지방 전당 엄격 분리 및 세부 홀 교차 검증)
      if (filters.venue !== 'all') {
        if (!matchesVenueFilter(c, filters.venue)) {
          return false;
        }
      }

      // 3. 연주 편성 필터 (오케스트라 / 실내악)
      if (filters.performerType && filters.performerType !== 'all') {
        if (c.performerType !== filters.performerType) {
          return false;
        }
      }

      // 4. 작곡가 필터 (한/영 양방향 매칭)
      if (filters.composer !== 'all') {
        const cQuery = filters.composer.toLowerCase();
        const hasComp =
          (c.composers || []).some((comp) => comp.toLowerCase().includes(cQuery)) ||
          matchesBilingualConcert({ composers: c.composers, pieces: c.pieces }, filters.composer);
        if (!hasComp) return false;
      }

      // 5. 날짜 필터
      if (filters.dateRange === 'custom' && filters.customDate) {
        if (c.date !== filters.customDate) return false;
      } else if (filters.dateRange !== 'all') {
        if (!c.date.startsWith(filters.dateRange)) return false;
      }

      return true;
    }).sort((a, b) => {
      const aPast = isPastConcert(a.date, a.time);
      const bPast = isPastConcert(b.date, b.time);

      // 예정된 미래 공연을 먼저 표시
      if (!aPast && bPast) return -1;
      if (aPast && !bPast) return 1;

      // 예정된 미래 공연끼리는 가장 가까운 날짜부터 오름차순(가까운 미래 순)
      if (!aPast && !bPast) {
        return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
      }

      // 이미 지나간 공연끼리는 최근에 끝난 공연 순으로 내림차순
      return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '');
    });
  }, [concerts, filters]);

  if (hasFatalError) {
    return (
      <ErrorFallback
        onRetry={loadData}
        onReset={() => {
          storageService.resetAll();
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-concert-50 dark:bg-hall-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        onOpenTipModal={() => setIsTipModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab 1: Concerts Discovery */}
        {activeTab === 'concerts' && (
          <section className="space-y-6">
            {/* Hero Banner: Satin Gloss Deep-Brown Instrument Wood Varnish Tone */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#24140e] via-[#3d2015] to-[#1a0c07] text-white p-8 sm:p-10 shadow-2xl border border-[#522b1c]/60">
              {/* Semi-transparent orchestra cello section artwork on the right (Copyright/portrait-free asset) */}
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-3/5 lg:w-1/2 pointer-events-none overflow-hidden select-none">
                <img
                  src="/images/banner_cello_section.jpg"
                  alt="Orchestra Cello Section"
                  className="w-full h-full object-cover object-right opacity-35 mix-blend-screen scale-105"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 20%, black 100%)'
                  }}
                />
              </div>

              {/* Satin gloss & wood shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#874b26]/15 to-white/[0.08] pointer-events-none" />
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#9b582b]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#b88648]/40 via-[#522b1c]/10 to-transparent" />

              <div className="relative z-10 max-w-2xl space-y-3.5">
                <h1 className="font-serif font-black text-xl sm:text-3xl leading-snug tracking-tight text-[#fdf8f4] drop-shadow-sm">
                  숨죽인 홀 안의 침묵<br />가슴 깊이 남겨질 선율의 순간
                </h1>
                <p className="text-sm sm:text-[15px] text-[#ebdcc5]/95 font-medium leading-relaxed drop-shadow-xs">
                  무대 위의 호흡과 객석의 여운이 하나가 되는 시간<br />
                  전국 공연장에서 펼쳐지는 아름다운 연주의 순간들을 정갈하게 전합니다
                </p>
              </div>
            </div>

            {/* Smart Multi-Filter Bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              totalCount={concerts.length}
              filteredCount={filteredConcerts.length}
              concerts={concerts}
              shouldShowConcerts={shouldShowConcerts}
              onReset={() => setShowAllConcerts(false)}
            />

            {/* View Mode: Initial Discovery Guide vs Cards vs Compact vs Calendar */}
            {!shouldShowConcerts ? (
              <InitialDiscoveryGuide
                totalCount={concerts.length}
                onSelectVenue={(venue) => setFilters((prev) => ({ ...prev, venue }))}
                onSelectComposer={(composer) => setFilters((prev) => ({ ...prev, composer }))}
                onSelectDateRange={(dateRange) => setFilters((prev) => ({ ...prev, dateRange }))}
                onShowAll={() => setShowAllConcerts(true)}
              />
            ) : viewMode === 'cards' ? (
              filteredConcerts.length === 0 ? (
                <div className="p-16 text-center bg-white dark:bg-hall-900 rounded-3xl border border-stone-200 dark:border-hall-800">
                  <AlertCircle className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                  <h3 className="font-serif font-bold text-base text-stone-800 dark:text-stone-200">
                    선택한 조건의 클래식 공연이 없습니다
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    필터 조건을 변경하거나 검색어를 재설정해보세요.
                  </p>
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        venue: 'all',
                        performerType: 'all',
                        composer: 'all',
                        performer: 'all',
                        dateRange: 'all',
                        customDate: ''
                      });
                      setShowAllConcerts(true);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-concert-50 dark:bg-hall-800 text-concert-700 dark:text-concert-300 text-xs font-bold hover:bg-concert-100 transition-colors"
                  >
                    전체 공연 다시 보기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredConcerts.map((concert) => (
                    <ConcertCard
                      key={concert.id}
                      concert={concert}
                    />
                  ))}
                </div>
              )
            ) : viewMode === 'compact' ? (
              <ConcertCompactList
                concerts={filteredConcerts}
              />
            ) : (
              <ConcertCalendar
                concerts={filteredConcerts}
              />
            )}
          </section>
        )}

        {/* Tab 2: Community Board */}
        {activeTab === 'community' && (
          <CommunityBoard
            posts={posts}
            concerts={concerts}
            onAddPost={handleAddPost}
            onAddComment={handleAddComment}
            onToggleLike={handleToggleLike}
            initialTargetConcert={reviewTargetConcert}
          />
        )}

        {/* Tab 3: Admin & Crawler Monitor */}
        {activeTab === 'admin' && (
          isAdminAuthenticated ? (
            <AdminCenter
              concerts={concerts}
              tips={tips}
              posts={posts}
              blockedIps={blockedIps}
              onAddConcert={handleAddConcert}
              onUpdateConcert={handleUpdateConcert}
              onDeleteConcert={handleDeleteConcert}
              onClearAllConcerts={handleClearAllConcerts}
              onApproveTip={handleApproveTip}
              onDeleteTip={handleDeleteTip}
              onRefreshConcerts={(newList) => setConcerts(newList)}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onBlockIp={handleBlockIp}
              onUnblockIp={handleUnblockIp}
              onLogout={() => {
                setIsAdminAuthenticated(false);
                setActiveTab('concerts');
                showToast('관리자 모드를 종료했습니다.', 'info');
              }}
            />
          ) : (
            <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-concert-50 dark:bg-hall-800 text-concert-600 dark:text-concert-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                관리자 인증이 필요합니다
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                해당 페이지는 관리자 전용 공간입니다. 하단 비밀번호 인증 후 진입하실 수 있습니다.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('concerts')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  메인으로 이동
                </button>
                <button
                  onClick={() => setIsAdminAuthModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-concert-500 hover:bg-concert-600 text-white transition-colors shadow-sm"
                >
                  비밀번호 입력하기
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* General User Tip Modal */}
      <TipConcertModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        onSubmitTip={handleSubmitTip}
      />

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onAuthenticate={() => {
          setIsAdminAuthenticated(true);
          setActiveTab('admin');
          showToast('관리자 권한이 정상 인증되었습니다.');
        }}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Global Footer with hidden admin trigger */}
      <Footer onOpenAdminAuth={() => {
        if (isAdminAuthenticated) {
          setActiveTab('admin');
          showToast('관리 센터로 이동했습니다.');
        } else {
          setIsAdminAuthModalOpen(true);
        }
      }} />
    </div>
  );
}
