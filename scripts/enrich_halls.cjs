const fs = require('fs');
const http = require('http');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOne(kopisId) {
  return new Promise((resolve) => {
    const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${kopisId}?service=cdafc9fb4b1f4286a7e5dc59cb370c86`;
    const req = http.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const m = data.match(/<fcltynm>([\s\S]*?)<\/fcltynm>/);
        const castMatch = data.match(/<prfcast>([\s\S]*?)<\/prfcast>/);
        resolve({
          fcltynm: m ? m[1].trim() : null,
          cast: castMatch ? castMatch[1].trim() : null
        });
      });
    });
    req.on('error', () => resolve({ fcltynm: null, cast: null }));
    req.on('timeout', () => { req.destroy(); resolve({ fcltynm: null, cast: null }); });
  });
}

async function main() {
  const filePath = 'src/data/initialRealConcerts.js';
  const fileContent = fs.readFileSync(filePath, 'utf8');

  const jsonMatch = fileContent.match(/export const initialRealConcerts = (\[[\s\S]*\]);/);
  if (!jsonMatch) return;

  const concerts = JSON.parse(jsonMatch[1]);
  console.log(`Total concerts: ${concerts.length}`);

  // 복합 공연장 대상 목록
  const complexVenues = [
    '예술의전당', '세종문화회관', '대구콘서트하우스', '부천아트센터', '아트센터 인천',
    '성남아트센터', '부산문화회관', '대전예술의전당', '고양아람누리', '국립극장',
    '수성아트피아', '강릉아트센터', '광주예술의전당'
  ];

  const targets = concerts.filter(c => 
    c.kopisId && complexVenues.some(cv => c.venue && c.venue.includes(cv))
  );

  console.log(`Querying ${targets.length} complex venue concerts...`);

  let count = 0;
  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    const res = await fetchOne(c.kopisId);
    if (res && res.fcltynm) {
      c.venue = res.fcltynm;
      // 괄호 추출
      const pMatch = res.fcltynm.match(/\(([^()]+)\)/g);
      if (pMatch) {
        for (const pm of pMatch) {
          const inner = pm.replace(/[()]/g, '').trim();
          if (inner && !inner.startsWith('구.') && !inner.includes('파리뮤직포럼')) {
            c.hall = inner;
            count++;
            break;
          }
        }
      }
      if (res.cast && res.cast.length > 1 && (!c.performers || c.performers[0] === c.title)) {
        c.performers = res.cast.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (i % 20 === 0 || i === targets.length - 1) {
      process.stdout.write(`Done ${i + 1}/${targets.length} (Extracted halls: ${count})\r`);
    }
    await sleep(25);
  }

  console.log(`\nExtracted ${count} specific halls.`);

  // 롯데콘서트홀 등 단일홀 및 나머지 홀 정리
  for (const c of concerts) {
    if (!c.hall || c.hall === '메인홀') {
      if (c.venue.includes('롯데콘서트홀')) {
        c.hall = '콘서트홀';
      } else if (c.venue.includes('IBK챔버홀') || c.title.includes('IBK')) {
        c.hall = 'IBK챔버홀';
      } else if (c.venue.includes('인춘아트홀') || c.title.includes('인춘')) {
        c.hall = '인춘아트홀';
      } else if (c.venue.includes('리사이틀홀') || c.title.includes('리사이틀홀')) {
        c.hall = '리사이틀홀';
      } else if (c.venue.includes('콘서트홀') || c.title.includes('콘서트홀')) {
        c.hall = '콘서트홀';
      } else if (c.venue.includes('대극장')) {
        c.hall = '대극장';
      } else if (c.venue.includes('챔버홀') || c.venue.includes('체임버홀')) {
        c.hall = '챔버홀';
      } else if (c.venue.includes('앙상블홀')) {
        c.hall = '앙상블홀';
      } else if (c.venue.includes('그랜드홀')) {
        c.hall = '그랜드홀';
      } else if (c.venue.includes('오페라극장') || c.venue.includes('오페라하우스')) {
        c.hall = '오페라극장';
      } else if (c.venue.includes('아트홀')) {
        c.hall = '아트홀';
      } else {
        c.hall = '공연홀';
      }
    }
  }

  const updatedCode = `/**
 * KOPIS(공연예술통합전산망) OpenAPI 실시간 전수 수집 실제 클래식 공연 데이터
 * 대한민국 전역 (서울, 경기, 부산, 대구, 대전, 광주 등) 999건 전수 적재
 * 세부 홀 정보 (콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀 등) 완벽 통합
 */

export const initialRealConcerts = ${JSON.stringify(concerts, null, 2)};
`;

  fs.writeFileSync(filePath, updatedCode, 'utf8');
  console.log(`Saved successfully to ${filePath}`);
}

main().catch(console.error);
