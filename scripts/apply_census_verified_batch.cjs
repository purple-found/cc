const fs = require('fs');
const path = require('path');

const CONCERTS_FILE = path.join(__dirname, '../src/data/initialRealConcerts.js');

const censusVerifiedData = {
  // 1. Seong-Jin Cho Chamber Concert [Bucheon Art Center]
  'PF293988': {
    composers: ['요하네스 브람스'],
    performerType: '실내악',
    performers: ['조성진', '다이신 카시모토', '박경민', '키안 솔타니', '벤젤 푹스', '슈테판 도어'],
    pieces: [
      'Brahms: Clarinet Trio in A minor, Op. 114 (브람스 클라리넷 삼중주 a단조)',
      'Brahms: Horn Trio in E-flat major, Op. 40 (브람스 호른 삼중주 E-flat장조)',
      'Brahms: Piano Quartet No. 1 in G minor, Op. 25 (브람스 피아노 사중주 제1번 g단조)'
    ]
  },
  // 2. Yeol Eum Son Recital [Bucheon]
  'PF294542': {
    composers: ['파데레프스키', '프리드만', '호프만', '체르카스키', '카사드쥐', '바흐'],
    performerType: '독주',
    performers: ['손열음'],
    pieces: [
      'Paderewski: Miscellanea, Op. 16 No. 4 Nocturne in B-flat major',
      'Friedman: Viennese Dance No. 1 after Eduard Gärtner',
      'Hofmann: Kaleidoskop, Op. 40 No. 4',
      'Cherkassky: Prélude pathétique',
      'Casadesus: Toccata, Op. 40',
      'Bach / Dame Myra Hess: Jesu, Joy of Man\'s Desiring, BWV 147',
      'Bach / Paul Wittgenstein: Chaconne in D minor for the Left Hand Alone (from BWV 1004)'
    ]
  },
  // 3. Yeol Eum Son Recital [Pyeongtaek]
  'PF300231': {
    composers: ['파데레프스키', '프리드만', '호프만', '체르카스키', '카사드쥐', '바흐'],
    performerType: '독주',
    performers: ['손열음'],
    pieces: [
      'Paderewski: Miscellanea, Op. 16 No. 4 Nocturne in B-flat major',
      'Friedman: Viennese Dance No. 1 after Eduard Gärtner',
      'Hofmann: Kaleidoskop, Op. 40 No. 4',
      'Cherkassky: Prélude pathétique',
      'Casadesus: Toccata, Op. 40',
      'Bach / Dame Myra Hess: Jesu, Joy of Man\'s Desiring, BWV 147',
      'Bach / Paul Wittgenstein: Chaconne in D minor for the Left Hand Alone (from BWV 1004)'
    ]
  },
  // 4. Lim Yunchan Recital [Daegu Suseong Artpia]
  'PF299596': {
    composers: ['볼프강 아마데우스 모차르트'],
    performerType: '독주',
    performers: ['임윤찬'],
    pieces: [
      'Mozart: Piano Sonata No. 1 in C major, K. 279',
      'Mozart: Piano Sonata No. 6 in D major, K. 284 "Dürnitz"',
      'Mozart: Fantasia in D minor, K. 397',
      'Mozart: Piano Sonata No. 12 in F major, K. 332',
      'Mozart: Piano Sonata No. 8 in A minor, K. 310'
    ]
  },
  // 5. Lim Yunchan Recital [Gimhae]
  'PF302869': {
    composers: ['볼프강 아마데우스 모차르트'],
    performerType: '독주',
    performers: ['임윤찬'],
    pieces: [
      'Mozart: Piano Sonata No. 4 in E-flat major, K. 282',
      'Mozart: Piano Sonata No. 13 in B-flat major, K. 333',
      'Mozart: Piano Sonata No. 9 in D major, K. 311',
      'Mozart: Piano Sonata No. 7 in C major, K. 309',
      'Mozart: Piano Sonata No. 11 in A major, K. 331 "Alla Turca"'
    ]
  },
  // 6. Lim Yunchan Recital [Gangneung Special]
  'PF303117': {
    composers: ['볼프강 아마데우스 모차르트'],
    performerType: '독주',
    performers: ['임윤찬'],
    pieces: [
      'Mozart: Piano Sonata No. 4 in E-flat major, K. 282',
      'Mozart: Piano Sonata No. 13 in B-flat major, K. 333',
      'Mozart: Piano Sonata No. 9 in D major, K. 311',
      'Mozart: Piano Sonata No. 7 in C major, K. 309',
      'Mozart: Piano Sonata No. 11 in A major, K. 331 "Alla Turca"'
    ]
  },
  // 7. Lim Yunchan Recital [Gangneung]
  'PF303020': {
    composers: ['볼프강 아마데우스 모차르트'],
    performerType: '독주',
    performers: ['임윤찬'],
    pieces: [
      'Mozart: Piano Sonata No. 4 in E-flat major, K. 282',
      'Mozart: Piano Sonata No. 13 in B-flat major, K. 333',
      'Mozart: Piano Sonata No. 9 in D major, K. 311',
      'Mozart: Piano Sonata No. 7 in C major, K. 309',
      'Mozart: Piano Sonata No. 11 in A major, K. 331 "Alla Turca"'
    ]
  },
  // 8. Sunwook Kim Recital [Shinsegae Namsan Trinity Hall]
  'PF301029': {
    composers: ['루트비히 판 베토벤', '프란츠 슈베르트'],
    performerType: '독주',
    performers: ['김선욱'],
    pieces: [
      'Beethoven: Piano Sonata No. 17 in D minor, Op. 31 No. 2 "Tempest" (템페스트)',
      'Beethoven: Piano Sonata No. 23 in F minor, Op. 57 "Appassionata" (열정)',
      'Schubert: Piano Sonata No. 21 in B-flat major, D. 960'
    ]
  },
  // 9. Bucheon Phil Wagner Ring Highlights
  'PF294779': {
    composers: ['리하르트 바그너'],
    performerType: '오케스트라',
    performers: ['아드리앙 페뤼숑', '부천필하모닉오케스트라', '사무엘 윤', '김재형', '이명주', '최인식', '김은희', '김승직'],
    pieces: [
      'Wagner: Der Ring des Nibelungen (The Ring of the Nibelung) Highlights',
      'Wagner: Das Rheingold - Entry of the Gods into Valhalla (신들의 발할라 입성)',
      'Wagner: Die Walküre - Ride of the Valkyries & Magic Fire Music (발퀴레의 기행 & 마법의 불의 음악)',
      'Wagner: Siegfried - Forest Murmurs (숲의 속삭임)',
      'Wagner: Götterdämmerung - Siegfried\'s Rhine Journey & Funeral March (지그프리트의 라인강 여정 & 장송 행진곡)'
    ]
  },
  // 10. Estonian National Symphony with Sunwoo Yekwon [Bucheon]
  'PF295052': {
    composers: ['퇴누 쾨르비츠', '루트비히 판 베토벤'],
    performerType: '오케스트라',
    performers: ['올라리 엘츠', '에스토니아 국립 교향악단', '선우예권'],
    pieces: [
      'Tõnu Kõrvits: Hymns to the Nordic Lights (오로라를 위한 찬가)',
      'Beethoven: Piano Concerto No. 5 in E-flat major, Op. 73 "Emperor" (황제) - 피아노 협연: 선우예권',
      'Beethoven: Symphony No. 5 in C minor, Op. 67 "Fate" (운명)'
    ]
  },
  // 11. Incheon Phil 448th Brahms in Autumn
  'PF281689': {
    composers: ['요하네스 브람스'],
    performerType: '오케스트라',
    performers: ['최수열', '인천시립교향악단', '안종도'],
    pieces: [
      'Brahms: Symphony No. 3 in F major, Op. 90 (브람스 교향곡 제3번 F장조)',
      'Brahms: Piano Concerto No. 2 in B-flat major, Op. 83 (브람스 피아노 협주곡 제2번 B-flat장조) - 협연: 안종도'
    ]
  },
  // 12. SAC Saturday Concert Preview Beethoven (Oct)
  'PF293483': {
    composers: ['루트비히 판 베토벤'],
    performerType: '오케스트라',
    performers: ['이병욱', '경기필하모닉오케스트라', '김태형'],
    pieces: [
      'Beethoven: Piano Concerto No. 5 in E-flat major, Op. 73 "Emperor" (피아노 협주곡 제5번 황제) - 협연: 김태형',
      'Beethoven: Symphony No. 6 in F major, Op. 68 "Pastoral" (교향곡 제6번 전원)'
    ]
  },
  // 13. Suh Hyung-min Hammerklavier [Nakdong Art Center]
  'PF300023': {
    composers: ['루트비히 판 베토벤'],
    performerType: '독주',
    performers: ['서형민'],
    pieces: [
      'Beethoven: Piano Sonata No. 29 in B-flat major, Op. 106 "Hammerklavier" (하머클라비어)'
    ]
  },
  // 14. Gyeonggi Phil Mahler 1 SAC [Seoul]
  'PF293732': {
    composers: ['리하르트 바그너', '구스타프 말러'],
    performerType: '오케스트라',
    performers: ['홍석원', '경기필하모닉오케스트라', '서선영'],
    pieces: [
      'Wagner: Wesendonck Lieder, WWV 91 (베젠돈크 가곡) - 소프라노: 서선영',
      'Mahler: Symphony No. 1 in D major "Titan" (말러 교향곡 제1번 거인)'
    ]
  },
  // 15. Daejeon Phil Masters Series 8 [Shostakovich 7 Leningrad]
  'PF284828': {
    composers: ['볼프강 아마데우스 모차르트', '드미트리 쇼스타코비치'],
    performerType: '오케스트라',
    performers: ['이승원', '대전시립교향악단', '김영욱'],
    pieces: [
      'Mozart: Sinfonia Concertante in E-flat major, K. 364 (신포니아 콘체르탄테) - 바이올린 김영욱, 비올라/지휘 이승원',
      'Shostakovich: Symphony No. 7 in C major, Op. 60 "Leningrad" (쇼스타코비치 교향곡 제7번 레닌그라드)'
    ]
  },
  // 16. KNN Phil & Lim Dong-hyek [Busan]
  'PF299656': {
    composers: ['미하일 글린카', '세르게이 라흐마니노프', '표트르 차이콥스키'],
    performerType: '오케스트라',
    performers: ['서희태', 'KNN방송교향악단', '임동혁'],
    pieces: [
      'Glinka: Ruslan and Lyudmila Overture (루슬란과 루드밀라 서곡)',
      'Rachmaninoff: Piano Concerto No. 2 in C minor, Op. 18 (피아노 협주곡 제2번) - 협연: 임동혁',
      'Tchaikovsky: Symphony No. 6 in B minor, Op. 74 "Pathétique" (교향곡 제6번 비창)'
    ]
  },
  // 17. Shin Zia & Ditto Orchestra [Pyeongtaek]
  'PF301950': {
    composers: ['안토니오 비발디', '아스토르 피아졸라'],
    performerType: '오케스트라',
    performers: ['신지아', '디토 오케스트라'],
    pieces: [
      'Vivaldi: The Four Seasons, Op. 8 (비발디 사계 전곡 - 봄, 여름, 가을, 겨울)',
      'Piazzolla: The Four Seasons of Buenos Aires (피아졸라 부에노스아이레스의 사계 - 항구의 봄, 여름, 가을, 겨울)'
    ]
  },
  // 18. BBC Phil & Bomsori Kim [Busan]
  'PF304165': {
    composers: ['파니 멘델스존', '표트르 차이콥스키', '루트비히 판 베토벤'],
    performerType: '오케스트라',
    performers: ['욘 스토르고르스', 'BBC 필하모닉 오케스트라', '김봄소리'],
    pieces: [
      'Fanny Mendelssohn: Overture in C major (파니 멘델스존 서곡 C장조)',
      'Tchaikovsky: Violin Concerto in D major, Op. 35 (차이콥스키 바이올린 협주곡 D장조) - 협연: 김봄소리',
      'Beethoven: Symphony No. 7 in A major, Op. 92 (베토벤 교향곡 제7번 A장조)'
    ]
  },
  // 19. BBC Phil & Bomsori Kim [Daegu]
  'PF295242': {
    composers: ['루이즈 파랭', '표트르 차이콥스키'],
    performerType: '오케스트라',
    performers: ['욘 스토르고르스', 'BBC 필하모닉 오케스트라', '김봄소리'],
    pieces: [
      'Louise Farrenc: Overture No. 1 in E minor, Op. 23 (루이즈 파랭 서곡 제1번)',
      'Tchaikovsky: Violin Concerto in D major, Op. 35 (차이콥스키 바이올린 협주곡 D장조) - 협연: 김봄소리',
      'Tchaikovsky: Symphony No. 5 in E minor, Op. 64 (차이콥스키 교향곡 제5번 e단조)'
    ]
  },
  // 20. Kun-Woo Paik & Young Friends [Daegu Suseong Artpia]
  'PF299650': {
    composers: ['시메온 텐 홀트', '볼프강 아마데우스 모차르트', '엑토르 베를리오즈', '조지 크룸', '모리스 라벨'],
    performerType: '실내악',
    performers: ['백건우', '김홍기', '김도현', '박진형', '선율', '강동휘', '홍석영', '이주언', '심선민', '김승수'],
    pieces: [
      'Simeon ten Holt: Canto Ostinato (칸토 오스티나토 - 4대의 피아노와 타악기 편성)',
      'Mozart: Die Zauberflöte (The Magic Flute) Overture, K. 620 (오페라 마술피리 서곡)',
      'Berlioz: Symphonie Fantastique, Op. 14 (환상교향곡 편곡)',
      'George Crumb: Music for a Summer Evening (여름밤의 음악)',
      'Ravel: Daphnis et Chloé (다프니스와 클로에)'
    ]
  },
  // 21. Johannes Trio [Kumho Art Hall]
  'PF279502': {
    composers: ['요하네스 브람스'],
    performerType: '실내악',
    performers: ['김재영', '문태국', '박재홍'],
    pieces: [
      'Brahms: Piano Trio No. 1 in B major, Op. 8 (브람스 피아노 삼중주 제1번 B장조)',
      'Brahms: Piano Trio No. 2 in C major, Op. 87 (브람스 피아노 삼중주 제2번 C장조)',
      'Brahms: Piano Trio No. 3 in C minor, Op. 101 (브람스 피아노 삼중주 제3번 c단조)'
    ]
  },
  // 22. Changwon Symphony 376th
  'PF300075': {
    composers: ['드미트리 쇼스타코비치'],
    performerType: '오케스트라',
    performers: ['김건', '창원시립교향악단'],
    pieces: [
      'Shostakovich: Symphony No. 11 in G minor, Op. 103 "The Year 1905" (쇼스타코비치 교향곡 제11번 1905년)'
    ]
  },
  // 23. Merry 36th Concert Tchaikovsky 5th
  'PF295685': {
    composers: ['표트르 차이콥스키'],
    performerType: '오케스트라',
    performers: ['메리오케스트라'],
    pieces: [
      'Tchaikovsky: Symphony No. 5 in E minor, Op. 64 (차이콥스키 교향곡 제5번 e단조)'
    ]
  },
  // 24. Jean-Guihen Queyras Bach Cello Suites Complete [Incheon]
  'PF289115': {
    composers: ['요한 제바스티안 바흐'],
    performerType: '독주',
    performers: ['장-기엔 케라스'],
    pieces: [
      'J.S. Bach: Cello Suite No. 1 in G major, BWV 1007',
      'J.S. Bach: Cello Suite No. 2 in D minor, BWV 1008',
      'J.S. Bach: Cello Suite No. 3 in C major, BWV 1009',
      'J.S. Bach: Cello Suite No. 4 in E-flat major, BWV 1010',
      'J.S. Bach: Cello Suite No. 5 in C minor, BWV 1011',
      'J.S. Bach: Cello Suite No. 6 in D major, BWV 1012'
    ]
  },
  // 25. Park Jong-hai Schubert Abend [SAC IBK Chamber Hall]
  'PF298559': {
    composers: ['프란츠 슈베르트'],
    performerType: '독주',
    performers: ['박종해'],
    pieces: [
      'Schubert: Adagio in G major, D. 178',
      'Schubert: 3 Klavierstücke, D. 946 (세 개의 피아노 소품)',
      'Schubert: 4 Impromptus, Op. posth. 142, D. 935 (네 개의 즉흥곡 전곡)'
    ]
  },
  // 26. Philharmonic EVE Mahler 3 [Bucheon Art Center]
  'PF299611': {
    composers: ['구스타프 말러'],
    performerType: '오케스트라',
    performers: ['이승혁', '필하모닉 이브', '이아경', '김상준'],
    pieces: [
      'Mahler: Symphony No. 3 in D minor (말러 교향곡 제3번 d단조 전곡)'
    ]
  }
};

