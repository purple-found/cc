import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  PlusCircle,
  Trash2,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Music,
  Inbox,
  Check,
  UserCheck
} from 'lucide-react';
import { formatKoreanDate } from '../utils/parser.js';

export default function AdminCenter({
  halls,
  concerts,
  tips = [],
  onAddConcert,
  onDeleteConcert,
  onApproveTip,
  onDeleteTip,
  onSyncAllHalls,
  isSyncing,
  onLogout
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const blockedHallsCount = halls.filter((h) => h.blocked).length;

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
              누락된 일정을 직접 관리하거나, 관람객이 제보한 공연을 검토하여 정식 등록합니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onSyncAllHalls}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-hall-800 dark:hover:bg-hall-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all shrink-0"
              title="전체 연주장 수집 상태 재확인 및 동기화"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-concert-500' : ''}`} />
              <span>{isSyncing ? '수집 동기화 진행 중...' : '자동 수집 상태 점검'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-md shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>공연 직접 등록 (관리자)</span>
            </button>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 dark:border-hall-800 text-xs">
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-100 dark:border-hall-800">
            <span className="text-stone-400 block text-[11px]">총 모니터링 공연장</span>
            <span className="text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5 block">
              {halls.length}개 기관
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
            <span className="text-amber-700 dark:text-amber-400 block text-[11px] font-semibold">
              수집 차단 감지 (수동 관리 대상)
            </span>
            <span className="text-base font-bold text-amber-900 dark:text-amber-300 mt-0.5 block">
              {blockedHallsCount}개 공연장
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40">
            <span className="text-blue-700 dark:text-blue-400 block text-[11px] font-semibold">
              접수된 관람객 제보
            </span>
            <span className="text-base font-bold text-blue-900 dark:text-blue-300 mt-0.5 block">
              {tips.length}건 대기 중
            </span>
          </div>
        </div>
      </div>

      {/* User Tip-off Inbox (관람객 제보 대기열 섹션) */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-concert-500" />
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              관람객 공연 제보함 ({tips.length}건 대기 중)
            </h3>
          </div>
          <span className="text-xs text-stone-400">
            검토 후 승인 시 즉시 공식 일정으로 메인 화면에 등록됩니다.
          </span>
        </div>

        {tips.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 dark:bg-hall-850 rounded-2xl border border-stone-200/60 dark:border-hall-800 text-xs text-stone-500 dark:text-stone-400">
            현재 대기 중인 관람객 제보가 없습니다. 유저가 상단 [공연 제보하기]를 통해 제보한 공연이 여기에 표시됩니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="p-4 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-800 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">{tip.createdAt} 제보 접수</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      검토 대기
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {formatKoreanDate(tip.date)} · {tip.time} | {tip.venue}
                  </p>
                  <p className="text-xs text-concert-600 dark:text-concert-400 font-medium mt-0.5">
                    출연: {Array.isArray(tip.performers) ? tip.performers.join(', ') : tip.performers}
                  </p>
                  {tip.note && (
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 bg-white dark:bg-hall-900 p-2 rounded-lg border border-stone-200/60 dark:border-hall-800 mt-2">
                      <strong>제보 메모:</strong> {tip.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/80 dark:border-hall-800">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hall Monitoring Table */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-stone-100 dark:border-hall-800">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            주요 연주장 수집망 실시간 현황
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-hall-850 text-stone-500 dark:text-stone-400 font-bold border-b border-stone-100 dark:border-hall-800">
              <tr>
                <th className="py-3 px-4">연주장 명칭 / 위치</th>
                <th className="py-3 px-4">수집 상태</th>
                <th className="py-3 px-4">최근 동기화</th>
                <th className="py-3 px-4">상세 점검 내용</th>
                <th className="py-3 px-4 text-right">홈페이지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-hall-800">
              {halls.map((hall) => (
                <tr key={hall.id} className="hover:bg-stone-50/80 dark:hover:bg-hall-850/50">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-stone-900 dark:text-stone-100 block">
                      {hall.name}
                    </span>
                    <span className="text-[11px] text-stone-400">{hall.city}</span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {hall.blocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>수집 차단됨</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>연동 정상</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                    {hall.lastSyncTime}
                  </td>

                  <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300 max-w-xs truncate">
                    {hall.syncNote}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <a
                      href={hall.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-concert-600 dark:text-concert-400 hover:underline font-semibold"
                    >
                      <span>이동</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Concerts Management Section */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
            현재 등록된 전체 공연 데이터 ({concerts.length}건)
          </h3>
          <span className="text-xs text-stone-400">관리자 삭제 시 메인 화면에 즉시 반영됩니다</span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-hall-800 max-h-96 overflow-y-auto">
          {concerts.map((c) => (
            <div
              key={c.id}
              className="py-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                    {c.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                  <span className="text-concert-600 dark:text-concert-400 truncate max-w-xs">{c.performers.join(', ')}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(`'${c.title}' 공연을 삭제하시겠습니까?`)) {
                    onDeleteConcert(c.id);
                  }
                }}
                className="p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors shrink-0"
                title="공연 일정 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
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
                    장르 형태
                  </label>
                  <select
                    value={formData.performerType}
                    onChange={(e) => setFormData({ ...formData, performerType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  >
                    <option value="솔리스트">솔리스트 리사이틀</option>
                    <option value="오케스트라">오케스트라 관현악</option>
                    <option value="협연 / 오케스트라">협연 & 오케스트라</option>
                    <option value="실내악 / 앙상블">실내악 / 앙상블</option>
                    <option value="오페라 / 성악">오페라 / 성악</option>
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
    </div>
  );
}
