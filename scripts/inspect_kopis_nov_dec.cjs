const http = require('http');
const fs = require('fs');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

function fetchPage(stdate, eddate, page) {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=${stdate}&eddate=${eddate}&cpage=${page}&rows=100&shcate=CCCA`;
  return new Promise((resolve) => {
    http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => {
      console.error('Fetch error:', err.message);
      resolve('');
    });
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
      state: getVal('prfstate')
    });
  }
  return items;
}

async function countPeriod(name, stdate, eddate) {
  let allItems = [];
  for (let page = 1; page <= 50; page++) {
    const xml = await fetchPage(stdate, eddate, page);
    const items = parseItems(xml);
    if (items.length === 0) break;
    allItems.push(...items);
    console.log(`[${name}] Page ${page}: ${items.length} items (Total so far: ${allItems.length})`);
    if (items.length < 100) break;
  }
  return allItems;
}

async function main() {
  console.log('--- Checking KOPIS for Nov 2026 ---');
  const novItems = await countPeriod('Nov 2026', '20261101', '20261130');
  console.log('--- Checking KOPIS for Dec 2026 ---');
  const decItems = await countPeriod('Dec 2026', '20261201', '20261231');

  // Load existing DB
  const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
  const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
  const existingConcerts = JSON.parse(jsonStr);
  const existingIds = new Set(existingConcerts.map(c => (c.kopisId || (c.id || '').replace(/^kopis-/, ''))));

  const missingNov = novItems.filter(item => !existingIds.has(item.id));
  const missingDec = decItems.filter(item => !existingIds.has(item.id));

  console.log('\n=== SUMMARY ===');
  console.log(`Nov 2026 KOPIS total: ${novItems.length}, Missing in DB: ${missingNov.length}`);
  console.log(`Dec 2026 KOPIS total: ${decItems.length}, Missing in DB: ${missingDec.length}`);

  fs.writeFileSync('scripts/missing_nov_dec.json', JSON.stringify({ missingNov, missingDec }, null, 2));
}

main();
