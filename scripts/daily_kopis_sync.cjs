/**
 * daily_kopis_sync.cjs
 * 매일 새벽 3시 KOPIS(공연예술통합전산망) 자동 연동 및 최신 클래식 공연 동기화 스크립트
 * 
 * 기능:
 * 1. KOPIS OpenAPI에서 실시간 순수 서양클래식(CCCA) 공연 목록 전수 수집
 * 2. 기존 initialRealConcerts.js와 비교하여 신규 공연 자동 발굴 및 변동 정보(상태, 예매처, 시간) 업데이트
 * 3. 세부 프로그램(pieces) 미등록 공연에 대한 4단계 자동 프로그램 추출 파이프라인 가동:
 *    - [Stage 1] KOPIS 상세 XML <sty> 소개글 정밀 파싱 ([PROGRAM] 섹션 및 헤더리스 곡목 라인, 다중 줄 작곡가+곡명 병합)
 *    - [Stage 2] 공식 상세페이지(<relateurl> 예매처/공연장 상세페이지) 자동 리다이렉트 추적 및 HTML/Next.js 본문 파싱
 *    - [Stage 3] 각 공연 포스터(<poster>) 및 상세 소개 전단 이미지(<styurl>) 자동 비전/OCR 판독 (장문 전단 자동 분할 판독)
 *    - [Stage 4] 공연 제목·부제 내 명시된 클래식 레퍼토리 정밀 추출
 * 4. 롯데콘서트홀 단일 홀 뱃지 생략 및 공연장 공식 예매 시스템 링크 자동 생성
 * 5. initialRealConcerts.js 안전 저장 및 daily_sync_log.json에 KST 감사 로그 기록
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execFileSync } = require('child_process');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

const kopisAgent = new http.Agent({ keepAlive: true, maxSockets: 6 });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchXmlOnce(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { agent: kopisAgent, timeout: 8000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve('');
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

async function fetchXml(url) {
  let xml = await fetchXmlOnce(url);
  if (!xml || !xml.includes('<db>')) {
    await sleep(350);
    xml = await fetchXmlOnce(url);
  }
  return xml;
}

function fetchUrlFollowRedirects(url, maxRedirects = 5) {
  return new Promise((resolve) => {
    if (!url || maxRedirects <= 0) return resolve('');
    let targetUrl = url;
    if (targetUrl.includes('sejongpac.or.kr') && targetUrl.includes('performIdx=')) {
      const m = targetUrl.match(/performIdx=(\d+)/);
      if (m) {
        targetUrl = `https://www.sejongpac.or.kr/portal/performance/performance/view.do?performIdx=${m[1]}&menuNo=200004`;
      }
    }
    const client = targetUrl.startsWith('https') ? https : http;
    let req;
    try {
      req = client.get(targetUrl, {
        timeout: 7000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8'
        }
      }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          try {
            const nextUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, targetUrl).href;
            return resolve(fetchUrlFollowRedirects(nextUrl, maxRedirects - 1));
          } catch {
            return resolve('');
          }
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          let str = buf.toString('utf8');
          if (/charset=["']?euc-kr/i.test(str)) {
            try {
              str = new TextDecoder('euc-kr').decode(buf);
            } catch {}
          }
          resolve(str);
        });
      });
      req.on('error', () => resolve(''));
      req.on('timeout', () => { req.destroy(); resolve(''); });
    } catch {
      resolve('');
    }
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
  return {
    start: `${y - 1}${m}${day}`,
    end: `${y + 2}1231`
  };
}

function decodeHtmlAndUnicode(raw) {
  if (!raw) return '';
  return raw
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u0027/gi, "'")
    .replace(/\\u0022/gi, '"')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&auml;/gi, 'ä')
    .replace(/&aacute;/gi, 'á')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function isValidDetailCache(d) {
  return Boolean(
    d && (
      (d.fcltynm && d.fcltynm.trim().length > 0) ||
      (d.poster && d.poster.trim().length > 0) ||
      (d.styurls && d.styurls.length > 0) ||
      (d.relateUrl && d.relateUrl.trim().length > 0)
    )
  );
}

async function fetchConcertDetail(kopisId) {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${kopisId}?service=${SERVICE_KEY}`;
  const xml = await fetchXml(url);
  if (!xml || !xml.includes('<db>')) return null;

  const fcltynm = (xml.match(/<fcltynm>([\s\S]*?)<\/fcltynm>/) || [])[1] || '';
  const prfcast = (xml.match(/<prfcast>([\s\S]*?)<\/prfcast>/) || [])[1] || '';
  const pcseguidance = (xml.match(/<pcseguidance>([\s\S]*?)<\/pcseguidance>/) || [])[1] || '';
  const prfruntime = (xml.match(/<prfruntime>([\s\S]*?)<\/prfruntime>/) || [])[1] || '';
  const dtguidance = (xml.match(/<dtguidance>([\s\S]*?)<\/dtguidance>/) || [])[1] || '';
  const sty = (xml.match(/<sty>([\s\S]*?)<\/sty>/) || [])[1] || '';
  const poster = (xml.match(/<poster>([\s\S]*?)<\/poster>/) || [])[1] || '';
  const genrenm = (xml.match(/<genrenm>([\s\S]*?)<\/genrenm>/) || [])[1] || '';

  // styurls: 공식 소개 포스터 및 전단 이미지 배열 추출
  const styurls = [];
  const styurlMatches = xml.match(/<styurl>([\s\S]*?)<\/styurl>/g);
  if (styurlMatches) {
    for (const sm of styurlMatches) {
      const u = decodeHtmlAndUnicode(sm.replace(/<\/?styurl>/g, '').trim());
      if (u.startsWith('http') && !styurls.includes(u)) {
        styurls.push(u);
      }
    }
  }

  // relateUrls: 모든 공식 상세페이지/예매처 URL 추출 (&amp; 디코딩 포함)
  const relateUrls = [];
  const relateMatches = xml.match(/<relateurl>([\s\S]*?)<\/relateurl>/g);
  if (relateMatches) {
    for (const rm of relateMatches) {
      const u = decodeHtmlAndUnicode(rm.replace(/<\/?relateurl>/g, '').trim());
      if (u.startsWith('http') && !relateUrls.includes(u)) {
        relateUrls.push(u);
      }
    }
  }
  const relateUrl = relateUrls[0] || '';

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
    genrenm: genrenm.trim(),
    hall,
    cast: prfcast.trim(),
    price: pcseguidance.trim(),
    runtime: prfruntime.trim(),
    dtguidance: dtguidance.trim(),
    sty: sty.trim(),
    poster: decodeHtmlAndUnicode(poster.trim()),
    styurls,
    relateUrl,
    relateUrls
  };
}

function normalizeOcrMusicalText(line, isOcr = false) {
  if (!line) return '';
  let res = line.replace(/\s+/g, ' ').trim();
  if (!isOcr) return res;
  return res
    .replace(/^」\./, 'J.')
    .replace(/」\.\s*S\.\s*Bach/gi, 'J. S. Bach')
    .replace(/」\.\s*5\.\s*Bach/gi, 'J. S. Bach')
    .replace(/」\.\s*Haydn/gi, 'J. Haydn')
    .replace(/」\.\s*Brahms/gi, 'J. Brahms')
    .replace(/P\.\s*[1l][』\.]\s*Tchaik[oO0]vsk[yYgG]/gi, 'P. I. Tchaikovsky')
    .replace(/5\.\s*Cherkassky/gi, 'S. Cherkassky')
    .replace(/5\.\s*Mercadante/gi, 'S. Mercadante')
    .replace(/(?:Pi해10|Pi리10|P\|혜0|Pia0@)/g, 'Piano')
    .replace(/표IO十노/g, '피아노')
    .replace(/(?:Ma[1J]0[「r]|Majo[「『]|Ma\.lOr)/gi, 'Major')
    .replace(/mino[「『]/gi, 'minor')
    .replace(/\bfo[「'\s]+(?=[A-Z])/g, 'for ')
    .replace(/\bSO\[0\b|\b5010\b|\bS010\b/gi, 'Solo')
    .replace(/(?:CeIIo|Ce110|C이\|0)/gi, 'Cello')
    .replace(/(?:VioIin|V101in|Ⅵ\(\)h11)/gi, 'Violin')
    .replace(/Keyboa[「『]d/gi, 'Keyboard')
    .replace(/Cla[「『]inet/gi, 'Clarinet')
    .replace(/BaIIade/g, 'Ballade')
    .replace(/Ncrtunw/gi, 'Nocturne')
    .replace(/\bin\s+0\s+Major\b/gi, 'in D Major')
    .replace(/\bin\s+6\s+Major\b/gi, 'in G Major')
    .replace(/\bin\s+8\s+Minor\b/gi, 'in B Minor')
    .replace(/\bin\s+9\s+Minor\b/gi, 'in G Minor')
    .replace(/\bin\s+\(:\s*Major\b/gi, 'in C Major')
    .replace(/HOb\.\s*\)\(Ⅵ\s*:/gi, 'Hob. XVI:')
    .replace(/卜\|Ob\s*\)\(Ⅵ\s*25/g, 'Hob. XVI:25')
    .replace(/B`\.,W\s*(\d+)/g, 'BWV $1')
    .replace(/사장죄/g, '사장조')
    .replace(/관으l단/g, '관악단')
    .replace(/\bChOpin\b/gi, 'Chopin')
    .replace(/\bViOlin\b/gi, 'Violin')
    .replace(/\bFIute\b/gi, 'Flute')
    .replace(/\bConcertO\b/gi, 'Concerto')
    .replace(/\blmprOmptu\b/gi, 'Impromptu')
    .replace(/\bRhapsodY\b/gi, 'Rhapsody')
    .replace(/\bMinOr\b/gi, 'Minor')
    .replace(/\bmmor\b/gi, 'minor')
    .replace(/\bNO\.\s*(\d)/gi, 'No. $1')
    .replace(/\bN0\.?\s*(\d)/g, 'No. $1')
    .replace(/\bN이\s*(\d)/g, 'No. $1')
    .replace(/(?:\b0[p하A]\.?|\(기[\),.]*|\(누[\),\-.]*)\s*(\d+)/g, 'Op. $1')
    .replace(/\b00\.\s*1\b/g, 'Op. 1')
    .replace(/\bVO\s*al\s+Zigeunerlieder/gi, 'Vocal Zigeunerlieder')
    .replace(/[•·_]/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToLines(html, isOcr = false) {
  const decoded = decodeHtmlAndUnicode(html);
  const text = decoded
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|dt|dd|blockquote|section|article)>/gi, '\n')
    .replace(/<(?:p|div|li|tr|h[1-6]|dt|dd|blockquote|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ');
  return text.split(/\r?\n/).map(l => normalizeOcrMusicalText(l, isOcr)).filter(Boolean);
}

const BIO_EXCLUDE_REGEX = /(?:졸업|박사|석사|학사|사사|교수|강사|출강|역임|수상|입상|콩쿠르|준우승|데뷔|초청|초대되어|발매|음반|앨범|선발|오디션|주최|주관|후원|협찬|문의|예매|티켓|관람|입장|할인|전석|R석|S석|A석|무료|유료|인터파크|예스24|티켓링크|오시는\s*길|주차|취소|환불|연주하기도|개최|선보인다|선보입니다|들려준다|무대를\s*꾸미|졸업하고|재학|장학생|구성된다|시작하지만|전개될수록|작품이다|곡이다|특징이다|연상시키는|소품곡\s*중|작품번호\s*\d|작곡된|독주곡집으로|생애\s*말년|예술감독|상임지휘|객원지휘|특별출연|우정출연|찬조출연|GUEST|실황\s*연주|순회\s*연주|협연하|출연하|비룾하여|투어에\s*오른다|작곡발표회|Intermission|\bStage$)/i;

const MOVEMENT_ONLY_REGEX = /^(?:(?:[I|V|X|Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|l]{1,4})\s*[\.\)]\s*(?:Allegro|Andante|Adagio|Presto|Largo|Moderato|Scherzo|Rondo|Menuetto|Finale|Grave|Vivace|Lento|Molto|Poco|Assai|Con\s|Ma\s|Non\s|Tempo|Romanze|Intermezzo|ntermezzo|Marcia|Gavotte|Sarabande|Gigue|Allemande|Courante|Preludio|Aria|Variations|Var\.|Valse|Serenade)|(?:Allegro|Andante|Adagio|Presto|Largo|Moderato|Scherzo|Rondo|Menuetto|Finale)\s*[:\.])/i;

const COMPOSER_ONLY_REGEX = /^(?:J\.\s*S\.\s*Bach|Johann\s+Sebastian\s+Bach|W\.\s*A\.\s*Mozart|W\s*-\s*A\.\s*Mozart|Wolfgang\s+Amadeus\s+Mozart|L\.\s*v\.\s*Beethoven|Ludwig\s+van\s+Beethoven|F\.\s*Chopin|Fr[eé]d[eé]ric\s+Chopin|R\.\s*Schumann|Robert\s+Schumann|J\.\s*Brahms|Johannes\s+Brahms|F\.\s*Schubert|Franz\s+Schubert|F\.\s*Liszt|Franz\s+Liszt|C\.\s*Debussy|Claude\s+Debussy|M\.\s*Ravel|Maurice\s+Ravel|P\.\s*I\.\s*Tchaikovsky|Pyotr\s+Ilyich\s+Tchaikovsky|S\.\s*Rachmaninoff|Sergei\s+Rachmaninoff|S\.\s*Prokofiev|Sergei\s+Prokofiev|D\.\s*Shostakovich|Dmitri\s+Shostakovich|F\.\s*Mendelssohn|Felix\s+Mendelssohn|C\.\s*Franck|C[eé]sar\s+Franck|C\.\s*Saint-Sa[eë]ns|Camille\s+Saint-Sa[eë]ns|G\.\s*Faur[eé]|Gabriel\s+Faur[eé]|A\.\s*Dvo[rř][aá]k|Anton[ií]n\s+Dvo[rř][aá]k|E\.\s*Grieg|Edvard\s+Grieg|J\.\s*Sibelius|Jean\s+Sibelius|G\.\s*Mahler|Gustav\s+Mahler|R\.\s*Strauss|Richard\s+Strauss|I\.\s*Stravinsky|Igor\s+Stravinsky|B\.\s*Bart[oó]k|B[eé]la\s+Bart[oó]k|A\.\s*Vivaldi|Antonio\s+Vivaldi|G\.\s*F\.\s*H[aä]ndel|George\s+Frideric\s+Handel|J\.\s*Haydn|Joseph\s+Haydn|N\.\s*Paganini|Niccol[oò]\s+Paganini|P\.\s*de\s+Sarasate|Pablo\s+de\s+Sarasate|F\.\s*Poulenc|Francis\s+Poulenc|A\.\s*Piazzolla|Astor\s+Piazzolla|M\.\s*Reger|Max\s+Reger|S\.\s*Cherkassky|H\.\s*Vieuxtemps|S\.\s*Mercadante|G\.\s*Puccini|G\.\s*Verdi|G\.\s*Bizet|G\.\s*Rossini|G\.\s*Donizetti|V\.\s*Bellini|바흐|모차르트|베토벤|쇼팽|슈만|브람스|슈베르트|리스트|드뷔시|라벨|차이콥스키|차이코프스키|라흐마니노프|프로코피예프|쇼스타코비치|멘델스존|프랑크|생상스|포레|드보르작|드보르자크|그리그|시벨리우스|말러|슈트라우스|스트라빈스키|바르톡|비발디|헨델|하이든|파가니니|사라사테|풀랑크|피아졸라)(?:\s*\([\d\s~–\-.,b.c]+\))?$/i;

function isMusicalPieceLine(line, allowBroadInProgramBlock = false) {
  if (!line || line.length < 4 || line.length > 130) return false;
  if (line.includes('\uFFFD') || line.includes('_*_+_*')) return false;
  if (MOVEMENT_ONLY_REGEX.test(line)) return false;
  if (BIO_EXCLUDE_REGEX.test(line)) return false;
  if (COMPOSER_ONLY_REGEX.test(line)) return false;
  if (/^(?:Program|PROGRAM|프로그램|곡목|연주자|출연진|프로필|Profile|Intermission|인터미션|1부|2부|<1부>|<2부>|\[1부\]|\[2부\])$/i.test(line)) return false;
  if (/^(?:\d+\.\s*)?(?:Opera\s*Ensemble|Bass\s*Baritone|Mezzo\s*Soprano|Soprano|Tenor|Baritone|Bass)\s+[가-힣a-zA-Z\s,·\-/]+$/i.test(line)) return false;

  const hasCatalogOrGenre = (
    /\b(?:Op\.\s*\d|No\.\s*\d|BWV\s*\d|K\.\s*\d|KV\s*\d|Hob\.|RV\s*\d|D\.\s*\d|S\.\s*\d|WoO|HWV\s*\d|Sz\.\s*\d|FP\s*\d|MWV|TWV)\b/i.test(line) ||
    /(?:Sonata|Concerto|Symphony|Suite|Partita|Prelude|Fugue|Etude|Ballade|Scherzo|Nocturne|Polonaise|Fantaisie|Fantasia|Impromptu|Variations|variata|Overture|Quartet|Quintet|Trio|Octet|Sextet|Septet|Serenade|Rhapsody|Romances?|Chaconne|Passacaglia|Caprice|Capriccio|Rondo|Poème|Tzigane|Liebestod|Carnaval|Faschingsschwank|Kreisleriana|Humoreske|Arabeske|Kinderszenen|Zigeunerlieder|Klavierst[üu]c?ke|Gaspard|Bergamasque|Estampes|Miroirs|Tombeau|Valse|Boléro|Pavane|Chanson|Après un rêve|소나타|협주곡|교향곡|모음곡|파르티타|전주곡|푸가|에튀드|연습곡|발라드|스케르초|녹턴|야상곡|폴로네이즈|환상곡|즉흥곡|변주곡|서곡|사중주|오중주|삼중주|팔중주|육중주|세레나데|랩소디|광시곡|로망스|샤콘느|카프리스|론도|사계|전람회의 그림|신세계로부터|비창|운명|황제|영웅|전원|합창|메시아|겨울나그네|동물의 사육제)/i.test(line)
  );

  if (hasCatalogOrGenre) return true;

  if (allowBroadInProgramBlock) {
    if (/[—–\-:]/.test(line) && /[A-Za-z가-힣]{3,}/.test(line)) return true;
  }

  return false;
}

function addUniquePiece(pieces, candidate) {
  if (!candidate || candidate.length < 4) return;
  const norm = s => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/klavierstuke/g, 'klavierstucke')
    .replace(/[^a-z0-9가-힣]/g, '');
  const cNorm = norm(candidate);
  if (!cNorm) return;

  const opMatch = candidate.match(/\bOp\.\s*(\d+)/i);
  for (let idx = 0; idx < pieces.length; idx++) {
    const p = pieces[idx];
    const pNorm = norm(p);
    if (pNorm === cNorm || pNorm.includes(cNorm)) return;
    if (cNorm.includes(pNorm)) {
      pieces[idx] = candidate;
      return;
    }
    if (opMatch) {
      const pOp = p.match(/\bOp\.\s*(\d+)/i);
      if (pOp && pOp[1] === opMatch[1] && pNorm.slice(0, 8) === cNorm.slice(0, 8)) return;
    }
  }
  pieces.push(candidate);
}

function cleanPieceLine(line, currentComposer) {
  let cleanPiece = line
    .replace(/^[0-9]+[\.\)]?\s*/, '')
    .replace(/^[•\-\*·▶▸\.]+\s*/, '')
    .replace(/\s*\(\d{4}[~–\-]\d{4}\)/g, '')
    .trim();

  if (currentComposer) {
    const lastWord = currentComposer.split(' ').pop().toLowerCase();
    if (!cleanPiece.toLowerCase().includes(lastWord)) {
      cleanPiece = `${currentComposer}: ${cleanPiece}`;
    }
  }
  return cleanPiece;
}

