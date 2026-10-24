const fs = require('fs');
const http = require('http');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStart = content.indexOf('[');
const jsonEnd = content.lastIndexOf(']');
const concerts = JSON.parse(content.substring(jsonStart, jsonEnd + 1));

console.log(`총 조사 대상 공연: ${concerts.length}건`);

// 캐시 파일 확인
const cacheFile = 'scripts/kopis_all_details.json';
let cache = {};
if (fs.existsSync(cacheFile)) {
  try {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    console.log(`기존 캐시 로드: ${Object.keys(cache).length}건`);
  } catch {}
}

const toFetch = concerts.filter(c => {
  const kid = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
  return kid && !cache[kid];
});

console.log(`새로 API 조회할 공연: ${toFetch.length}건`);

function fetchDetail(kid) {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${kid}?service=${SERVICE_KEY}`;
  return new Promise((resolve) => {
    http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function run() {
  const concurrency = 8;
  let fetchedCount = 0;
  for (let i = 0; i < toFetch.length; i += concurrency) {
    const chunk = toFetch.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map(c => {
      const kid = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
      return fetchDetail(kid);
    }));

    chunk.forEach((c, idx) => {
      const kid = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
      const xml = results[idx];
      if (xml) {
        const getTag = tag => {
          const m = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(xml);
          return m ? m[1].trim() : '';
        };
        const styurls = [];
        const styRegex = /<styurl>([\s\S]*?)<\/styurl>/g;
        let sMatch;
        while ((sMatch = styRegex.exec(xml)) !== null) {
          styurls.push(sMatch[1].trim());
        }

        cache[kid] = {
          title: getTag('prfnm'),
          venue: getTag('fcltynm'),
          cast: getTag('prfcast'),
          price: getTag('pcseguidance'),
          runtime: getTag('prfruntime'),
          dtguidance: getTag('dtguidance'),
          sty: getTag('sty'),
          poster: getTag('poster'),
          relateUrl: getTag('relateurl'),
          styurls: styurls
        };
      }
    });

    fetchedCount += chunk.length;
    if (fetchedCount % 100 === 0 || fetchedCount === toFetch.length) {
      console.log(`진행 상황: ${fetchedCount} / ${toFetch.length} (${Math.round(fetchedCount / toFetch.length * 100)}%)`);
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
    }
  }

  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
  console.log(`전체 세부 정보 캐시 완료: ${Object.keys(cache).length}건`);

  // 분석
  let withStyText = 0;
  let withStyUrlsOnly = 0;
  let withNeither = 0;
  for (const kid of Object.keys(cache)) {
    const item = cache[kid];
    if (item.sty && item.sty.trim().length > 10) {
      withStyText++;
    } else if (item.styurls && item.styurls.length > 0) {
      withStyUrlsOnly++;
    } else {
      withNeither++;
    }
  }

  console.log('\n=== KOPIS 전수 조사 분석 ===');
  console.log('텍스트 상세(sty) 보유:', withStyText);
  console.log('이미지 포스터(styurls)만 보유:', withStyUrlsOnly);
  console.log('상세 소개 없음:', withNeither);
}

run();
