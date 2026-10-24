const fs = require('fs');
const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const concerts = JSON.parse(jsonStr);

function checkVenue(vName, limit = 20) {
  const missing = concerts.filter(c => (!c.pieces || c.pieces.length === 0) && (c.venue || '').includes(vName));
  console.log(`\n=== Missing in ${vName} (Total: ${missing.length}) ===`);
  console.log(JSON.stringify(missing.slice(0, limit).map(c => ({
    id: c.id,
    title: c.title,
    date: c.date,
    venue: c.venue
  })), null, 2));
}

checkVenue('예술의전당', 25);
checkVenue('롯데콘서트홀', 20);
checkVenue('세종문화회관', 20);
checkVenue('금호아트홀', 20);
