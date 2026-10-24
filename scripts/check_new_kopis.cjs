const fs = require('fs');
const http = require('http');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const currentConcerts = JSON.parse(jsonStr);
const existingIds = new Set(currentConcerts.map(c => (c.kopisId || (c.id || '').replace(/^kopis-/, ''))));

console.log('Existing DB count:', existingIds.size);

function fetchPage(page) {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20241001&eddate=20271231&cpage=${page}&rows=100&shcate=CCCA`;
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
      state: getVal('prfstate'),
      openrun: getVal('openrun')
    });
  }
  return items;
}

async function run() {
  const newConcerts = [];
  for (let page = 1; page <= 15; page++) {
    const xml = await fetchPage(page);
    const items = parseItems(xml);
    if (items.length === 0) break;
    for (const item of items) {
      if (item.id && !existingIds.has(item.id)) {
        newConcerts.push(item);
      }
    }
    console.log(`Page ${page}: got ${items.length} items. New found so far: ${newConcerts.length}`);
    if (items.length < 100) break;
  }
  console.log('\nTotal brand-new concerts from KOPIS:', newConcerts.length);
  console.log(JSON.stringify(newConcerts.slice(0, 20), null, 2));
}

run();
