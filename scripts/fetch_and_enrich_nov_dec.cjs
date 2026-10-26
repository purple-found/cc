const fs = require('fs');
const http = require('http');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    if (stopKeywords.some(kw => line.includes(kw))) break;
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

async function main() {
  const missing = JSON.parse(fs.readFileSync('scripts/missing_nov_dec.json', 'utf8'));
  const allMissing = [...missing.missingNov, ...missing.missingDec];
  console.log(`총 ${allMissing.length}건의 신규 공연 상세 정보 수집 시작...`);

  const details = {};
  for (let i = 0; i < allMissing.length; i++) {
    const item = allMissing[i];
    const xml = await fetchDetail(item.id);
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
      let relateUrl = '';
      const rMatch = xml.match(/<relateurl>([\s\S]*?)<\/relateurl>/);
      if (rMatch && rMatch[1].trim().startsWith('http')) {
        relateUrl = rMatch[1].trim();
      }

      const fcltynm = getTag('fcltynm');
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

      const desc = getTag('sty');
      const pieces = extractPiecesFromDescription(desc);

      details[item.id] = {
        id: item.id,
        title: cleanHtmlEntities(getTag('prfnm') || item.title),
        startDate: (getTag('prfpdfrom') || item.startDate).replace(/\./g, '-'),
        endDate: (getTag('prfpdto') || item.endDate).replace(/\./g, '-'),
        venueRaw: fcltynm || item.venue,
        hall: hall,
        area: getTag('area') || item.area,
        cast: getTag('prfcast'),
        runtime: getTag('prfruntime'),
        price: getTag('pcseguidance'),
        poster: getTag('poster') || item.poster,
        dtguidance: getTag('dtguidance'),
        relateUrl: relateUrl,
        sty: desc,
        styurls: styurls,
        extractedPieces: pieces
      };
    }
    await sleep(60); // 안전한 호출 간격
    if ((i + 1) % 15 === 0 || i === allMissing.length - 1) {
      console.log(`진행: ${i + 1} / ${allMissing.length} (${Math.round((i + 1) / allMissing.length * 100)}%)`);
    }
  }

  fs.writeFileSync('scripts/nov_dec_new_details.json', JSON.stringify(details, null, 2), 'utf8');
  console.log('수집 및 저장 완료: scripts/nov_dec_new_details.json');

  const withPieces = Object.values(details).filter(d => d.extractedPieces.length > 0);
  console.log(`상세 설명(sty)에서 곡목 자동 추출 성공: ${withPieces.length}건 / ${allMissing.length}건`);
}

main();
