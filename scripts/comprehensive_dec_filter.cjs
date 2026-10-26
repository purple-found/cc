const fs = require('fs');

const allDec = JSON.parse(fs.readFileSync('scripts/kopis_dec_all_genres.json', 'utf8'));

// Filter for everything that belongs to concert culture:
// 1. All CCCA (서양음악/클래식)
// 2. All 무용 that is 호두까기인형 (Tchaikovsky Nutcracker)
// 3. All 대중음악/복합 that is Orchestra, Symphony, Philharmonic, Choir, Recital, Christmas, Year-end, Crossover, Gala, Opera, Film Music
const concertVenues = [
  '예술의전당', '롯데콘서트홀', '세종문화회관', '부천아트센터', '국립극장',
  '대구콘서트하우스', '부산콘서트홀', '통영국제음악당', '대전예술의전당', '경기아트센터',
  '고양아람누리', '성남아트센터', '광주예술의전당', '울산문화예술회관', '강원', '아트홀',
  '문화예술회관', '아트센터', '콘서트홀', '음악당', '홀'
];

const selected = allDec.filter(item => {
  // If it's pure classic, always include
  if (item.genre === '서양음악(클래식)') return true;
  
  const title = item.title;
  const isNutcracker = title.includes('호두까기');
  if (isNutcracker) return true;

  const isConcertTitle = 
    title.includes('오케스트라') || title.includes('심포니') || title.includes('필하모닉') ||
    title.includes('교향악단') || title.includes('합창') || title.includes('콰르텟') ||
    title.includes('앙상블') || title.includes('체임버') || title.includes('챔버') ||
    title.includes('독주회') || title.includes('리사이틀') || title.includes('소나타') ||
    title.includes('협주곡') || title.includes('교향곡') || title.includes('송년') ||
    title.includes('제야') || title.includes('메시아') || title.includes('환희의 송가') ||
    title.includes('합창교향곡') || title.includes('크리스마스') || title.includes('클래식') ||
    title.includes('오페라') || title.includes('갈라') || title.includes('캔들') ||
    title.includes('시네마 콘서트') || title.includes('영화음악') || title.includes('지브리') ||
    title.includes('디즈니') || title.includes('재즈 오케스트라') || title.includes('Classic');

  // Must not be a pure pop idol idol concert or trot concert at a stadium/gymnasium unless classical/orchestral
  const isPopArena = item.venue.includes('체육관') || item.venue.includes('스타디움') || item.venue.includes('돔') || item.venue.includes('핸드볼');
  if (isPopArena && !title.includes('오케스트라') && !title.includes('심포니')) return false;

  return isConcertTitle;
});

console.log(`선별된 12월 총 음악회/공연: ${selected.length}건 (전체 818건 중)`);

// Check which ones are already in DB vs new
const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStart = content.indexOf('[');
const jsonEnd = content.lastIndexOf(']');
const existing = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
const existingMap = new Map();
existing.forEach(c => {
  const kid = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
  existingMap.set(kid, c);
});

const newToFetch = selected.filter(s => !existingMap.has(s.id));
console.log(`새로 상세 정보를 긁어와야 할 공연: ${newToFetch.length}건`);
console.log(`기존 DB에 이미 있는 공연: ${selected.length - newToFetch.length}건`);

fs.writeFileSync('scripts/dec_to_fetch.json', JSON.stringify(newToFetch, null, 2), 'utf8');
