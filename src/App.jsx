import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ConcertCard from './components/ConcertCard';
import ConcertCalendar from './components/ConcertCalendar';
import ConcertDetailModal from './components/ConcertDetailModal';
import CommunityBoard from './components/CommunityBoard';
import AdminCenter from './components/AdminCenter';
import Toast from './components/Toast';
import ErrorFallback from './components/ErrorFallback';
import Footer from './components/Footer';
import { storageService } from './services/storageService';
import { Sparkles, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('concerts');
  const [theme, setTheme] = useState(() => storageService.getTheme());
  const [viewMode, setViewMode] = useState('cards');

  // Core Data States
  const [concerts, setConcerts] = useState([]);
  const [halls, setHalls] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasFatalError, setHasFatalError] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    venue: '전체 장소',
    composer: '전체 작곡가',
    performer: '전체 연주자/단체',
    dateRange: 'all',
    customDate: ''
  });

  // Modal & Target states
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [reviewTargetConcert, setReviewTargetConcert] = useState(null);
  const [isAdminAddModalDirect, setIsAdminAddModalDirect] = useState(false);

  // Async Simulator State
  const [isSyncing, setIsSyncing] = useState(false);
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

  // 초기 데이터 로드 (Gate 3, Gate 6)
  const loadData = () => {
    try {
      const c = storageService.getConcerts();
      const h = storageService.getHalls();
      const p = storageService.getPosts();
      setConcerts(c);
      setHalls(h);
      setPosts(p);
      setIsDataLoaded(true);
      setHasFatalError(false);
    } catch (err) {
      console.error('데이터 초기화 중 오류 발생:', err);
      setHasFatalError(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 토스트 도우미
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // 공연 추가 핸들러 (Admin)
  const handleAddConcert = (newConcert) => {
    const updated = storageService.addConcert(newConcert);
    setConcerts(updated);
    showToast(`'${newConcert.title}' 공연이 성공적으로 등록되었습니다.`);
  };

  // 공연 삭제 핸들러 (Admin)
  const handleDeleteConcert = (id) => {
    const updated = storageService.deleteConcert(id);
    setConcerts(updated);
    showToast('공연이 삭제되었습니다.', 'info');
  };

  // 전체 공연장 수집 동기화 시뮬레이션
  const handleSyncAllHalls = () => {
    setIsSyncing(true);
    showToast('전체 공연장 수집망 동기화를 시작합니다...', 'info');

    setTimeout(() => {
      const currentHalls = storageService.getHalls();
      const updatedHalls = currentHalls.map((h) => ({
        ...h,
        lastSyncTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }));
      storageService.saveHalls(updatedHalls);
      setHalls(updatedHalls);
      setIsSyncing(false);
      showToast('공연장 수집망 동기화가 완료되었습니다. (차단 공연장 수동 관리 유지)');
    }, 1200);
  };

  // 게시판 핸들러
  const handleAddPost = (newPost) => {
    const updated = storageService.addPost(newPost);
    setPosts(updated);
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

  // 필터링된 공연 목록 계산 (메모이제이션)
  const filteredConcerts = useMemo(() => {
    return concerts.filter((c) => {
      // 1. 검색어 필터 (제목, 작곡가, 협연자, 연주곡, 공연장)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const titleMatch = c.title.toLowerCase().includes(query);
        const composerMatch = c.composers.some((comp) => comp.toLowerCase().includes(query));
        const performerMatch = c.performers.some((perf) => perf.toLowerCase().includes(query));
        const pieceMatch = c.pieces.some((pc) => pc.toLowerCase().includes(query));
        const venueMatch = c.venue.toLowerCase().includes(query);
        if (!titleMatch && !composerMatch && !performerMatch && !pieceMatch && !venueMatch) {
          return false;
        }
      }

      // 2. 공연장 필터
      if (filters.venue !== '전체 장소' && !c.venue.includes(filters.venue.replace(' 콘서트홀', '').replace(' 대극장', '').replace(' 그랜드홀', ''))) {
        return false;
      }

      // 3. 작곡가 필터
      if (filters.composer !== '전체 작곡가' && !c.composers.includes(filters.composer)) {
        return false;
      }

      // 4. 연주자/단체 필터
      if (filters.performer !== '전체 연주자/단체') {
        const perfMatch = c.performers.some((p) => p.includes(filters.performer));
        if (!perfMatch) return false;
      }

      // 5. 날짜 필터
      if (filters.dateRange === 'custom' && filters.customDate) {
        if (c.date !== filters.customDate) return false;
      } else if (filters.dateRange !== 'all') {
        if (!c.date.startsWith(filters.dateRange)) return false;
      }

      return true;
    });
  }, [concerts, filters]);

  // 특정 공연과 관련된 게시글 필터링
  const selectedConcertPosts = useMemo(() => {
    if (!selectedConcert) return [];
    return posts.filter((p) => p.concertId === selectedConcert.id);
  }, [posts, selectedConcert]);

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
        onOpenAddModal={() => {
          setActiveTab('admin');
          setIsAdminAddModalDirect(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab 1: Concerts Discovery */}
        {activeTab === 'concerts' && (
          <section className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-hall-900 to-stone-950 text-white p-8 sm:p-10 shadow-lg border border-stone-800">
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-concert-500/20 text-concert-300 border border-concert-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2025/2026 대한민국 클래식 시즌</span>
                </span>
                <h1 className="font-serif font-black text-2xl sm:text-4xl leading-tight">
                  한국 클래식 공연의 감동을<br />한눈에 탐색하고 기록하세요
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 font-medium leading-relaxed">
                  예술의전당부터 롯데콘서트홀, 부천아트센터까지 전국 주요 클래식 전용홀의 일정을 날짜·장소·작곡가·연주자별로 정밀하게 큐레이션합니다.
                </p>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-concert-400 via-transparent to-transparent" />
            </div>

            {/* Smart Multi-Filter Bar */}
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
              totalCount={concerts.length}
              filteredCount={filteredConcerts.length}
            />

            {/* View Mode: Cards vs Calendar */}
            {viewMode === 'cards' ? (
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
                    onClick={() =>
                      setFilters({
                        search: '',
                        venue: '전체 장소',
                        composer: '전체 작곡가',
                        performer: '전체 연주자/단체',
                        dateRange: 'all',
                        customDate: ''
                      })
                    }
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
                      onSelect={(c) => setSelectedConcert(c)}
                      onOpenReview={(c) => {
                        setReviewTargetConcert(c);
                        setActiveTab('community');
                      }}
                    />
                  ))}
                </div>
              )
            ) : (
              <ConcertCalendar
                concerts={filteredConcerts}
                onSelectConcert={(c) => setSelectedConcert(c)}
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
          <AdminCenter
            halls={halls}
            concerts={concerts}
            onAddConcert={handleAddConcert}
            onDeleteConcert={handleDeleteConcert}
            onSyncAllHalls={handleSyncAllHalls}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Detail Modal */}
      <ConcertDetailModal
        concert={selectedConcert}
        onClose={() => setSelectedConcert(null)}
        onOpenReview={(c) => {
          setSelectedConcert(null);
          setReviewTargetConcert(c);
          setActiveTab('community');
        }}
        relatedPosts={selectedConcertPosts}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
