const fs = require('fs');

const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const concerts = JSON.parse(jsonStr);

const wave3Programs = {
  // 1. 유카페카 사라스테 & 헬싱키 필하모닉 (롯데콘서트홀)
  'PF294503': [
    'J. Sibelius: Pelléas et Mélisande Suite, Op. 46 (I. At the Castle gate, II. Mélisande, VIII. Entr\'acte, IX. The Death of Mélisande)',
    'S. Prokofiev: Violin Concerto No. 2 in G minor, Op. 63 (Vn. 양인모)',
    'J. Sibelius: Symphony No. 2 in D major, Op. 43'
  ],
  // 2. 드레스덴 필하모닉 & 제임스 에네스 [부천] (부천아트센터)
  'PF288934': [
    'R. Vaughan Williams: Fantasia on a Theme by Thomas Tallis',
    'M. Bruch: Violin Concerto No. 1 in G minor, Op. 26 (Vn. 제임스 에네스)',
    'J. Brahms: Symphony No. 4 in E minor, Op. 98'
  ],
  // 3. 클라라 주미 강 & 김선욱 듀오 리사이틀 [부천] (부천아트센터)
  'PF287446': [
    'O. Respighi: Violin Sonata in B minor, P 110',
    'M. Weinberg: Violin Sonata No. 4, Op. 39',
    'R. Strauss: Violin Sonata in E-flat major, Op. 18'
  ],
  // 4. BAC 초이스, 디토 오케스트라 with 신지아 (부천아트센터)
  'PF286865': [
    'A. Vivaldi: The Four Seasons, Op. 8 (Vn. 신지아)',
    'A. Piazzolla: The Four Seasons of Buenos Aires (Vn. 신지아)'
  ],
  // 5. 모차르트 플러스 Ⅰ: 폴 루이스 Piano (금호아트홀 연세)
  'PF279448': [
    'W. A. Mozart: Piano Sonata No. 10 in C major, K. 330',
    'F. Poulenc: Improvisations for Piano',
    'C. Debussy: L\'isle joyeuse (기쁨의 섬)',
    'W. A. Mozart: Piano Sonata No. 14 in C minor, K. 457'
  ],
  'PF289260': [
    'W. A. Mozart: Piano Sonata No. 10 in C major, K. 330',
    'F. Poulenc: Improvisations for Piano',
    'C. Debussy: L\'isle joyeuse (기쁨의 섬)',
    'W. A. Mozart: Piano Sonata No. 14 in C minor, K. 457'
  ],
  // 6. 모차르트 플러스 Ⅱ: 폴 루이스 Piano (금호아트홀 연세)
  'PF279451': [
    'W. A. Mozart: Piano Sonata No. 17 in B-flat major, K. 570',
    'F. Schubert: 3 Klavierstücke, D. 946',
    'F. Chopin: Polonaise No. 1 in C-sharp minor, Op. 26 No. 1',
    'F. Chopin: 2 Nocturnes, Op. 32',
    'W. A. Mozart: Piano Sonata No. 13 in B-flat major, K. 333'
  ],
  // 7. 프란츠 슈베르트 X 문지영 Piano Ⅰ (금호아트홀 연세)
  'PF279438': [
    'F. Schubert: Piano Sonata No. 13 in A major, D. 664',
    'F. Schubert: 3 Klavierstücke, D. 946',
    'F. Schubert: Allegretto in C minor, D. 915',
    'F. Schubert: Piano Sonata No. 16 in A minor, D. 845'
  ],
  // 8. 임현정의 베토벤 소나타 시리즈, 불멸 (예술의전당)
  'PF297984': [
    'L. v. Beethoven: Piano Sonata No. 3 in C major, Op. 2 No. 3',
    'L. v. Beethoven: Piano Sonata No. 5 in C minor, Op. 10 No. 1',
    'L. v. Beethoven: Piano Sonata No. 7 in D major, Op. 10 No. 3',
    'L. v. Beethoven: Piano Sonata No. 21 in C major, Op. 53 "Waldstein"'
  ],
  // 9. 제119회 강남 심포니 오케스트라 정기 연주회 (예술의전당)
  'PF294064': [
    'S. Rachmaninoff: Piano Concerto No. 2 in C minor, Op. 18 (Pf. 한지호)',
    'J. Brahms: Symphony No. 4 in E minor, Op. 98'
  ],
  // 10. 슈테른 필하모닉 더블 심포니 베토벤 7 & 5 (롯데콘서트홀)
  'PF298311': [
    'L. v. Beethoven: Symphony No. 7 in A major, Op. 92',
    'L. v. Beethoven: Symphony No. 5 in C minor, Op. 67 "Schicksal"'
  ],
  // 11. 누구나 클래식 with 대전시립교향악단 (세종문화회관)
  'PF302457': [
    'E. Grieg: Piano Concerto in A minor, Op. 16 (Pf. 김규연)',
    'S. Rachmaninoff: Symphony No. 2 in E minor, Op. 27'
  ],
  // 12. 아다지에토 실내악 시리즈, 브란덴부르크 협주곡 (세종문화회관)
  'PF303631': [
    'J. S. Bach: Concerto for 2 Violins in D minor, BWV 1043',
    '김종균: Bach in Deleuze\'s Territory for Trumpet and Strings',
    'Patrick Jong Min Kim: J. S. Bach - Brandenburg Concertos Recomposed (No. 1, No. 2, No. 3)'
  ],
  // 13. 서울시오페라단, 라보엠 (세종문화회관 대극장)
  'PF282109': [
    'G. Puccini: Opera 〈La Bohème〉 (푸치니 서거 100주년 전막 공연)'
  ],
  // 14. 프로젝트 부활 (Projekt Auferstehung) [부천] (부천아트센터)
  'PF290858': [
    'G. Mahler: Symphony No. 2 in C minor, "Resurrection" (부활)'
  ],
  // 15. 제3회 오케스트라 syncope 정기연주회: 차이코프스키 시리즈 (부천아트센터)
  'PF285843': [
    'P. I. Tchaikovsky: Swan Lake Suite, Op. 20a - Waltz',
    'P. I. Tchaikovsky: Piano Concerto No. 1 in B-flat minor, Op. 23 (Pf. 정지원)',
    'P. I. Tchaikovsky: Symphony No. 4 in F minor, Op. 36'
  ],
  // 16. 손예인 비올라 독주회 (예술의전당)
  'PF301779': [
    'G. Donizetti: Opera 〈La Favorite〉 Act III - \'Ô mon Fernand\' (Viola & Piano)',
    'V. Bellini: Opera 〈Norma〉 Act I - \'Casta Diva\' (Viola & Piano)',
    'G. A. Rolla: Variazioni Brillanti for Viola and Piano, Op. 13',
    'A. Bazzini: 3 Morceaux en forme de sonate, Op. 44 - No. 2 Romanza: Larghetto',
    'A. Rolla: Viola Sonata in E-flat major, BI 66'
  ],
  // 17. 정상욱 피아노 독주회 (예술의전당)
  'PF300850': [
    'F. Schubert: Piano Sonata in A minor, D. 784',
    'H. Dutilleux: Sonata for Piano, Op. 1 (1948)',
    'F. Schubert: Piano Sonata in D major, D. 850 \'Gasteiner\''
  ],
  // 18. 피아니스트 안화영의 작곡가 시리즈 Ⅳ (예술의전당)
  'PF299631': [
    'R. Schumann: Papillons, Op. 2',
    'R. Schumann: Piano Sonata No. 2 in G minor, Op. 22',
    'R. Schumann: Carnaval, Op. 9'
  ],
  // 19. 김원 피아노 독주회 (예술의전당)
  'PF301052': [
    'F. Liszt: Ballade No. 2 in B minor, S. 171',
    'F. Liszt: Années de pèlerinage II, Supplément: Venezia e Napoli, S. 162',
    'F. Liszt: Consolation No. 3 in D-flat major, S. 172',
    'F. Schubert / F. Liszt: Die Forelle, S. 563 No. 6',
    'F. Liszt: Années de pèlerinage II: Sonetto 104 del Petrarca, S. 161 No. 5',
    'F. Liszt: Rhapsodie espagnole, S. 254'
  ],
  // 20. 정다슬 피아노 독주회 (예술의전당)
  'PF300266': [
    'R. Schumann: Vier Klavierstücke, Op. 32',
    'R. Schumann: Nachtstücke, Op. 23',
    'F. Liszt: Années de pèlerinage III, S. 163 No. 2 - Aux cyprès de la Villa d\'Este I (Thrénodie)',
    'F. Liszt: Harmonies poétiques et religieuses, S. 173 No. 4 - Pensée des morts',
    'F. Liszt: Deux Légendes, S. 175 No. 2 - St. François de Paule marchant sur les flots'
  ],
  // 21. 박민하 바이올린 독주회 (예술의전당)
  'PF299728': [
    'E. Bloch: Baal Shem, B. 47 - II. Nigun',
    'J. Brahms: Violin Sonata No. 2 in A major, Op. 100',
    'J. Gargiulo: Sonata for Violin and Piano No. 3',
    'A. Igudesman: Sonata for Violin and Piano No. 2'
  ],
  // 22. 김대욱 트럼펫 독주회 (예술의전당)
  'PF300805': [
    'B. Broughton: Oliver\'s Birthday for Trumpet and Piano (1998)',
    'H. Stevens: Sonata for Trumpet and Piano (1959)',
    'K. McKee: Song for a Friend for Trumpet and Piano (2015)',
    'A. Frackenpohl: Sonatina for Piccolo Trumpet and Piano'
  ],
  // 23. 설지영 바이올린 독주회: 브람스, 세 개의 시선 (금호아트홀 연세)
  'PF297267': [
    'J. Brahms: Violin Sonata No. 1 in G major, Op. 78',
    'J. Brahms: Violin Sonata No. 2 in A major, Op. 100',
    'J. Brahms: Violin Sonata No. 3 in D minor, Op. 108'
  ],
  // 24. 이성경 플루트 귀국 독주회 (금호아트홀 연세)
  'PF301810': [
    'C. P. E. Bach: Sonata in A minor for Flute Solo, Wq. 132',
    'F. Schubert: Introduction and Variations on "Trockne Blumen", D. 802',
    'G. Fauré: Fantaisie for Flute and Piano, Op. 79',
    'S. Prokofiev: Flute Sonata in D major, Op. 94'
  ],
  // 25. 강주희 플루트 리사이틀 (금호아트홀 연세)
  'PF302267': [
    'J. Gade (arr. T. L. Christiansen): Tango Fantasia for Flute and Piano',
    'E. Schulhoff: Sonata for Flute and Piano',
    'J. M. Damase: Sonate en concert, Op. 17 for Flute and Piano'
  ],
  // 26. 소프라노 조주현 독창회 (금호아트홀 연세)
  'PF300034': [
    'F. Poulenc: Fiançailles pour rire (연가곡 〈웃음을 위한 약혼〉)',
    'R. Strauss: Mädchenblumen, Op. 22 (연가곡 〈소녀의 꽃들〉)',
    'F. Schubert: Das Vielliebchen, D. 170',
    'F. J. Obradors: Canciones clásicas españolas (스페인 고전 가곡)'
  ],
  // 27. 홍지연 첼로 독주회 (세종문화회관)
  'PF300532': [
    'L. v. Beethoven: Cello Sonata No. 5 in D major, Op. 102 No. 2',
    'G. Cassadó: Requiebros for Cello and Piano',
    'E. Grieg: Cello Sonata in A minor, Op. 36'
  ],
  // 28. 이준우 색소폰 독주회 (금호아트홀 연세)
  'PF301443': [
    'C. Debussy: Syrinx (Saxophone Solo)',
    'C. Debussy: Rhapsodie pour Saxophone',
    'C. Chaminade: Flute Concertino, Op. 107 (arr. for Saxophone)',
    'F. Doppler: Andante and Rondo for Two Flutes and Piano (arr. for Saxophones)',
    'C. P. E. Bach: Flute Concerto in D minor, Wq. 22'
  ],
  // 29. 제10회 클로리스 피아노 트리오 정기연주회 (세종문화회관)
  'PF301512': [
    'L. v. Beethoven: Variations in E-flat major, Op. 44',
    'L. v. Beethoven: Kakadu Variations in G major, Op. 121a',
    'L. v. Beethoven: Piano Trio No. 6 in E-flat major, Op. 70 No. 2'
  ],
  // 30. 이미연 피아노 독주회 (금호아트홀 연세)
  'PF304028': [
    'J. S. Bach: English Suite No. 2 in A minor, BWV 807',
    'M. Ravel: La Valse',
    'R. Schumann: Davidsbündlertänze, Op. 6'
  ],
  // 31. 윤덕희 귀국 바이올린 독주회 (금호아트홀 연세)
  'PF303801': [
    'H. I. F. Biber: Passacaglia in G minor for Violin Solo',
    'A. Schnittke: Sonata No. 1 for Violin and Piano',
    'J. Brahms: Violin Sonata No. 3 in D minor, Op. 108'
  ],
  // 32. 월드오케스트라페스티벌, 한수진 & 잉글리시 챔버 오케스트라 [대구] (대구콘서트하우스)
  'PF298868': [
    'W. A. Mozart: Divertimento in D major, K. 136',
    'G. Rossini: Sonata a quattro No. 1 in G major',
    'B. Britten: Simple Symphony, Op. 4',
    'A. Vivaldi: The Four Seasons, Op. 8 (Vn. 한수진)'
  ],
  // 33. 월드오케스트라페스티벌, 경상북도 도립교향악단 [대구] (대구콘서트하우스)
  'PF298871': [
    '이규봉: 관현악 곡 「악흥의 순간 VIII/II」',
    'L. v. Beethoven: Piano Concerto No. 4 in G major, Op. 58 (Pf. 문지영)',
    'D. Shostakovich: Symphony No. 11 in G minor, Op. 103 \'The Year 1905\''
  ],
  // 34. 제4회 DMZ OPEN 국제음악제, Connect: 연결되는 마음 [고양] (고양아람누리)
  'PF302632': [
    'G. Mahler: Symphony No. 8 in E-flat major, \'Symphony of a Thousand\' (천인교향곡)'
  ],
  // 35. 코원 필하모닉 오케스트라 정기 연주회: 브루크너 4번 [성남] (성남아트센터)
  'PF303037': [
    'C. Saint-Saëns: Danse Macabre, Op. 40',
    'F. Liszt: Piano Concerto No. 1 in E-flat major, S. 124 (Pf. 노예진)',
    'A. Bruckner: Symphony No. 4 in E-flat major, WAB 104 "Romantic"'
  ],
  // 36. 리처드 용재 오닐, 선물: Bach Society [성남] (성남아트센터)
  'PF303051': [
    'J. S. Bach: Brandenburg Concerto No. 3 in G major, BWV 1048',
    'J. S. Bach: Brandenburg Concerto No. 4 in G major, BWV 1049',
    'J. S. Bach: Brandenburg Concerto No. 5 in D major, BWV 1050',
    'J. S. Bach: Brandenburg Concerto No. 6 in B-flat major, BWV 1051'
  ],
  // 37. 일리야 라쉬코프스키, 라흐마니노프 3개의 피아노 협주곡 [수원] (경기아트센터)
  'PF300511': [
    'S. Rachmaninoff: Piano Concerto No. 1 in F-sharp minor, Op. 1',
    'S. Rachmaninoff: Piano Concerto No. 2 in C minor, Op. 18',
    'S. Rachmaninoff: Piano Concerto No. 3 in D minor, Op. 30'
  ],
  // 38. 경기필 마스터피스 시리즈 Ⅵ. 무소륵스키 전람회의 그림 [수원] (경기아트센터)
  'PF293745': [
    'D. Shostakovich: Violin Concerto No. 1 in A minor, Op. 77 (Vn. 김서현)',
    'M. Mussorgsky (arr. M. Ravel): Pictures at an Exhibition'
  ],
  // 39. 제3회 신아름 & 신이레 듀오콘서트: 우리가 만난 밤, 두 영혼의 라흐마니노프 [성남] (성남아트센터)
  'PF302009': [
    'S. Rachmaninoff: Rhapsody on a Theme of Paganini, Op. 43 (for Two Pianos)',
    'S. Rachmaninoff: Piano Concerto No. 2 in C minor, Op. 18 (for Two Pianos)'
  ],
  // 40. 조수미 세계무대 데뷔 40주년 기념 콘서트 [부천 / 고양]
  'PF287336': [
    'R. Glière: Concerto for Coloratura Soprano, Op. 82 - I. Andante',
    'G. Verdi: Opera 〈Rigoletto〉 - \'Caro nome\' (그리운 이름이여)',
    'G. F. Handel: Opera 〈Rinaldo〉 - \'Lascia ch\'io pianga\' (울게 하소서)',
    '최진: 아름다워라 (How Beautiful)',
    'R. Leoncavallo: Mattinata (아침의 노래)'
  ],
  'PF304242': [
    'R. Glière: Concerto for Coloratura Soprano, Op. 82 - I. Andante',
    'G. Verdi: Opera 〈Rigoletto〉 - \'Caro nome\' (그리운 이름이여)',
    'G. F. Handel: Opera 〈Rinaldo〉 - \'Lascia ch\'io pianga\' (울게 하소서)',
    '최진: 아름다워라 (How Beautiful)',
    'R. Leoncavallo: Mattinata (아침의 노래)'
  ],
  // 41. 성남시립교향악단 기획공연, 금난새의 카니발 오브 뮤직 (성남아트센터)
  'PF303796': [
    'C. Saint-Saëns: Le Carnaval des animaux (동물의 사육제) 발췌 옴니버스 (지휘 및 해설: 금난새)'
  ],
  // 42. 성남아트센터 오후의 콘서트: Viva Italia! 오페라 갈라 콘서트 (성남아트센터)
  'PF285128': [
    'G. Donizetti: Opera 〈L\'elisir d\'amore〉 - \'Una furtiva lagrima\', \'Udite, udite, o rustici\'',
    'G. Verdi: Opera 〈La traviata〉 - \'Brindisi\', \'È strano... Sempre libera\'',
    'G. Rossini: Opera 〈Il barbiere di Siviglia〉 - \'Largo al factotum\''
  ],
  // 43. 아람 클래식, 아트하우스 17 내한공연 리허설 [고양] (고양아람누리)
  'PF302642': [
    'J. S. Bach: Concerto for 2 Violins in D minor, BWV 1043',
    'J. S. Bach: Brandenburg Concerto No. 5 in D major, BWV 1050',
    'J. S. Bach: Orchestral Suite No. 2 in B minor, BWV 1067'
  ]
};

let updatedCount = 0;
for (const concert of concerts) {
  const rawId = (concert.id || '').replace(/^kopis-/, '');
  if (wave3Programs[rawId]) {
    concert.pieces = wave3Programs[rawId];
    updatedCount++;
  }
}

const withPiecesCount = concerts.filter(c => c.pieces && c.pieces.length > 0).length;

const updatedJs = `/**
 * KOPIS 공식 연계 대한민국 클래식 공연 정밀 데이터셋
 * 총 공연 수: ${concerts.length}건
 * 곡목 보유 공연 수: ${withPiecesCount}건
 * 최종 업데이트: ${new Date().toISOString()}
 */
export const INITIAL_REAL_CONCERTS = ${JSON.stringify(concerts, null, 2)};

export default INITIAL_REAL_CONCERTS;
`;

fs.writeFileSync('src/data/initialRealConcerts.js', updatedJs, 'utf8');

console.log('=== Wave 3 공식 팩트체크 곡목 적재 완료 ===');
console.log('Wave 3 추가된 공연 건수:', updatedCount);
console.log('총 프로그램 보유 공연 건수:', withPiecesCount);
