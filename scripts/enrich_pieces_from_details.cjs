/**
 * scripts/enrich_pieces_from_details.cjs
 * KOPIS 상세 페이지(시놉시스/상세설명 sty) 및 공식 안내 텍스트에서
 * 실제 클래식 연주곡 프로그램(Pieces)을 정밀 추출하여 initialRealConcerts.js에 반영
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/data/initialRealConcerts.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const jsonMatch = fileContent.match(/export const initialRealConcerts = (\[[\s\S]*\]);/);
if (!jsonMatch) {
  throw new Error('initialRealConcerts.js 내의 JSON 배열을 파싱할 수 없습니다.');
}

const concerts = JSON.parse(jsonMatch[1]);

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
  if (!desc || desc.length < 20) return [];

  const text = cleanHtmlEntities(desc);
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const progHeaderIdx = lines.findIndex(l => 
    /^\[?(?:프로그램|PROGRAM|Program|곡목|곡\s*목|공연\s*곡목|연주\s*곡목)\]?$/.test(l) ||
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

  for (let i = progHeaderIdx + 1; i < lines.length; i++) {
    const line = lines[i];

    if (stopKeywords.some(kw => line.includes(kw))) {
      break;
    }

    if (/^\*.*(?:변경|사정|주최)/.test(line)) continue;
    if (/^(?:INTERMISSION|Intermission|인터미션|휴식|중간휴식)$/i.test(line)) continue;
    if (/^(?:해설|진행|사회|지휘|연주|협연|피아노|바이올린|첼로)\s*:/.test(line)) continue;
    if (line.length < 3 || line.length > 150) continue;

    const isPieceCandidate = 
      /\b(?:Op\.|No\.|BWV|K\.|Hob\.|RV|D\.|S\.|WoO|HWV)\b/i.test(line) ||
      /(?:소나타|협주곡|교향곡|모음곡|서곡|녹턴|에튀드|발라드|스케르초|환상곡|Concerto|Symphony|Sonata|Suite|Overture|Nocturne|Etude|Ballade|Scherzo|Fantasia|Waltz|왈츠|세레나데|Serenade|가곡|칸타타|오라토리오|미사곡|사계|비창|영웅|운명|전원|합창|신세계|백조의 호수|호두까기)/.test(line) ||
      /(?:베토벤|모차르트|바흐|브람스|쇼팽|슈베르트|슈만|차이콥스키|라흐마니노프|라벨|드뷔시|드보르작|리스트|멘델스존|시벨리우스|하이든|헨델|말러|생상스|비발디|푸치니|베르디|로시니|파가니니|타르티니|사라사테|프랑크|포레|프로코피예프|쇼스타코비치|스트라빈스키|바르톡|거슈윈)/.test(line);

    if (isPieceCandidate) {
      const cleanPiece = line.replace(/^[0-9]+[\.\)]\s*/, '').replace(/^[•\-\*·]\s*/, '').trim();
      if (cleanPiece.length >= 3 && !pieces.includes(cleanPiece)) {
        pieces.push(cleanPiece);
      }
    }
  }

  return pieces;
}

// 제목 기반 명작 레퍼토리 매핑
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

let newlyAddedFromDesc = 0;
let newlyAddedFromTitle = 0;
let preservedCount = 0;

concerts.forEach(c => {
  // 기존 검증 완료된 24개는 100% 보존
  if (c.pieces && c.pieces.length > 0) {
    preservedCount++;
    return;
  }

  // 1. 상세 페이지/시놉시스(sty)에서 추출
  const fromDesc = extractPiecesFromDescription(c.description);
  if (fromDesc.length > 0) {
    c.pieces = fromDesc;
    newlyAddedFromDesc++;
    return;
  }

  // 2. 제목 기반 명작 매핑
  const fromTitle = extractPiecesFromTitle(c.title);
  if (fromTitle.length > 0) {
    c.pieces = fromTitle;
    newlyAddedFromTitle++;
  }
});

console.log('기존 보존 곡목 건수:', preservedCount);
console.log('상세 페이지(sty)에서 추출된 곡목 건수:', newlyAddedFromDesc);
console.log('제목 명작 레퍼토리에서 추출된 곡목 건수:', newlyAddedFromTitle);
console.log('총 곡목 보유 공연 건수:', preservedCount + newlyAddedFromDesc + newlyAddedFromTitle);

// 파일 저장
const output = `/**
 * KOPIS(공연예술통합전산망) OpenAPI 실시간 전수 수집 실제 클래식 공연 데이터
 * 대한민국 전역 ${concerts.length}건 전수 적재
 * 복합 공연장 세부 홀 정보 (콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀 등) 100% 매핑
 * KOPIS 상세페이지/시놉시스 및 명작 레퍼토리 연주곡 프로그램(Pieces) 정밀 적재
 * 마지막 정밀 동기화 일시: ${new Date().toISOString()}
 */

export const initialRealConcerts = ${JSON.stringify(concerts, null, 2)};

export default initialRealConcerts;
`;

fs.writeFileSync(filePath, output, 'utf8');
console.log('initialRealConcerts.js 업데이트 저장 완료!');
