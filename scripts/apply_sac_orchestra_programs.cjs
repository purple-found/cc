const fs = require('fs');

const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');
const jsonStr = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
const concerts = JSON.parse(jsonStr);

const sacPrograms = {
  // 1. 빈 필하모닉 내한공연 (투간 소키에프 지휘, 협연: 조성진)
  'PF296892': [
    'L. v. Beethoven: Piano Concerto No. 4 in G major, Op. 58 (Pf. 조성진)',
    'J. Brahms: Symphony No. 2 in D major, Op. 73'
  ],
  // 2. 사이먼 래틀 경 & 바이에른 방송교향악단 (11.12)
  'PF291837': [
    'F. Schubert: Symphony No. 9 in C major, D. 944 \'Great\' (교향곡 제9번 "그레이트")',
    'I. Stravinsky: The Rite of Spring (봄의 제전)'
  ],
  // 3. 사이먼 래틀 경 & 바이에른 방송교향악단 (11.13)
  'PF291863': [
    'G. Mahler: Symphony No. 2 in C minor, \'Resurrection\' (교향곡 제2번 "부활") (Sop. 루시 크로, M.Sop. 캐런 카길, 국립합창단, 서울모테트합창단)'
  ],
  // 4. 제220회 뉴서울필하모닉오케스트라 정기 연주회: 피아니스트 임동혁과 함께하는 차이코프스키
  'PF299019': [
    'P. I. Tchaikovsky: Piano Concerto No. 1 in B-flat minor, Op. 23 (Pf. 임동혁)',
    'P. I. Tchaikovsky: Symphony No. 4 in F minor, Op. 36'
  ],
  // 5. 과천시립교향악단 콘서트시리즈6, 영웅의 생애 그리고 김동현 [과천]
  'PF304070': [
    'L. v. Beethoven: Violin Concerto in D major, Op. 61 (Vn. 김동현)',
    'R. Strauss: Tone Poem \'Ein Heldenleben\', Op. 40 (교향시 \'영웅의 생애\')'
  ],
  // 6. 예술의전당 토요콘서트, 프리뷰 베토벤 (11월)
  'PF298970': [
    'L. v. Beethoven: Piano Concerto No. 2 in B-flat major, Op. 19 (Pf. 김준형)',
    'L. v. Beethoven: Symphony No. 5 in C minor, Op. 67 \'Schicksal\' (교향곡 제5번 "운명")'
  ],
  // 7. 예술의전당 토요콘서트, 프리뷰 베토벤 (12월)
  'PF298967': [
    'L. v. Beethoven: Missa Solemnis in D major, Op. 123 (장엄 미사) (경기필하모닉오케스트라, 노이오페라코러스)'
  ],
  // 8. 한화생명과 함께하는 예술의전당 11시 콘서트 (12월)
  'PF300061': [
    'E. Waldteufel: Les Patineurs, Op. 183 (스케이트 왈츠)',
    'P. I. Tchaikovsky: The Nutcracker Suite, Op. 71a - Waltz of the Flowers (꽃의 왈츠)',
    'S. Prokofiev: Piano Concerto No. 3 in C major, Op. 26 - I & III Mov. (Pf. 윤철희)',
    'J. Sibelius: Violin Concerto in D minor, Op. 47 - I Mov. (Vn. 김다미)',
    'P. I. Tchaikovsky: Fantasy Overture \'Romeo and Juliet\' (환상 서곡 \'로미오와 줄리엣\')'
  ],
  // 9. KT와 함께하는 예술의전당 마음을 담은 클래식 (11월)
  'PF297765': [
    'W. A. Mozart: Opera 〈Die Zauberflöte〉 Overture (오페라 <마술피리> 서곡)',
    'W. A. Mozart: Piano Concerto No. 21 in C major, K. 467 (Pf. 김정원)',
    'Jan Frenkel: Cranes (백학) (Bass 손혜수)',
    'F. Schubert: Erlkönig, D. 328 (마왕) (Bass 손혜수)',
    'P. I. Tchaikovsky: Manfred Symphony in B minor, Op. 58 - I Mov. (만프레드 교향곡 1악장)'
  ],
  // 10. 제120회 강남심포니오케스트라 정기연주회
  'PF294057': [
    'L. v. Beethoven: Symphony No. 9 in D minor, Op. 125 \'Choral\' (합창 교향곡) (지휘: 데이비드 이, Sop. 서선영, M.Sop. 김세린, Ten. 손지훈, Bar. 이동환)'
  ],
  // 11. 경기필 마스터피스 시리즈 Ⅵ. 무소륵스키 전람회의 그림 [서울]
  'PF293713': [
    'D. Shostakovich: Violin Concerto No. 1 in A minor, Op. 77 (Vn. 김서현)',
    'M. Mussorgsky (arr. M. Ravel): Pictures at an Exhibition (전람회의 그림)'
  ],
  // 12. 욘 스토르고르스 & BBC 필하모닉 (협연: 김봄소리)
  'PF293222': [
    'Fanny Mendelssohn: Overture in C major (서곡 C장조)',
    'P. I. Tchaikovsky: Violin Concerto in D major, Op. 35 (Vn. 김봄소리)',
    'L. v. Beethoven: Symphony No. 7 in A major, Op. 92'
  ],
  // 13. 함신익과 심포니 송 마스터즈 시리즈 Ⅷ, 송년음악회: 합창교향곡
  'PF283864': [
    'L. v. Beethoven: Symphony No. 9 in D minor, Op. 125 \'Choral\' (합창교향곡) (지휘: 함신익, 국립합창단)'
  ],
  // 14. 차이콥스키의 낭만
  'PF300453': [
    'P. I. Tchaikovsky: Opera 〈Eugene Onegin〉 - \'Polonaise\'',
    'P. I. Tchaikovsky: Piano Concerto No. 1 in B-flat minor, Op. 23 (Pf. 김정원)',
    'P. I. Tchaikovsky: Symphony No. 5 in E minor, Op. 64'
  ],
  // 15. 라 필하모니카 첫 내한공연 [서울]
  'PF303360': [
    'J. Strauss II: Operetta 〈Die Fledermaus〉 Overture (박쥐 서곡)',
    'J. Françaix: Divertissement pour basson et quintette à cordes',
    'G. Rossini: Opera Fantasy (오페라 환상곡)',
    'P. Viardot: 6 Morceaux',
    'J. Williams: Memoirs of a Geisha Suite (게이샤의 추억 모음곡)',
    'L. Bernstein: Symphonic Dances from 〈West Side Story〉 (웨스트 사이드 스토리 교향적 무곡)'
  ],
  // 16. 베르디 콘서트 오페라: 리골레토 & 아이다 & 라 트라비아타
  'PF294522': [
    'G. Verdi: Opera 〈Rigoletto〉 Highlights (\'La donna è mobile\', \'Caro nome\')',
    'G. Verdi: Opera 〈Aida〉 Highlights (\'Celeste Aida\', Triumphal March)',
    'G. Verdi: Opera 〈La traviata〉 Highlights (\'Brindisi\', \'Sempre libera\')'
  ],
  // 17. 한화클래식: 르 포엠 아르모니크, 태양왕의 음악 [서울]
  'PF301773': [
    'J. B. Lully: 세계 네 대륙의 합창 (플로르의 발레 중)',
    'J. B. Lully: 스위스인들의 등장 (초조함의 발레 중)',
    'J. B. Lully: 이탈리아인들의 등장 (서민 귀족 중)',
    'J. B. Lully: 아프리카인들의 샤콘느 (카드무스와 에르미온느 중)',
    'J. B. Lully: 스페인들의 등장 (서민 귀족 중)'
  ],
  // 18. 백건우와 영 프렌즈 [서울]
  'PF304110': [
    'W. A. Mozart: Opera 〈Die Zauberflöte〉 Overture, K. 620',
    'H. Berlioz: Symphonie fantastique (환상 교향곡 편곡)',
    'George Crumb: Music for a Summer Evening, Makrokosmos III',
    'M. Ravel: Daphnis et Chloé (다프니스와 클로에)',
    'Simeon ten Holt: Canto Ostinato'
  ],
  // 19. 한국·벨기에 수교 125주년 기념음악회
  'PF302914': [
    'J. Jongen: Two Pieces, Op. 33 - I. Clair de lune (달빛) (Pf. 발레르 뷔르농)',
    'F. Schubert: Piano Sonata No. 20 in A major, D. 959 (Pf. 발레르 뷔르농)',
    'C. Franck: Sonata in A major for Cello and Piano (arr. J. Delsart) (Vc. 문태국, Pf. 발레르 뷔르농)'
  ],
  // 20. 알렉상드르 캉토로프 피아노 리사이틀
  'PF300600': [
    'J. S. Bach / F. Liszt: Weinen, Klagen, Sorgen, Zagen Variations, S. 180',
    'N. Medtner: Piano Sonata No. 1 in F minor, Op. 5'
  ],
  // 21. 김다솔 피아노 리사이틀: 슈만의 초상
  'PF302395': [
    'R. Schumann: Arabeske in C major, Op. 18',
    'R. Schumann: Piano Sonata No. 1 in F-sharp minor, Op. 11',
    'R. Schumann: Geistervariationen, WoO 24 (유령 변주곡)',
    'R. Schumann: Humoreske in B-flat major, Op. 20'
  ],
  // 22. 국립심포니오케스트라, 실내악 시리즈 Ⅲ. 국립심포니 6 첼리스트
  'PF281238': [
    'A. Piazzolla: \'Invierno Porteño\' & \'Primavera Porteña\' from Four Seasons of Buenos Aires',
    'R. Wagner: Prelude from Opera 〈Tristan und Isolde〉 (arr. for 6 Cellos)',
    'M. de Falla: Siete canciones populares españolas (arr. for 6 Cellos)',
    'J. Offenbach: Bolero for 6 Cellos'
  ],
  // 23. 리처드 용재 오닐: 바흐 소사이어티 [서울]
  'PF301266': [
    'J. S. Bach: Brandenburg Concerto No. 3 in G major, BWV 1048',
    'J. S. Bach: Brandenburg Concerto No. 4 in G major, BWV 1049',
    'J. S. Bach: Brandenburg Concerto No. 5 in D major, BWV 1050',
    'J. S. Bach: Brandenburg Concerto No. 6 in B-flat major, BWV 1051'
  ],
  // 24. 조인혁 클라리넷 리사이틀
  'PF303451': [
    'M. Bruch: Acht Stücke für Klarinette, Viola und Klavier, Op. 83 (Va. 김상진, Pf. 박영성)',
    'C. Reinecke: Introduktion und Allegro appassionato, Op. 256',
    'O. Messiaen: Quatuor pour la fin du temps - III. Abîme des oiseaux (새들의 심연)',
    'L. Bernstein: Sonata for Clarinet and Piano'
  ],
  // 25. 라이너호넥 & 윤홍천 듀오 리사이틀 [서울]
  'PF303997': [
    'W. A. Mozart: Violin Sonata in G major, K. 379',
    'F. Schubert: Fantasy for Violin and Piano in C major, D. 934',
    'L. v. Beethoven: Violin Sonata No. 9 in A major, Op. 47 \'Kreutzer\' (크로이처)'
  ],
  // 26. 더 크리스마스: 송영훈의 4첼리스트
  'PF303490': [
    'L. Anderson: A Christmas Festival',
    'C. Monteverdi: Pur Ti Miro',
    'F. Schubert: Ave Maria',
    'C. Gardel: Por una Cabeza',
    'A. Piazzolla: Oblivion & Libertango',
    'P. I. Tchaikovsky: The Nutcracker Overture & Serenade for Strings Op. 48',
    'A. Piazzolla: Milonga del Angel',
    'Amazing Grace & The Christmas Song'
  ],
  // 27. 국립오페라단 정기공연, 돈 카를로스
  'PF285072': [
    'G. Verdi: Opera 〈Don Carlos〉 (베르디 오페라 〈돈 카를로스〉 전막)'
  ],
  // 28. 베토벤 교향곡 x 두 대의 피아노 #3
  'PF302198': [
    'L. v. Beethoven: Symphony No. 2 in D major, Op. 36 (for Two Pianos, arr. F. Liszt)',
    'L. v. Beethoven: Symphony No. 8 in F major, Op. 93 (for Two Pianos, arr. F. Liszt)',
    'L. v. Beethoven: Symphony No. 9 in D minor, Op. 125 \'Choral\' (for Two Pianos, arr. F. Liszt)'
  ],
  // 29. 신민철 피아노 독주회
  'PF304132': [
    'R. Schumann: Waldszenen, Op. 82 (숲의 정경)',
    'R. Schumann: Arabeske, Op. 18 (아라베스크)',
    'R. Schumann: Kreisleriana, Op. 16 (크라이슬레리아나)'
  ],
  // 30. 김남훈 바이올린 독주회
  'PF304260': [
    'A. Piazzolla: Las Cuatro Estaciones Porteñas (부에노스아이레스의 사계)',
    'A. Vivaldi: Le Quattro Stagioni, Op. 8 (사계)'
  ],
  // 31. 박지현 오보에 독주회
  'PF303736': [
    'G. Finzi: Interlude, Op. 21 (arr. for Oboe & Piano)',
    'C. Koechlin: Sonata for Oboe and Piano, Op. 58 - III. Andante, Le Soir dans la Campagne',
    'A. Morris: 27-72 for Oboe and Piano',
    'L. Diémer: Légende, Op. 52',
    'O. Navarro: "LEGACY" Concerto for Oboe and Piano'
  ],
  // 32. 송윤진 피아노 독주회
  'PF302578': [
    'W. A. Mozart: Fantaisie in D minor, K. 397',
    'R. Schumann: Fantasiestücke, Op. 12',
    'F. Chopin: Fantaisie in F minor, Op. 49',
    'S. Barber: Excursions, Op. 20',
    'W. Bolcom: Graceful Ghost Rag',
    'W. Hirtz: Wizard of Oz Fantasy'
  ],
  // 33. 임홍균 바이올린 독주회
  'PF302249': [
    'L. v. Beethoven: Violin Sonata No. 2 in A major, Op. 12 No. 2',
    'C. Debussy: Violin Sonata in G minor, L. 140',
    'J. Sibelius: 5 Pieces for Violin and Piano, Op. 81',
    'S. Prokofiev: Violin Sonata No. 1 in F minor, Op. 80'
  ]
};

let appliedCount = 0;
for (const concert of concerts) {
  const rawId = (concert.id || '').replace(/^kopis-/, '');
  if (sacPrograms[rawId]) {
    concert.pieces = sacPrograms[rawId];
    appliedCount++;
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

console.log('=== 예술의전당 오케스트라 및 주요 공연 팩트체크 적재 완료 ===');
console.log('추가된 예술의전당 프로그램 건수:', appliedCount);
console.log('총 프로그램 보유 공연 건수:', withPiecesCount);
