import React, { useState, useEffect } from 'react';
import { Sparkles, X, Send, MessageSquare } from 'lucide-react';
import { storageService } from '../services/storageService.js';

export default function TipConcertModal({ isOpen, onClose, onSubmitTip }) {
  const [mode, setMode] = useState('tip'); // 'tip' | 'inquiry'
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '19:30',
    venue: '예술의전당 콘서트홀',
    performers: '',
    ticketUrl: '',
    note: ''
  });

  // ESC 키 닫기 이벤트 바인딩 (Gate 2)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'tip') {
      if (!formData.title.trim() || !formData.date) {
        alert('공연명과 공연 날짜를 입력해주세요.');
        return;
      }
    } else {
      if (!formData.title.trim() || !formData.note.trim()) {
        alert('문의 제목과 상세 내용을 입력해주세요.');
        return;
      }
    }

    // 도배 방지: 문의 및 공연 제보 1분 (60초) 쿨다운
    const rateCheck = storageService.checkTipRateLimit();
    if (!rateCheck.allowed) {
      alert(`[도배 방지 안내]\n문의 및 공연 제보는 1분에 1회만 등록하실 수 있습니다.\n잠시 후 다시 시도해주세요. (${rateCheck.remainingSeconds}초 남음)`);
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    if (mode === 'inquiry') {
      onSubmitTip({
        type: 'inquiry',
        title: formData.title.trim(),
        date: todayStr,
        time: '-',
        venue: '일반 문의 / 정보 수정 요청',
        performers: formData.performers.trim() ? [formData.performers.trim()] : ['익명 이용자'],
        ticketUrl: '',
        note: formData.note.trim()
      });
    } else {
      onSubmitTip({
        type: 'tip',
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time || '19:30',
        venue: formData.venue,
        performers: formData.performers.trim() ? [formData.performers.trim()] : ['출연진 제보 확인 중'],
        ticketUrl: formData.ticketUrl.trim() || 'https://www.sac.or.kr',
        note: formData.note.trim()
      });
    }

    setFormData({
      title: '',
      date: '',
      time: '19:30',
      venue: '예술의전당 콘서트홀',
      performers: '',
      ticketUrl: '',
      note: ''
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-hall-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-hall-800">
          <div>
            <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-concert-500" />
              <span>문의 및 공연 제보</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              누락된 공연 제보나 정보 오류 수정 요청, 사이트 이용 문의를 관리자에게 전달합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-hall-800 text-stone-500"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100 dark:bg-hall-850 border border-stone-200/80 dark:border-hall-700">
          <button
            type="button"
            onClick={() => setMode('tip')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'tip'
                ? 'bg-white dark:bg-hall-700 text-concert-700 dark:text-concert-300 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>공연 일정 제보</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('inquiry')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === 'inquiry'
                ? 'bg-white dark:bg-hall-700 text-concert-700 dark:text-concert-300 shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>일반 문의 / 오류 제보</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'tip' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  공연 명칭 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 클라라 주미 강 & 손열음 듀오 콘서트"
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

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  공연장 / 홀
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="예: 부천아트센터, 예술의전당, 롯데콘서트홀 등"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  출연진 / 연주자
                </label>
                <input
                  type="text"
                  value={formData.performers}
                  onChange={(e) => setFormData({ ...formData, performers: e.target.value })}
                  placeholder="예: 임윤찬, 조성진, 서울시향 등"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  예매처 링크 (또는 안내 URL)
                </label>
                <input
                  type="text"
                  value={formData.ticketUrl}
                  onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  제보자 메모 (프로그램·추가 정보)
                </label>
                <textarea
                  rows={3}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="연주 프로그램이나 특별히 전하고 싶은 정보가 있다면 남겨주세요."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  문의 제목 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 공연 프로그램 정보 수정 요청 / 사이트 이용 문의"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  작성자 닉네임 또는 회신 연락처 (선택)
                </label>
                <input
                  type="text"
                  value={formData.performers}
                  onChange={(e) => setFormData({ ...formData, performers: e.target.value })}
                  placeholder="예: 클래식 애호가 (또는 회신받을 이메일)"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  문의 및 요청 상세 내용 *
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="수정이 필요한 공연 정보나 서비스 관련 문의 사항을 자유롭게 작성해주세요."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-hall-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{mode === 'inquiry' ? '문의 전송하기' : '제보 전송하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

