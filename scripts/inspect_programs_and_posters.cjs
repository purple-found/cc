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
    '유의사항', '오시는길', '시놉시스', '줄거리', 'SYNOPSIS'
  ];

  for (let i = progHeaderIdx + 1; i < lines.length; i++) {
    const line = lines[i];

    // Check stop keyword
    if (stopKeywords.some(kw => line.includes(kw))) {
      break;
    }

    // Ignore disclaimer lines
    if (/^\*.*(?:변경|사정|주최)/.test(line)) continue;
    if (/^(?:INTERMISSION|Intermission|인터미션|휴식|중간휴식)$/i.test(line)) continue;
    if (/^(?:해설|진행|사회|지휘|연주|협연|피아노|바이올린|첼로)\s*:/.test(line)) continue;
    if (line.length < 3 || line.length > 150) continue;

    // Check if line looks like a piece or composer - piece
    const isPieceCandidate = 
      /\b(?:Op\.|No\.|BWV|K\.|Hob\.|RV|D\.|S\.|WoO|HWV)\b/i.test(line) ||
      /(?:소나타|협주곡|교향곡|모음곡|서곡|녹턴|에튀드|발라드|스케르초|환상곡|Concerto|Symphony|Sonata|Suite|Overture|Nocturne|Etude|Ballade|Scherzo|Fantasia|Waltz|왈츠|세레나데|Serenade|가곡|칸타타|오라토리오|미사곡|사계|비창|영웅|운명|전원|합창|신세계|백조의 호수|호두까기 인형)/.test(line) ||
      /(?:베토벤|모차르트|바흐|브람스|쇼팽|슈베르트|슈만|차이콥스키|라흐마니노프|라벨|드뷔시|드보르작|리스트|멘델스존|시벨리우스|하이든|헨델|말러|생상스|비발디|푸치니|베르디|로시니|파가니니|타르티니|사라사테|프랑크|포레|프로코피예프|쇼스타코비치|스트라빈스키|바르톡|거슈윈)/.test(line);

    if (isPieceCandidate) {
      // Strip leading bullets/numbers
      const cleanPiece = line.replace(/^[0-9]+[\.\)]\s*/, '').replace(/^[•\-\*·]\s*/, '').trim();
      if (cleanPiece.length >= 3) {
        pieces.push(cleanPiece);
      }
    }
  }

  return pieces;
}

let extractedCount = 0;
const samples = [];

initialRealConcerts.forEach(c => {
  if (c.pieces && c.pieces.length > 0) return;
  const pieces = extractPiecesFromDescription(c.description);
  if (pieces.length > 0) {
    extractedCount++;
    if (samples.length < 8) {
      samples.push({
        title: c.title,
        date: c.date,
        venue: c.venue,
        pieces: pieces
      });
    }
  }
});

console.log('Successfully extracted programs from description for:', extractedCount, 'concerts');
console.log('\n--- Extraction Samples ---');
samples.forEach((s, idx) => {
  console.log(`[${idx + 1}] ${s.date} ${s.title} (${s.venue})`);
  s.pieces.forEach(p => console.log('    •', p));
});
