const http = require('http');
const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

function fetchUrl(url) {
  return new Promise((resolve) => {
    http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function check() {
  console.log('--- 1. KOPIS Genre codes in December 2026 ---');
  // KOPIS genres: CCCA=클래식, CCCB=오페라(?), CCCC=국악, CCCD=대중음악, EEEA=복합
  const genres = ['CCCA', 'CCCB', 'CCCC', 'CCCD', 'EEEA', 'BBBC'];
  for (const g of genres) {
    const url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20261201&eddate=20261231&cpage=1&rows=100&shcate=${g}`;
    const xml = await fetchUrl(url);
    const count = (xml.match(/<db>/g) || []).length;
    console.log(`Genre [${g}]: Page 1 has ${count} items`);
  }

  console.log('\n--- 2. What about wider date queries? ---');
  // What if stdate is 20261001 and eddate is 20261231?
  // How many performances overlap December?
  const widerUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20261001&eddate=20261231&cpage=1&rows=100&shcate=CCCA`;
  const widerXml = await fetchUrl(widerUrl);
  console.log(`stdate=20261001 to 20261231: Page 1 has ${(widerXml.match(/<db>/g) || []).length} items`);

  console.log('\n--- 3. What about major venues specifically in Dec 2026? ---');
  // Can we search by venue?
  // 예술의전당, 롯데콘서트홀, 세종문화회관
  const sacUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20261201&eddate=20261231&cpage=1&rows=100&shcate=CCCA&shprfnmfct=예술의전당`;
  const sacXml = await fetchUrl(sacUrl);
  console.log(`예술의전당 Dec 2026: ${(sacXml.match(/<db>/g) || []).length} items`);

  const lotteUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20261201&eddate=20261231&cpage=1&rows=100&shcate=CCCA&shprfnmfct=롯데`;
  const lotteXml = await fetchUrl(lotteUrl);
  console.log(`롯데 Dec 2026: ${(lotteXml.match(/<db>/g) || []).length} items`);

  const sejongUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20261201&eddate=20261231&cpage=1&rows=100&shcate=CCCA&shprfnmfct=세종`;
  const sejongXml = await fetchUrl(sejongUrl);
  console.log(`세종 Dec 2026: ${(sejongXml.match(/<db>/g) || []).length} items`);
}

check();