function main() {
  const content = fs.readFileSync(CONCERTS_FILE, 'utf8');
  const start = content.indexOf('[');
  const end = content.lastIndexOf(']');
  if (start === -1 || end === -1) {
    console.error('Could not parse JSON array from file');
    process.exit(1);
  }

  const prefix = content.substring(0, start);
  const jsonStr = content.substring(start, end + 1);
  const suffix = content.substring(end + 1);
  const concerts = JSON.parse(jsonStr);

  let updatedCount = 0;
  for (const concert of concerts) {
    const rawId = concert.id.replace('kopis-', '');
    if (censusVerifiedData[rawId]) {
      const data = censusVerifiedData[rawId];
      concert.pieces = data.pieces;
      concert.composers = data.composers;
      if (data.performerType) concert.performerType = data.performerType;
      if (data.performers) concert.performers = data.performers;
      updatedCount++;
      console.log(`[UPDATED] ${rawId}: ${concert.title} (${data.pieces.length} pieces)`);
    }
  }

  console.log(`Total concerts updated: ${updatedCount} / ${Object.keys(censusVerifiedData).length}`);

  const newContent = `${prefix}${JSON.stringify(concerts, null, 2)}${suffix}`;
  fs.writeFileSync(CONCERTS_FILE, newContent, 'utf8');
  console.log('Successfully saved to initialRealConcerts.js');
}

main();
