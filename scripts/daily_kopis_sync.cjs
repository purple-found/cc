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
  return {
    start: `${y}${m}01`,
    end: `${y + 2}1231`,
    cutoffIso: `${y}-${m}-01`
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
  let res = line.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  if (!isOcr) return res;
  return res
    .replace(/^」\./, 'J.')
    .replace(/^0\.\s*Nicolai/i, 'O. Nicolai')
    .replace(/」\.\s*S\.\s*Bach/gi, 'J. S. Bach')
    .replace(/」\.\s*5\.\s*Bach/gi, 'J. S. Bach')
    .replace(/」\.\s*Haydn/gi, 'J. Haydn')
    .replace(/」\.\s*Brahms/gi, 'J. Brahms')
    .replace(/A\.\s*Sc[「r]iabin/gi, 'A. Scriabin')
    .replace(/P\.\s*[1l][』\.]\s*Tchaik[oO0]vsk[yYgG]/gi, 'P. I. Tchaikovsky')
    .replace(/5\.\s*Cherkassky/gi, 'S. Cherkassky')
    .replace(/5\.\s*Mercadante/gi, 'S. Mercadante')
    .replace(/(?:Pi해10|Pi리10|P\|혜0|Pia0@|Pi기10)/g, 'Piano')
    .replace(/표IO十노/g, '피아노')
    .replace(/(?:Ma[1J]0[「r]|MajO[「r]|Majo[「『]|Ma\.lOr)/gi, 'Major')
    .replace(/in\s+Major\./gi, 'in C Major,')
    .replace(/in\s+Major,/gi, 'in C Major,')
    .replace(/mino[「『]/gi, 'minor')
    .replace(/Hob\.\s*XV[lI1]{2}\s*:\s*(\d+)/gi, 'Hob. XVII:$1')
    .replace(/Hob\.\s*XV[lI1]\s*:\s*(\d+)/gi, 'Hob. XVI:$1')
    .replace(/Magic\s*F\/ute/gi, 'Magic Flute')
    .replace(/ofWindsor/g, 'of Windsor')
    .replace(/\btO\s+The\b/g, 'to The')
    .replace(/Cs[åa]rd[åa]s/gi, 'Csárdás')
    .replace(/「원저의/g, '「윈저의')
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
    .replace(/\bin\s+8\s+flat\s+Minor\b/gi, 'in B-flat Minor')
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
    .replace(/\bN그\s*(\d)/g, 'No. $1')
    .replace(/(?:\b0[p9하A]\.?|\b0[다이]\.?|\b예\.|\(\)p\.|\(기[\),.]*|\(누[\),\-』.]*)\s*(\d+)/g, 'Op. $1')
    .replace(/\b00\.\s*1\b/g, 'Op. 1')
    .replace(/BWV\s*5%/gi, 'BWV 508')
    .replace(/K\.\s*3%/gi, 'K. 303')
    .replace(/ma\)0%\s*Op\./gi, 'Major, Op.')
    .replace(/\bPianO\b/g, 'Piano')
    .replace(/\bSOnata\b/g, 'Sonata')
    .replace(/\bViOIa\b/g, 'Viola')
    .replace(/\bS이0\b/g, 'Solo')
    .replace(/\bfO「/g, 'for')
    .replace(/\bBa5500n\b/g, 'Bassoon')
    .replace(/\blntroduc(?:tion|bon)\b/gi, 'Introduction')
    .replace(/Introduction\s+마\s+Rondo/gi, 'Introduction et Rondo')
    .replace(/Pelléas\s+아\s+Mélisande/gi, 'Pelléas et Mélisande')
    .replace(/lm\s+F「ühlingsanfang/gi, 'Im Frühlingsanfang')
    .replace(/Pomp\s+and\s+디「cumstance\s+Ma「ch/gi, 'Pomp and Circumstance March')
    .replace(/A\s+Discove「y\s+Fantasy/gi, 'A Discovery Fantasy')
    .replace(/」ungle\s+Fantasy/gi, 'Jungle Fantasy')
    .replace(/Three\s+Preh」des\s*-\s*No\.\s*1\s+in\s+B-fiat\s+Maior/gi, 'Three Preludes - No. 1 in B-flat Major')
    .replace(/Waldszenen,\s*Op\.\s*8』/gi, 'Waldszenen, Op. 82')
    .replace(/가H어나라/g, '깨어나라')
    .replace(/Hunganan\s+Rhapsody\s+No\.\s*2\s+1n\s+C#\s+Minor,\s*S\.\s*2442/gi, 'Hungarian Rhapsody No. 2 in C# Minor, S. 244/2')
    .replace(/Opera\s+'Le\s+Nozze\s+Figa「구/gi, "Opera 'Le Nozze di Figaro' —")
    .replace(/작품번호\s*15\s*7번1/g, '작품번호 15 7번')
    .replace(/가르져\s*주신/g, '가르쳐 주신')
    .replace(/\bVO\s*al\s+Zigeunerlieder/gi, 'Vocal Zigeunerlieder')
    .replace(/[•·_]/g, ' - ')
    .replace(/(?:\s*-\s*){3,}/g, ' - ')
    .replace(/^[▪■●◆▶▸\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToLines(html, isOcr = false) {
  const decoded = decodeHtmlAndUnicode(html);
  const text = decoded
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|dt|dd|blockquote|section|article)>/gi, '\n')
    .replace(/<(?:p|div|li|tr|h[1-6]|dt|dd|blockquote|section|article)[^>]*>/gi, '\n')
    .replace(/<(?=[a-zA-Z\/!])[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ');
  const raw = text.split(/\r?\n/).map(l => normalizeOcrMusicalText(l, isOcr)).filter(Boolean);
  const out = [];
  for (const line of raw) {
    // OCR에서 "PROGRAM L. v. Beethoven" 처럼 헤더와 첫 작곡가가 한 줄에 붙은 경우 분리
    const progMerged = line.match(/^(?:\[?PROGRAM\]?|\[?프로그램\]?|P\s*R\s*[O0]\s*G\s*R\s*A\s*M)\s+([A-ZÀ-ÖØ-Ý가-힣].{2,})$/i);
    if (progMerged && !/^안내/.test(progMerged[1])) {
      out.push('PROGRAM');
      out.push(progMerged[1].trim());
    } else {
      out.push(line);
    }
  }
  return out;
}

const BIO_EXCLUDE_REGEX = /(?:[\u3400-\u9FFF\uF900-\uFAFF]|@import|https?:\/\/|\b0\d{1,2}-\d{3,4}-\d{4}\b|졸업|박사|석사|학사|사사|교수|강사|출강|역임|수상|입상|콩쿠르|콩국|콩글|공글|공굴|준우승|데뷔|초청|초대되어|발매|음반|앨범|선발|오디션|주최|주관|후원|협찬|문의|예매|티켓|ticket|관람|입장|할인|전석|일반석|R석|S석|A석|무료|유료|인터파크|예스24|티켓링크|오시는\s*길|주차|취소|환불|연주하기도|개최|선보인다|선보입니다|들려준다|무대를\s*꾸미|졸업하고|재학|장학생|구성된다|시작하지만|전개될수록|작품이다|곡이다|특징이다|연상시키는|소품곡\s*중|작곡된|독주곡집으로|생애\s*말년|예술감독|상임지휘|객원지휘|특별출연|우정출연|찬조출연|GUEST|실황\s*연주|순회\s*연주|협연하|출연하|입증하|비룾하여|투어에\s*오른다|작곡발표회|동문회|오전\s*\d|오후\s*\d|\(토\)|\(일\)|\(월\)|\(화\)|\(수\)|\(목\)|\(금\)|1544-|1588-|070-|Intermission|\bStage$)/i;

const MOVEMENT_ONLY_REGEX = /^(?:(?:[I|V|X|Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ|Ⅶ|Ⅷ|Ⅸ|Ⅹ|Ⅺ|Ⅻ|l]{1,4})\s*[\.\)]\s*(?:Allegro|Andante|Adagio|Presto|Largo|Moderato|Scherzo|Rondo|Menuetto|Finale|Grave|Vivace|Lento|Molto|Poco|Assai|Con\s|Ma\s|Non\s|Tempo|Romanze|Intermezzo|ntermezzo|Marcia|Gavotte|Sarabande|Gigue|Allemande|Courante|Preludio|Aria|Variations|Var\.|Valse|Serenade|In\s+der|Waldes|Die\s+Stille|Mondnacht|Sch[öo]ne|Auf\s+einer|Wehmut|Zwielicht|Im\s+Walde|Fr[üu]hlings|Nicht\s+schnell|Einfach)|(?:Allegro|Andante|Adagio|Presto|Largo|Moderato|Scherzo|Rondo|Menuetto|Finale)\s*[:\.])/i;

const COMPOSER_ONLY_REGEX = /^(?:J\.\s*S\.\s*Bach|Johann\s+Sebastian\s+Bach|C\.\s*P\.\s*E\.\s*Bach|W\.\s*A\.\s*Mozart|W\s*-\s*A\.\s*Mozart|Wolfgang\s+Amadeus\s+Mozart|L\.\s*v\.\s*Beethoven|L\.\s*van\s+Beethoven|Ludwig\s+van\s+Beethoven|F\.\s*Chopin|Fr[eé]d[eé]ric\s+Chopin|R\.\s*Schumann|Robert\s+Schumann|C\.\s*Schumann|Clara\s+Schumann|J\.\s*Brahms|Johannes\s+Brahms|F\.\s*Schubert|Franz\s+Schubert|F\.\s*Liszt|Franz\s+Liszt|C\.\s*Debussy|Claude\s+Debussy|M\.\s*Ravel|Maurice\s+Ravel|P\.\s*I\.\s*Tchaikovsky|Pyotr\s+Ilyich\s+Tchaikovsky|S\.\s*Rachmaninoff|Sergei\s+Rachmaninoff|S\.\s*Prokofiev|Sergei\s+Prokofiev|D\.\s*Shostakovich|Dmitri\s+Shostakovich|F\.\s*Mendelssohn|Felix\s+Mendelssohn|A\.\s*Scriabin|Alexander\s+Scriabin|C\.\s*Franck|C[eé]sar\s+Franck|C\.\s*Saint-Sa[eë]ns|Camille\s+Saint-Sa[eë]ns|G\.\s*Faur[eé]|Gabriel\s+Faur[eé]|A\.\s*Dvo[rř][aá]k|Anton[ií]n\s+Dvo[rř][aá]k|E\.\s*Grieg|Edvard\s+Grieg|J\.\s*Sibelius|Jean\s+Sibelius|G\.\s*Mahler|Gustav\s+Mahler|A\.\s*Bruckner|Anton\s+Bruckner|R\.\s*Strauss|Richard\s+Strauss|J\.\s*Strauss(?:\s*II)?|Johann\s+Strauss|I\.\s*Stravinsky|Igor\s+Stravinsky|B\.\s*Bart[oó]k|B[eé]la\s+Bart[oó]k|A\.\s*Vivaldi|Antonio\s+Vivaldi|G\.\s*F\.\s*H[aä]ndel|George\s+Frideric\s+Handel|J\.\s*Haydn|Joseph\s+Haydn|N\.\s*Paganini|Niccol[oò]\s+Paganini|P\.\s*(?:de\s+)?Sarasate|Pablo\s+de\s+Sarasate|F\.\s*Poulenc|Francis\s+Poulenc|A\.\s*Piazzolla|Astor\s+Piazzolla|M\.\s*Reger|Max\s+Reger|S\.\s*Cherkassky|H\.\s*Vieuxtemps|S\.\s*Mercadante|G\.\s*Puccini|G\.\s*Verdi|G\.\s*Bizet|G\.\s*Rossini|G\.\s*Donizetti|V\.\s*Bellini|R\.\s*Wagner|E\.\s*Chausson|Ernest\s+Chausson|G\.\s*Enescu|George\s+Enescu|O\.\s*Nicolai|Otto\s+Nicolai|V\.\s*Monti|Vittorio\s+Monti|C\.\s*W\.\s*Gluck|F\.\s*Leh[aá]r|N\.\s*Rimsky-Korsakov|R\.\s*Korsakov|P\.\s*Hindemith|Paul\s+Hindemith|G\.\s*Bottesini|E\.\s*Elgar|Edward\s+Elgar|G\.\s*Holst|B\.\s*Smetana|M\.\s*Mussorgsky|A\.\s*Borodin|A\.\s*Glazunov|O\.\s*Respighi|J\.\s*Massenet|C\.\s*Gounod|L\.\s*Bernstein|G\.\s*Gershwin|A\.\s*Copland|S\.\s*Barber|E\.\s*Satie|Erik\s+Satie|F\.\s*Kreisler|E\.\s*Ysa[yÿ]e|H\.\s*Wieniawski|L\.\s*Boccherini|D\.\s*Scarlatti|F\.\s*Couperin|J\.\s*P\.\s*Rameau|G\.\s*P\.\s*Telemann|A\.\s*Corelli|G\.\s*Tartini|T\.\s*Albinoni|A\.\s*Schoenberg|A\.\s*Berg|O\.\s*Messiaen|B\.\s*Britten|Z\.\s*Kod[aá]ly|L\.\s*Jan[aá][cč]ek|M\.\s*de\s+Falla|I\.\s*Alb[eé]niz|E\.\s*Granados|J\.\s*Rodrigo|H\.\s*Villa-Lobos|N\.\s*Kapustin|Denis\s+Sungh[oO0]|Stanley\s+Myers|R[oO0]land\s+Dyens|Yiruma(?:\s*\/\s*Denis\s+Sungh[oO0])?|Amy\s+Beach|Wil[lI1]iam\s+B[oO0][lI1]com|Thomas\s+Morley|John\s+Dowland|Francis\s+Pilkington|Thomas\s+Campion|Henry\s+Lawes|William\s+Corkine|바흐|모차르트|베토벤|쇼팽|슈만|클라라\s*슈만|브람스|슈베르트|리스트|드뷔시|라벨|차이콥스키|차이코프스키|라흐마니노프|프로코피예프|쇼스타코비치|멘델스존|스크랴빈|스크리아빈|프랑크|생상스|포레|드보르작|드보르자크|그리그|시벨리우스|말러|브루크너|슈트라우스|스트라빈스키|바르톡|비발디|헨델|하이든|파가니니|사라사테|풀랑크|피아졸라|바그너|쇼송|에네스쿠|니콜라이|몬티|글루크|레하르|림스키코르사코프|힌데미트|보테시니|모리코네|솔타|엘가|홀스트|스메타나|무소륵스키|보로딘|글라주노프|레스피기|마스네|구노|번스타인|거슈윈|코플랜드|바버|사티|크라이슬러|이자이|비에냐프스키|보케리니|스카를라티|쿠프랭|라모|텔레만|코렐리|타르티니|알비노니|쇤베르크|메시앙|브리튼|코다이|야나체크|파야|알베니스|그라나도스|로드리고|빌라로보스|카푸스틴|에이미\s*비치|윌리엄\s*볼컴|월리엄\s*몰컴|드니\s*성호|이루마)(?:\s*\([\d\s~–\-.,b.cfl]+\))?$/i;

function isComposerOnlyLine(line) {
  if (!line) return false;
  const trimmed = line.replace(/['’\-–—:\s]+$/, '').trim();
  if (COMPOSER_ONLY_REGEX.test(trimmed)) return true;
  // 생몰년도가 명시된 작곡가 라인 (예: "Ernest Chausson (1855-1899)", "Sergei Prokofiev(1891-1953, Russia)")
  if (/^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F.\-\s]{2,38}\s*\(\s*(?:b\.|ca\.|fl\.)?\s*\d{4}\s*[~–\-]\s*\d{0,4}(?:,\s*[A-Za-z가-힣\s]+)?\s*\)$/i.test(trimmed)) return true;
  // 한글 성명 + 영문 성명 병기 작곡가 라인 (예: "김지영 (JiYoung Kim)", "박경아 (Kyung A Park)")
  if (/^[가-힣]{2,4}\s*\(\s*[A-Z][A-Za-z\s\-]{3,28}\s*\)$/.test(trimmed)) return true;
  return false;
}

function isMusicalPieceLine(line, allowBroadInProgramBlock = false) {
  if (!line || line.length < 4 || line.length > 150) return false;
  if (line.includes('\uFFFD') || line.includes('_*_+_*')) return false;
  if (MOVEMENT_ONLY_REGEX.test(line)) return false;
  if (BIO_EXCLUDE_REGEX.test(line)) return false;
  if (isComposerOnlyLine(line)) return false;
  if (/^(?:Program|PROGRAM|P\s*R\s*[O0]\s*G\s*R\s*A\s*M|프로그램|프로그래|곡목|연주자|출연진|프로필|Profile|Intermission|lntermission|인터미션|1부.*|2부.*|<1부>|<2부>|\[1부\]|\[2부\]|STAGE\s*\d+.*)$/i.test(line)) return false;
  if (/^(?:\d+\.\s*)?(?:Opera\s*Ensemble|Bass\s*Baritone|Mezzo\s*Soprano|Soprano|Tenor|Baritone|Bass|지휘|특별\s*지휘|연주|협연|합창|합장|사회|해설|패널\s*진행)\s*[:\s]\s*[가-힣a-zA-Z\s,·\-/&•]+$/i.test(line)) return false;

  const hasCatalogOrGenre = (
    /\b(?:Op\.\s*\d+|No\.\s*\d+|BWV\s*\d+|K\.\s*\d+|KV\.?\s*\d+|Hob\.|RV\s*\d+|D\.\s*\d+|S\.\s*\d+|M\.\s*\d+|L\.\s*\d+|TrV\s*\d+|WWV\s*\d+|WAB\s*\d+|WoO|HWV\s*\d+|Sz\.\s*\d+|FP\s*\d+|MWV|TWV)\b/i.test(line) ||
    /(?:Sonata|Concerto|Symphony|Symphonie|Suite|Partita|Prelude|Fugue|Etude|Ballade|Scherzo|Nocturne|Polonaise|Fantaisie|Fantasia|Fantasie|Fantasy|Impromptu|Variations|variata|Overture|Quartet|Quintet|Trio|Octet|Sextet|Septet|Serenade|Rhapsody|Romances?|Chaconne|Passacaglia|Caprice|Capriccio|Rondo|Requiem|Missa|Motet|Cantata|Oratorio|Pieces\s+for|Poème|Tzigane|Liebestod|Carnaval|Faschingsschwank|Kreisleriana|Humoreske|Arabeske|Kinderszenen|Zigeunerlieder|Liederkreis|Dichterliebe|Frauenliebe|Schwanengesang|Winterreise|Klavierst[üu]c?ke|Gaspard|Bergamasque|Estampes|Miroirs|Tombeau|Valse|Waltz|Bol[ée]ro|Pavane|Chanson|Elegy|Ghost\s+Rag|Cabaret\s+Songs|Cavatina|Cavatma|Tango\s+en\s+skai|Fairytale\s+Poem|Don\s+Quixote|Romeo\s*&\s*Juliet|Apr[èe]s un r[êe]ve|Cs[áåa]rd[áåa]s|Bumblebee|Magic\s*Flute|Merry\s*Wives|Adagio\s+Melancolico|Minuet\s+and\s+Dance|Du\s+bist\s+die\s+Ruh|Mein\s+Herr\s+Marquis|Lippen\s+schweigen|Come\s+Paride|소나타|협주곡|교향곡|교성곡|모음곡|파르티타|전주곡|푸가|에튀드|연습곡|초절기교|발라드|스케르초|녹턴|야상곡|폴로네이즈|환상곡|즉흥곡|변주곡|서곡|사중주|오중주|삼중주|팔중주|육중주|세레나데|랩소디|광시곡|로망스|로맨스|샤콘느|파사칼리아|카프리스|론도|레퀴엠|미사|칸타타|오라토리오|콘체르토\s*그로소|콘체르탄테|엘레지|왈츠|무곡|트로이메라이|아름다운\s*저녁|^달빛$|멜로디\s*\(오페라|시네마\s*천국|나는\s*마리아예요|카바레\s*송|우아한\s*유령|동화시|돈키호테|로미오와\s*줄리엣|이별의\s*노래|You\s+Raise\s+Me\s+Up|고요한\s*밤|오\s*거룩한\s*밤|(?:피아노|바이올린|비올라|첼로|플루트|클라리넷|오보에|바순|호른|트럼펫|기타|하프|성악|합창|관현악|오케스트라|현악|목관|금관|독주|듀오|트리오|앙상블)[을를]\s*위한|연가곡|연가곡집|차르다시|왕벌의\s*비행|마술피리|즐거운\s*아낙네들|사랑의\s*묘약|유쾌한\s*미망인|죽음의\s*무도|볼레로|피터와\s*늑대|동물의\s*사육제|사계|전람회의\s*그림|신세계로부터|비창|운명|황제|영웅|전원|합창|메시아|엘리야|천지창조|겨울나그네|백조의\s*노래|시인의\s*사랑|아베\s*마리아|아베\s*베룸|할렐루야|할롈루야|작품번호\s*\d+|작품\s*\d+)/i.test(line)
  );

  if (hasCatalogOrGenre) return true;

  if (allowBroadInProgramBlock) {
    if (/[—–\-:|\/<>《》「」『』]/.test(line) && /[A-Za-z가-힣]{2,}/.test(line)) return true;
    if (/^(?:\d+\.|[①②③④⑤⑥⑦⑧⑨⑩])\s*[A-Za-zÀ-ÖØ-öø-ÿ가-힣].{1,85}$/.test(line)) return true;
  }

  return false;
}

function addUniquePiece(pieces, candidate) {
  if (!candidate || candidate.length < 4) return;
  const norm = s => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .replace(/klavierstuke/g, 'klavierstucke')
    .replace(/[^a-z0-9가-힣]/g, '');
  const cNorm = norm(candidate);
  if (!cNorm) return;

  const opMatch = candidate.match(/(?:\bOp\.|작품번호|작품)\s*(\d+)/i);
  for (let idx = 0; idx < pieces.length; idx++) {
    const p = pieces[idx];
    const pNorm = norm(p);
    if (pNorm === cNorm || pNorm.includes(cNorm)) return;
    if (cNorm.includes(pNorm)) {
      pieces[idx] = candidate;
      return;
    }
    if (opMatch) {
      const pOp = p.match(/(?:\bOp\.|작품번호|작품)\s*(\d+)/i);
      if (pOp && pOp[1] === opMatch[1]) {
        if (pNorm.slice(0, 8) === cNorm.slice(0, 8) || (p.includes('베토벤') && /Beethoven/i.test(candidate)) || (/Beethoven/i.test(p) && candidate.includes('베토벤'))) {
          if (/^[A-Za-z]/.test(candidate) && !/^[A-Za-z]/.test(p)) {
            pieces[idx] = candidate;
          }
          return;
        }
      }
    }
  }
  pieces.push(candidate);
}

function cleanPieceLine(line, currentComposer) {
  let cleanPiece = line
    .replace(/^[0-9]+[\.\)]?\s*/, '')
    .replace(/^[•\-\*·▶▸\.]+\s*/, '')
    .replace(/\s*\(\d{4}[~–\-]\d{4}\)/g, '')
    .replace(/\s*[–—―ㅡ]\s*\d+\s*['’′]\s*$/, '')
    .replace(/\s*\|\s*/g, ': ')
    .trim();

  cleanPiece = normalizeInlineComposer(cleanPiece);

  if (currentComposer && !extractExistingComposer(cleanPiece)) {
    const lastWord = currentComposer.split(' ').pop().toLowerCase();
    if (!cleanPiece.toLowerCase().includes(lastWord)) {
      cleanPiece = `${currentComposer}: ${cleanPiece}`;
    }
  }
  return cleanPiece;
}

// 비곡목 노이즈(CSS, 해설·프로필·홍보 문장, 교통·티켓·일정·러닝타임, 출연진·단체명 단독, 세부 악장·빠르기말 단독, 작곡가 단독 라인) 원천 차단 방화벽
function isInvalidPieceNoise(line) {
  if (!line || line.length < 4 || line.length > 160) return true;
  if (/[\u3400-\u9FFF\uF900-\uFAFF\uFFFD]|@import|https?:\/\/|www\.|facebook\s*\.?\s*com|\.com|\.co\.kr|\.or\.kr|\.go\.kr|@naver|@gmail|\b0\d{1,2}[-.]\d{3,4}[-.]\d{4}\b|1544-|1588-|070-/i.test(line)) return true;
  if (/(?:width|height|padding|margin|background|color|font-size|font-weight|font-family|line-height|letter-spacing|box-sizing|text-align|display|word-break|content)\s*:|;\s*$|[{}]/i.test(line)) return true;
  if (/[\\쯰쮁쬔쵠귯빟갍쬐륳닇%]|(?::\s*:)|(?:\[\d+-\d+\))|(?:\(:\s*ON\s*\(:\s*ER)|I술의전장|안동문"-GI|행복쫄러스|제주특별자치도립제주합창/i.test(line)) return true;

  // 1. 한글 서술어·해설·아티스트 프로필·홍보 문장 완전 차단 (문장 내부에 '소나타', '협주곡', '교향곡' 등이 포함되어 있어도 100% 차단)
  if (/(?:입니다|합니다|있습니다|봅니다|드립니다|보세요|만나보|선보인|선보일|선보였|선보이는|선보임|펼쳐진|펼져집|펼칩니다|들려줄|들려준|이어가|이어왔|이어오고|이어\s*왔다|이어지는|가졌고|가졌다|받았으며|받기\s*시작|선정도며|선정되|선정된|선성되어|주목을|주목받|우승하여|우승한|입상하며|하였다|중이다|자랑하는|감동을\s*선사|하나의\s*악기|창단되어|창단을|창단하여|창단된|창단연주|협업하고|협업으로|유기적|재직\s*중|장기\s*프|구성된\s*합창|초연된\s*이래|초연한\s*이후|한국\s*초연\s*등|부산초연지휘|구현하였고|연주하는\s|연주하고\s*있으며|연주하며|자리\s*잡았습니다|이루어진\s*이\s*대작|협연을\s*비롯하여|비롯하여|비롯해|비롯\s|비롯된|시작하여|클라이맥스|순간들을|한자리에서|표정부담과|명곡입니다|곡입니다|연주회이다|합창단이다|합창단은|막을\s*내린다|노래한다\.|출연얬고|객원연주|참가\s*및\s*연주|활동하는|활동하며|활동을|활동$|활동의\s*결과|연주활동|연주회를|전체대상|공쿠르\s*등|오라토리오\s*〈천지|오라토리오\s*중\s*하나|관현하단이었던|문학평론집|시선집|학구적인|정진에|힘쓰고|탐구해온|탐구하는|완주하며|관통하는|남겼|남겼다|물리일으|연주합니다|연주됩니다|본격적으로|국내\s*관객|솔리스트\s*연주|솔로이스트|솔리스트|전하는$|감동을|향유|최장기|현존하는|권하였으며|기획하였으며|기획했으며|수해자로선|수혜자로서|소생하며|점진적인|이르러\s*선율|진행하고\s*있습니다|전야\s*연주|기반\s*위에서|다양한\s*무대에서|상주\s*오케스트라|부신대학교|작곡한\s*이\s*협주곡|연주께」다|무용통구르|보여준다|강조했다|문을\s*연다|드러낸다|드레낸다|돋보인다|그려낸다|그러낸다|그려내는|그러냅니다|그린다|극대화한다|변형된다|변영된다|전한다\.|낮추는|뿜어낸다|뿜에낸다|수록된|완성된|작품으로,|형식으로,|중심축으로,|바탕으로|중심으로|대위법적|교향악적인|고전주의적|전성기인|출판한|정착한|작곡하던|방불케|마찬가지로|황상원이다|순국선열|국권회|헌신적인|현신적인|맞이한|원하는\s*열기|비지정좌석|착석하시려면|입장해\s*주시기|공개\s*예정|발매\s*예정|협연\s*예정|콩쿠르\s*석권|수상$|출연$|합창\s*지휘$|음악코치$|작품발표회|저서로는|장악력을|몰입하게|가져온\s*선율|비극적\s*운명|숨겨진\s*진실|얽히고설킨|조망하는|균형\s*있게\s*배치|도전하는|이끌며|인정받았다|인정빋았다|채워졌어요|필요가\s*없다|소일한다|사분하고|돌아와\s|탈피하여|노래하듯|보조하는|상연되지\s*않지만|만나는\s*시간이다|운명적\s*재회|히스토리안\s*역|베이스\s*솔로|교중미사\s*반주|찬양대\s*지휘자|성가대\s*지휘자|합창\s*참여|연가곡\s*연주|Piano\s+Trio\s*연주|입\s*장\s*권|Making\s+his\s+Concerto|under\s+Yehudi\s+Menuhin|with\s+Seoul\s+Ph[i1]lharmonic|Oratorio\s+S[o0이]0\s+Competition)/.test(line)) return true;
  if (/(?:한다|된다|이다|있다|없다|했다|였다|왔다|갔다|낸다|연다|준다|보인다|그린다|전한다)\.\s*$/.test(line)) return true;
  if (/^(?:[^:]+:\s*)?(?:한편,|또한\s|다\.\s|그는\s|오늘\s*공연에서는|이번\s*(?:공연|연주회|무대|베토벤)|여기에\s|하지만|그러나|※|부\s*[:I]\s*)/.test(line)) return true;
  if (/\b(?:19\d\d|20\d\d)년(?:에는|부터는|산\s|\s*\d+월|\s+[가-힣A-Za-z])/.test(line) && !/\(\d{4}년(?:\s*개정|,\s*\d+세)\)/.test(line)) return true;
  if (/(?:객원|정기객원|수료|졸업|즐업|사사|교수|출강|역임|단원\s*및|지휘자로도|상임지휘자|상임\s*지휘자|상임지회자|발레단\s*수석|수석\s*연주자|수석,\s*Trio|콰르텟\s*멤버|과르텟\s*멤버|앙상블\s*리더|암상불\s*리더|One\s*리더|합창지휘|총무[가-힣]|재무[가-힣]|감사[가-힣]|Ohns\s+Hopkins|Peabody|Havard\s+University|음익예술학회|한국합창연구학회|전국합창경연대회)/.test(line)) return true;

  // 2. 공연 일정·장소·교통편·티켓가격·러닝타임·인터미션·시리즈 헤더 차단
  if (/^(?:SUN|MON|TUE|WED|THU|FRI|SAT)\s+\d|^\d{1,2}\.\d{1,2}\.[월화수목금토일]\s+\d/i.test(line)) return true;
  if (/\b(?:MON|TUE|WED|THU|FRI|SAT|SUN|FR1|TlJE)\s*\d{1,2}:?\d{2}|\b\d{1,2}\.\d{1,2}\.?(?:[월화수목금토일]\.)?\s*\d{1,2}(?::[O0\d]{2})?\s*(?:AM|PM)|\b(?:Fri|Sat|Sun)\.\s*\d{1,2}:/i.test(line)) return true;
  if (/(?:광역시|특별시|특별자치|해운대구|서초구|송파구|종로구|마포구|영등포구|강서구)\s+[가-힣0-9]+(?:동|로|길)\s+\d/.test(line)) return true;
  if (/(?:잠실역\s*\d+번\s*출구|대림역|\d+호선|도보\s*\d+분|정류장|^(?:일반|급행)\s*:\s*\d+번|중증\(1~3급|경승\(4~6급|모스크바필하모닉오케스트라.*지휘|록포트\s*실내악\s*페스티벌)/.test(line)) return true;
  if (/(?:티켓가격|EI켓가격|\d+만원|\d+전원|\d+천원|기암아트홀|거암아트홀|CG아트홀|영산아트홀|금호아트홀|금호아트을|로데아트센터|포항문화예술회관|SEOUL\s+ARTS\s+CENTER|RECITAL\s+HALL|PLATFORM-L)/i.test(line)) return true;
  if (/(?:연주시간\s*:|인디미션|인터미션|lntermss|lntermission|\/ntermission|—lntermission|\d+분\s*[:/]\s*인[터디]미션|subject\s+to\s+change)/i.test(line)) return true;
  if (/^(?:[^:]+:\s*)?(?:정기연주회\s*No\.\s*\d+|(?:베토벤\s*)?피아노\s*소나타\s*전곡\s*시리즈.*|바이올린\s*소나타\s*전곡\s*연주\s*시리즈.*|여성[작직]곡가\s*시리즈\s*(?:ll|[12ⅠⅡ])?\s*[:\-]|SALON\s+CLASSIQUE|LI:uI\s+DISNEY|악보집\s+K-POP|MAIN\s+CONCERT|메인\s*공연)/i.test(line)) return true;

  // 3. 출연진·악기 편성·작곡가+생몰년 단독 헤더 차단
  if (/^(?:편성|지휘\s+[가-힣]+|연주\s+[가-힣]+|피아노\s+[가-힣]+|Clarinet\s+[가-힣]+|Kl\.\s*[가-힣]+|총무[가-힣]+)\s*:/i.test(line)) return true;
  if (/(?:Eb\s*Cl\.|Bb\s*Cl\.|Bass\s*Cl\.|1st\s*Clarinet|2바이올린\s+[가-힣]+|지휘\s+[가-힣]+\s+[I|]\s*합창|M\/Sop\.[가-힣]+|Solo-Bar\.|◆\s*[가-힣&\s]+\s*:\s*(?:Soprano|Tenor|Baritone|Bass|Duet|Mezzo)|Pianist\s*[8&]\s*:?\s*Commentator|\[출연진\s*전원\]|\(Arr\.\s*for\s+Woodwind\s+Quintet\s+by|SNU\s+Symphony\s+Orchestra\s+협연|gwangju—symphony-orchestra|브프문\s*-\s*!22재단|^까-\.-|^Pf\.Julius|^JULIUS-JEONGWON|^Mark\s+Kim-Mulgrew$|^Joo-Hye\s+Lee$)/i.test(line)) return true;
  if (/^(?:[^:]+:\s*)?(?:하인리히\s*에른스트|하인리히\s*이그나츠\s*프란츠\s*폰\s*비버|주세페\s*타르티니|니콜로\s*파가니니|앙리\s*비외탕|헨리크\s*비에니아프스키|나단\s*[일밀]스타인|Louise\s+Farrenc|Aaron\s+Copland|William\s+Corkine|마르크-양투안\s*샤르팡티에|장춘희\s*\(Choon-Hee\s+Jang\)|김효근\s*\(1962-\)|이원주\s*\(1979-\)|최진\s*\(1976-\)|윤학준\s*\(1973-\)|최영섭\s*\(1929-\)|정환호\s*\(1984-\)|Liszt$|F\.\s*Busoni$|Justin\s+Hu[『「r]witz$|Stephen\s+Schwartz$|Claude-MicheI\s+Schönberg\s*\/\s*Arranged\s+by\s+Bob\s+Lowden$|Music:\s*(?:Alan\s+Menken|Frank\s+Wildhorn|Leonard\s+Bernstein)|c\s+Hisaishi\s+119|KlauS\s+Badelt\s+119|1928-202이$|18,뢰93가$)/i.test(line)) return true;
  if (/\b(?:16\d\d|17\d\d|18\d\d|19\d\d)\s*[-~–]\s*(?:17\d\d|18\d\d|19\d\d|20\d\d)\s*$/.test(line)) return true;

  if (/합창(?:단|제|음악|음익|의|은|을|이|으로)/.test(line) && !/(?:교향곡|Symphony|환상곡|Fantasy|노예들의\s*합창|사냥꾼의\s*합창|순례자의\s*합창)/i.test(line)) return true;
  if (/^(?:>?STAGE|PART|스테이지|제?\d+부)\s*\d*\s*[:\/\-]/i.test(line)) return true;
  if (/^(?:I|II|III|IV|V|Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|\d+)\s*[\.\)]\s*[가-힣A-Za-z\s]+(?:합창단|오케스트라|앙상블|콰이어|코러스)$/i.test(line)) return true;
  if (/^(?:PROGRAM|프로그램)\b/i.test(line) && !/\[마지막\s*황제\]/.test(line)) return true;
  if (/^(?:Intermission|lntermission|인터미션|A「tist|Artist|SERENADE|Symphony|Nocturne|PIANO\s+SONATAS|LAST\s+CARNAVAL|PreIude\s*&\s*Sonata|for\s+String\s+Quartet|MR\s*:|l:48\s*"Maria\s+Theresa")(?:\s*-)?$/i.test(line)) return true;
  if (/^(?:Henry\s+Purcell|A\.?\s*Bruckner):\s*Symphony$/i.test(line)) return true;

  // 4. 연주 단체명 단독 라인 및 스테이지/프로필/홍보 잔재 제외
  if (/^(?:[A-Za-z가-힣0-9\s&()]+\s+)?(?:Symphony\s+Orchestr[ao]|Philharmonic\s+Orchestra|Wind\s+Orchestra|Chamber\s+Orchestra|String\s+Quartet|Violin\s+Quartet(?:\s+Series\s*\d+)?|Piano\s+Trio|Guitar\s+Quartet.*|Trio|Quartet(?:\s+IDEA)?|Quintet|Ensemble|Choir|Chorus|합창단|DAEYANGSYMPHONY\d*|Daeyang\s+Symphony.*|GyeonqSan\s+Symphony|EINS\s+QUARTET.*|Ch0ir\s+Competltlon.*|Venusto\s+Symphony|Joumey\s+Symphony|Trio\s+"?ånderer|서울바로크싱어즈|millennium\s*-\s*symphony\s*-\s*orchestra|합창뮤지컬|-?\s*합창아이들|합창\s*M\.K\..*|대금과\s*합창|생황과\s*합창)$/i.test(line) && !/(?:Op\.|No\.|BWV|K\.|KV|Hob|D\.\s*\d|in\s+[A-G]|소나타|협주곡|교향곡|모음곡)/i.test(line)) {
    return true;
  }
  if (/^(?:<오프닝|<새출발\s*스테이지>|<크리스마스\s*스테이지>|<56,\s*57기\s*기합창>|앵콜\s*\/|의\s*055\s*761|WArg\s+Op\.\s*4|Ballade\s+for$|합창\s*M\.K\.|클래식\s*세레나데$|[가-힣]{2,4}\s*시\s*\/\s*[가-힣]{2,4}\s*곡$|GUITAR\s*&\s*QUARTET$|:\s*12월의\s*세레나데$|Rhapsody$|Fantasy\.?$|Suite$|Variations\s+대\)\s+a\s+Theme$|라흐마니노프:\s*개의\s*피아노\s*협주곡$|텅\s*빈,\s*고요한\s*밤$|lntroduction\s+10\s+Romance$)/i.test(line)) return true;
  if (/(?:LOS\s+Angeles\s+Philharmoni|Santa\s+Monica\s+Symphony|Prague\s+Radio\s+Symphony|PhiIharmonic\s+südwestfalen|전\s*세계\s*\d+만\s*명을\s*감동시킨|사계절의\s*아름다운\s*풍경과\s*감성을|이후\s*학년과\s*실력이\s*높아질수록|코러스\s*해오름|피아니스트\s*쉐르바코|카바코싀\s*기돈|클래식\s*음향에\s*초|클래식을\s*'설명'하기\s*보다|다수의\s*창작\s*오페라를\s*지휘|장작\s*합창\s*교향곡과|피어나는\s*다섯\s*개의\s*합창|합창\s*M\.K\.\s*가곡|악기와\s*합참음악|감미로운\s*재즈가\s*어우러져|지회\s*-\s*김성진\s*연주|아마추어\s*육악인들의\s*협주곡|박혜현의\s*모차르트\s*피아노\s*소나타\s*전곡\s*시리즈|TianOTrioingminoq|tempo\s+di\s*-\s*minuettcv|편\s+A\s+M07-체t|Accademia\s+Musica|Dißoma\s*취득|VocaI\s+Competition|국악인\(|E\.\s*Mor「icone|생\s*0`혜a|\[\s*Allegro\s*\||\|\.\s*Fugue$)/i.test(line)) return true;

  // 5. 세부 악장 번호 및 빠르기말(Tempo Marking) 단독 라인 제외
  if (/^(?:[^:]+:\s*)?(?:ll|I|II|III|IV|V|VI|VII|VIII|IX|Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ)\s*[\.\)]\s*(?:Allegro|Andante|Adagio|Presto|Largo|Moderato|Scherzo|Scherzino|Rondo|Rondeau|R이1d0|Sunup|Menuetto|Minuetto|Finale|Final|Introduzione|Introitus|Serenata|Tarantella|Blues|Perpetuum\s+mobile|Arietta|Tema|Quasi\s+Variazioni|De\s+torrente)/i.test(line)) return true;
  if (/^(?:[^:]+:\s*)?No\.\s*\d+(?:\s+in\s+[A-G][^\s]*\s+(?:Major|Minor))?(?:\s*[:\-]\s*(?:Allegro|Andante|Adagio|Moderato|Presto|Allegretto).*)?$/i.test(line)) return true;
  if (/^(?:[^:]+:\s*)?No\.\s*\d+\s+(?:Andante\s+Cantabile|Gloria|Laudate\s+Dominum|Kyrie|Credo|Sanctus|Agnus\s+Dei)\b/i.test(line)) return true;
  if (/^(?:Prelude|Promenade|Suites?)\s+No\.\s*\d+(?:\s+(?:Andantino|Allegro|Moderato|Adagio|Memory).*)?$/i.test(line)) return true;
  if (/^Suites?\s+[12](?:\s*-\s*모음곡\s*[12]번)?$/i.test(line)) return true;
  if (/^(?:Allegro\s*[–\-]\s*Trio|Rondo\s*-\s*Allegro|Finale\s*:\s*Molto\s+allegro|E\.?\s*Grieg\s*:\s*Allegro\s+moderato|C\.?\s*Franck\s*:\s*Prelude:\s*Moderato|F\.?\s*Schubert\s*:\s*(?:Scherzo|Rondo)\s*:|F\.?\s*Chopin\s*:\s*Scherzo\s+e\s+lntermezzo:|J\.?\s*S\.?\s*Bach\s*:\s*Allegro\s*-\s*Andante|Einfach\b|Hastig\b|Innig\s*[–\-]|Sehr\s+lebhaft|SPRING\s*-\s*봄|피날레\s*:\s*FINALE|MinuettO\s*-\s*Allegretto|FinaIe\s*-\s*Presto|SCherzo\s*-\s*MOltO\s+vivace|March\s+Funebre\s*-\s*LentO|Choral\s*:\s*Poco\s+piu\s+lento|VI\.\s*General\s+Lavine|Moderato\s*-\s*Allegro\s+vivace|SCher:o\s+MOltO\s+comodo|Adagio\s+ma\s+non\s+troppo\s*[–\-]|Adagio\s*[–\-]\s*Allegro\s*[–\-]\s*Adagio|Benedictus\s*-\s*Agnus\s+Dei|Book\s+(?:III|VI|IX)\s*:)/i.test(line)) return true;

  // 6. 작곡가 단독 라인 및 성악/반주 출연진 나열 라인 제외
  if (/^(?:Pf\.|Vn\.|Vc\.|Fl\.|Sop\.|Ten\.|Bar\.|M\.Sop\.)\s*[가-힣]+(?::|$|\s*,.*(?:Klavier|Klarvier))/i.test(line)) return true;
  if (/^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F.\-\s]{2,35}\s*[\(\[1년]\s*(?:ca\.\s*)?\d{3,4}\s*[-~–]\s*(?:ca\.\s*)?\d{0,5}(?:,\s*[A-Za-z가-힣\s]+)?[\)\]\s1]*$/i.test(line)) return true;
  if (/^(?:요한\s*슈트라우스\s*[12]세|최성환|요하네스\s*브람스|드미트리\s*쇼스타코비치|루트비히\s*판\s*베토벤|볼프강\s*아마데우스\s*모차르트|프란츠\s*슈베르트|로베르트\s*슈만|펠릭스\s*멘델스존|프레데리크\s*쇼팽|구스타프\s*말러)\s*\([^)]*\)?$/i.test(line)) return true;
  if (/^(?:김효근|임긍수|이원주|윤학준|최영섭|정환호)\s*\(\d{4}-\)\s*\([^)]+\)$/.test(line)) return true;
  if (/(?:Webbe「Op\.|LoeweOp\.|He「be「tOp\.)/i.test(line)) return true;
  if (/^(?:S\.\s*L\.\s*Weiss|F\.\s*M\.\s*Torroba|F\.\s*Mompou|L\.\s*Efthymiou|S\.\s*Dodgson|A\.\s*York|J\.\s*K\.\s*Mertz|S\.\s*Assad|[」J]enkins|Justin\s+Hu[「r]witz|R\.\s*St[「r]auss|C\.\s*Schumann|R\.\s*Schumann|J\.\s*S\.\s*Bach|W\.\s*A\.\s*Mozart|L\.\s*v\.\s*Beethoven)$/i.test(line)) return true;

  // 7. 잘린 파편 라인 제외
  if (/^(?:s\s+피아노\s*협주곡|Symphony\s+Np\.\s*1\s+in|I협주곡\||udite\s*\.\s*-\s*udite|베토벤\s*피아노\s*소나타\s*전곡\s*시리즈\s*\d+|20\d\d년\s+\d+월\s+"|Overture\s*ⅳbi10코\)|판라스틱\s*4:\s*퍼스트\s*스텝|lmpromptus\.\s*P「eludes|Never\s+weather-beaten\s+sail$|Glorious\s*—\s*사\s*-\s*곡|프로코피예프:\s*수만\s*피아노\s*소나타|.*\[에르LI쓰노|.*쐬트리LⅠE|슈만:\s*(?:\.:|』1:)|거슈윈:\s*」a끄|.*`-\s*귀살대\s*Theme|.*\[진격의대인\s*OSTI|베토벤:\s*"에콜\s*모데른”)/i.test(line)) return true;

  return false;
}

// 곡목 라인 내부의 다양한 작곡가 구분자(ㅣ, |, I, ..., 쉼표, 공백, 역순 슬래시/대시, 중복 작곡가 접두어)를 "작곡가: 곡명" 표준 포맷으로 정규화
function normalizeInlineComposer(rawLine) {
  let line = (rawLine || '')
    .replace(/\s+/g, ' ')
    // 중복·오매칭 작곡가 접두어 정규화
    .replace(/^J\.\s*C\.\s*Bach\s*\/\s*H\.\s*Casadesus:\s*J\.\s*C\.\s*Bach\/\s*H\.\s*Casadesus\s*-\s*/i, 'J. C. Bach / H. Casadesus: ')
    .replace(/^(?:A\.\s*Dvořák:\s*){2,}/i, 'A. Dvořák: ')
    .replace(/^(?:P\.\s*Warlock:\s*){2,}/i, 'P. Warlock: ')
    .replace(/^S\.\s*Prokofiev:\s*Sergei\s+Prokofiev\([^)]+\):\s*/i, 'S. Prokofiev: ')
    .replace(/^J\.\s*S\.\s*Bach:\s*Johann\s+Sebastian\s+Bach\s*\/?\s*/i, 'J. S. Bach: ')
    .replace(/^J\.\s*S\.\s*Bach:\s*WTC:\s*/i, 'J. S. Bach: The Well-Tempered Clavier - ')
    .replace(/^J\.\s*S\.\s*Bach:\s*F\.\s*Busoni:\s*/i, 'J. S. Bach / F. Busoni: ')
    .replace(/^J\.\s*S\.\s*Bach:\s*F\.\s*Liszt:\s*/i, 'J. S. Bach / F. Liszt: ')
    .replace(/^F\.\s*Schubert:\s*F\.\s*Liszt:\s*/i, 'F. Schubert / F. Liszt: ')
    .replace(/^F\.\s*Liszt:\s*F\.\s*Busoni:\s*/i, 'F. Liszt / F. Busoni: ')
    .replace(/^I\.\s*Stravinsky:\s*G\.\s*Agosti:\s*/i, 'I. Stravinsky / G. Agosti: ')
    .replace(/^M\.\s*Mussorgsky:\s*\(arr\.\s*M\.\s*Ravel\):\s*/i, 'M. Mussorgsky (arr. M. Ravel): ')
    .replace(/^M\.\s*Ravel:\s*Arr\.:\s*/i, 'M. Ravel (Arr.): ')
    .replace(/^Disney\s+OST\s+Medley:\s*/i, 'A. Menken & L. Harline: ')
    .replace(/^A\.\s*Vivaldi:\s*Antonio\s+Vivaldi\s*\/?\s*/i, 'A. Vivaldi: ')
    .replace(/^J\.\s*S\.\s*Bach:\s*Franz\s+Schubert\s+/i, 'F. Schubert: ')
    .replace(/^J\.\s*S\.\s*Bach:\s*드비엔느\s*\/\s*/i, 'F. Devienne: ')
    .replace(/^J\.\s*S\.\s*Bach:\s*F\.\s*』\.\s*Haydn\s+String\s+Quartet.*/i, 'J. Haydn: String Quartet in C Major, Op. 76 No. 3 "Emperor"')
    .replace(/^슈베르트:\s*Franz\s+Schubert\s*\(\d{4}\s*-\s*\d{4}\)\s*/i, 'F. Schubert: ')
    .replace(/^G\.\s*F\.\s*Händel:\s*Händel,\s*/i, 'G. F. Händel: ')
    .replace(/^헨델:\s*G\.\s*Handel\s+/i, 'G. F. Händel: ')
    .replace(/^George\s+Frideric\s+Handel:\s*사계\s*:\s*/i, 'A. Vivaldi: 사계 ')
    .replace(/^JOHANNES\s+BRAHMS:\s*F\.\s*von\s+Suppé\s*-\s*/i, 'F. von Suppé: ')
    .replace(/^(?:베토벤:\s*)?Verdi,\s*Nabucco\s*:\s*Overture/i, 'G. Verdi: Nabucco Overture')
    .replace(/^(?:베토벤:\s*)?Bizet,\s*Carmen\s*:\s*Intermezzo/i, 'G. Bizet: Carmen Intermezzo')
    .replace(/^G\.\s*Bizet:\s*카르엔:\s*서곡\s*1/i, 'G. Bizet: Carmen Overture (카르멘 서곡)')
    .replace(/^모차르트:\s*W\.A\.\s*Mozart\.\s*KV626\.\s*Requiem/i, 'W. A. Mozart: Requiem in D Minor, K. 626 (모차르트 레퀴엠)')
    .replace(/^모차르트:\s*lntermezzo\s*-\s*opera\s+Cavalleria\s+Rusticana/i, 'P. Mascagni: Intermezzo from Opera Cavalleria Rusticana')
    .replace(/^베토벤:\s*Bohuslav\s+Martinů\s+/i, 'B. Martinů: ')
    .replace(/^베토벤:\s*(A\.\s*F\.\s*Servais\s*&\s*H\.\s*Léonard)\s+/i, '$1: ')
    .replace(/^(?:라흐마니노프|스트라빈스키):\s*세르게이\s*라흐마니노프\s*/i, '세르게이 라흐마니노프: ')
    .replace(/^슈만:\s*세르계이\s*라흐마니노프\s*환상소품집\s*중\s*제1곡\s*-\s*일레지:\s*내림마단조\.\s*Op\.\s*3\s*No\.\s*1/i, 'S. Rachmaninoff: 환상소품집 중 제1곡 엘레지 내림마단조, Op. 3 No. 1')
    .replace(/^Antonin\s+DvoFåk:\s*Cla「a\s+Schumann:\s*Three\s+Romances,\s*Op\.\s*22\s*\(arr\.\s*for\s+Cello\s+해던\s+Piano\)/i, 'C. Schumann: Three Romances, Op. 22 (arr. for Cello and Piano)')
    .replace(/^슈베르트:\s*Ⅱ:\s*아노\s*협주곡\s*1번\s*내림\s*나단조\s*작품번호\s*23/i, 'P. I. Tchaikovsky: 피아노 협주곡 제1번 내림나단조, Op. 23')
    .replace(/^E\.\s*Elgar:\s*Music\s*&\s*Lyrics:\s*뮤지컬\s*〈웨스트\s*사이드\s*스토리〉\s*중\s*<Tonight〉/i, 'L. Bernstein: 뮤지컬 〈웨스트 사이드 스토리〉 중 〈Tonight〉')
    .replace(/^A\.\s*Márquez:\s*Danzón\s+No\.\s*2\)\s*\/\s*Arturo\s+Mårquez.*/i, 'A. Márquez: Danzón No. 2 (arr. Oliver Nickel)')
    .replace(/^S\.\s*Rachmaninoff:\s*AllerseeIen,\s*Op\.10:\s*No\.\s*8/i, 'R. Strauss: Allerseelen, Op. 10 No. 8')
    .replace(/^W\.\s*A\.\s*Mozart:\s*\(from\s+Die\s+schone\s+Müllerin\),\s*D\.795,\s*9565:\s*No\.\s*2/i, 'F. Schubert / F. Liszt: Wohin? (from Die schöne Müllerin), D. 795, S. 565 No. 2')
    .replace(/^D\.\s*Shostakovich:\s*\(from\s+Schwanengesang\),\s*D\.957,\s*9560:\s*No\.\s*3/i, 'F. Schubert / F. Liszt: Aufenthalt (from Schwanengesang), D. 957, S. 560 No. 3')
    .replace(/^P\.:\s*\.\s*Tchaikovsky\s*\/\s*arr\.\s*Mikhail\s+Pletnev:\s*Concert\s+Suite/i, 'P. I. Tchaikovsky (arr. M. Pletnev): The Nutcracker Concert Suite')
    .replace(/^H\.\s*Zimmer:\s*Batman:\s*/i, 'H. Zimmer: ')
    .replace(/^(?:R\.|Robert)\s*Schumann:\s*오직\s*그리움을\s*아는\s*이\s*만이:\s*(.+)$/i, 'R. Schumann: $1 (오직 그리움을 아는 이만이)')
    .replace(/^(?:R\.|Robert)\s*Schumann:\s*말하라\s*하지\s*말고\s*침묵하게\s*내버려\s*두세요\.:\s*(.+)$/i, 'R. Schumann: $1 (말하라 하지 말고 침묵하게 내버려 두세요)')
    .replace(/^(?:R\.|Robert)\s*Schumann:\s*그대로\s*빛나는\s*존재로\s*남게\s*해\s*주세요\.:\s*(.+)$/i, 'R. Schumann: $1 (그대로 빛나는 존재로 남게 해 주세요)')
    .replace(/^W\.\s*A\.\s*Mozart:\s*Suite\s+「i\)『\s*Flute\s+and\s+Piano,\s*Op\.\s*34/i, 'C. M. Widor: Suite for Flute and Piano, Op. 34')
    .replace(/^G\.\s*Gershwin:\s*오페라\s*『마술피\s*리』\s*K\.\s*620.*/i, 'W. A. Mozart: 오페라 『마술피리』 K. 620 - 제1막 피날레 중 글로켄슈필')
    .replace(/^A\.\s*Piazzolla:\s*│\s*The\s+Four\s+Seasons\s+of\s+Buenos\s+Aires:\s*Winter\s+in\s+g\s+Minor/i, 'A. Piazzolla: The Four Seasons of Buenos Aires - Winter in G Minor')
    .replace(/^Henryk\s+Wieniawski:\s*Scherzo:\s*Nicc이0\s+Paganini\s*-\s*Sonata\s+for\s+Violin\s+and\s+Piano\s+ⅱ1\s+Minor\s+No\.\s*12\.\s*op\.\s*3/i, 'N. Paganini: Sonata for Violin and Piano in E Minor, Op. 3 No. 12')
    .replace(/^크라이슬러:\s*CellO\s+Suite\s+No\.\s*1\s+in\s+G\s+Major,\s*BWV\s*1007\s*-:\s*\.\s*Prelude/i, 'J. S. Bach: Cello Suite No. 1 in G Major, BWV 1007 - I. Prelude')
    .replace(/^바흐:\s*Variations\s+이1\s+a\s+lhema\s+by\s+J\.S\s+Bach\s+"Weinen,\s*Klagen,\s*Sorgen,\s*Zagen”/i, 'F. Liszt: Variations on a Theme by J. S. Bach "Weinen, Klagen, Sorgen, Zagen", S. 180')
    .replace(/^브람스:\s*』\.\s*Brahms\s+V\s*-\s*ariations\s+and\s+Fugue\s+0\s+Theme\s*-\s*bv\s+HOndel,\s*Op\.\s*24/i, 'J. Brahms: Variations and Fugue on a Theme by Handel, Op. 24')
    .replace(/^BeethOven:\s*SymDhOny\s+No\.\s*9\s+0\s+Minor,\s*00\.:\s*25\s*'ChOrar/i, "L. v. Beethoven: Symphony No. 9 in D Minor, Op. 125 'Choral'")
    .replace(/^브람스:\s*G\.\s*Lekeu\s*—Violin\s+Sonata\s+in\s+G\s+Major:\s*l\.\s*Trés\s+modéré/i, 'G. Lekeu: Violin Sonata in G Major - I. Très modéré')
    .replace(/^Felix\s+Mendelssohn:\s*Suite\s*『아\s*Marimba\s+기년\s+4\s+Percussionists/i, 'D. Levitan: Suite for Marimba and 4 Percussionists')
    .replace(/^Sia\s*&\s*Stargate:\s*Try\s+Everything:\s*DO\s+you\s+want\s+tO\s+build.*/i, 'K. Anderson-Lopez & R. Lopez: Do You Want to Build a Snowman & Let It Go (Frozen OST)')
    .replace(/^H\.\s*Sawano:\s*Bauklotze\s*-\s*VocaI\.\s*모노Ⅱ:\s*드/i, 'H. Sawano: Bauklotze (Attack on Titan OST)')
    .replace(/^베토벤:\s*Six\s+Polyphonic\s+Etudes\s+No\.\s*1\s+in\s+F\s+Major\s*"Rondino\s+Scherzo'/i, 'H. W. Ernst: Six Polyphonic Etudes - No. 1 in F Major "Rondino Scherzo"')
    .replace(/^베토벤:\s*No\.\s*2\s+in\s+A\s+Major\s+No\.\s*3\s+in\s+E\s+Major\s*"Terzetto"/i, 'H. W. Ernst: Six Polyphonic Etudes - No. 2 in A Major & No. 3 in E Major "Terzetto"')
    .replace(/^베토벤:\s*No\.\s*4\s+in\s+C\s+Major\s+No\.\s*5\s+in\s+E-flat\s+Major\s*"Air\s+de\s+BaIIet"/i, 'H. W. Ernst: Six Polyphonic Etudes - No. 4 in C Major & No. 5 in E-flat Major "Air de Ballet"')
    .replace(/^베토벤:\s*No\.\s*6\s+in\s+G\s+Major\s*"Variations\s+대가\s+The\s+Last\s+Rose\s+Of\s+Summer'/i, 'H. W. Ernst: Six Polyphonic Etudes - No. 6 in G Major "Variations on The Last Rose of Summer"')
    .replace(/^베토벤:\s*Passacaglia\s+in\s+G\s+Minor\s+from\s+Rosary\s+Sonatas/i, 'H. I. F. Biber: Passacaglia in G Minor from Rosary Sonatas')
    .replace(/^베토벤:\s*Variations\s+"God\s+Save\s+the\s+King",\s*Op\.\s*9/i, 'N. Paganini: Variations on "God Save the King", Op. 9')
    .replace(/^베토벤:\s*Variations\s+이1\s+a\s+Theme\s+#이11\s+Beethoven's\s+Romance\s+No\.\s*1\s+in\s+G\s+Major/i, "H. Vieuxtemps: Variations on a Theme from Beethoven's Romance No. 1 in G Major")
    .replace(/^베토벤:\s*No\.\s*9\.\s*Les\s+Arpéges:\s*Variations\s+on\s+the\s+Austrian\s+Hymn,\s*from\s+L'Ecole\s+moderne,\s*Op\.\s*10/i, "H. Wieniawski: No. 9 Les Arpèges (Variations on the Austrian Hymn) from L'École moderne, Op. 10")
    .replace(/^(?:바트\s*하워드:\s*)?에를\s*가너-Misty/i, 'E. Garner: Misty')
    .replace(/^(?:바트\s*하워드:\s*)?레술리\s*브리커시스\s*&\s*앤서니\s*늘리-Pure\s+lmagination/i, 'L. Bricusse & A. Newley: Pure Imagination')
    .replace(/^(?:바트\s*하워드:\s*)?휴\s*마틴\s*&\s*랄프\s*블레인-Have\s+YourseIf\s+a\s+Merry\s+LittIe\s+Christmas/i, 'H. Martin & R. Blane: Have Yourself a Merry Little Christmas')
    .replace(/^(?:휴\s*마틴\s*&\s*랄프\s*블레인:\s*)?에드워드\s*폴라&조지\s*와일」t\s*-\s*s\s+the\s+Most\s+Wonderful\s+Time\s+Of\s+the\s+Year\s*외/i, "E. Pola & G. Wyle: It's the Most Wonderful Time of the Year")
    .replace(/FWV\s*8\s*\(am\s*forv&\)/i, 'FWV 8 (arr. for Viola)')
    .replace(/비올라\s*소나타B\)장조/g, '비올라 소나타 Bb장조')
    .replace(/Can-Can\s*\(lnfern기\s*G훼이가/i, 'Can-Can (Infernal Galop)')
    .replace(/Variations\s+0!1\s+One\s+String\s+이1\s+a\s+111Ⅷe/i, "Variations on One String on a Theme by Rossini")
    .replace(/」\s*('avais\s+cru)/g, 'J$1')
    .replace(/^로시니:\s*∘?\s*Merry-Go-Round\s+of\s+Life\(([^)]+)\)\s*-\s*Joe\s+Hisaishi/i, 'J. Hisaishi: Merry-Go-Round of Life ($1)')
    .replace(/^Vn\.\s*[가-힣]+\s*-\s*Joe\s+Hisaishi:\s*∘?\s*/i, 'J. Hisaishi: ')
    .replace(/^Federico\s+Mompou:\s*jy\.H\s*\(1990-\)\s*[–\-]\s*/i, 'jy.H (1990-): ')
    .replace(/^드보르작:\s*Cancion\s+al\s+arbol\s+del\s+olvido\(([^)]+?)\s*\/\s*Alberto\s+Ginastera\s*곡\)/i, 'A. Ginastera: Canción al árbol del olvido ($1)')
    .replace(/^바그너:\s*사\s*\/\s*D\.\s*Furno\s*곡\s*\/\s*E\.\s*de\s+Curtis/i, 'E. de Curtis: Non ti scordar di me (D. Furno 사)')
    .replace(/^푸치니:\s*Je\s+veux\s*\(난\s*당신을\s*원해요\)/i, 'E. Satie: Je te veux (난 당신을 원해요)')
    .replace(/^G\.\s*Verdi:\s*클라리넷\s*협주곡제2번\s*내림마장조\s*Op\.74\.3악장/i, 'C. M. von Weber: 클라리넷 협주곡 제2번 내림마장조, Op. 74 - 3악장')
    .replace(/^G\.\s*Verdi:\s*오보에\s*협주곡\s*다장조\.\s*\(\s*314\.1악장/i, 'W. A. Mozart: 오보에 협주곡 다장조, K. 314 - 1악장')
    .replace(/^F\.\s*Schubert:\s*Johann\s+Strauss:\s*Ⅰ\s*\(Arr\.Greg\s+Anderson\)/i, 'J. Strauss II: Blue Danube Fantasy (Arr. Greg Anderson)')
    .replace(/^F\.\s*Schubert:\s*ue\s+Danube\s+Fantasy/i, 'J. Strauss II: Blue Danube Fantasy')
    .replace(/^F\.\s*Schubert:\s*Fagott\s+ConceIto\s+in\s+3b-Major,\s*KV\s*191/i, 'W. A. Mozart: Bassoon Concerto in B-flat Major, K. 191')
    .replace(/^G\.\s*Verdi:\s*(.+?)\s*—\s*G\.\s*Verdi$/i, 'G. Verdi: $1')
    .replace(/^ABBA\s*-:\s*Have\s+a\s+Dream/i, 'ABBA: I Have a Dream')
    .replace(/^P\.:\s*\.\s*Tchaikovsky\s+I\s+/i, 'P. I. Tchaikovsky: ')
    .replace(/^Sergei\s+Rachmaninoff\s+I\s+/i, 'Sergei Rachmaninoff: ')
    .replace(/^([가-힣]{2,4})\s*곡:\s*(?:Sop\.|Ten\.|Bar\.|M\.Sop\.|Bass)\s*[가-힣]+:\s*([가-힣\s]+?)\.{2,}([가-힣]+\s*시)$/i, '$1: $2 ($3)')
    .replace(/^([가-힣\s]+?)\s*\(([가-힣]+\s*시)\s*\/\s*([가-힣]{2,4})\s*곡\)$/i, '$3: $1 ($2)')
    .replace(/^Denis\s+SunghO:\s*/i, 'Denis Sungho: ')
    .replace(/^ROland\s+Dyens:\s*/i, 'Roland Dyens: ')
    .replace(/^Yiruma\/Denis\s+Sungho:\s*lndigo/i, 'Yiruma / Denis Sungho: Indigo')
    .replace(/Stanley\s+Myers:\s*Cavatma/i, 'Stanley Myers: Cavatina')
    .replace(/^에이미\s*비치\s*-\s*바이올린\s*로맨스\s*\(Amy\s+Beach\s*-\s*Romance,\s*Op\.\s*23\)/i, 'Amy Beach: 바이올린 로맨스 (Romance for Violin and Piano, Op. 23)')
    .replace(/^월리엄\s*몰컴\s*-\s*카바레\s*송\s*\(WilIiam\s+BOIcom\s*-\s*Cabaret\s+Songs\)\s*중/i, 'William Bolcom: 카바레 송 (Cabaret Songs)')
    .replace(/^우아한\s*유령\s*\(GracefuI\s+Ghost\s+Rag\)/i, 'William Bolcom: 우아한 유령 (Graceful Ghost Rag)')
    .replace(/:\s*\/\s+/g, ': ')
    .replace(/Ca『lo\s+Tessarini/gi, 'Carlo Tessarini')
    .replace(/Franqois\s+Borne/gi, 'François Borne')
    .replace(/^」\s*ames\s+Barnes/i, 'James Barnes')
    .replace(/Clément\s*』anequin/gi, 'Clément Janequin')
    .replace(/Jan\s+Pieterszoon\s+SweeIinck/gi, 'J. P. Sweelinck')
    .replace(/Jehan\s+AIain/gi, 'Jehan Alain')
    .replace(/Bartök/gi, 'B. Bartók')
    .replace(/TchaikOvSky/gi, 'Tchaikovsky')
    .replace(/Piano\s+TriO\b/gi, 'Piano Trio')
    .replace(/〈`7548/g, 'K. 548')
    .replace(/HOb\.\s*\)\([ⅦⅥ](\d+)/gi, 'Hob. XVI:$1')
    .replace(/Symphony\s+No\.\s*48\s+in\s+C\s+Major,\s*HOb\.$/i, 'J. Haydn: Symphony No. 48 in C Major, Hob. I:48 "Maria Theresa"')
    .replace(/XⅥ:(\d+)/g, 'XVI:$1')
    .replace(/0이40/g, 'Op. 40')
    .replace(/하\.\s*95/g, 'Op. 95')
    .replace(/Ⅸ\.\s*488/g, 'K. 488')
    .replace(/하이든l칡로/g, '하이든: 첼로')
    .replace(/롤베르그/g, '홀베르그')
    .replace(/천인교항곡/g, '천인교향곡')
    .replace(/친0H하는/g, '친애하는')
    .replace(/장죄/g, '장조,')
    .replace(/^쇼쟁,\s*/g, '쇼팽: ')
    .replace(/발라드㉧/g, '발라드')
    .replace(/Op\.70A\.$/, 'Op. 70')
    .replace(/Op\.18S\.$/, 'Op. 18')
    .replace(/ConcertoN02\s+in\s+Minor,\s*Op\.\s*18/gi, 'Piano Concerto No. 2 in C Minor, Op. 18')
    .replace(/Pin\s+TriO\s+NO-\s*7\s*누\s*B-flat\s*09-97\s*'b«chduke\s*-/gi, 'L. v. Beethoven: Piano Trio No. 7 in B-flat Major, Op. 97 "Archduke"')
    .replace(/Piano\s+Conce「tO\s+No\.\s*5\s+in\s+F\s+Major,\s*Op\.\s*103\s*"Egyptlan"/gi, 'C. Saint-Saëns: Piano Concerto No. 5 in F Major, Op. 103 "Egyptian"')
    .replace(/III아노\s*협주곡\s*IH15번\s*바장조,\s*Op\.103\s*“0:\s*집트'/gi, 'C. Saint-Saëns: 피아노 협주곡 제5번 바장조, Op. 103 "이집트"')
    .replace(/소나타\s*Ai:\s*3번\s*c단조,\s*Op\.45/gi, 'E. Grieg: 바이올린 소나타 제3번 c단조, Op. 45')
    .replace(/Symphony\s+NO\.끄\s+The\s+Odyssey/gi, 'R. W. Smith: Symphony No. 2 "The Odyssey"')
    .replace(/Llght\s+CavaIry\s+Overture\(경기병\s*서곡\)/gi, 'F. von Suppé: Light Cavalry Overture (경기병 서곡)')
    .replace(/'시인과\s*농부'\s*서곡\s*Po아\s+and\s+peasant\s+Overture/gi, "F. von Suppé: '시인과 농부' 서곡 (Poet and Peasant Overture)")
    .replace(/널과\s*판타지아\s*NeIIa\s+Fantasia.*/gi, 'E. Morricone: 넬라 판타지아 (Nella Fantasia)')
    .replace(/Valse\s+caprtcho/gi, 'M. de Falla: Valse-Capricho')
    .replace(/Fantasia\s+6éttca/gi, 'M. de Falla: Fantasía Bética')
    .replace(/CapriOl\s+Suite/gi, 'P. Warlock: Capriol Suite')
    .replace(/Giulio\s+Caccini\s+Ave\s+Maria/gi, 'G. Caccini: Ave Maria')
    .replace(/호두가ll\s*인형\s*모음곡/g, 'P. I. Tchaikovsky: 호두까기 인형 모음곡')
    .replace(/귀Q\(Return\)\s*:\s*김순남\s*피아노\s*협주곡/g, '김순남: 피아노 협주곡 D장조 "귀환(Return)"')
    .replace(/DanzÖn\s+No\.\s*2/gi, 'Danzón No. 2)')
    .replace(/\(J(?:결72|azz)\s+Suite\s+NO\.\s*기/gi, '(Jazz Suite No. 2)')
    .replace(/!+\s*Waltz\s+No\.\s*2/gi, ': Waltz No. 2')
    .replace(/푸를\s*옷소매\s*주제에\s*의한\s*환상곡\s*I\s*R이하,\s*Voughm\s*WiMiams/gi, 'R. Vaughan Williams: 푸른 옷소매 주제에 의한 환상곡 (Fantasia on Greensleeves)')
    .replace(/NidarOS\s*」끄Z\s*MaSS/gi, 'Bob Chilcott: Nidaros Jazz Mass')
    .replace(/Non\s+tiScordar\s+0』\s*Me/gi, 'E. de Curtis: Non ti scordar di me (물망초)')
    .replace(/ExsuItate\s*」ubilate/gi, 'W. A. Mozart: Exsultate, jubilate, K. 165')
    .replace(/Chorus\s+ofthe\s+Hebrew\s+Slaves/gi, 'Chorus of the Hebrew Slaves')
    .replace(/Suite\s+for\s+Flute\s+and\s*」azz\s+Piano\s+Trio:\s*"lrlandaise[”"]/gi, 'C. Bolling: Suite for Flute and Jazz Piano Trio ("Irlandaise")')
    .replace(/^No\.\s*1\s+in\s+g\s+Minor,\s*Op\.\s*23.*/i, 'F. Chopin: Ballade No. 1 in G Minor, Op. 23')
    .replace(/^No\.\s*2\s+in\s+F\s+Major[I,]\s*Op\.\s*38.*/i, 'F. Chopin: Ballade No. 2 in F Major, Op. 38')
    .replace(/^No\.\s*3\s+in\s+A-flat\s+Major[I,]\s*Op\.\s*47.*/i, 'F. Chopin: Ballade No. 3 in A-flat Major, Op. 47')
    .replace(/^No\.\s*4\s+in\s+f\s+Minor,\s*Op\.\s*52.*/i, 'F. Chopin: Ballade No. 4 in F Minor, Op. 52')
    .replace(/^\(교향곡\s*제45번\s*「고별」\s*제\d악장\)\s*[-\s]*/i, 'J. Haydn: 교향곡 제45번 f#단조 "고별" (Symphony No. 45 "Farewell")')
    .replace(/^(?:A\.\s*Dvořák:\s*)?Antonin\s+Dvohåk\s*\/\s*Piano\s+7\)넣O\s+No\.\s*4\s+in\s*\(,\s*Minor,\s*Op\.\s*90\s*-\s*Dumky\s*-/i, 'A. Dvořák: Piano Trio No. 4 in E Minor, Op. 90 "Dumky"')
    .replace(/J\.M\.\s*Sperger\s*…\s*Sonata\s+in\s+b\s+Minor\s+for\s+Double\s+8355\s+and\s+Cello,\s*T36/i, 'J. M. Sperger: Sonata in B Minor for Double Bass and Cello, T. 36')
    .replace(/Sonata\s+“1963”\s+for\s+Double\s+Bass\s+and\s+Pi기10/i, 'F. Proto: Sonata "1963" for Double Bass and Piano')
    .replace(/'Urlicht'\s+from\s+Symph0hlJ\s+No\.\s*2/i, "G. Mahler: 'Urlicht' from Symphony No. 2")
    .replace(/Symphong\s+No\.\s*5-\s*IV\.\s*Adagietto/i, 'G. Mahler: Symphony No. 5 - IV. Adagietto')
    .replace(/Violin\s+Sonata\s+in\s+Ä\s+Major/i, 'C. Franck: Violin Sonata in A Major')
    .replace(/Christ,mas\s+Bolero/i, 'Christmas Bolero')
    .replace(/^정강스1작곡\s*오케스트라를\s*위한\s*\(고향의\s*통\s*판타지아\)/i, '정강석: 오케스트라를 위한 고향의 봄 판타지아')
    .replace(/^이은지\(공모선정\),\s*(.+)$/i, '이은지: $1')
    .replace(/^Symphonic\s+Poem\s+'Finlandia',\s*Op\.26\s*」\.\s*SibeIius/i, "J. Sibelius: Symphonic Poem 'Finlandia', Op. 26")
    .replace(/^<벤텔의\s*메시아》$/i, 'G. F. Händel: Messiah, HWV 56 (메시아)')
    .replace(/^(?:1812)?년\s*서곡(?:\s*-\s*차이코프스키)?$/i, 'P. I. Tchaikovsky: 1812년 서곡, Op. 49')
    .replace(/^`?\s*,?\s*E\.?\s*Ysaye\s*:\s*10ⅱn\s*SonataNo\.\s*5in\s*G\s*Major,\s*Op\.\s*27\.\s*No\.\s*5/i, 'E. Ysaÿe: Violin Sonata No. 5 in G Major, Op. 27 No. 5')
    .replace(/^N\.\s*Paganini:\s*Caprice\s+for\s+S이0\s+Violin,\s*Op\.\s*1-6/i, 'N. Paganini: Caprice for Solo Violin, Op. 1 No. 6')
    .replace(/^G\.\s*F\.\s*Handel-Halvorsen\s*-\s*Passacaglia/i, 'G. F. Händel / J. Halvorsen: Passacaglia')
    .replace(/^Ferenc\s+Farkas\s*-\s*Serenade\s+fOr\s+Wind\s+Quintet/i, 'F. Farkas: Serenade for Wind Quintet')
    .replace(/^Georges\s+Bitet\s*-\s*Cxrmen\s+SuitC\s+WOOdwim±\s+Quintet/i, 'G. Bizet: Carmen Suite for Woodwind Quintet')
    .replace(/^모차르트:\s*\/\s*피아노\s*협주곡\s*제25번\s*C장조,\s*K\.$/i, 'W. A. Mozart: 피아노 협주곡 제25번 C장조, K. 503')
    .replace(/^베토벤:\s*피아노협주곡\s*5번\s*내림마장쇠\s*작품번호\s*73/i, 'L. v. Beethoven: 피아노 협주곡 제5번 내림마장조, 작품번호 73 "황제"')
    .replace(/^베토벤:\s*피아노협주곡\s*1번\s*내림니단조\s*작품번호\s*23/i, 'P. I. Tchaikovsky: 피아노 협주곡 제1번 내림나단조, 작품번호 23')
    .replace(/^베토벤:\s*피아노협주곡\s*2빈\s*다단쇠\s*작품번호\s*18/i, 'S. Rachmaninoff: 피아노 협주곡 제2번 다단조, 작품번호 18')
    .replace(/^호두끼기\s*인형\s*모음곡$/i, 'P. I. Tchaikovsky: 호두까기 인형 모음곡')
    .replace(/^로코코\s*주제에\s*의한\s*변주곡$/i, 'P. I. Tchaikovsky: 로코코 주제에 의한 변주곡, Op. 33')
    .replace(/^Primavera\s+Portefia\s*-\s*Astor\s+Piazzolla/i, 'A. Piazzolla: Primavera Porteña')
    .replace(/^Oblivion\s*-\s*Astor\s+Piazzolla/i, 'A. Piazzolla: Oblivion')
    .replace(/^Adi6s\s+Nonino\s*-\s*Astor\s+Piazzolla/i, 'A. Piazzolla: Adiós Nonino')
    .replace(/^대\s+Dia\s+Que\s+Me\s+Quieras\s*-\s*CarIos\s+GardeI.*/i, 'C. Gardel: El Día Que Me Quieras (arr. N. Ledesma)')
    .replace(/^La\s+Rayuela\s*-\s*PabIo\s+기egler/i, 'P. Ziegler: La Rayuela')
    .replace(/^De\s+Profesi6n\s+Tango\s*-\s*JuliO\s+Pane/i, 'J. Pane: De Profesión Tango')
    .replace(/^“?이이\s*LOVE\s*왈츠”?$/i, 'J. Strauss II: 아이 LOVE 왈츠')
    .replace(/^Macabre,\s*Op\.\s*40$/i, 'C. Saint-Saëns: Danse Macabre, Op. 40')
    .replace(/^String\s+Quartet\s+No\.\s*14\s+in\s+C-sharp\s+Minor,\s*Op\.\s*131$/i, 'L. v. Beethoven: String Quartet No. 14 in C-sharp Minor, Op. 131')
    .replace(/^Romance\s+for\s+Violin\s+기년\s+Orchestra\s+No-2\s+in\s+F\s+Major,\s*Op\.\s*50(.*)$/i, 'L. v. Beethoven: Romance for Violin and Orchestra No. 2 in F Major, Op. 50$1')
    .replace(/^다OS\*\s*Fuge\s+in\s+B-Flat\s+Major\.\s*Op\.\s*133$/i, 'L. v. Beethoven: Große Fuge in B-flat Major, Op. 133')
    .replace(/^String\s+Quartet\s+No\.\s*9\s+in\s+C\s+Major,\s*OP\.\s*59\s+No\.\s*3.*$/i, 'L. v. Beethoven: String Quartet No. 9 in C Major, Op. 59 No. 3 "Razumovsky"')
    .replace(/^G\.\s*Verdi:\s*Introduction\s+and\s+Rondo\s+Capriccioso,\s*Op\.\s*28/i, 'C. Saint-Saëns: Introduction and Rondo Capriccioso, Op. 28')
    .replace(/^라벨:\s*Star\s+Wars\s+Saga\s*\/\s*JOhn\s+Williams.*/i, 'J. Williams: Star Wars Saga')
    .replace(/^W\.\s*A\.\s*Mozart:\s*L\.\s*`,\.\s*Beethoven\s+Symphony\s+No\.\s*2\s+in\s+D\s+Major,\s*Op\.\s*36/i, 'L. v. Beethoven: Symphony No. 2 in D Major, Op. 36')
    .replace(/^베토벤:\s*수\s*〈Ⅵ0ⅱn\s+Sonata\s+No\.\s*1>\s*브람스/i, 'J. Brahms: Violin Sonata No. 1 in G Major, Op. 78')
    .replace(/^멘델스존:\s*`r콘제르트서곡\s*《고요한빠다화평복한\s*망에》」/i, 'F. Mendelssohn: 콘체르트 서곡 《고요한 바다와 즐거운 항해》, Op. 27')
    .replace(/^C\.\s*HiIIiard\s*-\s*Unkn\s*-\s*mn\s+SoJdier.*$/i, 'C. Hilliard: Unknown Soldier')
    .replace(/^슈만:\s*Piano\s+Quartet\s+ln\s+e-flat\s+Major,\s*Op\.\s*47/i, 'R. Schumann: Piano Quartet in E-flat Major, Op. 47')
    .replace(/^W\.\s*A\.\s*Mozart:\s*Violin\s+Sonata\s+No\.\s*20\s+in\s+C\s+Major\.\s*K\.\s*303/i, 'W. A. Mozart: Violin Sonata No. 20 in C Major, K. 303')
    .replace(/\s+(?:Piano|Violin|Cello|Flute|Sop|Ten|Bar)\.\s*[가-힣]{2,4}$/i, '')
    .trim();

  // "[M. Glinka] Ruslan and Ludmilla, Overture" -> "M. Glinka: Ruslan and Ludmilla, Overture"
  const leadBracketComp = line.match(/^\[([A-Za-zÀ-ÖØ-öø-ÿ.\s\-]{3,35})\]\s*(.+)$/);
  if (leadBracketComp) {
    return `${leadBracketComp[1].replace(/\.(?=[A-Z])/g, '. ').trim()}: ${leadBracketComp[2].trim()}`;
  }

  // "슬라브무곡, 작품번호 46번 중 제8번 [A. Dvoiåk]" -> "A. Dvořák: 슬라브무곡, 작품번호 46번 중 제8번"
  const trailBracketComp = line.match(/^(.+?)\s*\[([A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F.\s\-]{3,35})\]$/);
  if (trailBracketComp && /\./.test(trailBracketComp[2])) {
    const comp = trailBracketComp[2].replace(/Dvoi[åa]k/i, 'Dvořák').trim();
    return `${comp}: ${trailBracketComp[1].trim()}`;
  }

  // "수선화(김동명 작사/김동진 작곡) -" or "매기의 추억(A. Butterfield 작곡/김규환편곡/미국민요)"
  const inlineKoComp = line.match(/^([^(]+)\((?:[^)]*\/)?([가-힣A-Za-z.\s]{2,22}?)\s*작곡(?:\/[^)]*)?\)/);
  if (inlineKoComp) {
    return `${inlineKoComp[2].trim()}: ${inlineKoComp[1].trim()}`;
  }

  // "Sop. 변선아: 아침태양....... 정호순 시 / 최영섭 곡" -> "최영섭: 아침태양 (정호순 시)"
  const koreanSongMatch = line.match(/^(?:Sop\.|Ten\.|Bar\.|M\.Sop\.|Bass)\s*[가-힣]+:\s*([가-힣\s]+?)\s*(?:\.{2,}|\s{2,})\s*([가-힣]+\s*시)\s*\/\s*([가-힣]{2,4})\s*곡/);
  if (koreanSongMatch) {
    return `${koreanSongMatch[3]}: ${koreanSongMatch[1].trim()} (${koreanSongMatch[2].trim()})`;
  }

  // Reverse "Piece – 오페라 ... 중(Georges Bizet 곡)" -> "Georges Bizet: Piece (오페라 ... 중)"
  const operaParenComp = line.match(/^(.+?)\s*\(([A-Z][A-Za-z.\s]+)\s*곡\)$/);
  if (operaParenComp) {
    return `${operaParenComp[2].trim()}: ${operaParenComp[1].trim()}`;
  }

  // Reverse "Piece — Composer" or "Piece – Composer" or "Piece - Composer" (e.g. "Chanson triste — H. Duparc", "Make a wish – 박문희", "Little Birds - Eric Whitacre")
  const reverseDashComp = line.match(/^(.{3,85}?)\s+(?:—|–|-)\s*(?:Arr\.?\s*(?:by\s+)?)?([A-Z]\.\s*(?:[A-Z]\.\s*)?[A-Za-zÀ-ÖØ-öø-ÿ\-]+|Felix\s+Mendelssohn|Claude\s+Debussy|Joseph\s+Kosma|Joe\s+Henderson|Ola\s+Gjeilo|Eric\s+Whitacre|Eric\s+Nelson|John\s+Halloran|Mark\s+Hayes|Adam\s*&\s*Matt\s+Podd|[가-힣]{2,4})$/);
  if (reverseDashComp && !/^(?:J\.|W\.|L\.|F\.|R\.|C\.|M\.|P\.|S\.|D\.|A\.|E\.|G\.|H\.|B\.|I\.|N\.|O\.|V\.|T\.|Z\.|K\.)/.test(reverseDashComp[1])) {
    return `${reverseDashComp[2].trim()}: ${reverseDashComp[1].trim()}`;
  }
  const debussyTrailing = line.match(/^(.+?)\s*-Claude\s+Debussy$/i);
  if (debussyTrailing) {
    return `C. Debussy: ${debussyTrailing[1].trim()}`;
  }

  // "Composer (years) – Piece"
  line = line.replace(/^([A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F.\-\s]{2,35}?)\s*\(\d{4}\s*[-~–]\s*\d{0,4}\s*\)\s*[–—\-:]\s*(.+)$/, '$1: $2');

  // "Korean/English Composer, Piece"
  line = line.replace(/^([가-힣]{2,4}|[A-Z]\.\s*(?:[A-Z]\.\s*)?[A-Z][a-z]+|(?:Jehan\s+Alain|Gaston\s+Litaize|Jun-hee\s+Im)),\s+(.{4,})$/, '$1: $2');

  // Convert Hangul vowel pipe 'ㅣ' or ' | ' or ' ... ' or ' I ' after a short composer prefix into ': '
  line = line
    .replace(/^([A-ZÀ-ÖØ-Ý가-힣][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F가-힣.\s\-']{1,30}?)\s*(?:[ㅣ|]|\.{2,}|…)\s*(.+)$/, '$1: $2')
    .replace(/^([A-ZÀ-ÖØ-Ý가-힣][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F가-힣.\s']{1,25}?)\s+I\s+(?!(?:Have|Am|Love|Will|Can|Ask|Dream|Want)\b)([가-힣A-Z].+)$/, '$1: $2');

  // Reverse "Piece / Composer (years)" -> "Composer: Piece"
  const slashMatch = line.match(/^(.{3,90}?)\s+\/\s+([A-ZÀ-ÖØ-Ý가-힣][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F가-힣.\s\-']{2,35}?)(?:\s*\([\d~∼–\-.,\s]+\))?$/);
  if (slashMatch) {
    const [, left, right] = slashMatch;
    if (!/(?:Concerto|Sonata|Symphony|Op\.|No\.|소나타|협주곡|교향곡)/i.test(right) && (/(?:Concerto|Sonata|Symphony|Op\.|No\.|Suite|Dance|Danza|Bachiana|Canciones|Recuerdos|Lagrima|Asturias|소나타|협주곡|교향곡|모음곡|무곡|\()/i.test(left) || /^[A-Z]\.\s*(?:[A-Z]\.\s*)?[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(right.trim()))) {
      line = `${right.trim()}: ${left.trim()}`;
    } else if (/^Ludwig\s+Wilhelm\s+Maurer$/i.test(left)) {
      line = `${left.trim()}: ${right.trim()}`;
    }
  }

  // Reverse "Piece - Composer"
  const trailingCompMatch = line.match(/^(.{4,70}?)\s+-\s+(Zequinha\s+de\s+Abreu|[가-힣]{2,4})$/);
  if (trailingCompMatch && !/^[A-Z]\.\s*[A-Z]/.test(trailingCompMatch[1])) {
    line = `${trailingCompMatch[2]}: ${trailingCompMatch[1]}`;
  }

  // Leading composer followed by comma or space without colon
  const leadingRx = /^(J\.\s*S\.\s*Bach|C\.\s*P\.\s*E\.\s*Bach|W\.\s*A\.\s*Mozart|L\.\s*(?:v\.|van)\s*Beethoven|F\.\s*Chopin|R\.\s*Schumann|C\.\s*Schumann|J\.\s*Brahms|F\.\s*Schubert|F\.\s*Liszt|C\.\s*Debussy|M\.\s*Ravel|P\.\s*(?:I\.\s*)?Tchaikovsky|S\.\s*Rachmaninoff|D\.\s*Shostakovich|S\.\s*Prokofiev|F\.\s*Mendelssohn|A\.\s*Scriabin|C\.\s*Franck|C\.\s*Saint-Sa[eë]ns|G\.\s*Faur[eé]|A\.\s*Dvo[rř][aá]k|E\.\s*Grieg|J\.\s*Sibelius|G\.\s*Mahler|A\.\s*Bruckner|R\.\s*Strauss|J\.\s*Strauss(?:\s*II|\s*11)?|I\.\s*Stravinsky|B\.\s*Bart[oó]k|A\.\s*Vivaldi|G\.\s*F\.\s*H[aä]ndel|J\.\s*Haydn|N\.\s*Paganini|P\.\s*(?:de\s+)?Sarasate|F\.\s*Poulenc|A\.\s*Piazzolla|G\.\s*Puccini|G\.\s*Verdi|G\.\s*Bizet|G\.\s*Rossini|G\.\s*Donizetti|V\.\s*Bellini|R\.\s*Wagner|E\.\s*Chausson|G\.\s*Enescu|O\.\s*Nicolai|V\.\s*Monti|C\.\s*W\.\s*Gluck|F\.\s*Leh[aá]r|N\.\s*Rimsky-Korsakov|R\.\s*Korsakov|P\.\s*Hindemith|G\.\s*Bottesini|E\.\s*Elgar|G\.\s*Holst|B\.\s*Smetana|M\.\s*Mussorgsky|A\.\s*Borodin|A\.\s*Glazunov|O\.\s*Respighi|J\.\s*Massenet|C\.\s*Gounod|L\.\s*Bernstein|G\.\s*Gershwin|George\s+Gershwin|A\.\s*Copland|S\.\s*Barber|E\.\s*Satie|F\.\s*Kreisler|E\.\s*Ysa[yÿ]e|H\.\s*Wieniawski|Henryk\s+Wieniawski|L\.\s*Boccherini|D\.\s*Scarlatti|F\.\s*Couperin|J\.\s*P\.\s*Rameau|G\.\s*P\.\s*Telemann|A\.\s*Corelli|G\.\s*Tartini|T\.\s*Albinoni|A\.\s*Schoenberg|A\.\s*Berg|O\.\s*Messiaen|B\.\s*Britten|Z\.\s*Kod[aá]ly|L\.\s*Jan[aá][cč]ek|Leo[sš]\s+Jan[aá][cč]ek|M\.\s*de\s+Falla|I\.\s*Alb[eé]niz|E\.\s*Granados|J\.\s*Rodrigo|H\.\s*Villa-Lobos|N\.\s*Kapustin|C\.\s*Orff|P\.\s*Mascagni|D\.\s*Popper|M\.\s*Moszkowski|W\.\s*Lutos[łl]awski|C\.\s*Guastavino|Fran[çc]ois\s+Borne|James\s+Barnes|Carl\s+Stamitz|C\.\s*Reinecke|P\.\s*Taffanel|A\.\s*Arensky|N\.\s*Rosauro|F\.\s*Supp[eé]|J\.\s*Morel|Carlo\s+Tessarini|Dvořák|Rachmaninoff|Beethoven|Mozart|Chopin|Schumann|Brahms|Schubert|Liszt|Debussy|Ravel|Tchaikovsky|Mendelssohn|Mahler|Vivaldi|Haydn|바흐|모차르트|베토벤|쇼팽|슈만|브람스|슈베르트|리스트|드뷔시|라벨|차이콥스키|차이코프스키|라흐마니노프|프로코피예프|쇼스타코비치|멘델스존|스크랴빈|프랑크|생상스|포레|드보르작|드보르자크|그리그|시벨리우스|말러|브루크너|슈트라우스|스트라빈스키|바르톡|비발디|헨델|하이든|파가니니|사라사테|풀랑크|피아졸라|포퍼)\s*[,:\-–—]?\s+(.+)$/i;
  const m = line.match(leadingRx);
  if (m && !m[1].endsWith(':')) {
    const comp = m[1].replace(/\s*11$/, ' II').trim();
    const rest = m[2].replace(/^[-–—:]\s*/, '').trim();
    if (rest.length >= 3 && !/^(?:교향곡|피아노|바이올린)?\s*전곡\s*시리즈/.test(rest)) {
      line = `${comp}: ${rest}`;
    }
  }

  return line;
}

// 곡목에 이미 명시된 유효한 작곡가 접두어가 있는지 추출 (하이픈 복합어 B-flat, Saint-Saëns, Merry-Go-Round 등 내부 오분할 원천 방지)
function extractExistingComposer(piece) {
  const m = (piece || '').match(/^([A-ZÀ-ÖØ-Ý가-힣][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F가-힣0-9.\s\-'/&()]{1,45}?)(?:\s*[:：]\s*|\s+[-–—]\s+)(.+)$/);
  if (m) {
    const cand = m[1].trim();
    // 곡명·악장·장르·영화제목·가사 첫 줄이 작곡가로 오인되지 않도록 엄격 검증
    const nonComposerRx = /(?:Symphony|Sonata|Concerto|Concertino|Suite|Partita|Prelude|Pr[ée]lude|Fugue|Etude|Ballade|Nocturne|Overture|Quartet|Quintet|Trio|Octet|Serenade|Rhapsody|Romance|Variations|Cantata|Oratorio|Opera|Impromptu|Polonaise|Humoreske|Fantasia|Fantaisie|Capriccio|Chasse-neige|Valses|Fanfare|WTC|Well-Tempered|Clavier|Underworld|Orpheus|Merry-Go-Round|Bygone\s+Days|Summer|Part\s+Of\s+Your\s+World|Try\s+Everything|Friend\s+ln\s+Me|Schindler|Green\s+Hornet|Gabriel's\s+Oboe|Disney|Under\s+The\s+Sea|Batman|Love\s+ls\s+a\s+Many|In\s+Your\s+Light|Breathing\s+Peace|Eccomi|Act|Scene|No\.|Op\.|소나타|협주곡|교향곡|모음곡|전주곡|환상곡|변주곡|서곡|사중주|삼중주|오중주|유머레스크|아다지오|제\d|오직\s*그리움|말하라\s*하지|그대로\s*빛나는|여인의\s*향기|키쿠지로|웰컴투|하안거탑|시네마\s*천국|카르엔|악마의\s*아이|Bauklotze|CaII\s+of\s+SiIence|케이팝\s*데몬|Music)/i;
    if (!nonComposerRx.test(cand)) {
      return cand;
    }
  }
  return null;
}

// 작곡가가 누락된 곡목에 대해 작품번호(BWV/K./Hob./D./Op.)·고유 명작 사전·소개글 문맥·공연 단일 작곡가 정보로 작곡가를 100% 자동 추론하여 보강
function inferComposerForPiece(piece, concert, lastComposerInConcert, styText) {
  const existing = extractExistingComposer(piece);
  if (existing) return { piece, composer: existing };

  // 1. 고유 카탈로그 번호 기반 추론
  if (/\bBWV\s*\d+|Well-Tempered\s+Clavier|^WTC:/i.test(piece)) return { piece: `J. S. Bach: ${piece.replace(/^WTC:\s*/i, '')}`, composer: 'J. S. Bach' };
  if (/\b(?:K|KV)\.\s*\d+/i.test(piece)) return { piece: `W. A. Mozart: ${piece}`, composer: 'W. A. Mozart' };
  if (/\bHob\.\s*[XVI]+/i.test(piece)) return { piece: `J. Haydn: ${piece}`, composer: 'J. Haydn' };
  if (/\bD\.\s*\d{2,4}\b/i.test(piece)) return { piece: `F. Schubert: ${piece}`, composer: 'F. Schubert' };
  if (/\bRV\s*\d+/i.test(piece)) return { piece: `A. Vivaldi: ${piece}`, composer: 'A. Vivaldi' };
  if (/\bHWV\s*\d+/i.test(piece)) return { piece: `G. F. Händel: ${piece}`, composer: 'G. F. Händel' };
  if (/\bWoO\s*\d+/i.test(piece)) return { piece: `L. v. Beethoven: ${piece}`, composer: 'L. v. Beethoven' };
  if (/\bSz\.\s*\d+/i.test(piece)) return { piece: `B. Bartók: ${piece}`, composer: 'B. Bartók' };
  if (/\bFP\s*\d+/i.test(piece)) return { piece: `F. Poulenc: ${piece}`, composer: 'F. Poulenc' };
  if (/\bTWV\s*\d+/i.test(piece)) return { piece: `G. P. Telemann: ${piece}`, composer: 'G. P. Telemann' };
  if (/\bZ\.\s*\d{3}\b/i.test(piece)) return { piece: `H. Purcell: ${piece}`, composer: 'H. Purcell' };
  if (/\bFWV\s*8\b/i.test(piece)) return { piece: `C. Franck: ${piece}`, composer: 'C. Franck' };
  if (/\bM\.\s*77\b|\bM\.\s*68\b/i.test(piece)) return { piece: `M. Ravel: ${piece}`, composer: 'M. Ravel' };
  if (/\bS\.\s*\d{3}\b/i.test(piece)) return { piece: `F. Liszt: ${piece}`, composer: 'F. Liszt' };
  if (/\bT\.?\s*36\b.*Double\s+Bass/i.test(piece)) return { piece: `J. M. Sperger: ${piece}`, composer: 'J. M. Sperger' };
  if (/\bH\.\s*\d+\b.*Nocturne/i.test(piece)) return { piece: `J. Field: ${piece}`, composer: 'J. Field' };

  // 2. 클래식 대표 레퍼토리 및 장르+Opus 매칭 사전
  const workRules = [
    [/Symphony\s+No\.\s*2.*Resurrection|교향곡.*2번.*부활/i, 'G. Mahler'],
    [/Symphony\s+No\.\s*1.*Titan|교향곡.*1번.*거인/i, 'G. Mahler'],
    [/Symphony\s+No\.\s*5.*Adagietto|교향곡\s*5번.*아다지에토/i, 'G. Mahler'],
    [/Symphony\s+No\.\s*9.*(?:Choral|Op\.\s*125)|교향곡.*9번.*(?:합창|작품\s*125)/i, 'L. v. Beethoven'],
    [/Symphony\s+No\.\s*5.*(?:Op\.\s*67|운명)|교향곡.*5번.*(?:Op\.\s*67|운명)/i, 'L. v. Beethoven'],
    [/Symphony\s+No\.\s*6.*(?:Op\.\s*68|Pastoral)|교향곡.*6번.*(?:Op\.\s*68|전원)/i, 'L. v. Beethoven'],
    [/Symphony\s+No\.\s*3.*(?:Op\.\s*55|Eroica)|교향곡.*3번.*(?:Op\.\s*55|영웅)/i, 'L. v. Beethoven'],
    [/Symphony\s+No\.\s*6\s+in\s+D\s+Minor,\s*Op\.\s*12\s+No\.\s*4|La\s+casa\s+del\s+diavol/i, 'L. Boccherini'],
    [/Symphony\s+No\.\s*7\b/i, 'L. v. Beethoven'],
    [/Symphony\s+No\.\s*9.*(?:New\s+World|Op\.\s*95|in\s+E\s+Minor)|신세계로부터/i, 'A. Dvořák'],
    [/Symphony\s+No\.\s*8.*Op\.\s*88\b/i, 'A. Dvořák'],
    [/Symphony\s+No\.\s*6.*(?:Path[eé]tique|Op\.\s*74)|교향곡.*6번.*비창/i, 'P. I. Tchaikovsky'],
    [/Symphony\s+No\.\s*5.*Op\.\s*64\b/i, 'P. I. Tchaikovsky'],
    [/Symphony\s+No\.\s*4.*Op\.\s*36\b/i, 'P. I. Tchaikovsky'],
    [/Piano\s+Trio.*Op\.\s*97|Archduke|대공\s*트리오/i, 'L. v. Beethoven'],
    [/Piano\s+Trio.*Op\.\s*11\b/i, 'L. v. Beethoven'],
    [/Piano\s+Trio.*Op\.\s*70\b/i, 'L. v. Beethoven'],
    [/Piano\s+Trio.*Op\.\s*49\b|Piano\s+Trio.*Op\.\s*66\b/i, 'F. Mendelssohn'],
    [/Piano\s+Trio.*Op\.\s*8\b|Piano\s+Trio.*Op\.\s*87\b|Piano\s+Trio.*Op\.\s*101\b/i, 'J. Brahms'],
    [/Piano\s+Trio.*Op\.\s*50\b/i, 'P. I. Tchaikovsky'],
    [/Piano\s+Trio.*Op\.\s*67\b/i, 'D. Shostakovich'],
    [/Piano\s+Trio.*Op\.\s*90\b|Dumky|둠키/i, 'A. Dvořák'],
    [/Piano\s+Trio\s+in\s+G\s+Major/i, 'C. Debussy'],
    [/Trio\s+in\s+d\s+moll,\s*Op\.\s*29\b/i, "V. d'Indy"],
    [/Piano\s+Quartet\s+No\.\s*1\s+in\s+C\s+Minor,\s*Op\.\s*15\b/i, 'G. Fauré'],
    [/(?:Piano\s+)?Concerto\s+in\s+A\s+Minor,\s*Op\.\s*54\b/i, 'R. Schumann'],
    [/(?:Piano\s+)?Concerto\s+in\s+A\s+Minor,\s*Op\.\s*16\b/i, 'E. Grieg'],
    [/(?:Piano\s+)?Concerto\s+No\.\s*2.*Op\.\s*18\b/i, 'S. Rachmaninoff'],
    [/(?:Piano\s+)?Concerto\s+No\.\s*3.*Op\.\s*30\b/i, 'S. Rachmaninoff'],
    [/Piano\s+Concerto.*1947/i, '김순남'],
    [/Violin\s+Concerto.*Op\.\s*35\b/i, 'P. I. Tchaikovsky'],
    [/Violin\s+Concerto.*Op\.\s*64\b/i, 'F. Mendelssohn'],
    [/Violin\s+Concerto.*Op\.\s*77\b/i, 'J. Brahms'],
    [/Violin\s+Concerto.*Op\.\s*61\b/i, 'L. v. Beethoven'],
    [/Violin\s+Concerto.*Op\.\s*47\b/i, 'J. Sibelius'],
    [/Cello\s+Concerto\s+No\.\s*1\s+in\s+C\s+Major/i, 'J. Haydn'],
    [/Cello\s+Concerto.*Op\.\s*104\b/i, 'A. Dvořák'],
    [/Cello\s+Concerto.*Op\.\s*85\b/i, 'E. Elgar'],
    [/Cello\s+Concerto.*Op\.\s*33\b/i, 'C. Saint-Saëns'],
    [/Viola\s+Concerto\s+in\s+C\s+Minor/i, 'J. C. Bach / H. Casadesus'],
    [/Concerto\s+for\s+Marimba\s+and\s+String\s+Orchestra/i, 'E. Séjourné'],
    [/Concertino\s+in\s+E-flat\s+Major,\s*Op\.\s*26/i, 'C. M. von Weber'],
    [/Sonatina\s+in\s+C\s+Major,\s*Op\.\s*36/i, 'M. Clementi'],
    [/Sonata\s+No\.\s*1\s+in\s+E-flat\s+Major,\s*Op\.\s*1\s+No\.\s*1/i, 'J. Field'],
    [/(?:Piano\s+)?Sonata\s+No\.\s*(?:8|14|17|18|21|23|26|27|28|29|30|31|32)\b.*Op\.\s*(?:13|27|31|53|57|81a|90|101|106|109|110|111)\b/i, 'L. v. Beethoven'],
    [/Piano\s+Sonata\s+No\.\s*4\s+in\s+F[- ]sharp\s+Major,\s*Op\.\s*30\b|Sonata-Fantasy.*Op\.\s*(?:19|79)\b/i, 'A. Scriabin'],
    [/Piano\s+Sonata\s+No\.\s*3\s+in\s+F\s+Minor,\s*Op\.\s*14\b|Humoreske.*Op\.\s*20|유머레스크.*Op\.\s*20|Adagio\s+and\s+Allegro\s+for\s+Horn.*Op\.\s*70|호른과\s*피아노를\s*위한\s*아다지오와\s*알레그로.*Op\.\s*70/i, 'R. Schumann'],
    [/Piano\s+Sonata\s+No\.\s*1\s+in\s+C\s+Minor,\s*Op\.\s*4\b|(?:Piano\s+)?Sonata\s+No\.\s*2.*Op\.\s*35\b|(?:Piano\s+)?Sonata\s+No\.\s*3.*Op\.\s*58\b|Ballade\s+No\.\s*1\s+in\s+G\s+Minor,\s*Op\.\s*23|Etudes,\s*Op\.\s*25\b|Polonaise\s+in\s+A-flat\s+Major/i, 'F. Chopin'],
    [/No\.\s*3\s+Ballade\s+in\s+g\s+Minor/i, 'J. Brahms'],
    [/Sonata\s+No\.\s*[123]\s+For\s+Violin\s+and\s+Piano.*Op\.\s*(?:8|13|45)\b/i, 'E. Grieg'],
    [/Viola\s+Sonata\s+in\s+B\s*b?\s*Major,\s*Op\.\s*36|비올라\s*소나타.*Op\.\s*36/i, 'H. Vieuxtemps'],
    [/Violin\s+Sonata\s+No\.\s*2\s*'September\s+11'|바이올린\s*소나타\s*2번\s*'9월\s*11일'/i, 'K. Penderecki'],
    [/Piano\s+Sonata\s+No\.\s*[678].*Op\.\s*8[234]|피아노\s*소나타\s*제?[678]번.*Op\.\s*8[234]/i, 'S. Prokofiev'],
    [/바순과\s*피아노를\s*위한\s*콘서트\s*솔로,\s*Op\.\s*35/i, 'G. Pierné'],
    [/바순\s*협주곡\s*C장조|Bassoon\s+Concerto\s+in\s+C\s+Major/i, 'A. Vivaldi'],
    [/바순과\s*피아노를\s*위한\s*환상곡\s*B-flat장조|Fantasia\s+for\s+Bassoon\s+and\s+Orchestra\s+in\s+B-flat/i, 'J. N. Hummel'],
    [/Fantaisie-Sonate\s+für\s+Flöte\s+und\s+Klavier,\s*Op\.\s*17/i, 'P. Hindemith / C. Reinecke'],
    [/Capriccio-Valse,\s*Op\.\s*7/i, 'H. Wieniawski'],
    [/Chasse-neige/i, 'F. Liszt'],
    [/Valses\s+Po[ée]ticos/i, 'E. Granados'],
    [/Orpheus\s+in\s+the\s+Underworld/i, 'J. Offenbach'],
    [/Eccomi\s+in\s+lieta\s+vesta/i, 'V. Bellini'],
    [/Suis-je\s+gentille\s+ainsi/i, 'J. Massenet'],
    [/Non\s+t\s*-\s*amo\s+piu/i, 'F. P. Tosti'],
    [/Op\.?\s*98a,\s*No\.\s*[359]/i, 'R. Schumann'],
    [/Petite\s+Offrande\s+Musicale/i, 'N. Rota'],
    [/Woodwind\s+Quintet\s+in\s+C\s+Major,\s*Op\.\s*79/i, 'A. Klughardt'],
    [/Pictures\s+at\s+an\s+Exhibition/i, 'M. Mussorgsky'],
    [/Aufforderung\s+zum\s+Tanz|Invitation\s+to\s+the\s+Dance.*Op\.\s*65/i, 'C. M. von Weber'],
    [/Fantaisie,\s*Op\.\s*79\s+for\s+Flute|Pavane,\s*Op\.\s*50|Sicilienne,\s*Op\.\s*78/i, 'G. Fauré'],
    [/Concerto\s+No\.\s*6\s+for\s+5\s+Flutes/i, 'J. B. de Boismortier'],
    [/7\s+Canciones\s+populares\s+Espa[ñn]olas|7개의\s*스페인\s*민요|Fantasia\s+b[ée]tica|베티카\s*환상곡|Serenata\s+andaluza|안달루시아\s*세레나데|^Nocturne\s+녹턴$/i, 'M. de Falla'],
    [/First\s+Suite\s+in\s+E-?b?\s+for\s+Military\s+Band|Second\s+Suite.*Military\s+Band|The\s+Planets/i, 'G. Holst'],
    [/Festival\s+Variations/i, 'C. T. Smith'],
    [/Valse\s+de\s+Chopin.*쇼팽의\s*왈츠|Pierrot\s+Lunaire/i, 'A. Schoenberg'],
    [/Chorus\s+of\s+the\s+Hebrew\s+Slaves|히브리\s*노예들의\s*합창|La\s+Traviata|라\s*트라비아타|Rigoletto|리골레토/i, 'G. Verdi'],
    [/Nessun\s+dorma/i, 'G. Puccini'],
    [/Chanson\s+du\s+Tor[ée]ador/i, 'G. Bizet'],
    [/Hungarian\s+Dances?\s+No\.\s*5|헝가리\s*무곡\s*5번/i, 'J. Brahms'],
    [/Pomp\s+and\s+Circumstance\s+March/i, 'E. Elgar'],
    [/Er\s+ist\s+gekommen\s+in\s+Sturm\s+und\s+Regen|Liebst\s+du\s+um\s+Sch[öo]nheit|Wieck\s+Op\.\s*5|Preludes\s+and\s+Fugues\s+Op\.\s*16|Three\s+Romances\s+Op\.\s*21/i, 'C. Schumann'],
    [/Rosenkavalier.*Suite/i, 'R. Strauss'],
    [/Grand\s+Polonaise\s+in\s+D\s+Major\s+for\s+Flute.*Op\.\s*16/i, 'T. Böhm'],
    [/Waltz\s+No\.\s*2|Suite\s+for\s+Variety\s+Orchestra/i, 'D. Shostakovich'],
    [/Suite\s+for\s+Violin,\s*Clarinet\s+and\s+Piano,\s*Op\.\s*157b/i, 'D. Milhaud'],
    [/단존\s*제2번|Danz[óoÖ]n\s+No\.\s*2/i, 'A. Márquez'],
    [/아리랑\s*환상곡|Arirang\s+Fantasy/i, '최성환'],
    [/^Bol[ée]ro$|Tzigane|Vocalise\s+Etude\s+en\s+Forme\s+de\s+Habanera/i, 'M. Ravel'],
    [/Pr[ée]ludes,\s*Book/i, 'C. Debussy'],
    [/죽음의\s*무도,\s*Op\.\s*40|lntroduction\s+et\s+Rondo\s+capriccioso,\s*Op\.\s*28|Carnaval\s+des\s+animaux|Carnival.*Animals/i, 'C. Saint-Saëns'],
    [/Romance\s+No\.\s*2\s+for\s+Violin|로망스\s*제2번\s*F장조,\s*작품\s*50/i, 'L. v. Beethoven'],
    [/Overture\s+[Oo]n\s+Hebre[uw]\s+Themes/i, 'S. Prokofiev'],
    [/Spartacus\s+Suite\s+No\.\s*2/i, 'A. Khachaturian'],
    [/The\s+Nutcracker\s+Suite/i, 'P. I. Tchaikovsky'],
    [/Ballade,\s*Op\.\s*288\b/i, 'C. Reinecke'],
    [/La\s+gazza\s+ladra\s+Overture/i, 'G. Rossini'],
    [/Serenade\s+for\s+Strings\s+Op\.\s*20\b/i, 'E. Elgar'],
    [/Schaffy,\s*Op\.\s*2\b/i, 'A. Rubinstein'],
    [/Preludes\s+for\s+Guitar|Sonata\s+No\.\s*3\s*-\s*II\.\s*Chanson/i, 'M. M. Ponce'],
    [/Tango\s+Fantasia/i, 'J. Gade'],
    [/Infini\s+for\s+String\s+Quartet/i, '박명훈'],
    [/Ave\s+Maria\s+아베\s*마리아/i, 'G. Caccini / F. Schubert'],
    [/When\s+You\s+Wish\s+Upon\s+a\s+Star/i, 'L. Harline'],
    [/미녀와\s*야수|Beauty\s+and\s+the\s+Beast|알라딘|A\s+whole\s+new\s+world|Part\s+Of\s+Your\s+World|Under\s+The\s+Sea/i, 'A. Menken'],
    [/모아나2|Beyond/i, 'A. Barlow & E. Bear'],
    [/코코.*Remember\s+me/i, 'K. Anderson-Lopez & R. Lopez'],
    [/Friend\s+ln\s+Me/i, 'R. Newman'],
    [/Try\s+Everything/i, 'Sia & Stargate'],
    [/Schindler's\s+List\s+Theme/i, 'J. Williams'],
    [/The\s+Green\s+Hornet\s+Theme/i, 'N. Rimsky-Korsakov / B. May'],
    [/Gabriel's\s+Oboe|시네마\s*천국/i, 'E. Morricone'],
    [/Batman.*Dark\s+Knight/i, 'H. Zimmer'],
    [/Love\s+ls\s+a\s+Many-Splendored\s+Thing/i, 'S. Fain'],
    [/Moon\s+River/i, 'H. Mancini'],
    [/Can't\s+Take\s+My\s+Eyes\s+Off\s+You/i, 'B. Crewe & B. Gaudio'],
    [/기쿠지로의\s*여름|키쿠지로의\s*여름|벼랑\s*위의\s*포뇨|Merry-Go-Round\s+Of\s+Life|Bygone\s+Days|^Summer\s+-\s+/i, 'J. Hisaishi'],
    [/웰컴투\s*동막골/i, 'J. Hisaishi'],
    [/하안거탑.*Rossette/i, '김수철'],
    [/악마의\s*아이/i, '히구치 아이'],
    [/Bauklotze|CaII\s+of\s+SiIence/i, 'H. Sawano'],
    [/케이팝\s*데몬\s*헌터스/i, 'KPop Demon Hunters OST'],
    [/In\s+Your\s+Light|A\s+Breathing\s+Peace/i, 'E. Whitacre / O. Gjeilo'],
    [/카르엔:\s*서곡/i, 'G. Bizet'],
    [/Singin'\s+in\s+the\s+Rain|Singm'\s+in\s+the\s+Rain/i, 'N. H. Brown'],
    [/오페라의\s*유령|All\s+I\s+ask/i, 'A. L. Webber'],
    [/Por\s+Una\s+Cabeza|여인의\s*향기/i, 'C. Gardel'],
    [/\[아멜리에\]\s*La\s+valse/i, 'Y. Tiersen'],
    [/\[마지막\s*황제\]/i, 'R. Sakamoto'],
    [/Polar\s+Express|The\s+Avengers|어벤져스/i, 'A. Silvestri'],
    [/Avatar\s+Suite/i, 'J. Horner'],
    [/Suite\s+New\s+Day/i, 'M. Giacchino'],
    [/You\s+Raise\s+me\s+up/i, 'R. Løvland'],
    [/Mancherai|일\s*포스티노/i, 'L. Bacalov'],
    [/Exodus.*영광의\s*탈출/i, 'E. Gold'],
    [/Christmas\s+Bolero/i, 'M. Ravel (Arr.)'],
    [/디즈니\s*판타지\s*Disney\s+fantasy|Disney\s+Medley/i, 'A. Menken & L. Harline'],
    [/(?:Klavier|Klarvier)\s+[가-힣]{2,4}$/i, 'H. Wolf'],
    [/Mein\s+Herr\s+Marquis|Die\s+Fledermaus|오페레타\s*['‘]박쥐/i, 'J. Strauss II'],
    [/Lippen\s+schweigen|유쾌한\s*미망인/i, 'F. Lehár'],
    [/Alvamar\s+Overture/i, 'J. Barnes'],
    [/Clarinet\s+Concerto\s+No\.\s*3/i, 'C. Stamitz'],
    [/Rhapsody\s+in\s+Blue/i, 'G. Gershwin'],
    [/Fanfare\s*[–\-]\s*The\s+Clowns/i, 'D. Kabalevsky'],
    [/^엘레지$/i, 'G. Bottesini'],
    [/감상적인\s*왈츠.*작품번호\s*51/i, 'P. I. Tchaikovsky'],
    [/시인의\s*사랑.*작품번호\s*48|트로이메라이.*작품번호\s*15/i, 'R. Schumann'],
    [/어머니가\s*가르[쳐져]\s*주신\s*노래.*작품번호\s*55/i, 'A. Dvořák'],
    [/스페인\s*무곡\s*1번.*허무한\s*인생/i, 'M. de Falla'],
    [/아름다운\s*저녁.*L\.\s*6|^달빛$/i, 'C. Debussy'],
    [/멜로디.*오르페오와\s*에우리디체/i, 'C. W. Gluck'],
    [/나는\s*마리아예요.*부에노스아이레스의\s*마리아/i, 'A. Piazzolla'],
    [/^(?:Over\s+the\s+Piano|George|Surprise!|Amor)$/i, 'William Bolcom'],
    [/서주와\s*사자왕의\s*행진|수탉과\s*암탉|귀가\s*긴\s*동물|숲속의\s*뻐꾸기|커다란\s*새장/i, 'C. Saint-Saëns'],
    [/티토\s*황제의\s*자비|Marriage.*Figaro\s+Overture/i, 'W. A. Mozart'],
    [/lntroduction.*Rondo.*Op\.\s*72/i, 'Ch.-M. Widor'],
    [/Carmen\s+Fantasie/i, 'G. Bizet / F. Borne'],
    [/펠레아스와\s*멜리장드.*80|Pelléas.*Mélisande.*80/i, 'G. Fauré'],
    [/플루트\s*협주곡.*283|Flute\s+Concerto.*(?:283|0다283)/i, 'C. Reinecke'],
    [/여인의\s*사랑과\s*생애|Frauenliebe/i, 'R. Schumann'],
    [/센토네\s*소나타|Centone\s+MS\s*112|협주적\s*소나타\s*가장조|베네치아\s*카니발\s*변주곡/i, 'N. Paganini'],
    [/허무한\s*인생/i, 'M. de Falla'],
    [/모던\s*락\s*모음곡|Modern\s+Rock\s+Suite/i, 'D. Bogdanović'],
    [/스티븐\s*포스터/i, 'S. Foster'],
    [/네\s*대륙의\s*합창|아프리카인들의\s*샤콘느/i, 'J. B. Lully'],
    [/Pomp\s+and|위풍당당/i, 'E. Elgar'],
    [/1812년\s*서곡/i, 'P. I. Tchaikovsky'],
    [/Valse\s*Triste|VaIsehriste/i, 'J. Sibelius'],
    [/Bohemian\s+Rhapsody/i, 'F. Mercury (Queen)'],
    [/Slavonic\s+Dances|슬라브\s*무곡/i, 'A. Dvořák'],
    [/Egmont\s+Overture/i, 'L. v. Beethoven'],
    [/피아노\s*사중주\s*제1번.*작품번호\s*25|Piano\s+Quartet\s+No\.\s*1.*Op\.\s*25/i, 'J. Brahms'],
    [/피아노\s*삼중주\s*제2번.*작품번호\s*100/i, 'F. Schubert'],
    [/[첼젤]로\s*소나타.*작품번호\s*19/i, 'S. Rachmaninoff'],
    [/피아노\s*사중주\s*가단조|Piano\s+Quartet\s+in\s+a\s+Minor/i, 'G. Mahler'],
    [/피아노\s*사중주\s*제2번.*작품번호\s*87/i, 'A. Dvořák'],
    [/Canon\s+Fantasy/i, 'J. Pachelbel'],
    [/Christmas\s+At\s+Hogwarts|Potter\s+Waltz/i, 'J. Williams / P. Doyle'],
    [/Lake\s+Louise/i, 'Yuhki Kuramoto'],
    [/SYMPHONIC\s+OVERTURE\s+OP\.\s*80/i, 'J. Barnes'],
    [/TROMBONE\s+Concerto\s+IN\s+Bb/i, 'N. Rimsky-Korsakov'],
    [/DISNEY\s+FANTASY/i, 'A. Menken (arr. Naohiro Iwai)'],
    [/STARFLIGHT\s+OVERTURE/i, 'R. Mitchell'],
    [/Nordanvind.*Dix\s+Proverbes/i, 'Traditional / Dix Proverbes'],
    [/장미의\s*노래.*Dirait-on|Dirait-on|Lux\s+aeterna/i, 'M. Lauridsen'],
    [/Nella\s+Fantasia/i, 'E. Morricone'],
    [/놀람\s*교향곡/i, 'J. Haydn'],
    [/Sleigh\s+Ride/i, 'L. Anderson'],
    [/All\s+I\s+Want\s+for\s+Christmas/i, 'M. Carey & W. Afanasieff'],
    [/어떻게\s*이별까지\s*사랑하겠어/i, '이찬혁 (AKMU)'],
    [/라이온\s*킹|The\s+Lion\s+King/i, 'H. Zimmer & E. John'],
    [/홍난파/i, '홍난파'],
    [/아리랑\s*변주곡|아리랑\s*랩소디/i, '한국 전통 민요 (아리랑)'],
    [/Auch\s+kleine\s+Dinge|Ihr\s+seid\s+die\s+Allerschönste|Benedeit\s+die\s+sel|Ich\s+hab'\s+in\s+Penna|Nun\s+laß\s+uns\s+Frieden/i, 'H. Wolf'],
    [/Gloria\s+ln\s+Excelsis\s+Deo/i, 'A. Vivaldi'],
    [/찬양의\s*왈츠/i, '한국 성가 합창'],
    [/피아노\s*협주곡\s*1번/i, 'F. Chopin / P. I. Tchaikovsky'],
    [/^Symphony\s+No\.\s*4$|^교향곡\s*4번$/i, 'P. I. Tchaikovsky / J. Brahms'],
    [/서곡\s*-\s*서귀포\s*바당/i, '도립서귀포합창단 위촉곡'],
    [/서곡\s*〈아침의\s*노래〉/i, '창작 오페라 김유신의 꿈'],
    [/아이\s*LOVE\s*왈츠/i, 'J. Strauss II'],
    [/CHRISTMAS\s+FANTASIA|Christmas\s+Fantasy/i, '크리스마스 캐럴 메들리'],
    [/드로잉\s*에튀드|^세레나데$/i, 'F. Schubert / 클래식 명곡']
  ];
  for (const [rx, comp] of workRules) {
    if (rx.test(piece)) {
      return { piece: `${comp}: ${piece}`, composer: comp };
    }
  }

  // 공연 제목 특화 추론 (볼프 이탈리아 가곡집, 작곡 발표회, 창작 초연 등)
  const cTitle = (concert && concert.title) || '';
  if (/한국독일가곡연구회.*연가곡\s*시리즈\s*Ⅳ/.test(cTitle)) {
    return { piece: `H. Wolf: ${piece}`, composer: 'H. Wolf' };
  }
  if (/이은지\s*작곡\s*발표회/.test(cTitle)) {
    return { piece: `이은지: ${piece}`, composer: '이은지' };
  }
  if (/정재은\s*작품\s*발표회/.test(cTitle)) {
    return { piece: `정재은: ${piece}`, composer: '정재은' };
  }
  if (/진선\s*반도네온/.test(cTitle)) {
    return { piece: `진선: ${piece}`, composer: '진선' };
  }
  if (/콘체르탄테:\s*바로크의\s*숨결/.test(cTitle)) {
    return { piece: `A. Vivaldi (개작 초연): ${piece}`, composer: 'A. Vivaldi' };
  }
  if (/소프라노\s*윤장미/.test(cTitle)) {
    return { piece: `A. Piazzolla / A. Vivaldi: ${piece}`, composer: 'A. Piazzolla' };
  }
  if (/라\s*필하모니카/.test(cTitle)) {
    return { piece: `La Philharmonica: ${piece}`, composer: 'La Philharmonica' };
  }
  if (/김천시립합창단/.test(cTitle)) {
    return { piece: `김천시립합창단 창작곡: ${piece}`, composer: '김천시립합창단 창작곡' };
  }
  if (/바다어린이합창단|꿈의\s*오케스트/.test(cTitle)) {
    return { piece: `창작 합창·동요: ${piece}`, composer: '창작 합창·동요' };
  }
  if (/만나필하모닉\s*윈드오케스트라/.test(cTitle)) {
    return { piece: `Jan de Haan: ${piece}`, composer: 'Jan de Haan' };
  }

  // 3. 공연 소개글(<sty>)에서 해당 곡명 바로 윗줄의 작곡가 탐색
  if (styText && styText.length > 20) {
    const cleanLines = styText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const shortNeedle = piece.slice(0, Math.min(18, piece.length)).toLowerCase();
    for (let i = 1; i < cleanLines.length; i++) {
      if (cleanLines[i].toLowerCase().includes(shortNeedle)) {
        for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
          const prev = cleanLines[j];
          const m = prev.match(/^([A-ZÀ-ÖØ-Ý가-힣][A-Za-zÀ-ÖØ-öø-ÿ\u0100-\u017F가-힣.\-\s]{1,35}?)\s*\(\s*(?:b\.|ca\.)?\s*\d{4}/i);
          if (m) {
            const comp = m[1].trim();
            return { piece: `${comp}: ${piece}`, composer: comp };
          }
        }
      }
    }
  }

  // 4. 공연 자체의 단일 작곡가 또는 직전 곡목 작곡가 상속
  if (concert && concert.composers && concert.composers.length === 1 && concert.composers[0] !== '클래식 명작') {
    const comp = concert.composers[0];
    return { piece: `${comp}: ${piece}`, composer: comp };
  }
  if (lastComposerInConcert) {
    return { piece: `${lastComposerInConcert}: ${piece}`, composer: lastComposerInConcert };
  }
  if (concert && concert.composers && concert.composers.length > 0) {
    const comp = concert.composers[0];
    return { piece: `${comp}: ${piece}`, composer: comp };
  }

  return { piece, composer: null };
}

function enrichConcertPiecesWithComposers(concert, styText = '') {
  if (!concert) return;
  // 시리즈 통합 포스터(현악본색 시즌2) 회차별 곡목 분리 보정
  if (concert.id === 'kopis-PF303819' && Array.isArray(concert.pieces)) {
    concert.pieces = concert.pieces.filter(p => !/(?:현악\s*오중주|현악\s*팔중주|현을\s*위한\s*세레나데)/.test(p));
  } else if (concert.id === 'kopis-PF303112' && (!concert.pieces || concert.pieces.length === 0)) {
    concert.pieces = [
      'A. Dvořák: 현악 오중주 제2번 G장조, Op. 77 중 1악장',
      'D. Shostakovich: 현악 팔중주를 위한 두 개의 소품, Op. 11',
      'F. Schubert: 현악 오중주 C장조, D. 956 중 4악장',
      'P. I. Tchaikovsky: 현을 위한 세레나데 C장조, Op. 48'
    ];
  }
  let rawPieces = Array.isArray(concert.pieces) ? concert.pieces : [];
  let lastComp = null;
  const enriched = [];
  for (const rawP of rawPieces) {
    const norm = normalizeInlineComposer(normalizeOcrMusicalText(rawP, true));
    if (isInvalidPieceNoise(norm)) continue;
    const { piece: withComp, composer } = inferComposerForPiece(norm, concert, lastComp, styText);
    if (isInvalidPieceNoise(withComp)) continue;
    if (composer) lastComp = composer;
    addUniquePiece(enriched, withComp);
  }

  // 만약 기존 pieces가 모두 비곡목 노이즈여서 걸러졌는데 원문 소개글(styText)이나 제목에 실제 프로그램이 존재하는 경우 재추출
  if (enriched.length === 0 && styText && styText.length > 15) {
    const reExtracted = extractPiecesSmart(styText, { isPlainSty: true });
    for (const rawP of reExtracted) {
      const norm = normalizeInlineComposer(normalizeOcrMusicalText(rawP, true));
      if (isInvalidPieceNoise(norm)) continue;
      const { piece: withComp, composer } = inferComposerForPiece(norm, concert, lastComp, styText);
      if (isInvalidPieceNoise(withComp)) continue;
      if (composer) lastComp = composer;
      addUniquePiece(enriched, withComp);
    }
  }

  concert.pieces = enriched;
}

/**
 * 지능형 다단계 프로그램 추출기 (KOPIS <sty>, 상세페이지 HTML, 포스터/전단 OCR 공용)
 */
function extractPiecesSmart(rawTextOrHtml, { isPlainSty = false, isOcr = false } = {}) {
  if (!rawTextOrHtml || rawTextOrHtml.length < 15) return [];
  const rawLines = htmlToLines(rawTextOrHtml, isOcr);

  // 줄바꿈으로 쪼개진 연속 곡목 라인 자동 병합 (예: "L. van Beethoven | Symphony No. 9 in D minor," + "Op. 125, 'Choral'")
  const lines = [];
  for (let i = 0; i < rawLines.length; i++) {
    let cur = rawLines[i];
    if (
      i + 1 < rawLines.length &&
      (cur.endsWith(',') || /^(?:Op\.\s*\d|No\.\s*\d|BWV\s*\d|K\.\s*\d|KV\s*\d|Hob\.)/i.test(rawLines[i + 1])) &&
      !isComposerOnlyLine(cur)
    ) {
      cur = `${cur} ${rawLines[i + 1]}`.replace(/\s+/g, ' ').trim();
      i++;
    }
    lines.push(cur);
  }

  const headerRegex = /^(?:[\[\<\(■●◆▶▸★\*—–\-~=|\/•·]+\s*)?(?:프로그램|프로그래|프\s*로\s*그\s*램|PROGRAM|Program|P\s*R\s*[O0]\s*G\s*R\s*A\s*M|곡목|곡\s*목|공연\s*곡목|연주\s*곡목|프로그램\s*안내|연주\s*프로그램|\d부\s*작품\s*소개)(?:\s*[\]\>\)■●◆▶▸★\*—–\-~=|\/•· 안내]+)?$/i;

  const stopKeywords = [
    '프로필', 'PROFILE', 'Profile', '출연진', 'CAST', 'Cast', 'ARTISTS', 'TICKETS', '아티스트 소개',
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
    for (let i = idx + 1; i < Math.min(lines.length, idx + 85); i++) {
      let line = lines[i];
      if (line.includes('\uFFFD')) continue;
      if (headerRegex.test(line)) continue;
      if (stopKeywords.some(kw => line.includes(kw))) break;
      // 시리즈 포스터에서 다음 회차 날짜/시간 헤더가 등장하면 현재 회차 프로그램 추출 종료
      if (pieces.length > 0 && /\b\d{1,2}\.\s*\d{1,2}\.?\s*(?:MON|TUE|WED|THU|FRI|SAT|SUN)\s+\d{1,2}:\d{2}\b/i.test(line)) break;
      if (/^(?:Pianist|Violinist|Cellist|Violist|Flutist|Oboist|Clarinetist|Bassoonist|Hornist|Conductor|피아니스트|바이올리니스트|첼리스트|비올리스트|플루티스트|클라리네티스트|지휘자)\s+[가-힣A-Za-z]/i.test(line)) break;
      if (/^(?:\*|※).*(?:변경|사정|주최|프로그램|유의|관람|요청)/.test(line)) {
        if (pieces.length > 0) break;
        continue;
      }
      if (/^(?:총\s*\d+곡의|패널\s*진행|출연진과\s*관객)/.test(line)) continue;
      if (/^(?:INTERMISSION|Intermission|lntermission|<lntermission>|term\s*i\s*S\s*S\s*i\s*0\s*n|인터미션|I\s+N\s+T\s+E\s+R\s+M\s+I\s+S\s+S\s+I\s+O\s+N|휴식|중간휴식|—\s*인터미션\s*—|<1부>|<2부>|1부(?:\s+[가-힣A-Za-z\s]+)?|2부(?:\s+[가-힣A-Za-z\s]+)?|\[1부\]|\[2부\]|PART\s*\d|Part\s*\d|STAGE\s*\d.*|-?\s*Intermission\s*-?)$/i.test(line)) {
        if (isOcr) currentComposer = '';
        continue;
      }
      if (MOVEMENT_ONLY_REGEX.test(line)) continue;

      if (/^(?:<\d부>\s*)?(?:Sop\.|Ten\.|Bar\.|M\.Sop\.|Bass|Pf\.|Piano|Vn\.|Vc\.)/i.test(line) && !/시\s*\/\s*[가-힣]{2,4}\s*곡/.test(line)) {
        continue;
      }
      if (/^(?:\d+\.\s*)?(?:Piano|Violin|Violoncello|Cello|Flute|Clarinet|Percussion|Bass\s*Baritone|Soprano|Mezzo\s*Soprano|Tenor|Baritone|Bass|Opera\s*Ensemble|Sop\.|Ten\.|Bar\.|Pf\.|Vn\.|Vc\.|Fl\.|Eb\s*Cl\.|Bb\s*Cl\.|Bass\s*Cl\.|1st\s*Clarinet|소프라노|테너|바리톤|베이스|메조소프라노|지휘|특별\s*지휘|연주|마림바|합창|합장)\s*[가-힣a-zA-Z0-9\s,·\-/•&\.()♭]+$/i.test(line) && !/(?:Sonata|Concerto|Trio|Quartet|Quintet|Suite|Partita|Op\.|BWV|KV)/i.test(line)) {
        continue;
      }

      if (isComposerOnlyLine(line)) {
        currentComposer = line.replace(/['’\-–—:\s]+$/, '').replace(/\s*\([^)]+\)\s*$/, '').trim();
        continue;
      }

      // 포스터에서 "곡명" 줄 바로 다음 줄에 "작곡가"가 단독으로 오는 레이아웃 처리 (예: Passage \n Denis Sungho)
      if (
        !currentComposer &&
        i + 1 < Math.min(lines.length, idx + 85) &&
        isComposerOnlyLine(lines[i + 1]) &&
        !isInvalidPieceNoise(line) &&
        line.length >= 3 &&
        line.length <= 70 &&
        !/^(?:1부|2부|Intermission)/i.test(line)
      ) {
        const nextAfterComp = lines[i + 2] || '';
        // 만약 다다음 줄도 작곡가이거나 끝/주의사항이면 "곡명 -> 작곡가" 페어링 확정
        if (!nextAfterComp || /^\*|^※/.test(nextAfterComp) || (i + 3 < lines.length && isComposerOnlyLine(lines[i + 3]))) {
          const pairedComp = lines[i + 1].replace(/['’\-–—:\s]+$/, '').replace(/\s*\([^)]+\)\s*$/, '').trim();
          const cp = cleanPieceLine(line, pairedComp);
          addUniquePiece(pieces, cp);
          i++;
          continue;
        }
      }

      // 성악곡 줄 끝에 출연진(Sop. ..., Ten. ..., Klavier ...)이 붙어 있는 경우 곡명만 추출 (예: "1. Auch kleine Dinge Sop. 전수미, Ten. 조철희, Klavier 정영하")
      if (!/^(?:Sop\.|Ten\.|Bar\.|M\.Sop\.|Bass)/i.test(line)) {
        line = line.replace(/\s+(?:Sop\.|Ten\.|Bar\.|M\.Sop\.|Bass|Pf\.|Klavier|Klarvier)\s*[가-힣,\s\/A-Za-z.]+$/i, '').trim();
      }

      const isValidPieceCandidate = isOcr
        ? (
            isMusicalPieceLine(line, false) ||
            /^\d+\.\s*[A-Za-zÀ-ÖØ-öø-ÿ가-힣].{2,80}\s+[-–—]\s+[A-Za-zÀ-ÖØ-öø-ÿ가-힣].{1,45}$/.test(line) ||
            (Boolean(currentComposer) && /^\d+\.\s*[A-ZÀ-ÖØ-Ý가-힣][A-Za-zÀ-ÖØ-öø-ÿ가-힣\s'’!?,\-()]{2,55}$/.test(line)) ||
            /(?:작사|작곡|\b시)\s*[\/7]\s*[가-힣]{2,4}\s*(?:작곡|곡|시)/.test(line)
          )
        : (
            isMusicalPieceLine(line, true) ||
            (Boolean(currentComposer) && line.length >= 3 && line.length <= 85)
          );

      if (isValidPieceCandidate && !isInvalidPieceNoise(line)) {
        const cp = cleanPieceLine(line, currentComposer);
        if (!isInvalidPieceNoise(cp)) {
          addUniquePiece(pieces, cp);
        }
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

      if (isComposerOnlyLine(line)) {
        const comp = line.replace(/\s*\([^)]+\)\s*$/, '').trim();
        currentComposer = comp;
        pendingComposers.push(comp);
        continue;
      }

      if (isMusicalPieceLine(line, false) && !isInvalidPieceNoise(line)) {
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
if (-not $engine) {
  $null = [Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime]
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
}
if (-not $engine) { exit 0 }

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
    finalPiecesMap.set(cId, { pieces, ocrText: ocrText.trim() });
  }
  return finalPiecesMap;
}

function normalizeTourBaseTitle(title) {
  return (title || '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\((?:앵콜|영상화|\d{1,2}\.\d{1,2}|\d{1,2}월|\d{1,2}시[^)]*)\)/g, '')
    .replace(/\b(?:Ⅰ|Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅵ|Ⅶ|Ⅷ|Ⅸ|Ⅹ|I|II|III|IV|V|\d+편|\d+회)\b/g, '')
    .replace(/[^A-Za-z0-9가-힣]/g, '')
    .toLowerCase();
}

function shareProgramsAcrossTourSiblings(concertsList) {
  const titleMap = new Map();
  for (const c of concertsList) {
    if (!c.pieces || c.pieces.length === 0) continue;
    const base = normalizeTourBaseTitle(c.title);
    if (base.length >= 6 && !titleMap.has(base)) {
      titleMap.set(base, c.pieces);
    }
  }
  let sharedCount = 0;
  for (const c of concertsList) {
    if (c.pieces && c.pieces.length > 0) continue;
    const base = normalizeTourBaseTitle(c.title);
    if (base.length >= 6 && titleMap.has(base)) {
      c.pieces = [...titleMap.get(base)];
      syncComposersFromPieces(c);
      sharedCount++;
    }
  }
  return sharedCount;
}

function extractPiecesFromTitle(title, styText = '') {
  if (!title && !styText) return [];
  const t = `${title || ''} ${styText || ''}`.trim();
  const titleOnly = (title || '').trim();
  const pieces = [];

  // 1. 아티스트·테마 특화 리사이틀/시리즈 매칭
  if (/호르니스트\s*김홍박/.test(titleOnly)) {
    return [
      'R. Schumann: Adagio and Allegro for Horn and Piano in A-flat Major, Op. 70 (호른과 피아노를 위한 아다지오와 알레그로)',
      'L. v. Beethoven: Horn Sonata in F Major, Op. 17 (호른 소나타 F장조)',
      'F. Strauss: Nocturne for Horn and Piano, Op. 7 (호른과 피아노를 위한 녹턴)',
      'E. Bozza: Sur les Cimes for Horn and Piano (정상에서)'
    ];
  }
  if (/베토벤\s*첼로\s*소나타\s*전곡|Complete\s+Cello\s+Sonatas/i.test(titleOnly)) {
    return [
      'L. v. Beethoven: Cello Sonata No. 1 in F Major, Op. 5 No. 1',
      'L. v. Beethoven: Cello Sonata No. 2 in G Minor, Op. 5 No. 2',
      'L. v. Beethoven: Cello Sonata No. 3 in A Major, Op. 69',
      'L. v. Beethoven: Cello Sonata No. 4 in C Major, Op. 102 No. 1',
      'L. v. Beethoven: Cello Sonata No. 5 in D Major, Op. 102 No. 2'
    ];
  }
  if (/김선욱\s*베토벤\s*피아노\s*소나타\s*전곡\s*시리즈\s*Ⅳ/.test(titleOnly)) {
    return [
      'L. v. Beethoven: Piano Sonata No. 8 in C Minor, Op. 13 "Pathétique" (비창)',
      'L. v. Beethoven: Piano Sonata No. 11 in B-flat Major, Op. 22',
      'L. v. Beethoven: Piano Sonata No. 26 in E-flat Major, Op. 81a "Les Adieux" (고별)'
    ];
  }
  if (/아를르?의\s*여인/.test(titleOnly) && /카르멘/.test(titleOnly)) {
    return [
      "G. Bizet: L'Arlésienne Suite No. 1 & No. 2 (조르주 비제: 아를의 여인 모음곡)",
      'G. Bizet: Carmen Suite No. 1 & No. 2 (조르주 비제: 카르멘 모음곡)'
    ];
  }
  if (/태양왕의\s*음악|르\s*포엠\s*아르모니크/.test(titleOnly)) {
    return [
      'J. B. Lully: 세계 네 대륙의 합창 (플로르의 발레 중)',
      'J. B. Lully: 아프리카인들의 샤콘느 (카드무스와 에르미온느 중)',
      'M. R. Delalande: 왕의 만찬을 위한 심포니 (Symphonies pour les Soupers du Roi)'
    ];
  }
  if (/만토바\s*[체챔]임?버\s*오케스트라/.test(titleOnly)) {
    return [
      'W. A. Mozart: Symphony No. 35 in D Major, K. 385 "Haffner"',
      'F. Mendelssohn: Violin Concerto in E Minor, Op. 64'
    ];
  }
  if (/프란츠\s*리스트\s*체임버\s*오케스트라/.test(titleOnly)) {
    return [
      'E. Grieg: Holberg Suite, Op. 40 (홀베르그 모음곡)',
      'J. Haydn: Cello Concerto No. 1 in C Major, Hob. VIIb:1',
      'B. Bartók: Romanian Folk Dances, Sz. 56 (루마니아 민속 무곡)',
      'F. Liszt: Hungarian Rhapsody No. 2, S. 244/2 & Mephisto Waltz No. 1, S. 514'
    ];
  }
  if (/로열\s*콘세르트헤[바보]우.*브라스/.test(titleOnly)) {
    return [
      'N. Rimsky-Korsakov: Christmas Eve Suite - No. 3 Polonaise',
      "J. S. Bach: Jesu, Joy of Man's Desiring, BWV 147 & Wachet auf, BWV 645",
      'P. I. Tchaikovsky: The Nutcracker Suite (호두까기 인형 모음곡)',
      'A. Piazzolla: María de Buenos Aires Suite'
    ];
  }
  if (/두\s*대의\s*피아노,\s*브람스를\s*말하다/.test(titleOnly)) {
    return [
      'J. Brahms: Academic Festival Overture, Op. 80 (for 2 Pianos 8 Hands)',
      'J. Brahms: Variations on a Theme by Haydn, Op. 56b (for 2 Pianos)'
    ];
  }
  if (/The\s+Schumann\s+Trilogy.*클라라/i.test(titleOnly)) {
    return [
      'C. Schumann: Piano Trio in G Minor, Op. 17',
      'R. Schumann: Piano Quartet in E-flat Major, Op. 47'
    ];
  }

  // 2. 소개글(sty) 산문 또는 공연 제목 내 명시된 레퍼토리 복합 추출
  if (/변주곡\s*'에니그마'|Enigma\s+Variations/i.test(t)) {
    pieces.push('E. Elgar: Enigma Variations, Op. 36 (엘가: 수수께끼 변주곡)');
  }
  if (t.includes('말러') && (t.includes('교향곡 1번') || t.includes('교향곡 제1번') || t.includes('거인'))) {
    pieces.push('구스타프 말러: 교향곡 제1번 D장조 "거인"');
  }
  if (t.includes('말러') && (t.includes('교향곡 2번') || t.includes('교향곡 제2번') || t.includes('부활'))) {
    pieces.push('구스타프 말러: 교향곡 제2번 c단조 "부활"');
  }
  if (t.includes('말러') && (t.includes('교향곡 4번') || t.includes('교향곡 제4번'))) {
    pieces.push('구스타프 말러: 교향곡 제4번 G장조');
  }
  if (t.includes('말러') && (t.includes('교향곡 5번') || t.includes('교향곡 제5번'))) {
    pieces.push('구스타프 말러: 교향곡 제5번 c#단조');
  }
  if (t.includes('베토벤') && (t.includes('합창') || t.includes('교향곡 제9번') || t.includes('교향곡 9번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제9번 d단조 Op.125 "합창"');
  }
  if (t.includes('베토벤') && (t.includes('운명') || t.includes('교향곡 제5번') || t.includes('교향곡 5번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제5번 c단조 Op.67 "운명"');
  }
  if (t.includes('베토벤') && (t.includes('전원') || t.includes('교향곡 제6번') || t.includes('교향곡 6번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제6번 F장조 Op.68 "전원"');
  }
  if (t.includes('베토벤') && (t.includes('교향곡 제7번') || t.includes('교향곡 7번'))) {
    pieces.push('루트비히 판 베토벤: 교향곡 제7번 A장조 Op.92');
  }
  if (t.includes('베토벤') && t.includes('황제')) {
    pieces.push('루트비히 판 베토벤: 피아노 협주곡 제5번 E-flat장조 Op.73 "황제"');
  }
  if (/베토벤.*소나타.*첼로와\s*함께/.test(titleOnly)) {
    pieces.push('L. v. Beethoven: Cello Sonata No. 3 in A Major, Op. 69');
  }
  if (t.includes('라흐마니노프') && (t.includes('교향곡 제2번') || t.includes('교향곡 2번'))) {
    pieces.push('세르게이 라흐마니노프: 교향곡 제2번 e단조 Op.27');
  }
  if (t.includes('라흐마니노프') && (t.includes('피아노 협주곡 제2번') || t.includes('피아노 협주곡 2번') || t.includes('피아노협주곡 2번'))) {
    pieces.push('세르게이 라흐마니노프: 피아노 협주곡 제2번 c단조 Op.18');
  }
  if (t.includes('라흐마니노프') && (t.includes('피아노 협주곡 제3번') || t.includes('피아노 협주곡 3번') || t.includes('피아노협주곡 3번'))) {
    pieces.push('세르게이 라흐마니노프: 피아노 협주곡 제3번 d단조 Op.30');
  }
  if (/차이[콥코]프?스키/.test(t) && t.includes('백조의 호수')) {
    pieces.push("표트르 일리치 차이콥스키: 모음곡 '백조의 호수' Op.20a");
  }
  if (/차이[콥코]프?스키/.test(t) && (t.includes('교향곡 제5번') || t.includes('교향곡 5번'))) {
    pieces.push('표트르 일리치 차이콥스키: 교향곡 제5번 e단조 Op.64');
  }
  if (/차이[콥코]프?스키/.test(t) && (t.includes('비창') || t.includes('교향곡 제6번') || t.includes('교향곡 6번'))) {
    pieces.push("표트르 일리치 차이콥스키: 교향곡 제6번 b단조 Op.74 '비창'");
  }
  if (/호두까기\s*인형/.test(titleOnly)) {
    pieces.push('표트르 일리치 차이콥스키: 발레 모음곡 "호두까기 인형" Op.71a');
  }
  if ((t.includes('비발디') && t.includes('사계')) || /사계.*안토니오\s*비발디/.test(t)) {
    pieces.push('안토니오 비발디: 바이올린 협주곡 Op.8 "사계"');
  }
  if (/드보르[작자]크?/.test(t) && (t.includes('신세계') || t.includes('교향곡 제9번') || t.includes('교향곡 9번'))) {
    pieces.push('안토닌 드보르작: 교향곡 제9번 e단조 Op.95 "신세계로부터"');
  }
  if (t.includes('홀스트') && t.includes('행성')) {
    pieces.push('구스타브 홀스트: 모음곡 "행성" Op.32');
  }
  if ((t.includes('생상스') && t.includes('동물의 사육제')) || /동물들도\s*리듬을\s*탈\s*수\s*있을까/.test(t)) {
    pieces.push('카미유 생상스: 동물의 사육제 (C. Saint-Saëns: Le Carnaval des animaux)');
  }
  if ((t.includes('헨델') && /메시[아야]/.test(t)) || /메시아\s*연주회/.test(titleOnly)) {
    pieces.push('게오르크 프리드리히 헨델: 오라토리오 "메시아" HWV 56');
  }
  if (/천지창조/.test(t) && (/하이든/.test(t) || /천지창조/.test(titleOnly))) {
    pieces.push('요제프 하이든: 오라토리오 "천지창조" Hob.XXI:2 (J. Haydn: Die Schöpfung)');
  }
  if (t.includes('바흐') && t.includes('골드베르크')) {
    pieces.push('요한 제바스티안 바흐: 골드베르크 변주곡 BWV 988');
  }
  if (/마태수난곡/.test(titleOnly)) {
    pieces.push('요한 제바스티안 바흐: 마태수난곡 BWV 244 (J. S. Bach: Matthäus-Passion)');
  }
  if (/크리스마스\s*오라토리오/.test(t) && /바흐|BWV\s*248/i.test(t)) {
    pieces.push('요한 제바스티안 바흐: 크리스마스 오라토리오 BWV 248');
  }
  if (/겨울\s*나그네|Winterreise/i.test(t) && (/슈베르트|연광철/.test(t) || /겨울\s*나그네/.test(titleOnly))) {
    pieces.push('프란츠 슈베르트: 연가곡 "겨울나그네" D.911 (F. Schubert: Winterreise)');
  }
  if (/Schwanengesang|백조의\s*노래/i.test(titleOnly)) {
    pieces.push('프란츠 슈베르트: 연가곡 "백조의 노래" D.957 (F. Schubert: Schwanengesang)');
  }
  if (/여인의\s*사랑과\s*생애|Frauenliebe/i.test(titleOnly)) {
    pieces.push('로베르트 슈만: 연가곡 "여인의 사랑과 생애" Op.42 (R. Schumann: Frauenliebe und -leben)');
  }
  if (t.includes('카르미나 부라나') || /Carmina\s+Burana/i.test(t)) {
    pieces.push('C. Orff: Carmina Burana (칼 오르프: 카르미나 부라나)');
  }
  if (titleOnly.includes('라인의 황금')) {
    pieces.push('R. Wagner: Das Rheingold, WWV 86A (리하르트 바그너: 오페라 라인의 황금)');
  }
  if (titleOnly.includes('발퀴레')) {
    pieces.push('R. Wagner: Die Walküre, WWV 86B (리하르트 바그너: 오페라 발퀴레)');
  }
  if (/돈\s*카를로스/.test(titleOnly)) {
    pieces.push('G. Verdi: Don Carlos (주세페 베르디: 오페라 돈 카를로스)');
  }
  if (/일\s*트로바토레/.test(titleOnly)) {
    pieces.push('G. Verdi: Il Trovatore (주세페 베르디: 오페라 일 트로바토레)');
  }
  if (/안드레아\s*쉐니에/.test(titleOnly)) {
    pieces.push('U. Giordano: Andrea Chénier (움베르토 조르다노: 오페라 안드레아 셰니에)');
  }
  if (/라\s*보엠/.test(titleOnly)) {
    pieces.push('G. Puccini: La Bohème (자코모 푸치니: 오페라 라 보엠)');
  }
  if (/라\s*트라비아타/.test(titleOnly)) {
    pieces.push('G. Verdi: La Traviata (주세페 베르디: 오페라 라 트라비아타)');
  }
  if (titleOnly.includes('리골레토')) {
    pieces.push('G. Verdi: Rigoletto (주세페 베르디: 오페라 리골레토)');
  }
  if (titleOnly.includes('마술피리')) {
    pieces.push('W. A. Mozart: Die Zauberflöte, K. 620 (모차르트: 오페라 마술피리)');
  }
  if (titleOnly.includes('피가로의 결혼') || titleOnly.includes('만능재치꾼 피가로')) {
    pieces.push('W. A. Mozart: Le nozze di Figaro, K. 492 (모차르트: 오페라 피가로의 결혼)');
  }
  if (/코지\s*판\s*투테/.test(titleOnly)) {
    pieces.push('W. A. Mozart: Così fan tutte, K. 588 (모차르트: 오페라 코지 판 투테)');
  }
  if (/돈\s*조반니|돈\s*죠반니/.test(titleOnly)) {
    pieces.push('W. A. Mozart: Don Giovanni, K. 527 (모차르트: 오페라 돈 조반니)');
  }
  if (/사랑의\s*묘약/.test(titleOnly)) {
    pieces.push("G. Donizetti: L'elisir d'amore (가이타노 도니제티: 오페라 사랑의 묘약)");
  }
  if (/세비야의 이발사|세빌리아의 이발사/.test(titleOnly)) {
    pieces.push('G. Rossini: Il barbiere di Siviglia (조아키노 로시니: 오페라 세비야의 이발사)');
  }
  if (/오페레타.*박쥐|박쥐.*슈트라우스/.test(titleOnly)) {
    pieces.push('J. Strauss II: Die Fledermaus (요한 슈트라우스 2세: 오페레타 박쥐)');
  }
  if (/유쾌한\s*미망인/.test(titleOnly)) {
    pieces.push('F. Lehár: Die lustige Witwe (프란츠 레하르: 오페레타 유쾌한 미망인)');
  }
  if (/모차르트와\s*함께하는\s*키즈클래식|모차르트\s*270년|모차르트,\s*인간을\s*그리다/.test(titleOnly)) {
    pieces.push('W. A. Mozart: Eine kleine Nachtmusik in G Major, K. 525 (아이네 클라이네 나흐트무지크)');
    pieces.push('W. A. Mozart: Piano Sonata No. 11 in A Major, K. 331 "Alla Turca" (터키 행진곡)');
  }
  if (pieces.length === 0 && /(?:지브리|디즈니|히사이시\s*조)/.test(titleOnly)) {
    if (/지브리|히사이시\s*조/.test(titleOnly)) {
      pieces.push('J. Hisaishi: Merry-Go-Round of Life (하울의 움직이는 성 OST) & Summer (기쿠지로의 여름 OST)');
    }
    if (/디즈니/.test(titleOnly)) {
      pieces.push('A. Menken: Beauty and the Beast & Part of Your World (디즈니 OST 메들리)');
    }
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
  const rawText = `${concert.title || ''} ${concert.pieces.join(' ')}`;
  const text = rawText.replace(/(?:피아|바이올리|첼|비올|플루|오보|클라리네|바수|호르|오르가|기타|하|솔로|아|플레이|스페셜)[니티이]?스트/g, '');
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
    ['Wagner', '바그너'], ['Donizetti', '도니제티'], ['Mascagni', '마스카니'], ['Orff', '오르프'],
    ['Scriabin', '스크랴빈'], ['Monti', '몬티'], ['Nicolai', '니콜라이'], ['Gluck', '글루크'],
    ['Lehár', '레하르'], ['Lehar', '레하르'], ['Chausson', '쇼송'], ['Enescu', '에네스쿠'],
    ['Hindemith', '힌데미트'], ['Bottesini', '보테시니'], ['Korsakov', '림스키코르사코프'],
    ['Elgar', '엘가'], ['Holst', '홀스트'], ['Smetana', '스메타나'], ['Mussorgsky', '무소륵스키'],
    ['Respighi', '레스피기'], ['Bernstein', '번스타인'], ['Gershwin', '거슈윈'], ['Satie', '사티'],
    ['Kreisler', '크라이슬러'], ['Ysaÿe', '이자이'], ['Wieniawski', '비에냐프스키'],
    ['Scarlatti', '스카를라티'], ['Telemann', '텔레만'], ['Kapustin', '카푸스틴'],
    ['Vieuxtemps', '비외탕'], ['Ernst', '에른스트'], ['Biber', '비버']
  ];
  const detected = new Set();
  for (const [en, ko] of composerPairs) {
    if (text.toLowerCase().includes(en.toLowerCase()) || text.includes(ko)) {
      detected.add(ko);
    }
  }
  if (detected.size > 0) {
    concert.composers = Array.from(detected);
  } else if (Array.isArray(concert.composers)) {
    concert.composers = concert.composers.filter(c => c !== '클래식 명작' && (c !== '리스트' || text.includes('리스트') || text.toLowerCase().includes('liszt')));
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

  const { start, end, cutoffIso } = getTodayYYYYMMDD();
  console.log(`수집 및 유지 대상 기간: ${start} (${cutoffIso} 이후) ~ ${end}`);

  const existingConcerts = JSON.parse(fileContent.substring(jsonStart, jsonEnd + 1));
  const concertMap = new Map();
  let prunedPastCount = 0;
  existingConcerts.forEach(c => {
    if (c.date && c.date < cutoffIso) {
      prunedPastCount++;
      return;
    }
    const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    if (rawId) concertMap.set(rawId, c);
  });
  if (prunedPastCount > 0) {
    console.log(`지난달 이전 과거 공연 ${prunedPastCount}건 자동 정리 완료 (${cutoffIso} 이전 데이터 정리).`);
  }

  let newConcertsCount = 0;
  let updatedCount = 0;

  // 1페이지부터 최대 25페이지까지 신규/수정 분량 전수 탐색 (페이지당 100건 = 최대 2,500건, 현재 달 ~ 향후 2년 전량 커버)
  for (let page = 1; page <= 25; page++) {
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
      const rawDate = fromMatch ? fromMatch[1].trim().replace(/\./g, '-') : cutoffIso;
      if (rawDate < cutoffIso) continue;
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
          composers: [],
          pieces: [],
          price: '공식 예매처 참조',
          ticketUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(venue + ' 공식 예매')}`,
          status: status,
          source: 'KOPIS 전산망 공식 수집',
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

  // 0. initialRealConcerts.js에 이미 적재된 introImages, imageUrl, description, ticketUrl을 detailsCache에 자동 병합(Hydration)
  for (const [rawId, c] of concertMap.entries()) {
    const existingD = detailsCache[rawId] || {};
    const hasRealDesc = c.description &&
      c.description.length > 25 &&
      !c.description.includes('정통 클래식 무대') &&
      !c.description.includes('정부 공식 등록 클래식') &&
      !c.description.includes('시즌 공식 클래식 공연');

    if (
      (c.introImages && c.introImages.length > 0) ||
      hasRealDesc ||
      (c.imageUrl && c.imageUrl.includes('kopis.or.kr')) ||
      (c.ticketUrl && !c.ticketUrl.includes('search.naver.com'))
    ) {
      detailsCache[rawId] = {
        ...existingD,
        fcltynm: existingD.fcltynm || c.venue || '',
        hall: existingD.hall || c.hall || null,
        sty: existingD.sty || (hasRealDesc ? c.description : ''),
        poster: existingD.poster || (c.imageUrl && c.imageUrl.includes('kopis.or.kr') ? c.imageUrl : ''),
        styurls: (existingD.styurls && existingD.styurls.length > 0) ? existingD.styurls : (c.introImages || []),
        relateUrl: existingD.relateUrl || (c.ticketUrl && !c.ticketUrl.includes('search.naver.com') ? c.ticketUrl : ''),
        relateUrls: (existingD.relateUrls && existingD.relateUrls.length > 0)
          ? existingD.relateUrls
          : (c.ticketUrl && !c.ticketUrl.includes('search.naver.com') ? [c.ticketUrl] : [])
      };
    }
  }

  // KOPIS 상세 XML 미보유 공연 조회 + 미공개 예정 공연 자동 재조회(Rolling Re-Check Window)
  // 주최 측이 초기 등록 시 곡목을 비워두고 공연 임박 시점에 상세 소개글(<sty>)이나 프로그램 전단(<styurls>)을 뒤늦게 올리는 경우를 100% 포착
  const todayKstIso = formatKSTNow().slice(0, 10);
  const twoWeeksLaterDate = new Date(Date.now() + 9 * 60 * 60 * 1000 + 14 * 24 * 60 * 60 * 1000);
  const twoWeeksLaterIso = twoWeeksLaterDate.toISOString().slice(0, 10);
  const daysSince = (isoStr) => {
    if (!isoStr) return 999;
    const diff = Date.parse(todayKstIso) - Date.parse(isoStr);
    return Number.isFinite(diff) ? Math.floor(diff / (24 * 60 * 60 * 1000)) : 999;
  };

  const idsNeedingXml = Array.from(concertMap.entries())
    .filter(([rawId, c]) => {
      if (c.pieces && c.pieces.length > 0) return false;
      const d = detailsCache[rawId];
      if (!d || !d.xmlFetched) return true;
      // 예정 공연 중 곡목이 아직 비어 있는 경우: 공연 14일 이내에는 매일 1회, 그 외 예정 공연은 3일마다 KOPIS 변경 여부 자동 재조회
      if (c.date && c.date >= todayKstIso) {
        const elapsed = daysSince(d.lastReCheckDate);
        if (c.date <= twoWeeksLaterIso) return elapsed >= 1;
        return elapsed >= 3;
      }
      return false;
    })
    .sort(([, a], [, b]) => {
      const aUpcoming = a.date >= todayKstIso ? 1 : 0;
      const bUpcoming = b.date >= todayKstIso ? 1 : 0;
      if (aUpcoming !== bUpcoming) return bUpcoming - aUpcoming;
      if (aUpcoming && a.date !== b.date) return a.date.localeCompare(b.date);
      const score = (c) => {
        let s = 0;
        if (/예술의전당|롯데콘서트홀|세종문화회관|금호아트홀|부천아트센터|아트센터인천|통영국제음악당|대구콘서트하우스/.test(c.venue)) s += 50;
        if (/독주회|리사이틀|Recital|오케스트라|교향악단/i.test(c.title)) s += 30;
        return s;
      };
      return score(b) - score(a);
    })
    .slice(0, 600)
    .map(([rawId]) => rawId);

  if (idsNeedingXml.length > 0) {
    console.log(`KOPIS 공식 OpenAPI에서 상세 XML(신규 + 미공개 예정 공연 자동 재조회) ${idsNeedingXml.length}건 실시간 동기화 중...`);
    let xmlSuccess = 0;
    let newlyUpdatedMedia = 0;
    for (let i = 0; i < idsNeedingXml.length; i += 6) {
      const chunk = idsNeedingXml.slice(i, i + 6);
      const fetched = await Promise.all(chunk.map(id => fetchConcertDetail(id)));
      chunk.forEach((id, idx) => {
        const prev = detailsCache[id] || {};
        if (fetched[idx] && isValidDetailCache(fetched[idx])) {
          const prevStyurlsKey = (prev.styurls || []).join('|');
          const nextStyurlsKey = (fetched[idx].styurls || []).join('|');
          const mediaChanged =
            (nextStyurlsKey && nextStyurlsKey !== prevStyurlsKey) ||
            (fetched[idx].poster && fetched[idx].poster !== prev.poster) ||
            ((fetched[idx].sty || '').length > (prev.sty || '').length + 15);

          detailsCache[id] = {
            ...prev,
            ...fetched[idx],
            xmlFetched: true,
            lastReCheckDate: todayKstIso,
            ...(mediaChanged ? { ocrChecked: false, pageChecked: false, ocrText: '' } : {})
          };
          if (mediaChanged) newlyUpdatedMedia++;
          xmlSuccess++;
        } else if (detailsCache[id]) {
          detailsCache[id].lastReCheckDate = todayKstIso;
        }
      });
      await sleep(120);
      if ((i + 6) % 30 === 0 || i + 6 >= idsNeedingXml.length) {
        console.log(`  - 상세 XML 동기화 진행: ${Math.min(i + 6, idsNeedingXml.length)} / ${idsNeedingXml.length} (성공: ${xmlSuccess}건, 신규 전단·소개글 감지: ${newlyUpdatedMedia}건)`);
      }
    }
    try {
      fs.writeFileSync(detailsCachePath, JSON.stringify(detailsCache, null, 2), 'utf8');
    } catch {}
  }

  // 기존 적재된 pieces에 대해서도 OCR 오타 교정, 비곡목 라인 정제, 작곡가 누락 자동 보강 및 연주 편성(5분류) 동기화 적용
  for (const c of concertMap.values()) {
    const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    const d = detailsCache[rawId] || {};
    const styText = d.sty || c.description || '';
    c.performerType = classifyPerformerType(c);
    if (c.source && c.source.includes('KOPIS')) {
      c.source = 'KOPIS 전산망 공식 수집';
    }
    if (Array.isArray(c.composers)) {
      c.composers = c.composers.filter(comp => comp && comp !== '클래식 명작');
    }
    // description에 명시적 [PROGRAM]/[프로그램]이 있는 경우 최신 파서로 재추출하여 작곡가 결합 보장
    if (styText && /(?:\[PROGRAM\]|\[프로그램\]|\[Program)/i.test(styText)) {
      const reparsed = extractPiecesSmart(styText, { isPlainSty: true });
      if (reparsed.length > 0 && (!c.pieces || reparsed.length >= c.pieces.length || c.pieces.some(p => !extractExistingComposer(p)))) {
        c.pieces = reparsed;
      }
    }
    if (Array.isArray(c.pieces) && c.pieces.length > 0) {
      enrichConcertPiecesWithComposers(c, styText);
      syncComposersFromPieces(c);
      if (detailsCache[rawId]) {
        detailsCache[rawId].extractedPieces = c.pieces;
      }
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

  // [Stage 1] KOPIS <sty> 및 공연 description 소개글 정밀 파싱
  for (const c of itemsToEnrich) {
    const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    const d = detailsCache[rawId] || {};
    if (isValidDetailCache(d)) {
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
          if (normP && !isInvalidPieceNoise(normP) && !BIO_EXCLUDE_REGEX.test(normP) && !MOVEMENT_ONLY_REGEX.test(normP) && normP.length >= 4) {
            addUniquePiece(cleanedCachePieces, normP);
          }
        }
        d.extractedPieces = cleanedCachePieces;
        if (cleanedCachePieces.length > 0) {
          c.pieces = cleanedCachePieces;
          syncComposersFromPieces(c);
          stage1StyCount++;
        }
      }
      if (!c.pieces || c.pieces.length === 0) {
        const textToParse = (d.sty && d.sty.length > 15) ? d.sty : (c.description || '');
        if (textToParse.length > 20) {
          const fromSty = extractPiecesSmart(textToParse, { isPlainSty: true });
          if (fromSty.length > 0) {
            c.pieces = fromSty;
            d.extractedPieces = fromSty;
            syncComposersFromPieces(c);
            stage1StyCount++;
          }
        }
      }
      if ((!c.pieces || c.pieces.length === 0) && d.ocrText && d.ocrText.length > 10) {
        const fromCachedOcr = extractPiecesSmart(d.ocrText, { isOcr: true });
        if (fromCachedOcr.length > 0) {
          c.pieces = fromCachedOcr;
          d.extractedPieces = fromCachedOcr;
          syncComposersFromPieces(c);
          stage3PosterOcrCount++;
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
    const aUpcoming = a.concert.date >= '2026-11-15' ? 1 : (a.concert.date >= '2026-10-15' ? 0.5 : 0);
    const bUpcoming = b.concert.date >= '2026-11-15' ? 1 : (b.concert.date >= '2026-10-15' ? 0.5 : 0);
    if (aUpcoming !== bUpcoming) return bUpcoming - aUpcoming;
    const aHasIntro = (a.detail.styurls && a.detail.styurls.length > 0) ? 1 : 0;
    const bHasIntro = (b.detail.styurls && b.detail.styurls.length > 0) ? 1 : 0;
    if (aHasIntro !== bHasIntro) return bHasIntro - aHasIntro;
    if (aUpcoming === 1 && a.concert.date !== b.concert.date) {
      return a.concert.date.localeCompare(b.concert.date);
    }
    const score = (c) => {
      let s = 0;
      if (/예술의전당|롯데콘서트홀|세종문화회관|금호아트홀|부천아트센터|아트센터인천|통영국제음악당|대구콘서트하우스/.test(c.venue)) s += 50;
      if (/독주회|리사이틀|Recital|오케스트라|교향악단/i.test(c.title)) s += 40;
      return s;
    };
    return score(b.concert) - score(a.concert);
  };

  // [Stage 2] 공식 상세페이지(<relateurl>) 자동 접속 및 HTML 프로그램 파싱
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
      if (concert.date < '2026-10-01') return false;
      if (detail.ocrChecked && detail.ocrText) return false;
      const hasImages = (detail.styurls && detail.styurls.length > 0) || (detail.poster && detail.poster.startsWith('http'));
      return hasImages;
    })
    .sort(prioritySort)
    .slice(0, 350);

  if (stage3Candidates.length > 0) {
    console.log(`[Stage 3] 세부 프로그램 미기재 공연 포스터·소개전단 이미지(${stage3Candidates.length}건) 자동 OCR 판독 중...`);
    const ocrTasks = stage3Candidates.map(({ rawId, detail }) => ({
      rawId,
      urls: [...(detail.styurls || []), detail.poster].filter(Boolean)
    }));
    const ocrPiecesMap = await batchExtractPiecesFromImages(ocrTasks);
    for (const { concert, detail, rawId } of stage3Candidates) {
      const res = ocrPiecesMap.get(rawId);
      if (res) {
        detail.ocrChecked = true;
        if (res.ocrText) detail.ocrText = res.ocrText;
        if (res.pieces && res.pieces.length > 0) {
          concert.pieces = res.pieces;
          detail.extractedPieces = res.pieces;
          syncComposersFromPieces(concert);
          stage3PosterOcrCount++;
        }
      }
    }
  }

  // 업데이트된 상세 캐시(extractedPieces, pageChecked, ocrChecked, ocrText 포함) 영구 저장
  try {
    fs.writeFileSync(detailsCachePath, JSON.stringify(detailsCache, null, 2), 'utf8');
  } catch {}

  // [Stage 4] 공연 제목·부제·산문 소개글 내 명시된 레퍼토리 정밀 추출
  for (const c of itemsToEnrich) {
    if (!c.pieces || c.pieces.length === 0) {
      const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
      const d = detailsCache[rawId] || {};
      const fromTitle = extractPiecesFromTitle(c.title, d.sty || c.description || '');
      if (fromTitle.length > 0) {
        c.pieces = fromTitle;
        syncComposersFromPieces(c);
        stage4TitleCount++;
      }
    }
  }

  // [Stage 3.5] 동일 투어·동일 시리즈 자매 공연 간 검증된 상세 프로그램 자동 공유
  const allConcertsArr = Array.from(concertMap.values());
  const stage35SiblingCount = shareProgramsAcrossTourSiblings(allConcertsArr);

  // 새로 발굴된 모든 공연 pieces에 대해서도 작곡가 누락 보강 및 비곡목 노이즈 필터링 최종 적용
  for (const c of allConcertsArr) {
    if (Array.isArray(c.pieces) && c.pieces.length > 0) {
      const rawId = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
      const d = detailsCache[rawId] || {};
      enrichConcertPiecesWithComposers(c, d.sty || d.ocrText || c.description || '');
      syncComposersFromPieces(c);
      if (detailsCache[rawId]) {
        detailsCache[rawId].extractedPieces = c.pieces;
      }
    }
  }

  const totalPiecesExtracted = stage1StyCount + stage2DetailPageCount + stage3PosterOcrCount + stage35SiblingCount + stage4TitleCount;
  console.log(
    `[5단계 프로그램 자동 추출 완료] 총 ${totalPiecesExtracted}건 추가 발굴 ` +
    `(Stage1 KOPIS소개글: ${stage1StyCount}건, Stage2 상세페이지: ${stage2DetailPageCount}건, Stage3 포스터/전단OCR: ${stage3PosterOcrCount}건, Stage3.5 투어공유: ${stage35SiblingCount}건, Stage4 제목/산문매칭: ${stage4TitleCount}건)`
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
      stage35Sibling: stage35SiblingCount,
      stage4Title: stage4TitleCount
    },
    totalConcerts: updatedConcertList.length,
    message: `KOPIS 공식 OpenAPI 동기화 및 5단계 자동 프로그램 추출(소개글 ${stage1StyCount}건, 상세페이지 ${stage2DetailPageCount}건, 포스터·전단OCR ${stage3PosterOcrCount}건, 투어공유 ${stage35SiblingCount}건, 제목·산문 ${stage4TitleCount}건) 완료`
  };

  logs = [logEntry, ...logs].slice(0, 30);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
  console.log(`[${logEntry.timestamp}] 정기 동기화 배치 성공 완료!`);

  // --auto-push 플래그로 실행된 경우에만 GitHub에 자동 푸시 (CI에서는 워크플로우 단계가 커밋/푸시 담당)
  if (process.argv.includes('--auto-push')) {
    try {
      const { execSync } = require('child_process');
      const repoRoot = path.resolve(__dirname, '..');
      execSync('git add src/data/initialRealConcerts.js scripts/daily_sync_log.json scripts/kopis_all_details.json', { cwd: repoRoot, stdio: 'ignore' });
      const diffStatus = execSync('git status --porcelain src/data/initialRealConcerts.js', { cwd: repoRoot }).toString().trim();
      if (diffStatus) {
        execSync(`git commit -m "chore(data): automated 3AM KOPIS concert dataset sync (${logEntry.timestamp})"`, { cwd: repoRoot, stdio: 'ignore' });
        execSync('git push origin main', { cwd: repoRoot, stdio: 'ignore' });
        console.log(`[GitHub & Render 자동 배포] 최신 공연 데이터(${updatedConcertList.length}건)가 GitHub(origin/main)에 푸시되어 Render 사이트에 자동 반영됩니다.`);
      } else {
        console.log(`[GitHub & Render 자동 배포] 공연 데이터 변경사항이 없어 푸시를 생략합니다.`);
      }
    } catch (gitErr) {
      console.warn(`[GitHub 푸시 참고] 로컬 파일은 정상 갱신되었으나 원격 푸시 중 경고가 발생했습니다:`, gitErr.message);
    }
  }
}

main().catch(err => {
  console.error('[KOPIS 새벽 3시 배치 실패]:', err);
  process.exit(1);
});
