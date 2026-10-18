import React, { useState, useEffect } from 'react';
import { Sparkles, X, Send, Calendar, MapPin, Music } from 'lucide-react';
import { storageService } from '../services/storageService.js';

export default function TipConcertModal({ isOpen, onClose, onSubmitTip }) {
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
    if (!formData.title.trim() || !formData.date) {
      alert('공연명과 공연 날짜를 입력해주세요.');
      return;
    }

    // 도배 방지: 공연 제보 1분 (60초) 쿨다운
    const rateCheck = storageService.checkTipRateLimit();
    if (!rateCheck.allowed) {
      alert(`[도배 방지 안내]\n공연 제보는 1분에 1회만 등록하실 수 있습니다.\n잠시 후 다시 시도해주세요. (${rateCheck.remainingSeconds}초 남음)`);
      return;
    }

    onSubmitTip({
      title: formData.title.trim(),
      date: formData.date,
      time: formData.time || '19:30',
      venue: formData.venue,
      performers: formData.performers.trim() ? [formData.performers.trim()] : ['출연진 제보 확인 중'],
      ticketUrl: formData.ticketUrl.trim() || 'https://www.sac.or.kr',
      note: formData.note.trim()
    });

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
        className="bg-white dark:bg-hall-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-hall-800">
          <div>
            <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-concert-500" />
              <span>공연 일정 제보하기</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              누락된 공연을 제보해주시면, 관리자 확인 후 공식 일정으로 등록됩니다.
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
              제보자 메모 (추가 정보)
            </label>
            <textarea
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="특별히 전하고 싶은 정보가 있다면 남겨주세요."
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
            />
          </div>

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
              <span>제보 전송하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
