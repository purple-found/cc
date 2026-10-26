const fs = require('fs');
const details = JSON.parse(fs.readFileSync('scripts/nov_dec_new_details.json', 'utf8'));
const list = Object.values(details);
list.forEach((d, i) => {
  console.log(`${i+1}. [${d.id}][${d.startDate}] ${d.title} @ ${d.venueRaw} | hall: ${d.hall || '메인'} | poster: ${d.poster ? 'Y' : 'N'} | styurls: ${d.styurls.length}`);
});
