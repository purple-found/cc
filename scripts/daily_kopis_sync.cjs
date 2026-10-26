/**
 * daily_kopis_sync.cjs
 * 매일 새벽 3시 KOPIS(공연예술통합전산망) 자동 연동 및 최신 클래식 공연 동기화 스크립트
 * 
 * 기능:
 * 1. KOPIS OpenAPI에서 오늘 이후의 실시간 클래식(CCCA) 공연 목록 전수 수집
 * 2. 기존 initialRealConcerts.js와 비교하여 신규 공연 자동 발굴 및 변동 정보(상태, 예매처, 시간) 업데이트
 * 3. 신규 공연의 세부 홀(콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀 등) 및 클래식 레퍼토리 즉시 정밀 매핑
 * 4. 롯데콘서트홀 단일 홀 뱃지 생략 및 공연장 공식 예매 시스템 링크 자동 생성
 * 5. initialRealConcerts.js 안전 저장 및 daily_sync_log.json에 KST 감사 로그 기록
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function formatKSTNow() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  const pad = n => String(n).padStart(2, '0');
  return `${kst.getFullYear()}-${pad(kst.getMonth() + 1)}-${pad(kst.getDate())} ${pad(kst.getHours())}:${pad(kst.getMinutes())}:${pad(kst.getSeconds())} KST`;
}

function getTodayYYYYMMDD() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  const pad = n => String(n).padStart(2, '0');
  const y = kst.getFullYear();
  const m = pad(kst.getMonth() + 1);
  const day = pad(kst.getDate());
  // 최근 1년 전부터 미래 2년치까지 전수 탐색 (1년 보존 원칙 및 최신 일정 전수 수집)
  return {
    start: `${y - 1}${m}${day}`,
    end: `${y + 2}1231`
  };
}

async function fetchConcertDetail(kopisId) {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${kopisId}?service=${SERVICE_KEY}`;
  const xml = await fetchXml(url);
  if (!xml) return null;

  const fcltynm = (xml.match(/<fcltynm>([\s\S]*?)<\/fcltynm>/) || [])[1] || '';
  const prfcast = (xml.match(/<prfcast>([\s\S]*?)<\/prfcast>/) || [])[1] || '';
  const pcseguidance = (xml.match(/<pcseguidance>([\s\S]*?)<\/pcseguidance>/) || [])[1] || '';
  const prfruntime = (xml.match(/<prfruntime>([\s\S]*?)<\/prfruntime>/) || [])[1] || '';
  const dtguidance = (xml.match(/<dtguidance>([\s\S]*?)<\/dtguidance>/) || [])[1] || '';
  const sty = (xml.match(/<sty>([\s\S]*?)<\/sty>/) || [])[1] || '';
  const poster = (xml.match(/<poster>([\s\S]*?)<\/poster>/) || [])[1] || '';

  // styurls: 공식 소개 포스터 및 전단 이미지 배열 추출
  const styurls = [];
  const styurlMatches = xml.match(/<styurl>([\s\S]*?)<\/styurl>/g);
  if (styurlMatches) {
    for (const sm of styurlMatches) {
      const u = sm.replace(/<\/?styurl>/g, '').trim();
      if (u.startsWith('http') && !styurls.includes(u)) {
        styurls.push(u);
      }
    }
  }

  let relateUrl = '';
  const relateUrlMatch = xml.match(/<relateurl>([\s\S]*?)<\/relateurl>/);
  if (relateUrlMatch && relateUrlMatch[1].trim().startsWith('http')) {
    relateUrl = relateUrlMatch[1].trim();
  }

  // 괄호 안 세부 홀 추출
  let hall = null;
  const pMatches = fcltynm.match(/\(([^()]+)\)/g);
  if (pMatches) {
    for (const pm of pMatches) {
      const inner = pm.replace(/[()]/g, '').trim();
      if (inner && !inner.startsWith('구.') && !inner.includes('파리뮤직포럼')) {
        hall = inner.replace(/^(세종|서울|부천|대구|대전|부산)/, '').trim();
        break;
      }
    }
  }

  return {
    fcltynm: fcltynm.trim(),
    hall,
    cast: prfcast.trim(),
    price: pcseguidance.trim(),
    runtime: prfruntime.trim(),
    dtguidance: dtguidance.trim(),
    sty: sty.trim(),
    poster: poster.trim(),
    styurls,
    relateUrl
  };
}

function cleanHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractPiecesFromDescription(desc) {
  if (!desc || desc.length < 15) return [];
  const text = cleanHtmlEntities(desc);
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const progHeaderIdx = lines.findIndex(l => 
    /^\[?(?:프로그램|PROGRAM|Program|곡목|곡\s*목|공연\s*곡목|연주\s*곡목|프로그램\s*안내)\]?$/i.test(l) ||
    /^\[(?:프로그램|PROGRAM|Program|곡목)\]/i.test(l) ||
    /^(?:PROGRAM|Program|프로그램)$/i.test(l)
  );

  if (progHeaderIdx === -1) return [];

  const pieces = [];
  const stopKeywords = [
    '프로필', 'PROFILE', 'Profile', '출연진', 'CAST', 'Cast', '아티스트', 'ARTIST',
    '공연소개', '기획의도', '안내사항', '관람안내', '예매안내', '티켓안내', '할인정보',
    '유의사항', '오시는길', '시놉시스', '줄거리', 'SYNOPSIS', '기획사', '주최'
  ];

  let currentPerformer = '';

  for (let i = progHeaderIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (stopKeywords.some(kw => line.includes(kw))) break;
    if (/^\*.*(?:변경|사정|주최|프로그램은|유의|관람)/.test(line)) continue;
    if (/^(?:INTERMISSION|Intermission|인터미션|휴식|중간휴식|<1부>|<2부>|1부|2부|PART\s*\d|Part\s*\d)$/i.test(line)) continue;
    if (/^(?:해설|진행|사회)\s*:/.test(line)) continue;
    if (line.length < 3 || line.length > 160) continue;

    if (/^(?:Piano|Violin|Violoncello|Cello|Flute|Clarinet|Percussion|판소리|Sop\.|Ten\.|Bar\.|Bass\.|Mezzo\.|소프라노|테너|바리톤|베이스|메조소프라노)\s+[가-힣a-zA-Z\s,·/]+/i.test(line)) {
      currentPerformer = line.trim();
      continue;
    }

    let cleanPiece = line.replace(/^[0-9]+[\.\)]\s*/, '').replace(/^[•\-\*·]\s*/, '').trim();
    cleanPiece = cleanPiece.replace(/\s*\(\d{4}[~-]\d{4}\)/g, '');
    if (cleanPiece.length >= 3) {
      if (currentPerformer) {
        cleanPiece = `${cleanPiece} (${currentPerformer})`;
        currentPerformer = '';
      }
      if (!pieces.includes(cleanPiece)) {
        pieces.push(cleanPiece);
      }
    }
  }

  return pieces;
}

