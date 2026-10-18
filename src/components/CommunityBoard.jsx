import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Heart,
  Eye,
  PenSquare,
  Search,
  Tag,
  Calendar,
  X,
  Send,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { formatKSTDateTime } from '../utils/parser.js';
import { ipService } from '../services/ipService.js';
import { storageService } from '../services/storageService.js';
import { matchesBilingualConcert } from '../utils/bilingualSearch.js';

export default function CommunityBoard({
  posts,
  concerts,
  onAddPost,
  onAddComment,
  onToggleLike,
  initialTargetConcert
}) {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(true);
  const [activePost, setActivePost] = useState(null);

  // New post form state
  const [formData, setFormData] = useState({
    title: '',
    category: '기대평',
    concertId: '',
    rating: 5,
    author: '',
    content: ''
  });

  // New comment input state
  const [commentInput, setCommentInput] = useState({
    author: '',
    content: ''
  });

  // initialTargetConcert가 있으면 글쓰기 모달을 열고 해당 공연 세팅
  useEffect(() => {
    if (initialTargetConcert) {
      setFormData((prev) => ({
        ...prev,
        category: '기대평',
        concertId: initialTargetConcert.id
      }));
      setIsWriteModalOpen(true);
    }
  }, [initialTargetConcert]);

  // 카테고리 필터링 및 검색 (한국어/영문 양방향 지능형 검색 적용)
  const filteredPosts = posts.filter((p) => {
    const matchCat = selectedCategory === '전체' || p.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      matchesBilingualConcert(
        {
          title: p.title,
          description: p.content,
          pieces: p.concertTitle ? [p.concertTitle] : [],
          performers: [p.author]
        },
        searchQuery
      );
    return matchCat && matchSearch;
  });

  // 글 등록 핸들러 (IP 확인 및 차단 여부 검사)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const clientIp = await ipService.getMyIp();
    if (storageService.isIpBlocked(clientIp)) {
      alert(`[작성 제한 안내]\n현재 접속하신 IP(${clientIp})는 커뮤니티 이용 규칙 위반(정치 논쟁/비방 등)으로 인해 글 및 댓글 작성이 차단되었습니다.\n차단 해제는 관리 센터로 문의하시기 바랍니다.`);
      return;
    }

    const linkedConcert = concerts.find((c) => c.id === formData.concertId);

    onAddPost({
      title: formData.title.trim(),
      category: formData.category,
      concertId: formData.concertId || null,
      concertTitle: linkedConcert ? linkedConcert.title : null,
      rating: formData.category === '관람 후기' ? Number(formData.rating) : null,
      author: formData.author.trim() || '클래식 메이트',
      content: formData.content.trim(),
      ip: clientIp
    });

    setFormData({
      title: '',
      category: '기대평',
      concertId: '',
      rating: 5,
      author: '',
      content: ''
    });
    setIsWriteModalOpen(false);
  };

  // 댓글 등록 핸들러 (IP 확인 및 차단 여부 검사)
  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!commentInput.content.trim()) return;

    const clientIp = await ipService.getMyIp();
    if (storageService.isIpBlocked(clientIp)) {
      alert(`[작성 제한 안내]\n현재 접속하신 IP(${clientIp})는 커뮤니티 이용 규칙 위반으로 작성이 차단되었습니다.`);
      return;
    }

    const newComment = {
      id: `c-${Date.now()}`,
      author: commentInput.author.trim() || '클래식 청중',
      content: commentInput.content.trim(),
      ip: clientIp,
      createdAt: formatKSTDateTime(new Date())
    };

    onAddComment(activePost.id, newComment);

    // 로컬 액티브 포스트도 갱신
    setActivePost((prev) => ({
      ...prev,
      comments: [
        ...(prev.comments || []),
        newComment
      ]
    }));

    setCommentInput({ author: '', content: '' });
  };

  const categories = ['전체', '기대평', '관람 후기', '클래식 수다'];

  return (
    <div className="space-y-6">
      {/* Board Top Header & Controls */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif font-black text-xl text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-concert-500" />
              <span>클래식 커뮤니티</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
              다가올 무대에 대한 벅찬 설렘과 생생한 관람 후기를 나눠보세요.
            </p>
          </div>

          <button
            onClick={() => setIsWriteModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-md shrink-0"
          >
            <PenSquare className="w-4 h-4" />
            <span>이야기 남기기</span>
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-hall-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-concert-500 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-hall-850 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-hall-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="게시글 또는 공연명 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-concert-500"
            />
          </div>
        </div>
      </div>

      {/* Community Guidelines Banner (클래식 커뮤니티 이용 규칙) */}
      <div className="bg-white dark:bg-hall-900 rounded-2xl border border-stone-200/90 dark:border-hall-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>클래식 커뮤니티 이용 규칙</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-hall-800 text-stone-600 dark:text-stone-300">
                필독
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsRulesExpanded(!isRulesExpanded)}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 font-semibold transition-colors"
          >
            <span>{isRulesExpanded ? '규칙 접기' : '규칙 펼치기'}</span>
            {isRulesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isRulesExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-stone-100 dark:border-hall-800 text-xs">
            <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-hall-850/60 border border-stone-200/60 dark:border-hall-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                1. 명예훼손·모욕 등 법적 분쟁 소지 발언 금지
              </span>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pl-3">
                연주자, 지휘자, 악단 및 타 관람객을 향한 악의적 인신공격, 사실 적시 또는 허위사실에 의한 명예훼손 등 법적으로 문제가 될 수 있는 발언을 엄격히 금지합니다. (건전한 연주 비평은 전면 보장됩니다)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-hall-850/60 border border-stone-200/60 dark:border-hall-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                2. 정치·사회적 갈등 조장 발언 금지
              </span>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pl-3">
                음악과 예술 본연의 향유를 위해 정치적 논쟁, 편가르기, 특정 집단 비하 게시물은 무통보 삭제 및 IP가 차단됩니다.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-hall-850/60 border border-stone-200/60 dark:border-hall-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                3. 허위사실 유포 및 불법 암표 거래 금지
              </span>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pl-3">
                확인되지 않은 루머 유포나 공식 예매처 규정을 위반하는 프리미엄 웃돈 암표 거래, 불법 양도는 엄단합니다.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-hall-850/60 border border-stone-200/60 dark:border-hall-800 space-y-1">
              <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                4. 기타 대한민국 법률 및 관계 법령 위반 금지
              </span>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pl-3">
                음란물, 사기, 저작권 침해 등 기타 대한민국 실정법 및 관계 법령을 위반하는 모든 게시물은 사전 경고 없이 즉각 삭제 및 해당 IP가 차단될 수 있습니다.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-50/70 dark:bg-hall-850/60 border border-stone-200/60 dark:border-hall-800 space-y-1 md:col-span-2">
              <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                5. 성숙한 클래식 공연장 관람 에티켓 준수
              </span>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pl-3">
                악장 간 박수 자제, 연주 중 스마트폰 무음 유지, 무단 녹음·촬영 금지 등 품격 있는 관람 문화를 함께 지켜주세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Post List */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredPosts.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-hall-900 rounded-3xl border border-stone-200 dark:border-hall-800 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-concert-50 dark:bg-hall-850 flex items-center justify-center text-concert-500 border border-concert-200/60 dark:border-hall-700">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-serif font-bold text-stone-800 dark:text-stone-200">
              아직 등록된 후기 및 기대평이 없습니다
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
              관람객 여러분의 실제 목소리로 채워지는 공간입니다.<br />
              무대에 대한 설렘이나 감상을 첫 번째로 남겨보세요!
            </p>
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-md"
            >
              <PenSquare className="w-4 h-4" />
              <span>첫 이야기 남기기</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => setActivePost(post)}
              className="p-5 rounded-2xl bg-white dark:bg-hall-900 border border-stone-200/80 dark:border-hall-800 hover:border-concert-400/80 dark:hover:border-concert-500/80 transition-all cursor-pointer shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      post.category === '기대평'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : post.category === '관람 후기'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {post.category}
                  </span>

                  {post.rating && (
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: post.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  )}

                  {post.concertTitle && (
                    <span className="flex items-center gap-1 text-[11px] text-concert-600 dark:text-concert-400 font-semibold truncate max-w-xs sm:max-w-md">
                      <Tag className="w-3 h-3 shrink-0" />
                      <span className="truncate">{post.concertTitle}</span>
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-stone-400 dark:text-stone-500">
                  {post.createdAt}
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-snug">
                  {post.title}
                </h3>
                <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-hall-800">
                <span className="font-medium text-stone-700 dark:text-stone-300">
                  작성자: {post.author}
                </span>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{post.likes}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>{(post.comments || []).length}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-stone-400" />
                    <span>{post.views}</span>
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Post Detail Modal */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setActivePost(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-hall-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100 dark:border-hall-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-concert-100 dark:bg-hall-800 text-concert-800 dark:text-concert-300">
                    {activePost.category}
                  </span>
                  {activePost.rating && (
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: activePost.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  )}
                  {activePost.concertTitle && (
                    <span className="text-xs font-semibold text-concert-600 dark:text-concert-400">
                      연동 공연: {activePost.concertTitle}
                    </span>
                  )}
                </div>

                <h2 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-stone-50 leading-snug">
                  {activePost.title}
                </h2>

                <div className="flex items-center gap-3 text-xs text-stone-400">
                  <span>작성자: {activePost.author}</span>
                  <span>·</span>
                  <span>{activePost.createdAt}</span>
                </div>
              </div>

              <button
                onClick={() => setActivePost(null)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-hall-800 text-stone-500 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap font-sans">
              {activePost.content}
            </div>

            {/* Like button */}
            <div className="flex items-center justify-center pt-4">
              <button
                onClick={() => {
                  onToggleLike(activePost.id);
                  setActivePost((prev) => ({ ...prev, likes: prev.likes + 1 }));
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs transition-all border border-rose-200 dark:border-rose-900 shadow-xs"
                aria-label={`공감 ${activePost.likes}`}
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>{activePost.likes}</span>
              </button>
            </div>

            {/* Comments Section */}
            <div className="pt-6 border-t border-stone-100 dark:border-hall-800 space-y-4">
              <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-concert-500" />
                <span>댓글 ({(activePost.comments || []).length}개)</span>
              </h3>

              {/* Comment input form */}
              <form onSubmit={handleCreateComment} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentInput.author}
                    onChange={(e) => setCommentInput({ ...commentInput, author: e.target.value })}
                    placeholder="닉네임"
                    className="w-28 sm:w-32 px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                  <input
                    type="text"
                    value={commentInput.content}
                    onChange={(e) => setCommentInput({ ...commentInput, content: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>등록</span>
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-2.5">
                {(activePost.comments || []).map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-100 dark:border-hall-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{comm.author}</span>
                      <span className="text-[10px] text-stone-400">{comm.createdAt}</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed">{comm.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Post Modal */}
      {isWriteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsWriteModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-hall-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 dark:border-hall-750 shadow-2xl p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-hall-800">
              <h2 className="font-serif font-black text-xl text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <PenSquare className="w-5 h-5 text-concert-500" />
                <span>새 이야기 작성하기</span>
              </h2>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-hall-800 text-stone-500"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Community Rule Notice */}
              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>이용 규칙 준수 안내</span>
                </span>
                <p className="leading-relaxed text-stone-600 dark:text-stone-300">
                  명예훼손·모욕 등 법적 침해, 정치적 논쟁, 불법 암표 거래 및 기타 대한민국 법률 위반 게시물은 무통보 삭제되며 해당 IP의 작성이 영구 차단될 수 있습니다.
                </p>
              </div>
              {/* Category & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                  >
                    <option value="기대평">기대평</option>
                    <option value="관람 후기">관람 후기</option>
                    <option value="클래식 수다">클래식 수다</option>
                  </select>
                </div>

                {formData.category === '관람 후기' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      별점 평가
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                    >
                      <option value="5">★★★★★ (5점 만점 - 인생 최고의 무대)</option>
                      <option value="4">★★★★☆ (4점 - 매우 훌륭한 연주)</option>
                      <option value="3">★★★☆☆ (3점 - 무난하고 편안함)</option>
                      <option value="2">★★☆☆☆ (2점 - 다소 아쉬움)</option>
                      <option value="1">★☆☆☆☆ (1점 - 음향/진행 불만족)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Nickname & Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  작성자 닉네임
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  내용
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="공연에 대한 기대감, 좌석 시야 정보, 음향 후기 등을 자유롭게 남겨보세요..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-hall-850 border border-stone-200 dark:border-hall-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-concert-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-hall-800">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-hall-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-concert-500 hover:bg-concert-600 text-white text-xs font-bold transition-all shadow-md"
                >
                  게시글 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
