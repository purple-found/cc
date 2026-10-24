const fs = require('fs');
const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const concerts = JSON.parse(jsonStr);

function checkOtherVenues(venues, limit = 25) {
  const missing = concerts.filter(c => (!c.pieces || c.pieces.length === 0) && venues.some(v => (c.venue || '').includes(v)));
  console.log(`\n=== Missing in ${venues.join(', ')} (Total: ${missing.length}) ===`);
  console.log(JSON.stringify(missing.slice(0, limit).map(c => ({
    id: c.id,
    title: c.title,
    date: c.date,
    venue: c.venue
  })), null, 2));
}

checkOtherVenues(['대구콘서트하우스', '대구시민회관'], 15);
checkOtherVenues(['성남아트센터'], 15);
checkOtherVenues(['고양아람누리', '고양어울림누리'], 15);
checkOtherVenues(['경기아트센터'], 15);