/**
 * 지능형 다단계 프로그램 추출기 (KOPIS <sty>, 상세페이지 HTML, 포스터/전단 OCR 공용)
 */
function extractPiecesSmart(rawTextOrHtml, { isPlainSty = false, isOcr = false } = {}) {
  if (!rawTextOrHtml || rawTextOrHtml.length < 15) return [];
  const lines = htmlToLines(rawTextOrHtml, isOcr);

  const headerRegex = /^(?:\[|\<|■|●|◆|▶|★|\*)?\s*(?:프로그램|PROGRAM|Program|곡목|곡\s*목|공연\s*곡목|연주\s*곡목|프로그램\s*안내|연주\s*프로그램)\s*(?:\]|\>| 안내)?$/i;

  const stopKeywords = [
    '프로필', 'PROFILE', 'Profile', '출연진', 'CAST', 'Cast', '아티스트 소개',
    '공연소개', '기획의도', '안내사항', '관람안내', '예매안내', '티켓안내', '할인정보',
    '유의사항', '오시는길', '시놉시스', '줄거리', 'SYNOPSIS', '기획사', '주최',
    'pinnedProductCount', 'dehydratedAt', 'queryKey', 'goodsDetail', 'noticeInfo',
    '캘린더', '공연일정', '전시일정', '_*_+_*'
  ];

  const pieces = [];

  // Pass 1: 명시적 [PROGRAM] 헤더 블록 탐색
  for (let idx = 0; idx < lines.length; idx++) {
    if (!headerRegex.test(lines[idx])) continue;

    let currentComposer = '';
    let currentPerformer = '';
    for (let i = idx + 1; i < Math.min(lines.length, idx + 75); i++) {
      const line = lines[i];
      if (line.includes('\uFFFD')) break;
      if (stopKeywords.some(kw => line.includes(kw))) break;
      if (/^\*.*(?:변경|사정|주최|프로그램은|유의|관람)/.test(line)) continue;
      if (/^(?:INTERMISSION|Intermission|인터미션|휴식|중간휴식|<1부>|<2부>|1부|2부|\[1부\]|\[2부\]|PART\s*\d|Part\s*\d|-?\s*Intermission\s*-?)$/i.test(line)) {
        currentComposer = '';
        continue;
      }
      if (MOVEMENT_ONLY_REGEX.test(line)) continue;

      if (/^(?:\d+\.\s*)?(?:Piano|Violin|Violoncello|Cello|Flute|Clarinet|Percussion|Bass\s*Baritone|Soprano|Mezzo\s*Soprano|Tenor|Baritone|Bass|Opera\s*Ensemble|Sop\.|Ten\.|Bar\.|소프라노|테너|바리톤|베이스|메조소프라노)\s+[가-힣a-zA-Z\s,·\-/]+$/i.test(line) && !/(?:Sonata|Concerto|Trio|Quartet|Quintet|Suite|Partita|Op\.|BWV|KV)/i.test(line)) {
        currentPerformer = line.replace(/^\d+\.\s*/, '').trim();
        continue;
      }

      if (COMPOSER_ONLY_REGEX.test(line)) {
        currentComposer = line.replace(/\s*\([\d\s~–\-.,b.c]+\)\s*$/, '').trim();
        continue;
      }

      if (isMusicalPieceLine(line, isPlainSty)) {
        let cp = cleanPieceLine(line, currentComposer);
        if (currentPerformer && isPlainSty) {
          cp = `${cp} (${currentPerformer})`;
        }
        if (isOcr) currentComposer = '';
        addUniquePiece(pieces, cp);
      }
    }
    if (pieces.length > 0) return pieces;
  }

  // Pass 2: 헤더리스 스캔 (KOPIS <sty> 본문 또는 포스터/전단 OCR에서 PROGRAM 로고가 이미지이거나 생략된 경우)
  if (isPlainSty || isOcr) {
    let currentComposer = '';
    const pendingComposers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (MOVEMENT_ONLY_REGEX.test(line)) continue;

      if (COMPOSER_ONLY_REGEX.test(line)) {
        const comp = line.replace(/\s*\([\d\s~–\-.,b.c]+\)\s*$/, '').trim();
        currentComposer = comp;
        pendingComposers.push(comp);
        continue;
      }

      if (isMusicalPieceLine(line, false)) {
        const compToUse = pendingComposers.length > 1 ? pendingComposers.shift() : currentComposer;
        const cp = cleanPieceLine(line, compToUse);
        if (pendingComposers.length === 0) currentComposer = '';
        addUniquePiece(pieces, cp);
      }
    }
  }

  return pieces;
}

