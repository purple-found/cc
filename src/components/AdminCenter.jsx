import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Music,
  Inbox,
  Check,
  Edit3,
  Ban,
  MessageSquare,
  MessageCircle,
  X,
  UserX,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ExternalLink,
  Activity,
  Search
} from 'lucide-react';
import { formatKoreanDate } from '../utils/parser.js';
import { kopisCrawlerService } from '../services/kopisCrawlerService.js';
import { analyticsService } from '../services/analyticsService.js';

export default function AdminCenter({
  concerts = [],
  tips = [],
  posts = [],
  blockedIps = [],
  onAddConcert,
  onUpdateConcert,
  onDeleteConcert,
  onClearAllConcerts,
  onApproveTip,
  onDeleteTip,
  onLogout,
  onRefreshConcerts,
  onUpdatePost,
  onDeletePost,
  onUpdateComment,
  onDeleteComment,
  onBlockIp,
  onUnblockIp
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingConcert, setEditingConcert] = useState(null);
  const [isSyncingKopis, setIsSyncingKopis] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState('');
  const [syncResult, setSyncResult] = useState(null);

  // 등록 공연 검색 및 가상 페이지네이션 상태 (2,000+건 DOM 렌더링 최적화)
  const [adminConcertQuery, setAdminConcertQuery] = useState('');
  const [visibleConcertLimit, setVisibleConcertLimit] = useState(60);

  // 커뮤니티 및 IP 관리용 상태
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [manualBlockIp, setManualBlockIp] = useState('');
  const [manualBlockReason, setManualBlockReason] = useState('');

  // 구글 애널리틱스 4 (GA4) 연동 상태
  const [gaMeasurementId, setGaMeasurementId] = useState(() => analyticsService.getMeasurementId() || '');
  const [gaFeedback, setGaFeedback] = useState(null);

  // ESC 키로 관리자 모달 닫기 (Gate 2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen) setIsAddModalOpen(false);
        else if (editingConcert) setEditingConcert(null);
        else if (editingPost) setEditingPost(null);
        else if (editingComment) setEditingComment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, editingConcert, editingPost, editingComment]);

  // 관리자 공연 검색 필터링
  const filteredAdminConcerts = useMemo(() => {
    const q = adminConcertQuery.trim().toLowerCase();
    if (!q) return concerts;
    return concerts.filter((c) => {
      const titleMatch = (c.title || '').toLowerCase().includes(q);
      const venueMatch = (c.venue || '').toLowerCase().includes(q);
      const dateMatch = (c.date || '').includes(q);
      const typeMatch = (c.performerType || '').toLowerCase().includes(q);
      const perfMatch = (c.performers || []).some((p) => String(p).toLowerCase().includes(q));
      return titleMatch || venueMatch || dateMatch || typeMatch || perfMatch;
    });
  }, [concerts, adminConcertQuery]);

  const handleSaveGaId = (e) => {
    e.preventDefault();
    const cleanId = gaMeasurementId.trim().toUpperCase();
    if (cleanId && !cleanId.startsWith('G-')) {
      setGaFeedback({ type: 'error', message: '측정 ID는 반드시 "G-"로 시작해야 합니다. (예: G-XXXXXXXXXX)' });
      return;
    }
    analyticsService.setMeasurementId(cleanId);
    setGaFeedback({
      type: 'success',
      message: cleanId ? `GA4 측정 ID (${cleanId})가 성공적으로 저장 및 즉시 활성화되었습니다!` : '측정 ID가 초기화되었습니다.'
    });
  };

  const handleSendTestEvent = () => {
    if (!analyticsService.isConfigured()) {
      setGaFeedback({ type: 'error', message: '측정 ID를 먼저 입력하고 저장한 후 테스트를 진행해주세요.' });
      return;
    }
    analyticsService.trackEvent('admin_verification_test', {
      timestamp: new Date().toISOString(),
      test_note: '관리자 센터 GA4 실시간 연동 정상 테스트'
    });
    setGaFeedback({
      type: 'success',
      message: '테스트 이벤트(admin_verification_test)가 전송되었습니다! 구글 애널리틱스 [실시간] 메뉴에서 확인하실 수 있습니다.'
    });
  };

  const handleSyncKopis = async () => {
    setIsSyncingKopis(true);
    setSyncResult(null);
    setSyncProgressText('[1/4단계] KOPIS 공식 전산망 및 10대 공연장 일정 조회 시작...');
    try {
      const res = await kopisCrawlerService.crawlKopisConcerts({
        onProgress: (p) => {
          if (p && p.stage) setSyncProgressText(p.stage);
        }
      });
      if (res.success && res.concerts) {
        if (onRefreshConcerts) {
          onRefreshConcerts(res.concerts);
        }
        setSyncResult(res);
      } else {
        setSyncResult({
          success: false,
          message: res.message || '공연 데이터를 수집하지 못했습니다.'
        });
      }
    } catch (e) {
      setSyncResult({
        success: false,
        message: 'KOPIS 전산망 수집 중 오류: ' + (e.message || '네트워크 오류')
      });
    } finally {
      setIsSyncingKopis(false);
      setSyncProgressText('');
    }
  };
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '19:30',
    venue: '부천아트센터 콘서트홀',
    city: '경기/인천',
    performerType: '오케스트라',
    performers: '',
    composers: '',
    pieces: '',
    price: 'R석 100,000원 / S석 70,000원',
    ticketUrl: 'https://www.bac.or.kr',
    status: '예매중',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.performers) {
      alert('공연명, 날짜, 출연진은 필수 항목입니다.');
      return;
    }

    const performersArray = formData.performers
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const composersArray = formData.composers
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const piecesArray = formData.pieces
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    onAddConcert({
      title: formData.title,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      city: formData.city,
      performerType: formData.performerType,
      performers: performersArray.length > 0 ? performersArray : ['출연진 정보 미정'],
      composers: composersArray.length > 0 ? composersArray : ['클래식 명곡'],
      pieces: piecesArray.length > 0 ? piecesArray : ['상세 프로그램 협의 중'],
      price: formData.price,
      ticketUrl: formData.ticketUrl || 'https://www.interpark.com',
      status: formData.status,
      description: formData.description || '주요 클래식 공연 일정입니다.',
      imageUrl: formData.imageUrl
    });

    setIsAddModalOpen(false);
    // 폼 리셋
    setFormData({
      title: '',
      date: '',
      time: '19:30',
      venue: '부천아트센터 콘서트홀',
      city: '경기/인천',
      performerType: '오케스트라',
      performers: '',
      composers: '',
      pieces: '',
      price: 'R석 100,000원 / S석 70,000원',
      ticketUrl: 'https://www.bac.or.kr',
      status: '예매중',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80'
    });
  };

  // 기존 공연 편집 열기 핸들러
  const openEditModal = (concert) => {
    setEditingConcert({
      id: concert.id,
      title: concert.title || '',
      date: concert.date || '',
      time: concert.time || '19:30',
      venue: concert.venue || '',
      city: concert.city || '서울',
      performerType: concert.performerType || '오케스트라',
      performers: Array.isArray(concert.performers) ? concert.performers.join(', ') : (concert.performers || ''),
      composers: Array.isArray(concert.composers) ? concert.composers.join(', ') : (concert.composers || ''),
      pieces: Array.isArray(concert.pieces) ? concert.pieces.join('\n') : (concert.pieces || ''),
      price: concert.price || '',
      ticketUrl: concert.ticketUrl || '',
      status: concert.status || '예매중',
      description: concert.description || ''
    });
  };

  // 기존 공연 수정 제출 핸들러
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingConcert || !editingConcert.title || !editingConcert.date) {
      alert('공연명과 공연일은 필수입니다.');
      return;
    }

    const performersArray = editingConcert.performers
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const composersArray = editingConcert.composers
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const piecesArray = editingConcert.pieces
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    if (onUpdateConcert) {
      onUpdateConcert(editingConcert.id, {
        title: editingConcert.title,
        date: editingConcert.date,
        time: editingConcert.time,
        venue: editingConcert.venue,
        city: editingConcert.city,
        performerType: editingConcert.performerType,
        performers: performersArray.length > 0 ? performersArray : ['출연진 정보'],
        composers: composersArray.length > 0 ? composersArray : ['클래식'],
        pieces: piecesArray.length > 0 ? piecesArray : ['상세 프로그램'],
        price: editingConcert.price,
        ticketUrl: editingConcert.ticketUrl,
        status: editingConcert.status,
        description: editingConcert.description
      });
    }

    setEditingConcert(null);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Sync Control */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-2 rounded-xl bg-concert-50 dark:bg-hall-800 text-concert-600 dark:text-concert-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <span>공연장 관리 센터</span>
              </h2>

              {/* 1. 슬림 타원 분홍 뱃지 */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200/80 dark:border-pink-900/60 shrink-0">
                관리자 전용 권한
              </span>

              {/* 2. 관리자 모드 나가기 버튼 (뱃지와 동일한 컴팩트 타원 규격) */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-hall-700 transition-colors shrink-0"
                  title="관리자 세션 종료"
                >
                  <span>관리자 모드 나가기</span>
                </button>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              새벽 3시 자동 배치와 동일한 4단계(KOPIS 소개글 · 공식 상세페이지 · 포스터/전단 이미지 판독 · 명작 매칭) 수집을 수동 실행하거나 공연을 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSyncKopis}
              disabled={isSyncingKopis}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all shrink-0 border border-stone-200 dark:border-hall-700 cursor-pointer"
              title="새벽 3시 자동 업데이트와 동일한 4단계(KOPIS 공식망 + 상세페이지 + 포스터/전단 이미지 판독) 실시간 수집을 즉시 실행합니다"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKopis ? 'animate-spin text-concert-500' : ''}`} />
              <span>{isSyncingKopis ? '4단계 지능형 수집 중...' : 'KOPIS 공식 실시간 수집'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>공연 직접 등록 (관리자)</span>
            </button>
          </div>
        </div>

        {/* Live 4-Stage Progress & Result Banner */}
        {isSyncingKopis && syncProgressText && (
          <div className="p-3.5 rounded-xl bg-concert-50/80 dark:bg-hall-850 border border-concert-200 dark:border-hall-700 flex items-center gap-2.5 text-xs text-concert-800 dark:text-concert-200 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-concert-600 shrink-0" />
            <span className="font-semibold">{syncProgressText}</span>
          </div>
        )}

        {syncResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              syncResult.success
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/70 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-bold">
                {syncResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <span>{syncResult.message}</span>
              </div>
              <button
                onClick={() => setSyncResult(null)}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="결과 닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {syncResult.success && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-hall-900/80 border border-emerald-200/60 dark:border-emerald-900/50">
                  <span className="text-stone-500 dark:text-stone-400 block">1단계 (KOPIS 소개글)</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{syncResult.stage1Count || 0}건 발굴</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-hall-900/80 border border-emerald-200/60 dark:border-emerald-900/50">
                  <span className="text-stone-500 dark:text-stone-400 block">2단계 (공식 상세페이지)</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{syncResult.stage2Count || 0}건 발굴</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-hall-900/80 border border-emerald-200/60 dark:border-emerald-900/50">
                  <span className="text-stone-500 dark:text-stone-400 block">3단계 (포스터·전단 판독)</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {syncResult.stage3Count || 0}건 {syncResult.serverBatchStarted ? '(서버 정밀 판독 중)' : '발굴'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-hall-900/80 border border-emerald-200/60 dark:border-emerald-900/50">
                  <span className="text-stone-500 dark:text-stone-400 block">4단계 (제목·오페라 매칭)</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{syncResult.stage4Count || 0}건 발굴</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Inquiry & Tip-off Inbox (관람객 문의 및 공연 제보함) */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-concert-500" />
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              관람객 문의 및 공연 제보함 ({tips.length}건 대기 중)
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            공연 제보는 승인 시 즉시 공식 일정으로 등록되며, 일반 문의는 확인 후 완료 처리할 수 있습니다.
          </span>
        </div>

        {tips.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 dark:bg-hall-850 rounded-2xl border border-stone-200/60 dark:border-hall-800 text-xs text-stone-500 dark:text-stone-400">
            현재 대기 중인 문의 또는 공연 제보가 없습니다. 이용자가 상단 [문의 및 공연 제보]를 통해 접수한 내역이 여기에 표시됩니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip) => {
              const isInquiry = tip.type === 'inquiry' || tip.venue === '일반 문의 / 정보 수정 요청';
              return (
                <div
                  key={tip.id}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-800 space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-stone-400">{tip.createdAt} 접수</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isInquiry
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {isInquiry ? '일반 문의 / 요청' : '공연 제보 대기'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                      {tip.title}
                    </h4>
                    {!isInquiry && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        {formatKoreanDate(tip.date)} · {tip.time} | {tip.venue}
                      </p>
                    )}
                    <p className="text-xs text-concert-600 dark:text-concert-400 font-medium mt-0.5">
                      {isInquiry ? '작성자/연락처: ' : '출연: '}
                      {Array.isArray(tip.performers) ? tip.performers.join(', ') : tip.performers}
                    </p>
                    {tip.note && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 bg-white dark:bg-hall-900 p-2.5 rounded-lg border border-stone-200/60 dark:border-hall-800 mt-2 whitespace-pre-wrap leading-relaxed">
                        <strong>{isInquiry ? '문의 내용:' : '제보 메모:'}</strong> {tip.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/80 dark:border-hall-800">
                    {isInquiry ? (
                      <button
                        onClick={() => onDeleteTip(tip.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>확인 완료 (정리)</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onDeleteTip(tip.id)}
                          className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
                        >
                          반려
                        </button>
                        <button
                          onClick={() => onApproveTip(tip.id)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>승인하여 정식 등록</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registered Concerts Management Section */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Music className="w-5 h-5 text-concert-500" />
              <span>현재 등록된 전체 공연 데이터 ({concerts.length}건)</span>
            </h3>
            <span className="text-xs text-stone-400">
              관리자 수정·삭제 시 메인 화면 및 캘린더에 즉시 반영됩니다
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Instant Admin Concert Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={adminConcertQuery}
                onChange={(e) => {
                  setAdminConcertQuery(e.target.value);
                  setVisibleConcertLimit(60);
                }}
                placeholder="공연명, 공연장, 날짜, 출연진 빠른 검색..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
              />
              {adminConcertQuery && (
                <button
                  type="button"
                  onClick={() => setAdminConcertQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label="검색어 지우기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {concerts.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('⚠️ 등록된 모든 공연 데이터를 완전히 삭제하시겠습니까?\n이 작업은 즉시 반영되며, 필요 시 공연 직접 등록이나 관람객 제보 승인을 통해 다시 채울 수 있습니다.')) {
                    if (onClearAllConcerts) {
                      onClearAllConcerts();
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200/80 dark:border-red-900/50 transition-colors shrink-0"
                title="모든 공연 데이터를 완전히 비웁니다"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>공연 데이터 전체 삭제</span>
              </button>
            )}
          </div>
        </div>

        {concerts.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-400 dark:text-stone-500 bg-stone-50/60 dark:bg-hall-850/60 rounded-xl border border-dashed border-stone-200 dark:border-hall-800 space-y-2">
            <Music className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600" />
            <p className="font-semibold text-stone-700 dark:text-stone-300">현재 등록된 공연 데이터가 없습니다.</p>
            <p className="text-[11px] text-stone-400">부정확한 기존 데이터는 전량 정리되었습니다. 상단의 '공연 직접 등록' 버튼을 이용하거나 관람객 제보를 승인하여 정확한 일정을 등록해주세요.</p>
          </div>
        ) : filteredAdminConcerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500 bg-stone-50/60 dark:bg-hall-850/60 rounded-xl border border-dashed border-stone-200 dark:border-hall-800">
            검색어("{adminConcertQuery}")와 일치하는 공연이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="divide-y divide-stone-100 dark:divide-hall-800 max-h-96 overflow-y-auto pr-1">
              {filteredAdminConcerts.slice(0, visibleConcertLimit).map((c) => (
                <div
                  key={c.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-concert-50 dark:bg-hall-800 text-concert-700 dark:text-concert-300 shrink-0">
                        {c.performerType || '클래식'}
                      </span>
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                        {c.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        c.crawlerBlocked
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-stone-100 text-stone-600 dark:bg-hall-800 dark:text-stone-300'
                      }`}>
                        {c.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                      <span>{formatKoreanDate(c.date)}</span>
                      <span>·</span>
                      <span>{c.venue}</span>
                      <span>·</span>
                      <span className="text-concert-600 dark:text-concert-400 truncate max-w-xs">{(c.performers || []).join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 text-stone-500 hover:text-concert-600 dark:hover:text-concert-400 hover:bg-concert-50 dark:hover:bg-hall-800 rounded-lg transition-colors"
                      title="공연 정보 직접 수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`'${c.title}' 공연을 삭제하시겠습니까?`)) {
                          onDeleteConcert(c.id);
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="공연 일정 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredAdminConcerts.length > visibleConcertLimit && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleConcertLimit((prev) => prev + 100)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-750 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
                >
                  공연 목록 더보기 ({visibleConcertLimit} / {filteredAdminConcerts.length}건 표시 중)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Moderation Section (커뮤니티 부적절 글 및 댓글 관리) */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-concert-500" />
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>커뮤니티 게시글 및 댓글 관리</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-hall-800 text-stone-600 dark:text-stone-300">
                게시글 {posts.length}건
              </span>
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            작성자 IP를 확인하고, 정치/비방 등 부적절한 글과 댓글을 수정·삭제하거나 이용자를 차단합니다.
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500 bg-stone-50/60 dark:bg-hall-850/60 rounded-xl border border-dashed border-stone-200 dark:border-hall-800">
            등록된 커뮤니티 게시글이 없습니다.
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {posts.map((post) => {
              const isAuthorBlocked = blockedIps.some((b) => b.ip === post.ip);
              const isExpanded = expandedPostId === post.id;
              const commentsCount = post.comments ? post.comments.length : 0;

              return (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-stone-50/80 dark:bg-hall-850 border border-stone-200/80 dark:border-hall-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-concert-50 dark:bg-hall-800 text-concert-700 dark:text-concert-300">
                          {post.category}
                        </span>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                          {post.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 flex-wrap">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">{post.author}</span>
                        <span>·</span>
                        <span>{post.createdAt}</span>
                        <span>·</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-stone-200 dark:bg-hall-700 text-stone-700 dark:text-stone-300">
                          IP: {post.ip || '기록 없음'}
                        </span>
                        {isAuthorBlocked && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300">
                            <Ban className="w-3 h-3" />
                            차단된 IP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="댓글 목록 확인"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-stone-500" />
                        <span>댓글 ({commentsCount})</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => setEditingPost({
                          id: post.id,
                          title: post.title,
                          category: post.category,
                          content: post.content
                        })}
                        className="p-1.5 text-stone-500 hover:text-concert-600 dark:hover:text-concert-400 hover:bg-concert-50 dark:hover:bg-hall-800 rounded-lg transition-colors"
                        title="게시글 내용 수정"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`'${post.title}' 게시글을 삭제하시겠습니까?\n등록된 댓글도 함께 삭제됩니다.`)) {
                            onDeletePost(post.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="게시글 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {post.ip && (
                        isAuthorBlocked ? (
                          <button
                            onClick={() => onUnblockIp(post.ip)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-stone-200 hover:bg-stone-300 dark:bg-hall-700 dark:hover:bg-hall-600 text-stone-700 dark:text-stone-300 transition-colors"
                            title="이 IP 차단 해제"
                          >
                            차단 해제
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`IP (${post.ip}) 사용자를 차단하시겠습니까?\n차단 시 해당 IP에서는 글 및 댓글 작성이 원천 차단됩니다.`)) {
                                onBlockIp(post.ip, `게시글 '${post.title}' 부적절 발언 규제`);
                              }
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 transition-colors"
                            title="이 IP 차단하기"
                          >
                            IP 차단
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-hall-900 p-3 rounded-lg border border-stone-200/60 dark:border-hall-800 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Comments accordion */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-stone-200/60 dark:border-hall-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                        <span>등록된 댓글 ({commentsCount}개)</span>
                      </div>

                      {commentsCount === 0 ? (
                        <p className="text-[11px] text-stone-400 italic py-1">작성된 댓글이 없습니다.</p>
                      ) : (
                        <div className="space-y-2">
                          {post.comments.map((comment) => {
                            const isCommentBlocked = blockedIps.some((b) => b.ip === comment.ip);
                            return (
                              <div
                                key={comment.id}
                                className="p-2.5 rounded-lg bg-stone-100/70 dark:bg-hall-900 border border-stone-200/60 dark:border-hall-800 flex items-start justify-between gap-2 text-xs"
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                    <span className="font-bold text-stone-800 dark:text-stone-200">{comment.author}</span>
                                    <span className="text-stone-400">{comment.createdAt}</span>
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded font-mono text-[10px] bg-stone-200/80 dark:bg-hall-800 text-stone-700 dark:text-stone-300">
                                      IP: {comment.ip || '기록 없음'}
                                    </span>
                                    {isCommentBlocked && (
                                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                                        (차단된 IP)
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                                    {comment.content}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setEditingComment({
                                      postId: post.id,
                                      commentId: comment.id,
                                      author: comment.author,
                                      content: comment.content
                                    })}
                                    className="p-1 text-stone-500 hover:text-concert-600 dark:hover:text-concert-400 hover:bg-stone-200 dark:hover:bg-hall-800 rounded transition-colors"
                                    title="댓글 수정"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('해당 댓글을 삭제하시겠습니까?')) {
                                        onDeleteComment(post.id, comment.id);
                                      }
                                    }}
                                    className="p-1 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                                    title="댓글 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  {comment.ip && (
                                    isCommentBlocked ? (
                                      <button
                                        onClick={() => onUnblockIp(comment.ip)}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-200 dark:bg-hall-700 text-stone-700 dark:text-stone-300"
                                      >
                                        해제
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (confirm(`댓글 작성자 IP (${comment.ip})를 차단하시겠습니까?`)) {
                                            onBlockIp(comment.ip, `댓글 부적절 표현 규제`);
                                          }
                                        }}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 hover:bg-red-200 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                                      >
                                        IP 차단
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Blocked IPs Management Section (차단된 IP 목록 및 수동 차단 관리) */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-500" />
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>차단된 이용자 (IP) 목록 관리</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-900/60">
                총 {blockedIps.length}개 차단됨
              </span>
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            차단된 IP는 커뮤니티 게시글 및 댓글 작성이 전면 차단됩니다.
          </span>
        </div>

        {/* Manual IP Block Form */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200/80 dark:border-hall-800 space-y-2">
          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
            수동 IP 차단 등록
          </span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="차단할 IP 주소 (예: 192.168.1.100)"
              value={manualBlockIp}
              onChange={(e) => setManualBlockIp(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-hall-700 bg-white dark:bg-hall-900 text-stone-900 dark:text-stone-100 text-xs flex-1 focus:outline-hidden focus:ring-1 focus:ring-concert-500 font-mono"
            />
            <input
              type="text"
              placeholder="차단 사유 (예: 지속적인 정치 논쟁 및 비방)"
              value={manualBlockReason}
              onChange={(e) => setManualBlockReason(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-hall-700 bg-white dark:bg-hall-900 text-stone-900 dark:text-stone-100 text-xs flex-1 focus:outline-hidden focus:ring-1 focus:ring-concert-500"
            />
            <button
              onClick={() => {
                if (!manualBlockIp.trim()) {
                  alert('차단할 IP 주소를 입력해주세요.');
                  return;
                }
                onBlockIp(manualBlockIp.trim(), manualBlockReason.trim() || '관리자 수동 차단');
                setManualBlockIp('');
                setManualBlockReason('');
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>IP 차단 등록</span>
            </button>
          </div>
        </div>

        {/* Blocked IPs Table */}
        {blockedIps.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-hall-850/50 rounded-xl border border-dashed border-stone-200 dark:border-hall-800">
            현재 차단된 IP 주소가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-hall-850 text-stone-500 dark:text-stone-400 font-bold border-b border-stone-100 dark:border-hall-800">
                <tr>
                  <th className="py-2.5 px-3">차단된 IP 주소</th>
                  <th className="py-2.5 px-3">차단 사유</th>
                  <th className="py-2.5 px-3">차단 일시</th>
                  <th className="py-2.5 px-3 text-right">해제 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-hall-800">
                {blockedIps.map((item) => (
                  <tr key={item.ip} className="hover:bg-stone-50/80 dark:hover:bg-hall-850/50">
                    <td className="py-3 px-3 font-mono font-bold text-red-600 dark:text-red-400">
                      {item.ip}
                    </td>
                    <td className="py-3 px-3 text-stone-700 dark:text-stone-300">
                      {item.reason}
                    </td>
                    <td className="py-3 px-3 text-stone-400 text-[11px]">
                      {item.blockedAt}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`IP (${item.ip}) 차단을 해제하시겠습니까?`)) {
                            onUnblockIp(item.ip);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-700 dark:text-stone-300 text-[11px] font-semibold transition-colors"
                      >
                        차단 해제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google Analytics 4 (GA4) Analytics & Statistics Section (방문자 통계 연동 관리) */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  사이트 방문자 분석 및 통계 관리 (Google Analytics 4)
                </h3>
                {analyticsService.isConfigured() ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    실시간 통계 수집 중
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    측정 식별 번호 설정 대기 중
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                일간/월간 방문객 수, 인기 공연 조회 순위, 검색 키워드 분석을 구글 공식 통계 센터와 실시간 연동합니다.
              </p>
            </div>
          </div>

          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-750 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all shrink-0 border border-stone-200 dark:border-hall-700 self-start sm:self-center"
          >
            <span>구글 통계 센터 바로가기</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Input & Form */}
        <form onSubmit={handleSaveGaId} className="space-y-3 pt-2 border-t border-stone-100 dark:border-hall-800">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <label htmlFor="ga-measurement-id" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                구글 애널리틱스 측정 식별 번호 (Measurement ID)
              </label>
              <input
                id="ga-measurement-id"
                type="text"
                value={gaMeasurementId}
                onChange={(e) => setGaMeasurementId(e.target.value)}
                placeholder="예: G-XXXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-hall-700 bg-white dark:bg-hall-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-concert-500 focus:outline-none font-mono"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-xs shrink-0"
              >
                저장 및 즉시 활성화
              </button>
              <button
                type="button"
                onClick={handleSendTestEvent}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-750 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-all shrink-0 border border-stone-200 dark:border-hall-700 flex items-center gap-1.5"
                title="통계 연동이 정상 작동하는지 테스트 신호를 전송합니다"
              >
                <Activity className="w-3.5 h-3.5 text-concert-500" />
                <span>연동 테스트</span>
              </button>
            </div>
          </div>

          {gaFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                gaFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}
            >
              {gaFeedback.message}
            </div>
          )}
        </form>

        {/* 3-Step Setup Guide */}
        <div className="p-4 rounded-xl bg-stone-50/80 dark:bg-hall-850 border border-stone-200/80 dark:border-hall-800 text-xs space-y-2">
          <span className="font-bold text-stone-800 dark:text-stone-200 block">
            📌 1분 만에 끝내는 구글 애널리틱스 연동 순서:
          </span>
          <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-stone-400 leading-relaxed">
            <li>
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-concert-600 dark:text-concert-400 font-bold underline">
                구글 애널리틱스(무료)
              </a>
              에 접속하여 구글 계정으로 로그인합니다.
            </li>
            <li>
              좌측 하단 <strong>[관리] → [데이터 스트림] → [웹]</strong>을 누르고 본 서비스의 홈페이지 주소를 입력합니다.
            </li>
            <li>
              화면에 나타나는 <strong>'G-'로 시작하는 측정 식별 번호</strong>를 복사하여 위 입력창에 붙여넣고 <strong>[저장 및 즉시 활성화]</strong>를 누르면 즉시 통계가 집계됩니다.
            </li>
          </ol>
        </div>
      </div>

      {/* Manual Registration Modal (Admin Only) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-hall-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-concert-100 dark:bg-hall-800 text-concert-700 dark:text-concert-300 text-[11px] font-bold">
                  관리자 단독 권한
                </span>
              </div>
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50 flex items-center gap-2 mt-1">
                <PlusCircle className="w-5 h-5 text-concert-500" />
                <span>공연 일정 직접 등록</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                보안 방화벽으로 자동 수집이 차단된 공연장의 일정을 관리자가 직접 정식 등록합니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  공연 명칭 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 임윤찬 피아노 리사이틀 2026"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    공연 날짜 *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    시작 시간
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="예: 19:30"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    공연장 / 홀
                  </label>
                  <select
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  >
                    <option value="부천아트센터 콘서트홀">부천아트센터 콘서트홀 (차단)</option>
                    <option value="예술의전당 콘서트홀">예술의전당 콘서트홀</option>
                    <option value="롯데콘서트홀">롯데콘서트홀</option>
                    <option value="세종문화회관 대극장">세종문화회관 대극장</option>
                    <option value="아트센터인천 콘서트홀">아트센터인천 콘서트홀</option>
                    <option value="대구콘서트하우스 그랜드홀">대구콘서트하우스 그랜드홀</option>
                    <option value="통영국제음악당 콘서트홀">통영국제음악당 콘서트홀</option>
                    <option value="국립극장 해오름극장">국립극장 해오름극장 (차단)</option>
                    <option value="대전예술의전당 아트홀">대전예술의전당 아트홀</option>
                    <option value="광주예술의전당 대극장">광주예술의전당 대극장</option>
                    <option value="부산문화회관 대극장">부산문화회관 대극장</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    연주 편성
                  </label>
                  <select
                    value={formData.performerType}
                    onChange={(e) => setFormData({ ...formData, performerType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  >
                    <option value="오케스트라">오케스트라 (Orchestra)</option>
                    <option value="실내악">실내악 (Chamber Music)</option>
                    <option value="독주회">독주회 / 리사이틀 (Solo Recital)</option>
                    <option value="오페라">오페라 (Opera)</option>
                    <option value="성악/합창">성악 / 합창 (Vocal & Choir)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  출연진 (쉼표로 구분) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.performers}
                  onChange={(e) => setFormData({ ...formData, performers: e.target.value })}
                  placeholder="예: 조성진 (Piano), 서울시향"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  작곡가 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.composers}
                  onChange={(e) => setFormData({ ...formData, composers: e.target.value })}
                  placeholder="예: 쇼팽, 베토벤, 말러"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  연주 작품 (줄바꿈으로 구분)
                </label>
                <textarea
                  rows={3}
                  value={formData.pieces}
                  onChange={(e) => setFormData({ ...formData, pieces: e.target.value })}
                  placeholder="베토벤 - 피아노 협주곡 5번 '황제'&#10;브람스 - 교향곡 1번"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    티켓 가격 및 좌석
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    예매처 링크
                  </label>
                  <input
                    type="text"
                    value={formData.ticketUrl}
                    onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-hall-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold shadow-md transition-all"
                >
                  공연 등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Edit Modal (공연 정보 수동 수정 모달) */}
      {editingConcert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setEditingConcert(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-hall-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                  공연 정보 수동 교정
                </span>
              </div>
              <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50 flex items-center gap-2 mt-1">
                <Edit3 className="w-5 h-5 text-concert-500" />
                <span>공연 정보 상세 수정</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                잘못 수집되었거나 변경된 연주자, 프로그램, 공연일시, 예매처 정보를 관리자가 직접 수정합니다.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  공연 명칭 *
                </label>
                <input
                  type="text"
                  required
                  value={editingConcert.title}
                  onChange={(e) => setEditingConcert({ ...editingConcert, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    공연 날짜 *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingConcert.date}
                    onChange={(e) => setEditingConcert({ ...editingConcert, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={editingConcert.time}
                    onChange={(e) => setEditingConcert({ ...editingConcert, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    공연장 / 홀
                  </label>
                  <input
                    type="text"
                    value={editingConcert.venue}
                    onChange={(e) => setEditingConcert({ ...editingConcert, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    연주 편성
                  </label>
                  <select
                    value={editingConcert.performerType || '오케스트라'}
                    onChange={(e) => setEditingConcert({ ...editingConcert, performerType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  >
                    <option value="오케스트라">오케스트라</option>
                    <option value="실내악">실내악</option>
                    <option value="독주회">독주회</option>
                    <option value="오페라">오페라</option>
                    <option value="성악/합창">성악/합창</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    예매 진행 상태
                  </label>
                  <select
                    value={editingConcert.status}
                    onChange={(e) => setEditingConcert({ ...editingConcert, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  >
                    <option value="예매중">예매중</option>
                    <option value="매진임박">매진임박</option>
                    <option value="매진">매진</option>
                    <option value="지나간 공연">지나간 공연</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  출연진 (쉼표로 구분) *
                </label>
                <input
                  type="text"
                  required
                  value={editingConcert.performers}
                  onChange={(e) => setEditingConcert({ ...editingConcert, performers: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  작곡가 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={editingConcert.composers}
                  onChange={(e) => setEditingConcert({ ...editingConcert, composers: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  연주 프로그램 (줄바꿈으로 구분)
                </label>
                <textarea
                  rows={3}
                  value={editingConcert.pieces}
                  onChange={(e) => setEditingConcert({ ...editingConcert, pieces: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    티켓 가격 정보
                  </label>
                  <input
                    type="text"
                    value={editingConcert.price}
                    onChange={(e) => setEditingConcert({ ...editingConcert, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    예매처 공식 링크
                  </label>
                  <input
                    type="text"
                    value={editingConcert.ticketUrl}
                    onChange={(e) => setEditingConcert({ ...editingConcert, ticketUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-hall-800">
                <button
                  type="button"
                  onClick={() => setEditingConcert(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold shadow-md transition-all"
                >
                  수정 내용 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Moderation Edit Modal (Admin) */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setEditingPost(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-hall-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-hall-800">
              <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-concert-500" />
                <span>커뮤니티 게시글 수정 (관리자)</span>
              </h2>
              <button
                onClick={() => setEditingPost(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-hall-800 text-stone-400"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdatePost(editingPost.id, {
                  title: editingPost.title,
                  category: editingPost.category,
                  content: editingPost.content
                });
                setEditingPost(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  카테고리
                </label>
                <select
                  value={editingPost.category}
                  onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                >
                  <option value="클래식 수다">클래식 수다</option>
                  <option value="관람 후기">관람 후기</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  게시글 제목
                </label>
                <input
                  type="text"
                  required
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  게시글 본문
                </label>
                <textarea
                  required
                  rows={6}
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-hall-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold shadow-md transition-all"
                >
                  수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comment Moderation Edit Modal (Admin) */}
      {editingComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setEditingComment(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-hall-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-hall-750 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-hall-800">
              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-concert-500" />
                <span>댓글 내용 수정 (관리자)</span>
              </h2>
              <button
                onClick={() => setEditingComment(null)}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-hall-800 text-stone-400"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateComment(editingComment.postId, editingComment.commentId, {
                  content: editingComment.content
                });
                setEditingComment(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  작성자: {editingComment.author}
                </label>
                <textarea
                  required
                  rows={4}
                  value={editingComment.content}
                  onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-hall-800">
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white font-bold shadow-xs transition-all"
                >
                  수정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
