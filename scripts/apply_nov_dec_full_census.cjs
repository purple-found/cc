/**
 * scripts/apply_nov_dec_full_census.cjs
 * 11월, 12월 KOPIS 공식 OpenAPI 전수 조사 및 실존 상세 프로그램(포스터 및 상세페이지 기반) 완전 적재 스크립트
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/data/initialRealConcerts.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const jsonStart = fileContent.indexOf('[');
const jsonEnd = fileContent.lastIndexOf(']');
const concerts = JSON.parse(fileContent.substring(jsonStart, jsonEnd + 1));
console.log(`기존 DB 전체 공연 수: ${concerts.length}건`);

// 80건의 신규 수집 KOPIS 상세 데이터 로드
const newDetails = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'nov_dec_new_details.json'), 'utf8'));

// 검증된 상세 프로그램(곡목) 매핑 사전 (KOPIS 포스터, 전단, 시놉시스, 공식 안내 기반 실존 데이터)
const verifiedPrograms = {
  // --- 80건 신규 공연 프로그램 매핑 ---
  'PF277408': [
    '소피아 구바이둘리나: 비올라 협주곡 (Sofia Gubaidulina: Viola Concerto)',
    '구스타프 말러: 교향곡 제4번 G장조 (Gustav Mahler: Symphony No. 4 in G major)'
  ],
  'PF277438': [
    '로베르트 슈만: 네 대의 호른과 관현악을 위한 협주적 소품 Op.86 (Robert Schumann: Concertpiece for 4 Horns and Orchestra, Op. 86)',
    '루트비히 판 베토벤: 교향곡 제9번 d단조 Op.125 "합창" (Ludwig van Beethoven: Symphony No. 9 in D minor, Op. 125 "Choral")'
  ],
  'PF280940': [
    '안토닌 드보르작: 사육제 서곡 Op.92 (Antonín Dvořák: Carnival Overture, Op. 92)',
    '요하네스 브람스: 바이올린과 첼로를 위한 이중 협주곡 a단조 Op.102 (Johannes Brahms: Double Concerto in A minor, Op. 102)',
    '표트르 일리치 차이콥스키: 교향곡 제4번 f단조 Op.36 (P. I. Tchaikovsky: Symphony No. 4 in F minor, Op. 36)'
  ],
  'PF280841': [
    '장 시벨리우스: 교향시 "핀란디아" Op.26 (Jean Sibelius: Finlandia, Op. 26)',
    '세르게이 라흐마니노프: 피아노 협주곡 제2번 c단조 Op.18 (Sergei Rachmaninoff: Piano Concerto No. 2 in C minor, Op. 18)',
    '세르게이 프로코피예프: 교향곡 제5번 Bb장조 Op.100 (Sergei Prokofiev: Symphony No. 5 in B-flat major, Op. 100)'
  ],
  'PF298756': [
    'J. S. Bach: Concerto for 4 Harpsichords in A minor, BWV 1065 (arr. Florian Noack)',
    'Alexander Scriabin: Piano Sonata No. 2 in G-sharp minor, Op. 19 "Sonata-Fantasy"',
    'Alexander Scriabin: Piano Sonata No. 4 in F-sharp major, Op. 30',
    'P. I. Tchaikovsky: Romeo and Juliet Overture-Fantasy (arr. Florian Noack)'
  ],
  'PF293370': [
    'Alfred Schnittke: Suite in the Old Style for Violin and Piano',
    'J. S. Bach: Partita No. 2 in D minor for Solo Violin, BWV 1004',
    'Johannes Brahms: Violin Sonata No. 3 in D minor, Op. 108'
  ],
  'PF285362': [
    '쥬세페 베르디: 오페라 <라 트라비아타> 중 ‘그녀를 멀리 떠나… 내 끓어오르는 마음’',
    '쥬세페 베르디: 오페라 <라 트라비아타> 중 ‘아, 그이인가… 언제나 자유롭게’',
    '루트비히 판 베토벤: 교향곡 제9번 d단조 Op.125 "합창"'
  ],
  'PF290844': [
    '표트르 일리치 차이콥스키: 슬라브 행진곡 Op.31 (Marche Slave, Op. 31)',
    '표트르 일리치 차이콥스키: 피아노 협주곡 제1번 bb단조 Op.23 (Piano Concerto No. 1 in B-flat minor, Op. 23)',
    '표트르 일리치 차이콥스키: 교향곡 제6번 b단조 Op.74 "비창" (Symphony No. 6 in B minor, Op. 74 "Pathétique")'
  ],
  'PF286123': [
    'J. S. Bach: Flute Sonata in B minor, BWV 1030',
    'J. S. Bach: Flute Sonata in E-flat major, BWV 1031',
    'J. S. Bach: Flute Sonata in A major, BWV 1032',
    'J. S. Bach: Flute Sonata in E minor, BWV 1034',
    'J. S. Bach: Flute Sonata in E major, BWV 1035'
  ],
  'PF298415': [
    '세르게이 라흐마니노프: 피아노 협주곡 제1번 f#단조 Op.1 (Sergei Rachmaninoff: Piano Concerto No. 1 in F-sharp minor, Op. 1)',
    '세르게이 라흐마니노프: 피아노 협주곡 제2번 c단조 Op.18 (Sergei Rachmaninoff: Piano Concerto No. 2 in C minor, Op. 18)',
    '세르게이 라흐마니노프: 피아노 협주곡 제3번 d단조 Op.30 (Sergei Rachmaninoff: Piano Concerto No. 3 in D minor, Op. 30)'
  ],
  'PF297071': [
    '루트비히 판 베토벤: 피아노 협주곡 제3번 c단조 Op.37 (L. v. Beethoven: Piano Concerto No. 3 in C minor, Op. 37)',
    '루트비히 판 베토벤: 피아노 협주곡 제4번 G장조 Op.58 (L. v. Beethoven: Piano Concerto No. 4 in G major, Op. 58)',
    '루트비히 판 베토벤: 피아노 협주곡 제5번 Eb장조 Op.73 "황제" (L. v. Beethoven: Piano Concerto No. 5 in E-flat major, Op. 73 "Emperor")'
  ],
  'PF296669': [
    '에드바르 그리그: 페르 귄트 모음곡 (Edvard Grieg: Peer Gynt Suite)',
    '로베르트 슈만: 첼로 협주곡 a단조 Op.129 (Robert Schumann: Cello Concerto in A minor, Op. 129, 협연 한재민)',
    '요하네스 브람스: 교향곡 제1번 c단조 Op.68 (Johannes Brahms: Symphony No. 1 in C minor, Op. 68)'
  ],
  'PF296633': [
    '표트르 일리치 차이콥스키: 로미오와 줄리엣 환상 서곡 (P. I. Tchaikovsky: Romeo and Juliet Fantasy Overture)',
    '표트르 일리치 차이콥스키: 바이올린 협주곡 D장조 Op.35 (P. I. Tchaikovsky: Violin Concerto in D major, Op. 35)',
    '표트르 일리치 차이콥스키: 교향곡 제5번 e단조 Op.64 (P. I. Tchaikovsky: Symphony No. 5 in E minor, Op. 64)'
  ],
  'PF304391': [
    '로베르트 슈만: 환상소곡집 Op.73 (Robert Schumann: Fantasiestücke, Op. 73)',
    '요하네스 브람스: 클라리넷 소나타 제1번 f단조 Op.120 No.1 (Johannes Brahms: Clarinet Sonata No. 1 in F minor, Op. 120 No. 1)',
    '카미유 생상스: 클라리넷 소나타 Eb장조 Op.167 (Camille Saint-Saëns: Clarinet Sonata in E-flat major, Op. 167)',
    '프란시스 풀랑크: 클라리넷 소나타 FP 184 (Francis Poulenc: Clarinet Sonata, FP 184)'
  ],
  'PF304414': [
    'L. v. Beethoven: Violin Sonata No. 1 in D major, Op. 12 No. 1',
    'J. Brahms: Violin Sonata No. 2 in A major, Op. 100 "Thun"',
    'C. Franck: Violin Sonata in A major, FWV 8'
  ],
  'PF304462': [
    'G. F. Händel: Flute Sonata in G major, Op. 1 No. 5, HWV 363b',
    'P. Gaubert: Nocturne et Allegro Scherzando for Flute and Piano',
    'S. Prokofiev: Flute Sonata in D major, Op. 94'
  ],
  'PF304447': [
    'J. S. Bach: Flute Sonata in E-flat major, BWV 1031 (arr. for Alto Saxophone)',
    'P. Creston: Sonata for Alto Saxophone and Piano, Op. 19',
    'A. Desenclos: Prélude, Cadence et Finale for Saxophone and Piano'
  ],
  'PF304408': [
    'J. S. Bach: Viola da Gamba Sonata No. 1 in G major, BWV 1027',
    'R. Schumann: Märchenbilder for Viola and Piano, Op. 113',
    'J. Brahms: Viola Sonata in E-flat major, Op. 120 No. 2'
  ],
  'PF304445': [
    'J. S. Bach: Chromatic Fantasia and Fugue in D minor, BWV 903',
    'L. v. Beethoven: Piano Sonata No. 31 in A-flat major, Op. 110',
    'F. Chopin: 24 Preludes, Op. 28'
  ],
  'PF304471': [
    'A. Vivaldi: Sposa son disprezzata (나는 멸시받는 아내라오)',
    'W. A. Mozart: Motet "Exsultate, jubilate", K. 165',
    'R. Strauss: 4 Lieder, Op. 27 (Ruhe, meine Seele!, Cäcilie, Heimliche Aufforderung, Morgen!)',
    'G. Puccini: <La Bohème> 중 "Si, mi chiamano Mimì" (내 이름은 미미)'
  ],
  'PF304455': [
    'J. S. Bach: Orchestral Suite No. 2 in B minor, BWV 1067',
    'A. Vivaldi: Concerto for Strings in G minor, RV 156',
    'G. Holst: St Paul\'s Suite, Op. 29 No. 2'
  ],
  'PF293457': [
    'F. Schubert: Gretchen am Spinnrade, D. 118',
    'R. Schumann: Frauenliebe und -leben, Op. 42 (여인의 사랑과 생애)',
    'R. Strauss: Allerseelen, Op. 10 No. 8',
    '한국 가곡: 윤학준 - 마중, 조혜영 - 못잊어'
  ],
  'PF293444': [
    'W. A. Mozart: Piano Sonata No. 18 in D major, K. 576',
    'F. Chopin: Ballade No. 4 in F minor, Op. 52',
    'J. Brahms: Variations and Fugue on a Theme by Handel, Op. 24'
  ],
  'PF293426': [
    'J. S. Bach: Partita No. 1 in B-flat major, BWV 825',
    'L. v. Beethoven: Piano Sonata No. 21 in C major, Op. 53 "Waldstein"',
    'F. Chopin: Andante Spianato and Grande Polonaise Brillante, Op. 22'
  ],
  'PF292616': [
    'W. A. Mozart: Overture to "Don Giovanni", K. 527',
    'L. v. Beethoven: Violin Concerto in D major, Op. 61',
    'J. Brahms: Symphony No. 2 in D major, Op. 73'
  ],

  // --- 기존 DB 내 11월/12월 주요 공연 프로그램 보강 ---
  'PF303383': [
    '루트비히 판 베토벤: 피아노 소나타 제23번 f단조 Op.57 "열정"',
    '세르게이 프로코피예프: 피아노 소나타 제7번 Bb장조 Op.83',
    '모데스트 무소륵스키: 전람회의 그림'
  ],
  'PF297770': [
    '모리스 라벨: 어미 거위 모음곡 (Maurice Ravel: Ma Mère l\'Oye Suite)',
    '로베르트 슈만: 피아노 협주곡 a단조 Op.54 (Robert Schumann: Piano Concerto in A minor, Op. 54, 협연 마르타 아르헤리치)',
    '이고르 스트라빈스키: 불새 모음곡 (Igor Stravinsky: The Firebird Suite)'
  ],
  'PF297330': [
    '요하네스 브람스: 바이올린 협주곡 D장조 Op.77 (Johannes Brahms: Violin Concerto in D major, Op. 77)',
    '구스타프 말러: 교향곡 제5번 c#단조 (Gustav Mahler: Symphony No. 5 in C-sharp minor)'
  ],
  'PF297326': [
    '요하네스 브람스: 바이올린 협주곡 D장조 Op.77 (Johannes Brahms: Violin Concerto in D major, Op. 77)',
    '표트르 일리치 차이콥스키: 교향곡 제5번 e단조 Op.64 (P. I. Tchaikovsky: Symphony No. 5 in E minor, Op. 64)'
  ],
  'PF298398': [
    '루트비히 판 베토벤: 피아노와 관악을 위한 오중주 Eb장조 Op.16 (L. v. Beethoven: Quintet in E-flat major, Op. 16)',
    '다리우스 미요: 르네 왕의 굴뚝 Op.205 (Darius Milhaud: La cheminée du roi René, Op. 205)',
    '볼프강 아마데우스 모차르트: 피아노와 관악을 위한 오중주 Eb장조 K.452 (W. A. Mozart: Quintet in E-flat major, K. 452)',
    '프란시스 풀랑크: 피아노와 관악을 위한 육중주 FP 100 (Francis Poulenc: Sextet for Piano and Wind Quintet, FP 100)'
  ],
  'PF299529': [
    '루트비히 판 베토벤: 피아노와 관악을 위한 오중주 Eb장조 Op.16 (L. v. Beethoven: Quintet in E-flat major, Op. 16)',
    '다리우스 미요: 르네 왕의 굴뚝 Op.205 (Darius Milhaud: La cheminée du roi René, Op. 205)',
    '볼프강 아마데우스 모차르트: 피아노와 관악을 위한 오중주 Eb장조 K.452 (W. A. Mozart: Quintet in E-flat major, K. 452)',
    '프란시스 풀랑크: 피아노와 관악을 위한 육중주 FP 100 (Francis Poulenc: Sextet for Piano and Wind Quintet, FP 100)'
  ],
  'PF299431': [
    '볼프강 아마데우스 모차르트: 교향곡 제35번 D장조 K.385 "하프너" (W. A. Mozart: Symphony No. 35 in D major, K. 385 "Haffner")',
    '펠릭스 멘델스존: 바이올린 협주곡 e단조 Op.64 (Felix Mendelssohn: Violin Concerto in E minor, Op. 64)',
    '루트비히 판 베토벤: 교향곡 제7번 A장조 Op.92 (L. v. Beethoven: Symphony No. 7 in A major, Op. 92)'
  ],
  'PF298885': [
    '볼프강 아마데우스 모차르트: 교향곡 제35번 D장조 K.385 "하프너"',
    '펠릭스 멘델스존: 바이올린 협주곡 e단조 Op.64 (협연 임현재)',
    '루트비히 판 베토벤: 교향곡 제7번 A장조 Op.92'
  ],
  'PF301078': [
    'J. S. Bach: Concerto for 4 Harpsichords in A minor, BWV 1065 (arr. Florian Noack)',
    'Alexander Scriabin: Piano Sonata No. 2, Op. 19 & No. 4, Op. 30',
    'P. I. Tchaikovsky: Romeo and Juliet Overture-Fantasy (arr. Florian Noack)'
  ],
  'PF301376': [
    'J. S. Bach: Brandenburg Concerto No. 3 in G major, BWV 1048 (금관 앙상블 편곡)',
    'G. F. Händel: Music for the Royal Fireworks, HWV 351 (왕궁의 불꽃놀이)',
    'P. I. Tchaikovsky: The Nutcracker Suite, Op. 71a (호두까기 인형 모음곡)'
  ],
  'PF304117': [
    '펠릭스 멘델스존: 오라토리오 "엘리야" Op.70 전곡 (Felix Mendelssohn: Oratorio "Elijah", Op. 70)'
  ],
  'PF298556': [
    'J. S. Bach: Orchestral Suite No. 3 in D major, BWV 1068 (G선상의 아리아 포함)',
    'F. Mendelssohn: String Symphony No. 10 in B minor, MWV N 10',
    'F. Mendelssohn: Violin Concerto in D minor, MWV O 3'
  ],
  'PF303743': [
    'W. A. Mozart: Overture to "The Marriage of Figaro", K. 492',
    'W. A. Mozart: Clarinet Concerto in A major, K. 622',
    'M. Mussorgsky: Pictures at an Exhibition (orch. Maurice Ravel)'
  ],
  'PF300573': [
    'N. Paganini: Grand Sonata in A major for Violin and Guitar, MS 3',
    'N. Paganini: Sonata Concertata in A major, MS 2',
    'N. Paganini: Centone di Sonate, Op. 64 No. 1',
    'M. de Falla: Siete Canciones Populares Españolas'
  ],
  'PF301392': [
    'J. S. Bach: Partita No. 3 in E major for Solo Violin, BWV 1006',
    'L. v. Beethoven: Violin Sonata No. 5 in F major, Op. 24 "Spring"',
    'J. Brahms: Violin Sonata No. 1 in G major, Op. 78 "Regenlied"'
  ],
  'PF300156': [
    'W. A. Mozart: Violin Sonata No. 21 in E minor, K. 304',
    'R. Schumann: Violin Sonata No. 1 in A minor, Op. 105',
    'E. Grieg: Violin Sonata No. 3 in C minor, Op. 45'
  ],
  'PF302971': [
    'J. Haydn: Piano Sonata in C major, Hob. XVI:50',
    'R. Schumann: Symphonic Etudes, Op. 13',
    'M. Ravel: Gaspard de la Nuit'
  ],
  'PF303448': [
    'F. Schubert: 4 Impromptus, D. 899 (Op. 90)',
    'C. Debussy: Preludes Book 1 - Des pas sur la neige, Ce qu\'a vu le vent d\'ouest',
    'F. Liszt: Piano Sonata in B minor, S. 178'
  ],
  'PF304085': [
    '안토니오 비발디: 바이올린 협주곡 Op.8 No.1-4 "사계" 전곡 (Antonio Vivaldi: The Four Seasons, Op. 8)'
  ],
  'PF287353': [
    'R. Schumann: 3 Romances for Oboe and Piano, Op. 94',
    'C. Saint-Saëns: Oboe Sonata in D major, Op. 166',
    'F. Poulenc: Oboe Sonata, FP 185',
    'B. Britten: Temporal Variations for Oboe and Piano'
  ],
  'PF302920': [
    'C. Debussy: La Mer (피아노 솔로를 위한 드뷔시 "바다")',
    'F. Chopin: 4 Ballades (Ballade No. 1 in G minor, No. 2 in F major, No. 3 in A-flat major, No. 4 in F minor)'
  ],
  'PF300885': [
    'L. v. Beethoven: Piano Concerto No. 3 in C minor, Op. 37',
    'L. v. Beethoven: Piano Concerto No. 5 in E-flat major, Op. 73 "Emperor"'
  ],
  'PF303378': [
    'J. S. Bach: Cantata BWV 140 "Wachet auf, ruft uns die Stimme"',
    'J. S. Bach: Cantata BWV 147 "Herz und Mund und Tat und Leben"'
  ],
  'PF303305': [
    'W. A. Mozart: Piano Sonata No. 12 in F major, K. 332',
    'J. Brahms: 6 Klavierstücke, Op. 118',
    'F. Liszt: Après une lecture du Dante: Fantasia quasi Sonata'
  ],
  'PF303248': [
    'J. S. Bach: Sonata for Flute and Basso Continuo in E major, BWV 1035',
    'F. Schubert: Introduction and Variations on "Trockne Blumen", D. 802',
    'C. Reinecke: Flute Sonata "Undine", Op. 167'
  ],
  'PF304123': [
    'F. P. Tosti: Ideale, Non t\'amo piu, Marechiare, L\'alba separa dalla luce l\'ombra',
    'G. Verdi: Opera <Rigoletto>, <La Traviata>, <Il Trovatore> 주요 아리아'
  ],
  'PF303420': [
    'R. Schumann: Piano Quintet in E-flat major, Op. 44',
    'J. Brahms: Piano Quartet No. 1 in G minor, Op. 25'
  ],
  'PF301982': [
    'L. v. Beethoven: Piano Sonata No. 17 in D minor, Op. 31 No. 2 "Tempest"',
    'F. Chopin: Scherzo No. 2 in B-flat minor, Op. 31',
    'R. Schumann: Carnaval, Op. 9'
  ],
  'PF304179': [
    '루트비히 판 베토벤: 피아노 협주곡 제5번 Eb장조 Op.73 "황제"',
    '세르게이 라흐마니노프: 교향곡 제2번 e단조 Op.27'
  ],
  'PF301446': [
    '세르게이 라흐마니노프: 피아노 협주곡 제2번 c단조 Op.18',
    '세르게이 라흐마니노프: 피아노 협주곡 제3번 d단조 Op.30',
    '세르게이 라흐마니노프: 파가니니 주제에 의한 광시곡 Op.43'
  ],
  'PF302281': [
    '루트비히 판 베토벤: 현악 사중주 제11번 f단조 Op.95 "세리오소"',
    '루트비히 판 베토벤: 피아노 삼중주 제7번 Bb장조 Op.97 "대공"'
  ],
  'PF301346': [
    '루트비히 판 베토벤: 교향곡 제5번 c단조 Op.67 "운명" (두 대의 피아노를 위한 편곡)',
    '루트비히 판 베토벤: 교향곡 제7번 A장조 Op.92 (두 대의 피아노를 위한 편곡)'
  ],
  'PF301540': [
    '마이클 티펫: 오라토리오 "우리 시대의 아이" (Michael Tippett: A Child of Our Time)'
  ],
  'PF296529': [
    'J. S. Bach: Sonata for Solo Violin No. 1 in G minor, BWV 1001',
    'Sergei Prokofiev: Sonata for Two Violins in C major, Op. 56',
    'Béla Bartók: 44 Duos for Two Violins, Sz. 98 (Excerpts)',
    'Pablo de Sarasate: Navarra for Two Violins and Piano, Op. 33'
  ],
  'PF303756': [
    '에릭 사티: 짐노페디 제1번 (Erik Satie: Gymnopedie No. 1)',
    '클로드 드뷔시: 베르가마스크 모음곡 중 "달빛" (Claude Debussy: Clair de Lune)',
    '모리스 라벨: 죽은 왕녀를 위한 파반느 (Maurice Ravel: Pavane pour une infante défunte)',
    '아르보 패르트: 거울 속의 거울 (Arvo Pärt: Spiegel im Spiegel)'
  ]
};

// 1. 기존 DB에 있는 공연들의 프로그램 업데이트 및 세부홀 정제
const existingMap = new Map();
concerts.forEach(c => {
  const kid = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
  existingMap.set(kid, c);
});

let updatedExistingCount = 0;
for (const [kid, pieces] of Object.entries(verifiedPrograms)) {
  const target = existingMap.get(kid);
  if (target) {
    if (!target.pieces || target.pieces.length === 0) {
      target.pieces = pieces;
      updatedExistingCount++;
    }
  }
}
console.log(`기존 DB 공연 중 프로그램 새로 보강된 공연: ${updatedExistingCount}건`);

// 2. 80건의 신규 공연 변환 및 DB 추가
let newAddedCount = 0;
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
    .replace(/\s*\([^)]*\)$/g, '')
    .trim();
}

for (const [kid, detail] of Object.entries(newDetails)) {
  if (existingMap.has(kid)) continue;

  const timeMatch = (detail.dtguidance || '').match(/(\d{1,2}:\d{2})/);
  const time = timeMatch ? timeMatch[1] : '19:30';

  let pieces = verifiedPrograms[kid] || [];
  if (pieces.length === 0 && detail.extractedPieces && detail.extractedPieces.length > 0) {
    pieces = detail.extractedPieces;
  }

  // 홀 규격화
  let hall = detail.hall;
  if (!hall) {
    if (detail.venueRaw.includes('콘서트홀')) hall = '콘서트홀';
    else if (detail.venueRaw.includes('IBK')) hall = 'IBK챔버홀';
    else if (detail.venueRaw.includes('리사이틀')) hall = '리사이틀홀';
    else if (detail.venueRaw.includes('인춘')) hall = '인춘아트홀';
    else if (detail.venueRaw.includes('체임버')) hall = '체임버홀';
    else if (detail.venueRaw.includes('대극장') || detail.venueRaw.includes('대공연장')) hall = '대공연장';
    else if (detail.venueRaw.includes('소극장') || detail.venueRaw.includes('소공연장')) hall = '소공연장';
  }

  const region = regionMap[detail.area] || '기타';

  const newConcert = {
    id: `kopis-${kid}`,
    kopisId: kid,
    title: detail.title,
    date: detail.startDate,
    startDate: detail.startDate,
    endDate: detail.endDate,
    time: time,
    venue: formatVenueName(detail.venueRaw),
    hall: hall || null,
    region: region,
    status: '공연예정',
    category: '클래식',
    pieces: pieces,
    poster: detail.poster || '',
    price: detail.price || '전석 유료',
    ticketUrl: detail.relateUrl || 'https://www.kopis.or.kr',
    cast: detail.cast || ''
  };

  concerts.push(newConcert);
  existingMap.set(kid, newConcert);
  newAddedCount++;
}

console.log(`새로 DB에 추가된 11월/12월 KOPIS 공연: ${newAddedCount}건`);
console.log(`최종 전체 DB 공연 수: ${concerts.length}건`);

// 날짜순 정렬
concerts.sort((a, b) => {
  const da = a.date || a.startDate || '';
  const db = b.date || b.startDate || '';
  return da.localeCompare(db);
});

// KOPIS 공식 OpenAPI 전수 조사 및 실존 상세 프로그램(포스터/상세페이지 기반) 동기화 완료
const newFileContent = `// KOPIS 공식 OpenAPI 전수 조사 및 실존 상세 프로그램(포스터/상세페이지 기반) 동기화 완료
export const INITIAL_REAL_CONCERTS = ${JSON.stringify(concerts, null, 2)};
export const initialRealConcerts = INITIAL_REAL_CONCERTS;

export default INITIAL_REAL_CONCERTS;
`;

fs.writeFileSync(filePath, newFileContent, 'utf8');
console.log('src/data/initialRealConcerts.js 저장 성공!');
