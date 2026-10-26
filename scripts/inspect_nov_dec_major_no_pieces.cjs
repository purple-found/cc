const fs = require('fs');

const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const concerts = JSON.parse(jsonStr);

const majorVenues = ['예술의전당', '롯데콘서트홀', '세종문화회관', '부천아트센터', '국립극장', '대구콘서트하우스', '부산콘서트홀', '통영국제음악당'];

const majorMissingPieces = concerts.filter(c => {
  const isNovDec = (c.date && (c.date.startsWith('2026-11') || c.date.startsWith('2026-12'))) ||
                   (c.startDate && (c.startDate.startsWith('2026-11') || c.startDate.startsWith('2026-12')));
  const hasPieces = c.pieces && c.pieces.length > 0;
  const isMajorVenue = majorVenues.some(v => (c.venue || '').includes(v));
  return isNovDec && !hasPieces && isMajorVenue;
});

console.log(`주요 공연장 중 프로그램 미등록 Nov/Dec 공연 수: ${majorMissingPieces.length}건`);
majorMissingPieces.forEach((c, idx) => {
  console.log(`${idx+1}. [${c.kopisId || c.id}][${c.date || c.startDate}] ${c.title} @ ${c.venue} (${c.hall || '메인'})`);
});
