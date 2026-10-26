const fs = require('fs');

const allDec = JSON.parse(fs.readFileSync('scripts/kopis_dec_all_genres.json', 'utf8'));

// Load existing DB
const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStart = content.indexOf('[');
const jsonEnd = content.lastIndexOf(']');
const existingConcerts = JSON.parse(content.substring(jsonStart, jsonEnd + 1));
const existingIds = new Set(existingConcerts.map(c => (c.kopisId || (c.id || '').replace(/^kopis-/, ''))));

// Identify classical/orchestral/vocal/year-end concerts
const keywords = [
  '오케스트라', '필하모닉', '심포니', '교향악단', '챔버', '체임버', '앙상블', '콰르텟', '트리오',
  '합창', '독주회', '리사이틀', '소나타', '협주곡', '교향곡', '피아노', '바이올린', '첼로', '플루트', '오보에', '클라리넷',
  '송년', '제야', '크리스마스', '호두까기', '메시아', '헨델', '베토벤', '바흐', '모차르트', '차이콥스키',
  '오페라', '갈라', '라보엠', '라 트라비아타', '카르멘', '마술피리', '클래식', '칸타타', 'Classic', 'Symphony', 'Orchestra'
];

const relevantDec = allDec.filter(item => {
  if (item.genre === '서양음악(클래식)') return true;
  if (item.genre === '복합') {
    return keywords.some(k => item.title.includes(k));
  }
  if (item.genre === '무용(서양/한국무용)') {
    return item.title.includes('호두까기'); // 차이콥스키 호두까기 인형 오케스트라 발레
  }
  if (item.genre === '대중음악') {
    // 오케스트라, 크로스오버 클래식, 크리스마스 심포니 콘서트 등
    return keywords.some(k => item.title.includes(k));
  }
  return false;
});

console.log(`총 818건 중 클래식/오케스트라/송년·제야 관련 공연: ${relevantDec.length}건`);

const missingFromDB = relevantDec.filter(item => !existingIds.has(item.id));
console.log(`현재 우리 DB에 없는 공연: ${missingFromDB.length}건`);

console.log('\n--- Missing items sample (first 30) ---');
missingFromDB.slice(0, 30).forEach((item, idx) => {
  console.log(`${idx+1}. [${item.id}][${item.startDate}] ${item.title} (${item.genre}) @ ${item.venue}`);
});

fs.writeFileSync('scripts/dec_missing_candidates.json', JSON.stringify(missingFromDB, null, 2), 'utf8');
