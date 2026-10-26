const http = require('http');
const fs = require('fs');
const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

function fetchPage(url) {
  return new Promise((resolve) => {
    http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function parseItems(xml) {
  const items = [];
  const regex = /<db>([\s\S]*?)<\/db>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const block = match[1];
    const getVal = tag => {
      const m = new RegExp(`<${tag}>(.*?)<\\/${tag}>`).exec(block);
      return m ? m[1].trim() : '';
    };
    items.push({
      id: getVal('mt20id'),
      title: getVal('prfnm'),
      startDate: getVal('prfpdfrom'),
      endDate: getVal('prfpdto'),
      venue: getVal('fcltynm'),
      poster: getVal('poster'),
      area: getVal('area'),
      genre: getVal('genrenm'),
      state: getVal('prfstate')
    });
  }
  return items;
}

async function searchAllDecember() {
  console.log('Querying KOPIS for ALL performances in Dec 2026 (no genre filter)...');
  let allDec = [];
  for (let page = 1; page <= 50; page++) {
    const url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20261201&eddate=20261231&cpage=${page}&rows=100`;
    const xml = await fetchPage(url);
    const items = parseItems(xml);
    if (items.length === 0) break;
    allDec.push(...items);
    console.log(`Page ${page}: ${items.length} items (Total: ${allDec.length})`);
    if (items.length < 100) break;
  }

  console.log(`Total ALL genres December 2026: ${allDec.length}`);
  const genreCounts = {};
  allDec.forEach(item => {
    genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
  });
  console.log('Genre breakdown:', genreCounts);

  fs.writeFileSync('scripts/kopis_dec_all_genres.json', JSON.stringify(allDec, null, 2), 'utf8');
}

searchAllDecember();
