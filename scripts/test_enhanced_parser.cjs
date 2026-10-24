const fs = require('fs');
const path = require('path');
const { initialRealConcerts } = require('../src/data/initialRealConcerts.js');

function cleanHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#183;/g, '·')
    .replace(/&#8211;/g, '–');
}

function extractPiecesFromDescription(desc) {
  if (!desc || desc.length < 20) return [];
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
    if (/^\*.*(?:변경|사정|주최|프로그램은)/.test(line)) continue;
    if (/^(?:INTERMISSION|Intermission|인터미션|휴식|중간휴식|<1부>|<2부>|1부|2부|PART\s*\d|Part\s*\d)$/i.test(line)) continue;
    if (/^(?:해설|진행|사회)\s*:/.test(line)) continue;
    if (line.length < 3 || line.length > 160) continue;

    // Check if line is a performer tag for next piece (e.g. "Sop. 김소희", "Ten. 이기용")
    if (/^(?:Sop\.|Ten\.|Bar\.|Bass\.|Mezzo\.|소프라노|테너|바리톤|베이스|메조소프라노)\s+[가-힣a-zA-Z\s,·]+/i.test(line)) {
      currentPerformer = line.trim();
      continue;
    }

    // Piece candidate detection
    const isPieceCandidate = 
      /\b(?:Op\.|No\.|BWV|K\.|Hob\.|RV|D\.|S\.|WoO|HWV|Sz\.|M\.|L\.|P\.)\b/i.test(line) ||
      /(?:소나타|협주곡|교향곡|모음곡|서곡|녹턴|에튀드|발라드|스케르초|환상곡|Concerto|Symphony|Sonata|Suite|Overture|Nocturne|Etude|Ballade|Scherzo|Fantasia|Waltz|왈츠|세레나데|Serenade|가곡|칸타타|오라토리오|미사곡|사계|비창|영웅|운명|전원|합창|신세계|백조의 호수|호두까기)/i.test(line) ||
      /(?:베토벤|모차르트|바흐|브람스|쇼팽|슈베르트|슈만|차이콥스키|차이코프스키|라흐마니노프|라벨|드뷔시|드보르작|드보르자크|리스트|멘델스존|시벨리우스|하이든|헨델|말러|생상스|비발디|푸치니|베르디|로시니|파가니니|타르티니|사라사테|프랑크|포레|프로코피예프|쇼스타코비치|스트라빈스키|바르톡|바르토크|거슈윈|거쉬인|구노|도니제티|글린카|벨리니|Gounod|Donizetti|Rossini|Puccini|Verdi|Bizet|비제|홍난파|현제명|채동선|이흥렬|조두남|김동진|최영섭|장일남|윤이상|신예훈|이신우|전현석|박소은|김지향|전욱용|정샹푸|뤼윈츠|박준선|양영광|조선희|김승림|김지현|이윤석)/i.test(line) ||
      /Opera\s*<[^>]+>|오페라\s*<[^>]+>|<\s*[^>]+>[^<]+Opera/i.test(line) ||
      /(?:for|for Solo|for 2|for Two|duo|trio|quartet|quintet)\b/i.test(line) ||
      /^[0-9]+[st|nd|rd|th|\.]?\s+[A-Z가-힣]/.test(line);

    if (isPieceCandidate) {
      let cleanPiece = line.replace(/^[0-9]+[\.\)]\s*/, '').replace(/^[•\-\*·]\s*/, '').trim();
      // Remove trailing composer born/death years if present like (1660~1725)
      cleanPiece = cleanPiece.replace(/\s*\(\d{4}[~-]\d{4}\)/g, '');
      if (currentPerformer) {
        cleanPiece = `${cleanPiece} (${currentPerformer})`;
        currentPerformer = '';
      }
      if (cleanPiece.length >= 3 && !pieces.includes(cleanPiece)) {
        pieces.push(cleanPiece);
      }
    }
  }

  return pieces;
}

let extraFound = 0;
initialRealConcerts.forEach(c => {
  if (c.pieces && c.pieces.length > 0) return;
  const p = extractPiecesFromDescription(c.description);
  if (p.length > 0) {
    extraFound++;
    console.log(`[EXTRA] ${c.date} ${c.title} -> ${p.length} pieces`);
    p.slice(0, 3).forEach(x => console.log('    •', x));
  }
});

console.log('Total new from descriptions:', extraFound);
