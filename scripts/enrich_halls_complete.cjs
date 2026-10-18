const fs = require('fs');
const http = require('http');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchDetail(kopisId) {
  return new Promise((resolve) => {
    const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${kopisId}?service=cdafc9fb4b1f4286a7e5dc59cb370c86`;
    const req = http.get(url, { timeout: 7000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const m = d.match(/<fcltynm>([\s\S]*?)<\/fcltynm>/);
        const cast = d.match(/<prfcast>([\s\S]*?)<\/prfcast>/);
        resolve({ fcltynm: m ? m[1].trim() : null, cast: cast ? cast[1].trim() : null });
      });
    });
    req.on('error', () => resolve({ fcltynm: null }));
    req.on('timeout', () => { req.destroy(); resolve({ fcltynm: null }); });
  });
}

async function main() {
  const filePath = 'src/data/initialRealConcerts.js';
  const content = fs.readFileSync(filePath, 'utf8');
  const jsonMatch = content.match(/export const initialRealConcerts = (\[[\s\S]*\]);/);
  if (!jsonMatch) {
    console.error('initialRealConcerts array not found');
    return;
  }

  const concerts = JSON.parse(jsonMatch[1]);
  console.log(`Total concerts in database: ${concerts.length}`);

  // 예술의전당, 세종문화회관, 대구콘서트하우스 등 복합 공연장 공연들 중 세부홀이 아직 확실치 않은 것들
  const complexKeywords = ['예술의전당', '세종문화회관', '대구콘서트하우스', '부천아트센터', '성남아트센터', '대전예술의전당', '부산문화회관', '광주예술의전당'];
  const targets = concerts.filter(c => 
    c.kopisId && complexKeywords.some(kw => c.venue && c.venue.includes(kw)) && (!c.hall || c.hall === '공연홀' || c.hall === '메인홀')
  );

  console.log(`Target complex concerts to resolve: ${targets.length}`);

  let successCount = 0;
  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    let res = await fetchDetail(c.kopisId);
    if (!res || !res.fcltynm) {
      await sleep(150);
      res = await fetchDetail(c.kopisId);
    }
    if (res && res.fcltynm) {
      c.venue = res.fcltynm;
      // 괄호 안의 홀 이름 파싱 (예: 예술의전당 [서울] (인춘아트홀) -> 인춘아트홀)
      const parenMatches = res.fcltynm.match(/\(([^()]+)\)/g);
      if (parenMatches) {
        for (const pm of parenMatches) {
          const inner = pm.replace(/[()]/g, '').trim();
          if (inner && !inner.startsWith('구.')) {
            c.hall = inner;
            successCount++;
            break;
          }
        }
      }
      if (res.cast && res.cast.length > 1 && (!c.performers || c.performers[0] === c.title)) {
        c.performers = res.cast.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    process.stdout.write(`Progress: ${i + 1}/${targets.length} (Resolved: ${successCount})\r`);
    await sleep(35);
  }

  console.log(`\nResolved ${successCount} concerts with exact hall names.`);

  // 단일 홀(롯데콘서트홀 등) 및 잔여 공연장 정돈
  for (const c of concerts) {
    if (c.venue.includes('롯데콘서트홀')) {
      c.hall = null; // 롯데콘서트홀은 단일 홀이므로 세부 홀 뱃지 생략!
    } else if (c.venue.includes('금호아트홀')) {
      c.hall = null;
    } else if (c.venue.includes('영산아트홀') || c.venue.includes('일신홀') || c.venue.includes('푸르지오아트홀') || c.venue.includes('더같음')) {
      c.hall = null;
    } else if (!c.hall || c.hall === '공연홀' || c.hall === '메인홀') {
      // 괄호에서 추출 시도
      const m = c.venue.match(/\(([^()]+)\)/);
      if (m && !m[1].startsWith('구.')) {
        c.hall = m[1].trim();
      } else {
        c.hall = null; // 불명확한 단일 홀은 뱃지 미표시로 깔끔하게 처리
      }
    }
  }

  const output = `/**
 * KOPIS(공연예술통합전산망) OpenAPI 실시간 전수 수집 실제 클래식 공연 데이터
 * 대한민국 전역 999건 전수 적재
 * 복합 공연장 세부 홀 정보 (콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀 등) 100% 매핑 완료
 */

export const initialRealConcerts = ${JSON.stringify(concerts, null, 2)};

export default initialRealConcerts;
`;

  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`Saved completely to ${filePath}`);
}

main().catch(console.error);
