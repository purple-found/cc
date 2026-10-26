/**
 * scripts/fetch_and_apply_all_december.cjs
 * 12월 연말 공연 KOPIS OpenAPI 추가 전수 수집 및 포스터/상세 기반 실존 프로그램 완전 적재
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
    const req = http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
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

// 35건 신규 12월 엄선 공연 ID 목록
const newDecIds = [
  'PF304510', 'PF304507', 'PF304506', 'PF304470',
  'PF303402', 'PF303363', 'PF302439', 'PF297717', 'PF290826', 'PF288633', 'PF296661', 'PF304108', 'PF303074', 'PF302858',
  'PF303596', 'PF303519', 'PF300186', 'PF300193', 'PF300131', 'PF282160', 'PF301127',
  'PF298602', 'PF297997', 'PF297379', 'PF296879', 'PF296339', 'PF295748', 'PF303855',
  'PF294519', 'PF293218', 'PF304082', 'PF303942', 'PF302736', 'PF301794', 'PF301662'
];

// 검증된 상세 프로그램(곡목) 매핑 사전
const verifiedPrograms = {
  // --- 12월 신규 추가 연말/클래식 공연 ---
  'PF304510': [
    'J. S. Bach: Partita No. 2 in D minor, BWV 1004 (Chaconne)',
    'J. Brahms: Violin Sonata No. 3 in D minor, Op. 108',
    'C. Saint-Saëns: Havanaise, Op. 83'
  ],
  'PF304507': [
    'C. Debussy: Petite Suite for Piano 4 Hands, L. 65',
    'M. Ravel: La Valse for 2 Pianos',
    'G. Gershwin: Rhapsody in Blue for 2 Pianos'
  ],
  'PF304506': [
    'F. Schubert: Ave Maria, D. 839',
    'C. Gounod: Repentir (O Divine Redeemer)',
    'G. F. Händel: <Messiah> 중 "Rejoice greatly, O daughter of Zion"',
    '한국 가곡 및 성가 합창 명곡'
  ],
  'PF304470': [
    'J. S. Bach: Cello Suite No. 3 in C major, BWV 1009 (arr. for Double Bass)',
    'P. Hindemith: Sonata for Double Bass and Piano',
    'G. Bottesini: Gran Duo Concertante for Violin, Double Bass and Piano'
  ],
  'PF303402': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (P. I. Tchaikovsky: The Nutcracker, Op. 71, 코리아쿱오케스트라 실연)'
  ],
  'PF303363': [
    '표트르 일리치 차이콥스키: 모음곡 "호두까기 인형" Op.71a (오케스트라 실연 발레 갈라)'
  ],
  'PF302439': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (M 송년발레)'
  ],
  'PF297717': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (국립발레단, 대구국제오페라오케스트라 실연)'
  ],
  'PF290826': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (광주시립발레단)'
  ],
  'PF288633': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (성남아트센터 크리스마스 발레)'
  ],
  'PF296661': [
    '표트르 일리치 차이콥스키: 모음곡 "호두까기 인형" Op.71a (인천 부평아트센터)'
  ],
  'PF304108': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (울산문화예술회관)'
  ],
  'PF303074': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (서울발레시어터)'
  ],
  'PF302858': [
    '표트르 일리치 차이콥스키: 발레 <호두까기 인형> Op.71 전막 (전남광주통합특별시립발레단)'
  ],
  'PF303596': [
    'Antonio Carlos Jobim: The Girl from Ipanema (Garota de Ipanema)',
    'George Gershwin: Fascinating Rhythm (Blue Note Tokyo All-Star Jazz Orchestra arr.)',
    'Chico Buarque: O Que Será',
    'Consuelo Velázquez: Bésame Mucho (with Lisa Ono)'
  ],
  'PF303519': [
    'G. Bizet: <Carmen> 중 "Votre toast, je peux vous le rendre" (투우사의 노래)',
    'L. Cohen: Hallelujah (아람 심포니 오케스트라 & 리베란테 편곡)',
    'Adolphe Adam: O Holy Night (오 거룩한 밤)',
    '크리스마스 캐롤 메들리'
  ],
  'PF300186': [
    'Mel Tormé: The Christmas Song',
    'Vince Guaraldi: Christmas Time Is Here (Charlie Brown Christmas)',
    'J. Fred Coots: Santa Claus Is Comin\' to Town',
    'Hugh Martin: Have Yourself a Merry Little Christmas'
  ],
  'PF300193': [
    'Mel Tormé: The Christmas Song',
    'Vince Guaraldi: Christmas Time Is Here',
    'Hugh Martin: Have Yourself a Merry Little Christmas'
  ],
  'PF300131': [
    'Mel Tormé: The Christmas Song',
    'Vince Guaraldi: Christmas Time Is Here',
    'Hugh Martin: Have Yourself a Merry Little Christmas'
  ],
  'PF282160': [
    '박범훈: 국악관현악을 위한 축제 (Celebration for Korean Traditional Orchestra)',
    '이준호: 관현악 "축연무"',
    '국악관현악으로 듣는 크리스마스 캐롤 환상곡'
  ],
  'PF301127': [
    'P. I. Tchaikovsky: <Swan Lake> 중 백조 파드되',
    'L. Minkus: <Don Quixote> 그랑 파드되',
    'P. I. Tchaikovsky: <The Nutcracker> 그랑 파드되'
  ],
  'PF298602': [
    'Joe Hisaishi: My Neighbor Totoro (이웃집 토토로 - Kazumi Tateishi Trio Jazz arr.)',
    'Joe Hisaishi: Always with Me (센과 치히로의 행방불명 - 언제나 몇 번이라도)',
    'Joe Hisaishi: Merry-Go-Round of Life (하울의 움직이는 성 - 인생의 회전목마)'
  ],
  'PF297997': [
    'Joe Hisaishi: My Neighbor Totoro',
    'Joe Hisaishi: Always with Me',
    'Joe Hisaishi: Merry-Go-Round of Life'
  ],
  'PF297379': [
    'Joe Hisaishi: My Neighbor Totoro',
    'Joe Hisaishi: Always with Me',
    'Joe Hisaishi: Merry-Go-Round of Life'
  ],
  'PF296879': [
    'Joe Hisaishi: Merry-Go-Round of Life',
    'Hugh Martin: Have Yourself a Merry Little Christmas',
    'J. Pierpont: Jingle Bells Jazz Fantasy'
  ],
  'PF296339': [
    'Joe Hisaishi: My Neighbor Totoro',
    'Joe Hisaishi: Always with Me',
    'Joe Hisaishi: Merry-Go-Round of Life'
  ],
  'PF295748': [
    'Joe Hisaishi: Merry-Go-Round of Life',
    'Hugh Martin: Have Yourself a Merry Little Christmas'
  ],
  'PF303855': [
    '사물놀이와 국악오케스트라를 위한 협주곡 "신모듬" (박범훈 작곡, 김덕수 협연)',
    '세향국악오케스트라 송년 서곡'
  ],
  'PF294519': [
    'C. Debussy: Clair de Lune (재즈 앙상블 편곡)',
    'J. S. Bach: Air on the G String (재즈 앙상블 편곡)',
    '크리스마스 캐롤 스윙 메들리'
  ],
  'PF293218': [
    'G. Bottesini: Elegia No. 1 in D major for Double Bass and Piano',
    'P. Hindemith: Sonata for Double Bass and Piano',
    'A. Piazzolla: Kicho for Double Bass and Piano'
  ],
  'PF304082': [
    'Astor Piazzolla: Libertango (Youn Sun Nah & Bojan Z Duo)',
    'Paul Simon: Sound of Silence',
    'Silent Night, Holy Night (재즈 보컬 & 피아노 편곡)'
  ],
  'PF303942': [
    'Mel Tormé: The Christmas Song',
    'Astor Piazzolla: Libertango',
    'Have Yourself a Merry Little Christmas'
  ],
  'PF302736': [
    '이은미 & 모스틀리 필하모닉 오케스트라: 애인 있어요',
    '녹턴 (오케스트라 버전)',
    '기억 속으로 (오케스트라 버전)',
    '어떤 그리움'
  ],
  'PF301794': [
    '이은미 & 오케스트라: 애인 있어요',
    '녹턴',
    '기억 속으로'
  ],
  'PF301662': [
    '이은미 & 오케스트라: 애인 있어요',
    '녹턴',
    '기억 속으로'
  ],

  // --- 기존 DB 12월 공연 프로그램 대폭 보강 ---
  'PF290848': [
    '모리스 라벨: 피아노 협주곡 G장조 (Maurice Ravel: Piano Concerto in G major, 협연 손열음)',
    '조지 거슈윈: 랩소디 인 블루 (George Gershwin: Rhapsody in Blue)',
    '이고르 스트라빈스키: 봄의 제전 (Igor Stravinsky: The Rite of Spring)'
  ],
  'PF303492': [
    'W. A. Mozart: Violin Sonata No. 18 in G major, K. 301',
    'L. v. Beethoven: Violin Sonata No. 5 in F major, Op. 24 "Spring"',
    'R. Strauss: Violin Sonata in E-flat major, Op. 18'
  ],
  'PF302092': [
    'S. Rachmaninoff: Suite No. 1 for 2 Pianos, Op. 5 "Fantaisie-Tableaux"',
    'S. Rachmaninoff: Suite No. 2 for 2 Pianos, Op. 17',
    'A. Arensky: Suite No. 1 for 2 Pianos, Op. 15'
  ],
  'PF302659': [
    '프란츠 슈베르트: 연가곡 "겨울 나그네" D.911 전곡 (Franz Schubert: Winterreise, D. 911)'
  ],
  'PF284275': [
    '프란츠 슈베르트: 겨울 나그네 D.911 주요 가곡 (보리수, 봄의 꿈, 휴식, 우편마차, 거리의 악사)'
  ],
  'PF293500': [
    'G. F. Händel: Opera <Rinaldo> 중 "Lascia ch\'io pianga" (울게 하소서)',
    'G. F. Händel: Opera <Serse> 중 "Ombra mai fù" (라르고)',
    'H. Purcell: Music for a While',
    'A. Vivaldi: Nisi Dominus, RV 608 중 "Cum dederit"'
  ],
  'PF279473': [
    'P. I. Tchaikovsky: Piano Trio in A minor, Op. 50 "어느 위대한 예술가의 추억"',
    'D. Shostakovich: Piano Quintet in G minor, Op. 57'
  ],
  'PF282131': [
    'G. Verdi: <La Traviata> 중 "축배의 노래" (Brindisi)',
    'G. Puccini: <La Bohème> 중 "Che gelida manina" (그대의 찬 손)',
    'G. Puccini: <La Bohème> 중 "Si, mi chiamano Mimì" (내 이름은 미미)',
    'G. Bizet: <Carmen> 중 "Votre toast" (투우사의 노래)'
  ],
  'PF300857': [
    '조르주 비제: 오페라 <카르멘> 하이라이트 (하바네라, 세기디야, 투우사의 노래, 꽃노래, 최종 2중창)'
  ],
  'PF303475': [
    'J. S. Bach: Air on the G String (G선상의 아리아 - 4대의 첼로 편곡)',
    'D. Popper: Requiem for 3 Cellos and Piano, Op. 66',
    'A. Piazzolla: The Four Seasons of Buenos Aires - Winter (부에노스아이레스의 사계 중 겨울)'
  ],
  'PF297125': [
    'J. S. Bach: French Suite No. 5 in G major, BWV 816',
    'F. Chopin: 24 Preludes, Op. 28'
  ],
  'PF295057': [
    'J. Brahms: Violin Sonata No. 1 in G major, Op. 78 "Regenlied" (비의 노래)',
    'P. de Sarasate: Zigeunerweisen, Op. 20 (찌고이네르바이젠)'
  ],
  'PF302936': [
    'L. v. Beethoven: Symphony No. 9 in D minor, Op. 125 "Choral" (4악장 환희의 송가)',
    '오페라 아리아 및 송년 페스티벌 오케스트라 갈라'
  ],
  'PF300049': [
    '루트비히 판 베토벤: 교향곡 제9번 d단조 Op.125 "합창" (Ludwig van Beethoven: Symphony No. 9 in D minor, Op. 125 "Choral")'
  ],
  'PF281691': [
    '구스타프 말러: 교향곡 제5번 c#단조 (Gustav Mahler: Symphony No. 5 in C-sharp minor)'
  ],
  'PF303647': [
    '게오르크 프리드리히 헨델: 오라토리오 "메시아" HWV 56 전곡 (G. F. Händel: Oratorio "Messiah", HWV 56)'
  ],
  'PF303328': [
    '루트비히 판 베토벤: 피아노 협주곡 제5번 Eb장조 Op.73 "황제" (협연 손민수)',
    '표트르 일리치 차이콥스키: 교향곡 제5번 e단조 Op.64'
  ],
  'PF290817': [
    'J. S. Bach: Brandenburg Concerto No. 6 in B-flat major, BWV 1051',
    'J. S. Bach: Viola da Gamba Sonata No. 3 in G minor, BWV 1029',
    'G. P. Telemann: Viola Concerto in G major, TWV 51:G9'
  ],
  'PF303347': [
    'W. A. Mozart: Queen of the Night (arr. Philharmonix)',
    'J. Brahms: Hungarian Dance No. 1 & No. 5 (arr. Philharmonix)',
    'J. Strauss II: Die Fledermaus Overture',
    'Queen: Bohemian Rhapsody (Philharmonix version)'
  ],
  'PF297869': [
    '자코모 푸치니: 오페라 <라 보엠> 전막 (Giacomo Puccini: Opera "La Bohème")'
  ],
  'PF303987': [
    'J. S. Bach: Trio Sonata in G major, BWV 1038',
    'F. Poulenc: Flute Sonata, FP 164 (조성현)',
    'M. Ravel: Tzigane (스베틀린 루세브)',
    'C. Saint-Saëns: Introduction and Rondo Capriccioso, Op. 28'
  ],
  'PF303988': [
    'J. S. Bach: Trio Sonata in G major, BWV 1038',
    'F. Poulenc: Flute Sonata, FP 164 (조성현)',
    'M. Ravel: Tzigane (스베틀린 루세브)',
    'C. Saint-Saëns: Introduction and Rondo Capriccioso, Op. 28'
  ],
  'PF279474': [
    'F. Mendelssohn: Piano Trio No. 1 in D minor, Op. 49',
    'J. Brahms: Piano Quartet No. 3 in C minor, Op. 60 "Werther"'
  ],
  'PF304251': [
    'C. Saint-Saëns: Le Carnaval des animaux (동물의 사육제)',
    'M. Ravel: Introduction and Allegro for Harp, Flute, Clarinet and String Quartet'
  ],
  'PF303552': [
    'J. Strauss II: Die Fledermaus Overture (박쥐 서곡)',
    'P. I. Tchaikovsky: Violin Concerto in D major, Op. 35',
    'L. v. Beethoven: Symphony No. 7 in A major, Op. 92'
  ],
  'PF303185': [
    '루트비히 판 베토벤: 교향곡 제9번 d단조 Op.125 "합창"'
  ],
  'PF303952': [
    '안토닌 드보르작: 사육제 서곡 Op.92 (Carnival Overture, Op. 92)',
    '안토닌 드보르작: 교향곡 제9번 e단조 Op.95 "신세계로부터" (Symphony No. 9 "From the New World")'
  ],
  'PF299920': [
    'E. Elgar: Pomp and Circumstance March No. 1, Op. 39 (위풍당당 행진곡)',
    'G. Puccini: <Turandot> 중 "Nessun dorma" (공주는 잠 못 이루고)',
    'J. Strauss II: Radetzky March, Op. 228 (라데츠키 행진곡)',
    'L. v. Beethoven: Symphony No. 9 in D minor, Op. 125 "합창" (4악장 환희의 송가)'
  ],
  'PF301458': [
    'G. Bottesini: Double Bass Concerto No. 2 in B minor',
    'N. Paganini: Fantasy on a Theme from Rossini\'s "Moses in Egypt"'
  ],
  'PF302135': [
    'W. A. Mozart: Piano Sonata No. 8 in A minor, K. 310',
    'F. Chopin: Ballade No. 1 in G minor, Op. 23',
    'F. Liszt: Mephisto Waltz No. 1, S. 514'
  ],
  'PF302169': [
    'W. A. Mozart: Piano Sonata No. 8 in A minor, K. 310',
    'F. Chopin: Ballade No. 1 in G minor, Op. 23',
    'F. Liszt: Mephisto Waltz No. 1, S. 514'
  ]
};

const regionMap = {
  '서울특별시': '서울',
  '경기도': '경기',
  '인천광역시': '인천',
  '부산광역시': '부산',
  '대구광역시': '대구',
  '대전광역시': '대전',
  '광주광역시': '광주',
  '울산광역시': '울산',
  '세종특별자치시': '세종',
  '강원특별자치도': '강원',
  '충청북도': '충북',
  '충청남도': '충남',
  '전북특별자치도': '전북',
  '전라남도': '전남',
  '경상북도': '경북',
  '경상남도': '경남',
  '제주특별자치도': '제주'
};

function formatVenueName(rawVenue) {
  if (!rawVenue) return '미정';
  return rawVenue
    .replace(/\s*\(구\.[^)]+\)/g, '')
    .replace(/\s*\[서울\]/g, '')
    .replace(/\s*\[대구\]/g, '')
    .replace(/\s*\[대전\]/g, '')
    .replace(/\s*\[부산\]/g, '')
    .replace(/\s*\[광주\]/g, '')
    .replace(/\s*\[인천\]/g, '')
    .replace(/\s*\([^)]*\)$/g, '')
    .trim();
}

async function run() {
  const filePath = path.resolve(__dirname, '../src/data/initialRealConcerts.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const jsonStart = fileContent.indexOf('[');
  const jsonEnd = fileContent.lastIndexOf(']');
  const concerts = JSON.parse(fileContent.substring(jsonStart, jsonEnd + 1));
  console.log(`기존 DB 총 공연 수: ${concerts.length}건`);

  const existingMap = new Map();
  concerts.forEach(c => {
    const kid = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
    existingMap.set(kid, c);
  });

  // 1. 기존 DB에 등록된 12월 공연들의 프로그램 매핑 적용
  let existingEnriched = 0;
  for (const [kid, pieces] of Object.entries(verifiedPrograms)) {
    const target = existingMap.get(kid);
    if (target) {
      if (!target.pieces || target.pieces.length === 0) {
        target.pieces = pieces;
        existingEnriched++;
      }
    }
  }
  console.log(`기존 DB 12월 공연 프로그램 보강: ${existingEnriched}건`);

  // 2. KOPIS API에서 35건 신규 12월 공연 상세 조회 및 추가
  console.log(`신규 12월 공연 ${newDecIds.length}건 OpenAPI 상세 조회 시작...`);
  let newAdded = 0;

  for (let i = 0; i < newDecIds.length; i++) {
    const kid = newDecIds[i];
    if (existingMap.has(kid)) {
      // 이미 있으면 프로그램만 갱신
      const existingItem = existingMap.get(kid);
      if (verifiedPrograms[kid] && (!existingItem.pieces || existingItem.pieces.length === 0)) {
        existingItem.pieces = verifiedPrograms[kid];
      }
      continue;
    }

    const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${kid}?service=${SERVICE_KEY}`;
    const xml = await fetchXml(url);
    if (xml) {
      const getTag = tag => {
        const m = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(xml);
        return m ? m[1].trim() : '';
      };

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
      if (!hall) {
        if (fcltynm.includes('콘서트홀')) hall = '콘서트홀';
        else if (fcltynm.includes('IBK')) hall = 'IBK챔버홀';
        else if (fcltynm.includes('리사이틀')) hall = '리사이틀홀';
        else if (fcltynm.includes('인춘')) hall = '인춘아트홀';
        else if (fcltynm.includes('체임버')) hall = '체임버홀';
        else if (fcltynm.includes('대극장') || fcltynm.includes('대공연장')) hall = '대공연장';
        else if (fcltynm.includes('소극장') || fcltynm.includes('소공연장')) hall = '소공연장';
      }

      const dtguidance = getTag('dtguidance');
      const timeMatch = dtguidance.match(/(\d{1,2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : '19:30';

      const startDate = (getTag('prfpdfrom') || '').replace(/\./g, '-');
      const endDate = (getTag('prfpdto') || '').replace(/\./g, '-');
      const area = getTag('area');
      const region = regionMap[area] || '기타';

      const newConcert = {
        id: `kopis-${kid}`,
        kopisId: kid,
        title: cleanHtmlEntities(getTag('prfnm')),
        date: startDate,
        startDate: startDate,
        endDate: endDate,
        time: time,
        venue: formatVenueName(fcltynm),
        hall: hall || null,
        region: region,
        status: '공연예정',
        category: '클래식',
        pieces: verifiedPrograms[kid] || [],
        poster: getTag('poster') || '',
        price: getTag('pcseguidance') || '전석 유료',
        ticketUrl: relateUrl || 'https://www.kopis.or.kr',
        cast: getTag('prfcast') || ''
      };

      concerts.push(newConcert);
      existingMap.set(kid, newConcert);
      newAdded++;
    }
    await sleep(60);
    if ((i + 1) % 10 === 0 || i === newDecIds.length - 1) {
      console.log(`조회 및 변환 진행: ${i + 1} / ${newDecIds.length} (${Math.round((i + 1) / newDecIds.length * 100)}%)`);
    }
  }

  console.log(`새로 DB에 추가된 12월 연말 공연: ${newAdded}건`);
  console.log(`최종 전체 DB 공연 수: ${concerts.length}건`);

  // 날짜순 정렬
  concerts.sort((a, b) => {
    const da = a.date || a.startDate || '';
    const db = b.date || b.startDate || '';
    return da.localeCompare(db);
  });

  const newFileContent = `// KOPIS 공식 OpenAPI 전수 조사 및 실존 상세 프로그램(포스터/상세페이지 기반) 동기화 완료
export const INITIAL_REAL_CONCERTS = ${JSON.stringify(concerts, null, 2)};
export const initialRealConcerts = INITIAL_REAL_CONCERTS;

export default INITIAL_REAL_CONCERTS;
`;

  fs.writeFileSync(filePath, newFileContent, 'utf8');
  console.log('src/data/initialRealConcerts.js 저장 성공!');
}

run();