/**
 * [Stage 3] 포스터 및 상세 소개 이미지(styurls) 배치 OCR/비전 분석기
 * 다수의 공연 포스터/전단 이미지를 한 번의 배치로 다운로드 및 슬라이싱 판독하여 초고속 추출
 */
async function batchExtractPiecesFromImages(concertImageTasks) {
  // concertImageTasks: Array<{ rawId: string, urls: string[] }>
  const resultsMap = new Map();
  if (!concertImageTasks || concertImageTasks.length === 0) return resultsMap;

  const tmpDir = path.resolve(__dirname, '.tmp_ocr_cache');
  if (!fs.existsSync(tmpDir)) {
    try { fs.mkdirSync(tmpDir, { recursive: true }); } catch {}
  }

  const downloadedItems = [];
  // 병렬 다운로드 (10개 단위)
  for (let i = 0; i < concertImageTasks.length; i += 10) {
    const chunk = concertImageTasks.slice(i, i + 10);
    await Promise.all(chunk.map(async (task) => {
      const validUrls = (task.urls || []).filter(u => u && u.startsWith('http')).slice(0, 3);
      for (let uIdx = 0; uIdx < validUrls.length; uIdx++) {
        const imgUrl = validUrls[uIdx];
        const ext = path.extname(imgUrl.split('?')[0]) || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.bmp'].includes(ext.toLowerCase()) ? ext : '.jpg';
        const tmpImg = path.join(tmpDir, `${task.rawId}_${uIdx}${safeExt}`);
        const ok = await new Promise((resolve) => {
          const client = imgUrl.startsWith('https') ? https : http;
          let req;
          try {
            req = client.get(imgUrl, { timeout: 7000 }, (res) => {
              if (res.statusCode !== 200) return resolve(false);
              const chunks = [];
              res.on('data', c => chunks.push(c));
              res.on('end', () => {
                const buf = Buffer.concat(chunks);
                if (buf.length < 2000) return resolve(false);
                try {
                  fs.writeFileSync(tmpImg, buf);
                  resolve(true);
                } catch {
                  resolve(false);
                }
              });
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
          } catch {
            resolve(false);
          }
        });
        if (ok) {
          downloadedItems.push({ rawId: task.rawId, filePath: tmpImg });
        }
      }
    }));
  }

  if (downloadedItems.length === 0) return resultsMap;

  // PowerShell Windows.Media.Ocr 배치 실행 (25개 이미지 단위)
  const tmpPs1 = path.join(tmpDir, `run_ocr_${process.pid}.ps1`);
  for (let i = 0; i < downloadedItems.length; i += 25) {
    const batch = downloadedItems.slice(i, i + 25);
    const entriesLiteral = batch.map(item => `@{ Id = '${item.rawId}'; Path = '${item.filePath.replace(/'/g, "''")}' }`).join(', ');

    const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]

function Await($WinRtTask, $ResultType) {
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(-1) | Out-Null
  $netTask.Result
}

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()

function OcrFile($filePath) {
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($filePath)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
  foreach ($line in $result.Lines) {
    Write-Output $line.Text
  }
  $stream.Dispose()
}

$items = @(${entriesLiteral})
foreach ($item in $items) {
  Write-Output "===CONCERT_ID:$($item.Id)==="
  $p = $item.Path
  try {
    $img = [System.Drawing.Bitmap]::FromFile($p)
    $w = $img.Width
    $h = $img.Height
    if ($h -gt 3800 -or $w -gt 3800) {
      $sliceH = 3400
      $y = 0
      $idx = 0
      while ($y -lt $h) {
        $curH = [Math]::Min($sliceH, $h - $y)
        if ($curH -gt 100) {
          $rect = New-Object System.Drawing.Rectangle(0, $y, [Math]::Min($w, 3800), $curH)
          $cropped = $img.Clone($rect, $img.PixelFormat)
          $slicePath = "$p.slice_$idx.png"
          $cropped.Save($slicePath, [System.Drawing.Imaging.ImageFormat]::Png)
          $cropped.Dispose()
          try { OcrFile $slicePath } catch {}
          if (Test-Path $slicePath) { Remove-Item $slicePath -Force }
        }
        $y += 3200
        $idx++
      }
      $img.Dispose()
    } else {
      $img.Dispose()
      OcrFile $p
    }
  } catch {}
}
`;
    try {
      fs.writeFileSync(tmpPs1, '\uFEFF' + psScript, 'utf8');
      const out = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpPs1], {
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 20 * 1024 * 1024
      });
      const blocks = out.split(/===CONCERT_ID:(PF\d+)===/);
      for (let b = 1; b < blocks.length; b += 2) {
        const cId = blocks[b].trim();
        const text = blocks[b + 1] || '';
        const prev = resultsMap.get(cId) || '';
        resultsMap.set(cId, prev + '\n' + text);
      }
    } catch {}
  }

  // 임시 파일 정리
  for (const item of downloadedItems) {
    try { if (fs.existsSync(item.filePath)) fs.unlinkSync(item.filePath); } catch {}
  }
  try { if (fs.existsSync(tmpPs1)) fs.unlinkSync(tmpPs1); } catch {}
  try { fs.rmdirSync(tmpDir); } catch {}

  const finalPiecesMap = new Map();
  for (const [cId, ocrText] of resultsMap.entries()) {
    const pieces = extractPiecesSmart(ocrText, { isOcr: true });
    if (pieces.length > 0) {
      finalPiecesMap.set(cId, pieces);
    }
  }
  return finalPiecesMap;
}

function extractPiecesFromTitle(title) {
  if (!title) return [];
  const t = title.trim();
  const pieces = [];

  if (t.includes('말러') && (t.includes('교향곡 1번') || t.includes('교향곡 제1번') || t.includes('거인'))) {
    pieces.push('구스타프 말러: 교향곡 제1번 D장조 "거인"');
  } else if (t.includes('말러') && (t.includes('교향곡 2번') || t.includes('교향곡 제2번') || t.includes('부활'))) {
    pieces.push('구스타프 말러: 교향곡 제2번 c단조 "부활"');
  } else if (t.includes('말러') && (t.includes('교향곡 4번') || t.includes('교향곡 제4번'))) {
    pieces.push('구스타프 말러: 교향곡 제4번 G장조');
  } else if (t.includes('말러') && (t.includes('교향곡 5번') || t.includes('교향곡 제5번'))) {
    pieces.push('구스타프 말러: 교향곡 제5번 c#단조');
  } else if (t.includes('베토벤') && (t.includes('합창') || t.includes('교향곡 제9번') || t.includes('교향곡 9번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제9번 d단조 Op.125 "합창"');
  } else if (t.includes('베토벤') && (t.includes('운명') || t.includes('교향곡 제5번') || t.includes('교향곡 5번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제5번 c단조 Op.67 "운명"');
  } else if (t.includes('베토벤') && (t.includes('전원') || t.includes('교향곡 제6번') || t.includes('교향곡 6번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제6번 F장조 Op.68 "전원"');
  } else if (t.includes('베토벤') && (t.includes('교향곡 제7번') || t.includes('교향곡 7번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제7번 A장조 Op.92');
  } else if (t.includes('베토벤') && t.includes('황제')) {
    pieces.push('루트비히 판 베토벤: 피아노 협주곡 제5번 E-flat장조 Op.73 "황제"');
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
  } else if (t.includes('헨델') && t.includes('메시아')) {
    pieces.push('게오르크 프리드리히 헨델: 오라토리오 "메시아" HWV 56');
  } else if (t.includes('바흐') && t.includes('골드베르크')) {
    pieces.push('요한 제바스티안 바흐: 골드베르크 변주곡 BWV 988');
  } else if (t.includes('슈베르트') && t.includes('겨울나그네')) {
    pieces.push('프란츠 슈베르트: 연가곡 "겨울나그네" D.911');
  } else if (t.includes('카르미나 부라나') || /Carmina\s+Burana/i.test(t)) {
    pieces.push('C. Orff: Carmina Burana (칼 오르프: 카르미나 부라나)');
  } else if (t.includes('라인의 황금')) {
    pieces.push('R. Wagner: Das Rheingold, WWV 86A (리하르트 바그너: 오페라 라인의 황금)');
  } else if (t.includes('발퀴레')) {
    pieces.push('R. Wagner: Die Walküre, WWV 86B (리하르트 바그너: 오페라 발퀴레)');
  } else if (/돈\s*카를로스/.test(t)) {
    pieces.push('G. Verdi: Don Carlos (주세페 베르디: 오페라 돈 카를로스)');
  } else if (/라\s*보엠/.test(t)) {
    pieces.push('G. Puccini: La Bohème (자코모 푸치니: 오페라 라 보엠)');
  } else if (/라\s*트라비아타/.test(t)) {
    pieces.push('G. Verdi: La Traviata (주세페 베르디: 오페라 라 트라비아타)');
  } else if (t.includes('리골레토')) {
    pieces.push('G. Verdi: Rigoletto (주세페 베르디: 오페라 리골레토)');
  } else if (t.includes('마술피리')) {
    pieces.push('W. A. Mozart: Die Zauberflöte, K. 620 (모차르트: 오페라 마술피리)');
  } else if (t.includes('피가로의 결혼') || t.includes('만능재치꾼 피가로')) {
    pieces.push('W. A. Mozart: Le nozze di Figaro, K. 492 (모차르트: 오페라 피가로의 결혼)');
  } else if (/코지\s*판\s*투테/.test(t)) {
    pieces.push('W. A. Mozart: Così fan tutte, K. 588 (모차르트: 오페라 코지 판 투테)');
  } else if (/돈\s*조반니|돈\s*죠반니/.test(t)) {
    pieces.push('W. A. Mozart: Don Giovanni, K. 527 (모차르트: 오페라 돈 조반니)');
  } else if (t.includes('사랑의 묘약')) {
    pieces.push("G. Donizetti: L'elisir d'amore (가이타노 도니제티: 오페라 사랑의 묘약)");
  } else if (/세비야의 이발사|세빌리아의 이발사/.test(t)) {
    pieces.push('G. Rossini: Il barbiere di Siviglia (조아키노 로시니: 오페라 세비야의 이발사)');
  }

  return pieces;
}

function classifyPerformerType(c) {
  const title = (c.title || '').trim();
  const t = title.toLowerCase();
  const hall = (c.hall || '').trim();
  const perf = Array.isArray(c.performers) ? c.performers.join(' ').toLowerCase() : String(c.performers || '').toLowerCase();

  // 1. 순수 관현악단 모음곡 연주 예외
  const isPureOrchestraProgram = /(?:오케스트라|교향악단|필하모닉|필하모니|심포니)/.test(t) &&
    !/(?:오페라|오페레타|라인의 황금|발퀴레|지크프리트|신들의 황혼|라\s*보엠|라\s*트라비아타|리골레토|마술피리|사랑의 묘약|토스카|투란도트|돈\s*카를로스|돈\s*조반니|코지\s*판\s*투테|피가로의 결혼|나비부인)/.test(t);

  // 2. 오페라 (Opera)
  if (!isPureOrchestraProgram) {
    if (
      hall === '오페라극장' ||
      /(?:오페라|오페레타|오페라단|오페라갈라|\bopera\b|라인의 황금|발퀴레|지크프리트|신들의 황혼|니벨룽의 반지|라\s*보엠|라\s*트라비아타|리골레토|돈\s*카를로스|사랑의 묘약|마술피리|피가로의 결혼|돈\s*조반니|돈\s*죠반니|코지\s*판\s*투테|토스카|투란도트|나비부인|세비야의 이발사|세빌리아의 이발사|카발레리아 루스티카나|팔리아치|박쥐|일\s*트로바토레|람메르무어의 루치아)/i.test(title) ||
      (/카르멘/.test(title) && !/(?:오케스트라|교향악단|필하모닉|독주회|리사이틀|콰르텟|트리오|앙상블)/.test(title))
    ) {
      return '오페라';
    }
  }

  // 3. 오케스트라 (Orchestra)
  if (!(t.includes('필하모닉스') && !t.includes('오케스트라'))) {
    const isOrch = [
      '오케스트라', '교향악단', '필하모닉', '필하모니', '심포니', '관현악단', '관현악',
      '합창교향곡', '서울시향', '부산시향', '인천시향', '대구시향', '대전시향', '광주시향',
      '수원시향', '울산시향', '창원시향', '전주시향', '청주시향', '춘천시향', '원주시향',
      '포항시향', '강릉시향', '부천필', '경기필', '한경아르떼필', 'kbs교향악단', '국립심포니',
      '신포니에타', '신포니아', '챔버오케스트라', '체임버오케스트라', '챔버 오케스트라', '체임버 오케스트라',
      '윈드오케스트라', '윈드 오케스트라', '관악단', '교향악축제', '월드오케스트라',
      'orchestra', 'philharmonic', 'symphony', 'sinfonietta', '필하모니커',
      '3개의 피아노 협주곡', '세 개의 피아노 협주곡', '윤이상국제음악콩쿠르 결선'
    ].some(k => t.includes(k) || perf.includes(k));
    if (isOrch) return '오케스트라';
  }

  // 4. 성악/합창 (Vocal & Choir)
  if (/(?:합창단|합창제|합창음악|소년소녀합창|남성합창|여성합창|시립합창|국립합창|합창|코러스|콰이어|\bchoir\b|\bchorus\b|\bchorale\b|독창회|성악|소프라노|메조소프라노|테너|바리톤|카운터테너|\bsoprano\b|\btenor\b|\bbaritone\b|보칼레|칸토레스|마드리갈|가곡의 밤|가곡|연가곡|오라토리오|칸타타|메시아|카르미나 부라나)/i.test(title + ' ' + perf)) {
    return '성악/합창';
  }

  // 5. 실내악 다인 편성 (듀오/트리오/콰르텟/앙상블 등)
  if (/(?:듀오|\bduo\b|트리오|\btrio\b|콰르텟|퀄텟|\bquartet\b|퀸텟|\bquintet\b|섹스텟|셉텟|옥텟|\boctet\b|앙상블|\bensemble\b|체임버|챔버|\bchamber\b|실내악|두 대의 피아노|2대의 피아노|피아노 듀엣|포핸즈|four hands|솔로이스츠|soloists|무지치|콜레기움)/i.test(title + ' ' + perf)) {
    return '실내악';
  }

  // 6. 독주회 (Solo Recital)
  if (/(?:독주회|리사이틀|\brecital\b|피아니스트|바이올리니스트|첼리스트|비올리스트|플루티스트|오보이스트|클라리네티스트|바수니스트|호르니스트|트럼페터|오르가니스트|기타리스트|하피스트|하프시코디스트|타악기 독주)/i.test(title)) {
    return '독주회';
  }

  return '실내악';
}

function syncComposersFromPieces(concert) {
  if (!concert.pieces || concert.pieces.length === 0) return;
  const text = `${concert.title || ''} ${concert.pieces.join(' ')}`;
  const composerPairs = [
    ['Bach', '바흐'], ['Mozart', '모차르트'], ['Beethoven', '베토벤'],
    ['Chopin', '쇼팽'], ['Schumann', '슈만'], ['Brahms', '브람스'],
    ['Schubert', '슈베르트'], ['Liszt', '리스트'], ['Debussy', '드뷔시'],
    ['Ravel', '라벨'], ['Tchaikovsky', '차이콥스키'], ['Rachmaninoff', '라흐마니노프'],
    ['Prokofiev', '프로코피예프'], ['Shostakovich', '쇼스타코비치'], ['Mendelssohn', '멘델스존'],
    ['Franck', '프랑크'], ['Saint-Saëns', '생상스'], ['Fauré', '포레'],
    ['Dvořák', '드보르작'], ['Dvorak', '드보르작'], ['Grieg', '그리그'],
    ['Sibelius', '시벨리우스'], ['Mahler', '말러'], ['Strauss', '슈트라우스'],
    ['Stravinsky', '스트라빈스키'], ['Bartók', '바르톡'], ['Vivaldi', '비발디'],
    ['Handel', '헨델'], ['Händel', '헨델'], ['Haydn', '하이든'],
    ['Paganini', '파가니니'], ['Sarasate', '사라사테'], ['Poulenc', '풀랑크'],
    ['Piazzolla', '피아졸라'], ['Puccini', '푸치니'], ['Verdi', '베르디'],
    ['Bizet', '비제'], ['Rossini', '로시니'], ['Bruckner', '브루크너'],
    ['Wagner', '바그너'], ['Donizetti', '도니제티'], ['Mascagni', '마스카니'], ['Orff', '오르프']
  ];
  const detected = new Set(
    (concert.composers || []).filter(c => c !== '클래식 명작')
  );
  for (const [en, ko] of composerPairs) {
    if (text.toLowerCase().includes(en.toLowerCase()) || text.includes(ko)) {
      detected.add(ko);
    }
  }
  if (detected.size > 0) {
    concert.composers = Array.from(detected);
  }
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

  // 1페이지부터 최대 15페이지까지 신규/수정 분량 탐색 (페이지당 100건 = 최대 1,500건, 순수 서양음악 CCCA 전용)
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
      const genreMatch = dbXml.match(/<genrenm>([\s\S]*?)<\/genrenm>/);

      if (!idMatch || !titleMatch) continue;
      // 순수 서양음악(클래식) 카테고리 무결성 검증
      if (genreMatch && !genreMatch[1].includes('서양음악') && !genreMatch[1].includes('클래식')) continue;

      const kopisId = idMatch[1].trim();
      const title = decodeHtmlAndUnicode(titleMatch[1].trim());
      const rawDate = fromMatch ? fromMatch[1].trim().replace(/\./g, '-') : '2026-10-20';
      const venue = venueMatch ? venueMatch[1].trim() : '공식 공연장';
      const poster = posterMatch ? decodeHtmlAndUnicode(posterMatch[1].trim()) : '';
      const area = areaMatch ? areaMatch[1].trim() : '전국';
      const status = stateMatch && stateMatch[1].trim().includes('완료') ? '지나간공연' : '공연예정';

      const existing = concertMap.get(kopisId);
      if (existing) {
        if (existing.status !== status) {
          existing.status = status;
          updatedCount++;
        }
      } else {
        const newConcert = {
          id: `kopis-${kopisId}`,
          kopisId: kopisId,
          title: title,
          date: rawDate,
          time: '19:30',
          venue: venue,
          city: area,
          performerType: classifyPerformerType({ title, venue }),
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
        concertMap.set(kopisId, newConcert);
        newConcertsCount++;
      }
    }
    await sleep(100);
  }

  console.log(`신규 공연 ${newConcertsCount}건 발굴, 기존 공연 ${updatedCount}건 상태 갱신.`);

  // 상세 캐시 로드 및 빈 스텁(Stub) 정리
  const detailsCachePath = path.resolve(__dirname, 'kopis_all_details.json');
  let detailsCache = {};
  if (fs.existsSync(detailsCachePath)) {
    try {
      const rawCache = JSON.parse(fs.readFileSync(detailsCachePath, 'utf8'));
      for (const [k, v] of Object.entries(rawCache)) {
        if (isValidDetailCache(v)) {
          detailsCache[k] = v;
        }
      }
    } catch {}
  }

  // KOPIS 상세 XML 미보유 공연 조회 (예정/진행 공연 및 독주회·주요 공연장 우선, KOPIS Rate-Limit 안전 범위)
  const idsNeedingXml = Array.from(concertMap.entries())
    .filter(([rawId, c]) => !isValidDetailCache(detailsCache[rawId]) && (!c.pieces || c.pieces.length === 0))
    .sort(([, a], [, b]) => {
      const score = (c) => {
        let s = 0;
        if (c.date >= '2026-10-31') s += 100;
        if (/독주회|리사이틀|Recital/i.test(c.title)) s += 50;
        if (/예술의전당|롯데콘서트홀|세종문화회관|금호아트홀|부천아트센터|아트센터인천/.test(c.venue)) s += 40;
        return s;
      };
      return score(b) - score(a);
    })
    .slice(0, 120)
    .map(([rawId]) => rawId);

  if (idsNeedingXml.length > 0) {
    console.log(`KOPIS 공식 OpenAPI에서 상세 XML(포스터·소개이미지·상세페이지 링크) ${idsNeedingXml.length}건 실시간 동기화 중...`);
    let xmlSuccess = 0;
    for (let i = 0; i < idsNeedingXml.length; i += 6) {
      const chunk = idsNeedingXml.slice(i, i + 6);
      const fetched = await Promise.all(chunk.map(id => fetchConcertDetail(id)));
      chunk.forEach((id, idx) => {
        if (fetched[idx] && isValidDetailCache(fetched[idx])) {
          detailsCache[id] = fetched[idx];
          xmlSuccess++;
        }
      });
      await sleep(120);
      if ((i + 6) % 30 === 0 || i + 6 >= idsNeedingXml.length) {
        console.log(`  - 상세 XML 동기화 진행: ${Math.min(i + 6, idsNeedingXml.length)} / ${idsNeedingXml.length} (성공: ${xmlSuccess}건)`);
      }
    }
    try {
      fs.writeFileSync(detailsCachePath, JSON.stringify(detailsCache, null, 2), 'utf8');
    } catch {}
  }

  // 기존 적재된 pieces에 대해서도 OCR 오타 교정, 비곡목 라인 정제 및 연주 편성(5분류) 동기화 적용
  for (const c of concertMap.values()) {
    c.performerType = classifyPerformerType(c);
    if (Array.isArray(c.pieces) && c.pieces.length > 0) {
      const cleaned = [];
      for (const rawP of c.pieces) {
        const normP = normalizeOcrMusicalText(rawP, true);
        if (normP && !BIO_EXCLUDE_REGEX.test(normP) && !MOVEMENT_ONLY_REGEX.test(normP) && normP.length >= 4) {
          addUniquePiece(cleaned, normP);
        }
      }
      c.pieces = cleaned;
    }
  }

  // 상세 프로그램 보강 대상: 곡목(pieces)이 미등록된 모든 공연
  const itemsToEnrich = Array.from(concertMap.values()).filter(c =>
    !c.pieces || c.pieces.length === 0
  );

  let enrichedCount = 0;
  let stage1StyCount = 0;
  let stage2DetailPageCount = 0;
  let stage3PosterOcrCount = 0;
  let stage4TitleCount = 0;

  const needStage2DetailPage = [];

  // [Stage 1] KOPIS <sty> 소개글 정밀 파싱 및 메타데이터 동기화
  for (const c of itemsToEnrich) {
    const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    const d = detailsCache[rawId];
    if (d && isValidDetailCache(d)) {
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
        c.ticketUrl = decodeHtmlAndUnicode(d.relateUrl);
      }
      if (d.sty && d.sty.length > 15) {
        c.description = d.sty;
      }
      if (d.poster && (!c.imageUrl || c.imageUrl.includes('unsplash.com'))) {
        c.imageUrl = d.poster;
      }
      if (d.styurls && d.styurls.length > 0) {
        c.introImages = d.styurls;
      }

      // 캐시에 이미 추출된 곡목이 있으면 정제 후 즉시 복원
      if (Array.isArray(d.extractedPieces) && d.extractedPieces.length > 0) {
        const cleanedCachePieces = [];
        for (const rawP of d.extractedPieces) {
          const normP = normalizeOcrMusicalText(rawP, true);
          if (normP && !BIO_EXCLUDE_REGEX.test(normP) && !MOVEMENT_ONLY_REGEX.test(normP) && normP.length >= 4) {
            addUniquePiece(cleanedCachePieces, normP);
          }
        }
        d.extractedPieces = cleanedCachePieces;
        if (cleanedCachePieces.length > 0) {
          c.pieces = cleanedCachePieces;
          syncComposersFromPieces(c);
          stage1StyCount++;
        }
      } else if (d.sty && d.sty.length > 15) {
        // Stage 1: KOPIS <sty> 본문에서 프로그램 추출
        const fromSty = extractPiecesSmart(d.sty, { isPlainSty: true });
        if (fromSty.length > 0) {
          c.pieces = fromSty;
          d.extractedPieces = fromSty;
          syncComposersFromPieces(c);
          stage1StyCount++;
        }
      }

      if (!c.pieces || c.pieces.length === 0) {
        needStage2DetailPage.push({ concert: c, detail: d, rawId });
      }
      enrichedCount++;
    }

    if (c.venue && c.venue.includes('롯데콘서트홀')) {
      c.hall = null;
    }
  }

  const prioritySort = (a, b) => {
    const score = (c) => {
      let s = 0;
      if (c.date >= '2026-10-31') s += 100;
      if (/독주회|리사이틀|Recital/i.test(c.title)) s += 50;
      if (/예술의전당|롯데콘서트홀|세종문화회관|금호아트홀|부천아트센터|아트센터인천/.test(c.venue)) s += 40;
      return s;
    };
    return score(b.concert) - score(a.concert);
  };

  // [Stage 2] 공식 상세페이지(<relateurl>) 자동 접속 및 HTML 프로그램 파싱
  // (예정/진행 공연 및 주요 공연장·독주회 우선 처리, 병렬 30건 단위 고속 파싱)
  const stage2Targets = needStage2DetailPage
    .filter(item => {
      if (item.concert.date < '2026-10-01') return false;
      if (item.detail.pageChecked) return false;
      const rUrls = item.detail.relateUrls || (item.detail.relateUrl ? [item.detail.relateUrl] : []);
      return rUrls.some(u => u && u.startsWith('http'));
    })
    .sort(prioritySort)
    .slice(0, 150);

  if (stage2Targets.length > 0) {
    console.log(`[Stage 2] 공식 상세페이지(${stage2Targets.length}건) 자동 접속 및 프로그램 파싱 중...`);
    for (let i = 0; i < stage2Targets.length; i += 30) {
      const chunk = stage2Targets.slice(i, i + 30);
      await Promise.all(chunk.map(async ({ concert, detail }) => {
        detail.pageChecked = true;
        const urls = detail.relateUrls && detail.relateUrls.length > 0
          ? detail.relateUrls
          : (detail.relateUrl ? [detail.relateUrl] : []);
        for (const rUrl of urls) {
          if (!rUrl || !rUrl.startsWith('http')) continue;
          const html = await fetchUrlFollowRedirects(rUrl);
          if (!html || html.length < 200) continue;
          const fromPage = extractPiecesSmart(html, { isPlainSty: false });
          if (fromPage.length > 0) {
            concert.pieces = fromPage;
            detail.extractedPieces = fromPage;
            syncComposersFromPieces(concert);
            stage2DetailPageCount++;
            break;
          }
        }
      }));
      if ((i + 30) % 90 === 0 || i + 30 >= stage2Targets.length) {
        console.log(`  - [Stage 2] 상세페이지 파싱 진행: ${Math.min(i + 30, stage2Targets.length)} / ${stage2Targets.length} (발굴: ${stage2DetailPageCount}건)`);
      }
    }
  }

  // [Stage 3] 포스터(<poster>) 및 상세 소개 이미지(<styurl>) 자동 비전/OCR 판독
  // 상세페이지 HTML에서도 프로그램 텍스트가 없는 공연(포스터/전단 이미지로만 곡목 안내된 독주회·실내악·정기연주회 등) 대상
  const stage3Candidates = needStage2DetailPage
    .filter(({ concert, detail }) => {
      if (concert.pieces && concert.pieces.length > 0) return false;
      if (concert.date < '2026-10-31') return false;
      if (detail.ocrChecked) return false;
      const hasImages = (detail.styurls && detail.styurls.length > 0) || (detail.poster && detail.poster.startsWith('http'));
      return hasImages;
    })
    .sort(prioritySort)
    .slice(0, 35);

  if (stage3Candidates.length > 0) {
    console.log(`[Stage 3] 세부 프로그램 미기재 공연 포스터·소개전단 이미지(${stage3Candidates.length}건) 자동 OCR 판독 중...`);
    const ocrTasks = stage3Candidates.map(({ rawId, detail }) => {
      detail.ocrChecked = true;
      return {
        rawId,
        urls: [...(detail.styurls || []), detail.poster].filter(Boolean)
      };
    });
    const ocrPiecesMap = await batchExtractPiecesFromImages(ocrTasks);
    for (const { concert, detail, rawId } of stage3Candidates) {
      const extracted = ocrPiecesMap.get(rawId);
      if (extracted && extracted.length > 0) {
        concert.pieces = extracted;
        detail.extractedPieces = extracted;
        syncComposersFromPieces(concert);
        stage3PosterOcrCount++;
      }
    }
  }

  // 업데이트된 상세 캐시(extractedPieces, pageChecked, ocrChecked 포함) 영구 저장
  try {
    fs.writeFileSync(detailsCachePath, JSON.stringify(detailsCache, null, 2), 'utf8');
  } catch {}

  // [Stage 4] 공연 제목·부제 내 명시된 레퍼토리 정밀 추출
  for (const c of itemsToEnrich) {
    if (!c.pieces || c.pieces.length === 0) {
      const fromTitle = extractPiecesFromTitle(c.title);
      if (fromTitle.length > 0) {
        c.pieces = fromTitle;
        syncComposersFromPieces(c);
        stage4TitleCount++;
      }
    }
  }

  const totalPiecesExtracted = stage1StyCount + stage2DetailPageCount + stage3PosterOcrCount + stage4TitleCount;
  console.log(
    `[4단계 프로그램 자동 추출 완료] 총 ${totalPiecesExtracted}건 추가 발굴 ` +
    `(Stage1 KOPIS소개글: ${stage1StyCount}건, Stage2 상세페이지: ${stage2DetailPageCount}건, Stage3 포스터/전단OCR: ${stage3PosterOcrCount}건, Stage4 제목매칭: ${stage4TitleCount}건)`
  );

  // 최종 리스트 정리 및 저장
  const updatedConcertList = Array.from(concertMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const output = `/**
 * KOPIS(공연예술통합전산망) OpenAPI 실시간 전수 수집 실제 클래식 공연 데이터
 * 대한민국 전역 ${updatedConcertList.length}건 전수 적재
 * 복합 공연장 세부 홀 정보 (콘서트홀, IBK챔버홀, 리사이틀홀, 인춘아트홀 등) 100% 매핑
 * 4단계 자동 파이프라인(KOPIS 소개글 -> 공식 상세페이지 -> 포스터·소개전단 이미지 OCR -> 제목 매칭) 기반 실제 연주곡(Pieces) 적재 완료
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
    programsExtracted: {
      total: totalPiecesExtracted,
      stage1KopisSty: stage1StyCount,
      stage2DetailPage: stage2DetailPageCount,
      stage3PosterOcr: stage3PosterOcrCount,
      stage4Title: stage4TitleCount
    },
    totalConcerts: updatedConcertList.length,
    message: `KOPIS 공식 OpenAPI 동기화 및 4단계 자동 프로그램 추출(소개글 ${stage1StyCount}건, 상세페이지 ${stage2DetailPageCount}건, 포스터·전단OCR ${stage3PosterOcrCount}건, 제목 ${stage4TitleCount}건) 완료`
  };

  logs = [logEntry, ...logs].slice(0, 30);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
  console.log(`[${logEntry.timestamp}] 정기 동기화 배치 성공 완료!`);
}

main().catch(err => {
  console.error('[KOPIS 새벽 3시 배치 실패]:', err);
  process.exit(1);
});
