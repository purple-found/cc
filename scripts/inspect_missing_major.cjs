const fs = require('fs');
const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const concerts = JSON.parse(jsonStr);

const withoutPieces = concerts.filter(c => !c.pieces || c.pieces.length === 0);
console.log('Total concerts without pieces:', withoutPieces.length);

const majorVenues = ['예술의전당', '부천아트센터', '롯데콘서트홀', '세종문화회관', '금호아트홀', '대구콘서트하우스', '성남아트센터', '고양아람누리'];
const majorWithoutPieces = withoutPieces.filter(c => majorVenues.some(v => (c.venue || '').includes(v)));
console.log('Major venue concerts without pieces:', majorWithoutPieces.length);

console.log('\nTop 40 missing from major venues:');
console.log(JSON.stringify(majorWithoutPieces.slice(0, 40).map(c => ({
  id: c.id,
  title: c.title,
  date: c.date,
  venue: c.venue
})), null, 2));