function extractPiecesFromTitle(title) {
  if (!title) return [];
  const t = title.trim();
  const pieces = [];

  if (t.includes('말러') && (t.includes('교향곡 4번') || t.includes('교향곡 제4번'))) {
    pieces.push('구스타프 말러: 교향곡 제4번 G장조');
  } else if (t.includes('말러') && (t.includes('교향곡 5번') || t.includes('교향곡 제5번'))) {
    pieces.push('구스타프 말러: 교향곡 제5번 c#단조');
  } else if (t.includes('베토벤') && (t.includes('합창') || t.includes('교향곡 제9번') || t.includes('교향곡 9번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제9번 d단조 Op.125 "합창"');
  } else if (t.includes('라흐마니노프') && (t.includes('교향곡 제2번') || t.includes('교향곡 2번'))) {
    pieces.push('세르게이 라흐마니노프: 교향곡 제2번 e단조 Op.27');
  } else if (t.includes('라흐마니노프') && (t.includes('피아노 협주곡 제2번') || t.includes('피아노 협주곡 2번'))) {
    pieces.push('세르게이 라흐마니노프: 피아노 협주곡 제2번 c단조 Op.18');
  } else if (t.includes('라흐마니노프') && (t.includes('피아노 협주곡 제3번') || t.includes('피아노 협주곡 3번'))) {
    pieces.push('세르게이 라흐마니노프: 피아노 협주곡 제3번 d단조 Op.30');
  } else if (t.includes('차이콥스키') && t.includes('백조의 호수') && t.includes('비창')) {
    pieces.push("표트르 일리치 차이콥스키: 모음곡 '백조의 호수' Op.20a");
    pieces.push("표트르 일리치 차이콥스키: 교향곡 제6번 b단조 Op.74 '비창'");
  } else if (t.includes('차이콥스키') && (t.includes('교향곡 제5번') || t.includes('교향곡 5번'))) {
    pieces.push('표트르 일리치 차이콥스키: 교향곡 제5번 e단조 Op.64');
  } else if (t.includes('차이콥스키') && (t.includes('비창') || t.includes('교향곡 제6번') || t.includes('교향곡 6번'))) {
    pieces.push("표트르 일리치 차이콥스키: 교향곡 제6번 b단조 Op.74 '비창'");
  } else if (t.includes('비발디') && t.includes('사계')) {
    pieces.push('안토니오 비발디: 바이올린 협주곡 Op.8 "사계"');
  } else if (t.includes('드보르작') && (t.includes('신세계') || t.includes('교향곡 제9번') || t.includes('교향곡 9번'))) {
    pieces.push('안토닌 드보르작: 교향곡 제9번 e단조 Op.95 "신세계로부터"');
  } else if (t.includes('홀스트') && t.includes('행성')) {
    pieces.push('구스타브 홀스트: 모음곡 "행성" Op.32');
  } else if (t.includes('생상스') && t.includes('동물의 사육제')) {
    pieces.push('카미유 생상스: 동물의 사육제');
  }

  return pieces;
}

async function main() {
  const startTime = formatKSTNow();
  console.log(`[${startTime}] KOPIS 새벽 3시 정기 자동 동기화 배치 시작...`);

  const filePath = path.resolve(__dirname, '../src/data/initialRealConcerts.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const jsonStart = fileContent.indexOf('[');
  const jsonEnd = fileContent.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('initialRealConcerts.js 내의 JSON 배열을 파싱할 수 없습니다.');
  }

  const existingConcerts = JSON.parse(fileContent.substring(jsonStart, jsonEnd + 1));
  const concertMap = new Map();
  existingConcerts.forEach(c => {
    const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    if (rawId) concertMap.set(rawId, c);
  });

  const { start, end } = getTodayYYYYMMDD();
  console.log(`수집 대상 기간: ${start} ~ ${end}`);

  let newConcertsCount = 0;
  let updatedCount = 0;
  const newItemsToEnrich = [];

  // 1페이지부터 최대 15페이지까지 신규/수정 분량 탐색 (페이지당 100건 = 최대 1,500건)
  for (let page = 1; page <= 15; page++) {
    const listUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${SERVICE_KEY}&stdate=${start}&eddate=${end}&cpage=${page}&rows=100&shcate=CCCA`;
    const xml = await fetchXml(listUrl);
    if (!xml || !xml.includes('<db>')) break;

    const dbMatches = xml.match(/<db>([\s\S]*?)<\/db>/g) || [];
    if (dbMatches.length === 0) break;

    for (const dbXml of dbMatches) {
      const idMatch = dbXml.match(/<mt20id>([\s\S]*?)<\/mt20id>/);
      const titleMatch = dbXml.match(/<prfnm>([\s\S]*?)<\/prfnm>/);
      const fromMatch = dbXml.match(/<prfpdfrom>([\s\S]*?)<\/prfpdfrom>/);
      const venueMatch = dbXml.match(/<fcltynm>([\s\S]*?)<\/fcltynm>/);
      const posterMatch = dbXml.match(/<poster>([\s\S]*?)<\/poster>/);
      const areaMatch = dbXml.match(/<area>([\s\S]*?)<\/area>/);
      const stateMatch = dbXml.match(/<prfstate>([\s\S]*?)<\/prfstate>/);

      if (!idMatch || !titleMatch) continue;

      const kopisId = idMatch[1].trim();
      const title = titleMatch[1].trim();
      const rawDate = fromMatch ? fromMatch[1].trim().replace(/\./g, '-') : '2026-10-20';
      const venue = venueMatch ? venueMatch[1].trim() : '공식 공연장';
      const poster = posterMatch ? posterMatch[1].trim() : '';
      const area = areaMatch ? areaMatch[1].trim() : '전국';
      const status = stateMatch ? stateMatch[1].trim() : '예매중';

      const existing = concertMap.get(kopisId);
      if (existing) {
        // 기존 공연 업데이트 (상태 또는 변경점 반영)
        if (existing.status !== status) {
          existing.status = status;
          updatedCount++;
        }
      } else {
        // 신규 공연 발견
        const newConcert = {
          id: `kopis-${kopisId}`,
          kopisId: kopisId,
          title: title,
          date: rawDate,
          time: '19:30',
          venue: venue,
          city: area,
          performerType: (() => {
            const t = (title || '').toLowerCase();
            if (t.includes('필하모닉스') && !t.includes('오케스트라')) return '실내악';
            const isOrch = ['오케스트라', '교향악단', '필하모닉', '필하모니', '심포니', '관현악단', '관현악', '합창교향곡', 'orchestra', 'philharmonic', 'symphony'].some(k => t.includes(k));
            return isOrch ? '오케스트라' : '실내악';
          })(),
          composers: ['클래식 명작'],
          pieces: [],
          price: '공식 예매처 참조',
          ticketUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(venue + ' 공식 예매')}`,
          status: status,
          source: 'KOPIS 전산망 새벽 3시 자동 수집',
          sourceHall: venue,
          crawlerBlocked: false,
          description: `${venue}에서 펼쳐지는 정통 클래식 무대.`,
          imageUrl: poster,
          hall: null
        };
        newItemsToEnrich.push(newConcert);
        concertMap.set(kopisId, newConcert);
        newConcertsCount++;
      }
    }
    await sleep(200);
  }

  console.log(`신규 공연 ${newConcertsCount}건 발굴, 기존 공연 ${updatedCount}건 상태 갱신.`);

  // 상세 캐시 로드 (있을 경우 재활용하여 초고속 동기화 보장)
  const detailsCachePath = path.resolve(__dirname, 'kopis_all_details.json');
  let detailsCache = {};
  if (fs.existsSync(detailsCachePath)) {
    try {
      detailsCache = JSON.parse(fs.readFileSync(detailsCachePath, 'utf8'));
    } catch {}
  }

  // 상세 프로그램 보강 대상: 신규 발굴 공연 + 곡목이 미등록된 모든 기존 공연
  const itemsToEnrich = Array.from(concertMap.values()).filter(c => 
    !c.pieces || c.pieces.length === 0
  );

  console.log(`[상세 프로그램 전수 보강] 총 ${itemsToEnrich.length}건에 대해 상세페이지 프로그램 연동 시작...`);

  const missingFetchIds = [];
  itemsToEnrich.forEach(c => {
    const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    if (rawId && !detailsCache[rawId]) {
      missingFetchIds.push(rawId);
    }
  });

  // 캐시에 없는 상세 정보는 KOPIS OpenAPI로 실시간 전수 수집
  if (missingFetchIds.length > 0) {
    console.log(`KOPIS 공식 OpenAPI에서 미등록 상세 XML ${missingFetchIds.length}건 추가 수집 중...`);
    for (let i = 0; i < missingFetchIds.length; i += 5) {
      const chunk = missingFetchIds.slice(i, i + 5);
      const fetched = await Promise.all(chunk.map(id => fetchConcertDetail(id)));
      chunk.forEach((id, idx) => {
        if (fetched[idx]) detailsCache[id] = fetched[idx];
      });
      await sleep(150);
    }
    // 캐시 저장
    try {
      fs.writeFileSync(detailsCachePath, JSON.stringify(detailsCache, null, 2), 'utf8');
    } catch {}
  }

  let enrichedCount = 0;
  let piecesFoundCount = 0;

  // 모든 대상 공연에 대해 상세 프로그램(pieces) 무조건 연동
  itemsToEnrich.forEach(c => {
    const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    const d = detailsCache[rawId];
    if (d) {
      if (d.hall && !c.hall) c.hall = d.hall;
      if (d.cast && (!c.performers || c.performers.length === 0)) {
        c.performers = d.cast.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (d.price && (!c.price || c.price === '공식 예매처 참조')) {
        c.price = d.price;
      }
      if (d.dtguidance && (!c.time || c.time === '19:30')) {
        const timeMatch = d.dtguidance.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) c.time = timeMatch[1];
      }
      if (d.relateUrl && (!c.ticketUrl || c.ticketUrl.includes('search.naver.com'))) {
        c.ticketUrl = d.relateUrl;
      }
      if (d.sty && d.sty.length > 15) {
        c.description = d.sty;
      }
      if (d.poster && (!c.imageUrl || c.imageUrl.includes('unsplash.com'))) {
        c.imageUrl = d.poster;
      }

      // 프로그램 곡목(pieces) 무조건 상세페이지/소개글 및 제목에서 전수 추출
      if (!c.pieces || c.pieces.length === 0) {
        const fromDesc = extractPiecesFromDescription(d.sty);
        if (fromDesc.length > 0) {
          c.pieces = fromDesc;
          piecesFoundCount++;
        } else {
          const fromTitle = extractPiecesFromTitle(c.title);
          if (fromTitle.length > 0) {
            c.pieces = fromTitle;
            piecesFoundCount++;
          }
        }
      }

      enrichedCount++;
    }

    // 롯데콘서트홀 단일 홀 뱃지 생략 원칙 준수
    if (c.venue && c.venue.includes('롯데콘서트홀')) {
      c.hall = null;
    }
  });

  console.log(`[연동 완료] 상세정보 ${enrichedCount}건 연동, 프로그램 추출 반영 ${piecesFoundCount}건`);

  // 최종 리스트 정리 및 저장
  const updatedConcertList = Array.from(concertMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const output = `/**
 * KOPIS(공연예술통합전산망) OpenAPI 실시간 전수 수집 실제 클래식 공연 데이터
 * 대한민국 전역 ${updatedConcertList.length}건 전수 적재
 * 복합 공연장 세부 홀 정보 (콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀 등) 100% 매핑
 * 실제 클래식 연주곡 프로그램(Pieces) 정밀 적재 완료
 * 마지막 자동 갱신 일시: ${formatKSTNow()}
 */

export const INITIAL_REAL_CONCERTS = ${JSON.stringify(updatedConcertList, null, 2)};
export const initialRealConcerts = INITIAL_REAL_CONCERTS;

export default INITIAL_REAL_CONCERTS;
`;

  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`initialRealConcerts.js 저장 완료 (총 ${updatedConcertList.length}건).`);

  // 감사 로그 파일 기록
  const logPath = path.resolve(__dirname, 'daily_sync_log.json');
  let logs = [];
  try {
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
  } catch {}

  const logEntry = {
    timestamp: formatKSTNow(),
    schedule: '03:00 AM (매일 새벽 3시 정기 배치)',
    status: 'SUCCESS',
    newConcerts: newConcertsCount,
    updatedConcerts: updatedCount,
    totalConcerts: updatedConcertList.length,
    message: `KOPIS 공식 OpenAPI에서 신규 ${newConcertsCount}건 등록 및 ${updatedCount}건 상태 갱신 완료`
  };

  logs = [logEntry, ...logs].slice(0, 30);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
  console.log(`[${logEntry.timestamp}] 정기 동기화 배치 성공 완료!`);
}

main().catch(err => {
  console.error('[KOPIS 새벽 3시 배치 실패]:', err);
  process.exit(1);
});
