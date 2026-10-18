/**
 * enrich_sac_halls.cjs
 * 예술의전당 및 주요 공연장의 세부 홀(콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀 등) 정보 KOPIS 실시간 조회 및 자동 보강 스크립트
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

// fcltynm 문자열 및 제목에서 세부 홀 추출
function extractHallName(fcltynm, title, venue) {
  if (!fcltynm && !title) return null;

  // 1. fcltynm 내 괄호 안 텍스트 파싱
  // 예: "예술의전당 [서울] (콘서트홀)" -> "콘서트홀"
  // 예: "대전예술의전당 (앙상블홀)" -> "앙상블홀"
  // 예: "세종예술의전당 (시크릿씨어터(3F) )" -> "시크릿씨어터(3F)"
  if (fcltynm) {
    const match = fcltynm.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      let hallCandidate = match[1].trim();
      // "서울", "구.프란츠홀" 등 공연장 자체 수식어 제외
      if (hallCandidate !== '서울' && !hallCandidate.startsWith('구.')) {
        return hallCandidate;
      }
    }
  }

  // 2. 예술의전당 대표 세부 홀 키워드 매칭
  const textToScan = `${fcltynm || ''} ${title || ''} ${venue || ''}`;
  if (textToScan.includes('IBK챔버홀') || textToScan.includes('챔버홀')) return 'IBK챔버홀';
  if (textToScan.includes('리사이틀홀')) return '리사이틀홀';
  if (textToScan.includes('인춘아트홀')) return '인춘아트홀';
  if (textToScan.includes('콘서트홀')) return '콘서트홀';
  if (textToScan.includes('오페라극장')) return '오페라극장';
  if (textToScan.includes('CJ토월극장') || textToScan.includes('토월극장')) return 'CJ토월극장';
  if (textToScan.includes('자유소극장')) return '자유소극장';
  if (textToScan.includes('앙상블홀')) return '앙상블홀';
  if (textToScan.includes('아트홀')) return '아트홀';
  if (textToScan.includes('대공연장') || textToScan.includes('대극장')) return '대공연장';
  if (textToScan.includes('소공연장') || textToScan.includes('소극장')) return '소공연장';

  return null;
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
  console.log(`[CLASSICALENDER] 예술의전당 세부 홀 KOPIS 실시간 조회 및 보강 시작`);
  console.log(`총 공연 건수: ${initialRealConcerts.length}건`);

  // 예술의전당(서울 및 전국 각지) 공연 중 세부 홀이 비어있거나 일반 '예술의전당'으로만 된 항목 필터링
  const targets = initialRealConcerts.filter(c => {
    const isSac = (c.venue && c.venue.includes('예술의전당')) || (c.sourceHall && c.sourceHall.includes('예술의전당'));
    const isMissingHall = !c.hall || c.hall === '' || c.hall === '예술의전당';
    return isSac && isMissingHall && c.kopisId;
  });

  console.log(`세부 홀 보강 대상 예술의전당 공연: ${targets.length}건`);
  console.log(`=======================================================`);

  let successCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const concert = targets[i];
    const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${concert.kopisId}?service=${SERVICE_KEY}`;
    let xml = await fetchXml(url);

    // 재시도 1회
    if (!xml || !xml.includes('<fcltynm>')) {
      await sleep(150);
      xml = await fetchXml(url);
    }

    const fcltynmMatch = xml ? xml.match(/<fcltynm>(.*?)<\/fcltynm>/) : null;
    const fcltynm = fcltynmMatch ? fcltynmMatch[1] : '';

    const hall = extractHallName(fcltynm, concert.title, concert.venue);
    if (hall) {
      concert.hall = hall;
      if (fcltynm && !concert.sourceHall) {
        concert.sourceHall = fcltynm;
      }
      successCount++;
      console.log(`[${i + 1}/${targets.length}] [보강 완료] "${concert.title.slice(0, 22)}..." => [${hall}] (${fcltynm || '추출'})`);
    } else {
      const fallbackHall = extractHallName('', concert.title, concert.venue);
      if (fallbackHall) {
        concert.hall = fallbackHall;
        successCount++;
        console.log(`[${i + 1}/${targets.length}] [제목 보강] "${concert.title.slice(0, 22)}..." => [${fallbackHall}]`);
      } else {
        skippedCount++;
        console.log(`[${i + 1}/${targets.length}] [미확인] "${concert.title.slice(0, 22)}..." (fcltynm: "${fcltynm}")`);
      }
    }
    await sleep(40);
  }

  console.log(`\n=======================================================`);
  console.log(`보강 완료: ${successCount}건 / 미확인: ${skippedCount}건`);

  // 파일 저장
  const fileContent = `export const initialRealConcerts = ${JSON.stringify(initialRealConcerts, null, 2)};\n\nexport default initialRealConcerts;\n`;
  fs.writeFileSync(dataFilePath, fileContent, 'utf8');
  console.log(`✅ src/data/initialRealConcerts.js 파일 저장 완료!`);
  console.log(`=======================================================`);
}

run();
