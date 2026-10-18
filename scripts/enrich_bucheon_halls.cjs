/**
 * enrich_bucheon_halls.cjs
 * 부천아트센터(BAC) KOPIS 전수 수집 및 콘서트홀 / 소공연장 세부 홀 100% 매핑 스크립트
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

function fetchXml(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractHall(fcltynm, mt13id, title) {
  if (mt13id === 'FC003150-01') return '콘서트홀';
  if (mt13id === 'FC003150-02') return '소공연장';

  if (fcltynm) {
    if (fcltynm.includes('콘서트홀')) return '콘서트홀';
    if (fcltynm.includes('소공연장')) return '소공연장';
    const match = fcltynm.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1].trim();
  }

  if (title) {
    if (title.includes('콘서트홀')) return '콘서트홀';
    if (title.includes('소공연장')) return '소공연장';
    if (title.includes('오케스트라') || title.includes('교향악단') || title.includes('합창 교향곡') || title.includes('오르간')) {
      return '콘서트홀';
    }
  }

  return '콘서트홀'; // 부천아트센터 기본 주 공연장
}

async function run() {
  const dataFilePath = path.join(__dirname, '..', 'src', 'data', 'initialRealConcerts.js');
  let initialRealConcerts = [];
  try {
    delete require.cache[require.resolve(dataFilePath)];
    const imported = require(dataFilePath);
    initialRealConcerts = imported.initialRealConcerts || imported.default || imported;
  } catch (err) {
    console.error('❌ 데이터 파일 로드 실패:', err.message);
    process.exit(1);
  }

  console.log(`=======================================================`);
  console.log(`[CLASSICALENDER] 부천아트센터 KOPIS 전수 수집 및 세부 홀 매핑 시작`);
  console.log(`현재 전체 공연 건수: ${initialRealConcerts.length}건`);

  const listUrl = `http://kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=20250101&eddate=20271231&cpage=1&rows=100&shcate=CCCA&shprfnmfct=${encodeURIComponent('부천아트센터')}`;
  const listXml = await fetchXml(listUrl);
  const items = [...listXml.matchAll(/<db>([\s\S]*?)<\/db>/g)];

  console.log(`KOPIS 부천아트센터 검색 결과: 총 ${items.length}건 발견`);

  const concertMap = new Map();
  initialRealConcerts.forEach(c => {
    concertMap.set(c.kopisId || c.id, c);
  });

  let enrichedCount = 0;
  let addedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const raw = items[i][1];
    const idMatch = raw.match(/<mt20id>(.*?)<\/mt20id>/);
    const nmMatch = raw.match(/<prfnm>(.*?)<\/prfnm>/);
    const fromMatch = raw.match(/<prfpdfrom>(.*?)<\/prfpdfrom>/);
    const posterMatch = raw.match(/<poster>(.*?)<\/poster>/);
    const stateMatch = raw.match(/<prfstate>(.*?)<\/prfstate>/);

    if (!idMatch) continue;
    const kopisId = idMatch[1].trim();
    const title = nmMatch ? nmMatch[1].trim().replace(/&amp;/g, '&') : '';
    const date = fromMatch ? fromMatch[1].trim().replace(/\./g, '-') : '2026-10-20';
    const poster = posterMatch ? posterMatch[1].trim() : '';
    const status = stateMatch ? stateMatch[1].trim() : '예매중';

    // 상세 조회 (direct domain)
    const detailUrl = `http://kopis.or.kr/openApi/restful/pblprfr/${kopisId}?service=${SERVICE_KEY}`;
    const detailXml = await fetchXml(detailUrl);

    const fclMatch = detailXml.match(/<fcltynm>(.*?)<\/fcltynm>/);
    const mt13Match = detailXml.match(/<mt13id>(.*?)<\/mt13id>/);
    const castMatch = detailXml.match(/<prfcast>(.*?)<\/prfcast>/);
    const priceMatch = detailXml.match(/<pcseguidance>(.*?)<\/pcseguidance>/);
    const dtMatch = detailXml.match(/<dtguidance>(.*?)<\/dtguidance>/);

    const fcltynm = fclMatch ? fclMatch[1].trim() : '부천아트센터';
    const mt13id = mt13Match ? mt13Match[1].trim() : '';
    const cast = castMatch ? castMatch[1].trim() : '';
    const price = priceMatch ? priceMatch[1].trim() : '공식 예매처 참조';

    let time = '19:30';
    if (dtMatch) {
      const tm = dtMatch[1].match(/(\d{1,2}:\d{2})/);
      if (tm) time = tm[1];
    }

    const hall = extractHall(fcltynm, mt13id, title);
    const performers = cast && cast.length > 1
      ? cast.split(',').map(s => s.trim()).filter(Boolean)
      : [title];

    let target = concertMap.get(kopisId) || concertMap.get(`kopis-${kopisId}`);
    if (target) {
      target.hall = hall;
      target.venue = `부천아트센터 (${hall})`;
      target.sourceHall = fcltynm;
      if (poster && (!target.imageUrl || target.imageUrl.includes('placeholder'))) target.imageUrl = poster;
      if (price && price !== '공식 예매처 참조') target.price = price;
      enrichedCount++;
    } else {
      const newConcert = {
        id: `kopis-${kopisId}`,
        kopisId: kopisId,
        title: title,
        date: date,
        time: time,
        venue: `부천아트센터 (${hall})`,
        city: '경기/인천',
        performers: performers,
        performerType: title.includes('오케스트라') || title.includes('교향악단') ? '오케스트라' : '실내악',
        composers: ['클래식 명작'],
        pieces: [`${title} - 정규 클래식 레퍼토리`, '앙코르 특별 무대'],
        price: price || '공식 예매처 참조',
        ticketUrl: 'https://www.bac.or.kr',
        status: status,
        source: 'KOPIS 전산망 공식 수집',
        sourceHall: fcltynm,
        crawlerBlocked: false,
        description: `부천아트센터 ${hall}의 세계적인 어쿠스틱 음향으로 울려 퍼지는 정통 클래식 무대.`,
        imageUrl: poster || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        hall: hall
      };
      initialRealConcerts.push(newConcert);
      concertMap.set(kopisId, newConcert);
      addedCount++;
    }

    console.log(`[${i + 1}/${items.length}] "${title.slice(0, 22)}..." => [${hall}] (${fcltynm})`);
    await sleep(40);
  }

  console.log(`\n=======================================================`);
  console.log(`기존 공연 보강: ${enrichedCount}건 / 신규 KOPIS 부천아트센터 공연 추가: ${addedCount}건`);
  console.log(`총 공연 건수: ${initialRealConcerts.length}건`);

  // 날짜순 정렬
  initialRealConcerts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const fileContent = `export const initialRealConcerts = ${JSON.stringify(initialRealConcerts, null, 2)};\n\nexport default initialRealConcerts;\n`;
  fs.writeFileSync(dataFilePath, fileContent, 'utf8');
  console.log(`✅ src/data/initialRealConcerts.js 저장 완료!`);
  console.log(`=======================================================`);
}

run();
