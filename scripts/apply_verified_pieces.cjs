const fs = require('fs');

const filePath = 'src/data/initialRealConcerts.js';
let content = fs.readFileSync(filePath, 'utf8');

// Verified official programs map
const verifiedMap = {
  // 1. 파보 예르비 & 에스토니안 페스티벌 오케스트라 서울 예술의전당 (10/20)
  'kopis-PF296659': {
    composers: ['에르키-스벤 튀르', '요하네스 브람스', '장 시벨리우스'],
    pieces: [
      '에르키-스벤 튀르: 패션-일루전 (Passion-Illusion) [한국 초연]',
      '요하네스 브람스: 바이올린 협주곡 D장조 Op.77 (협연: 클라라 주미 강)',
      '장 시벨리우스: 교향곡 제5번 E♭장조 Op.82'
    ]
  },
  // 2. 파보 예르비 & 에스토니안 페스티벌 오케스트라 아트센터인천 (10/18)
  'kopis-PF299130': {
    composers: ['에르키-스벤 튀르', '요하네스 브람스'],
    pieces: [
      '에르키-스벤 튀르: 패션-일루전 (Passion-Illusion)',
      '요하네스 브람스: 바이올린 협주곡 D장조 Op.77 (협연: 클라라 주미 강)',
      '요하네스 브람스: 교향곡 제1번 C단조 Op.68'
    ]
  },
  // 3. 아르토 노라스와 김규연 리사이틀 (SIMF)
  'kopis-PF299391': {
    composers: ['로베르트 슈만', '류재준', '클로드 드뷔시', '세르게이 라흐마니노프'],
    pieces: [
      '로베르트 슈만: 민속풍의 5개 소품 Op.102',
      '류재준: 첼로 소나타 제3번',
      '클로드 드뷔시: 첼로 소나타 d단조 L.135',
      '세르게이 라흐마니노프: 첼로 소나타 g단조 Op.19'
    ]
  },
  // 4. 이선아 피아노 독주회
  'kopis-PF300324': {
    composers: ['J.S. 바흐'],
    pieces: [
      'J.S. 바흐: 영국 모음곡 제1번 A장조 BWV 806',
      'J.S. 바흐: 파르티타 제3번 a단조 BWV 827',
      'J.S. 바흐: 모음곡 A장조 BWV 818a',
      'J.S. 바흐: 모음곡 a단조 BWV 818',
      'J.S. 바흐: 영국 모음곡 제2번 a단조 BWV 807'
    ]
  },
  // 5. 김호정 귀국 바이올린 독주회
  'kopis-PF300120': {
    composers: ['프랭크 브리지', '루트비히 판 베토벤', '클로드 드뷔시', '아르보 패르트'],
    pieces: [
      '프랭크 브리지: 바이올린과 피아노를 위한 환상 소나타 H.104',
      '루트비히 판 베토벤: 바이올린 소나타 제7번 c단조 Op.30 No.2',
      '클로드 드뷔시: 바이올린 소나타 g단조 L.140',
      '아르보 패르트: 프라트레스 (Fratres)'
    ]
  },
  // 6. 이진화 피아노 독주회
  'kopis-PF299937': {
    composers: ['루트비히 판 베토벤', '요하네스 브람스', '프란츠 리스트'],
    pieces: [
      '루트비히 판 베토벤: 피아노 소나타 제17번 d단조 Op.31 No.2 "템페스트"',
      '루트비히 판 베토벤: 피아노 소나타 제18번 E♭장조 Op.31 No.3 "사냥"',
      '요하네스 브람스: 4개의 피아노 소품 Op.119',
      '프란츠 리스트: 순례의 해 제2년 "이탈리아" 중 "단테를 읽고"'
    ]
  },
  // 7. 손열음 피아노 리사이틀 [서울] (10/18 예술의전당)
  'kopis-PF297168': {
    composers: ['이그나시 얀 파데레프스키', 'J.S. 바흐', '디누 리파티', '얼 와일드'],
    pieces: [
      '이그나시 얀 파데레프스키: 카프리스 Op.14 No.3, 유모레스크 Op.14 No.1',
      'J.S. 바흐 / 마이라 헤스 편곡: "예수, 인간 소망의 기쁨" BWV 147',
      '디누 리파티: 왼손을 위한 소나티나',
      '얼 와일드: 조지 거슈윈 가곡 편곡집 발췌'
    ]
  },
  // 8. 이원해 첼로 리사이틀
  'kopis-PF296887': {
    composers: ['클라라 슈만', '요하네스 브람스'],
    pieces: [
      '클라라 슈만: 3개의 로망스 Op.22',
      '요하네스 브람스: 첼로 소나타 제1번 e단조 Op.38',
      '요하네스 브람스: 첼로 소나타 제2번 F장조 Op.99'
    ]
  },
  // 9. 김도윤 바이올린 독주회
  'kopis-PF303368': {
    composers: ['볼프강 아마데우스 모차르트', 'J.S. 바흐', '루트비히 판 베토벤'],
    pieces: [
      '볼프강 아마데우스 모차르트: 론도 G장조 K.250 (하프너 세레나데, 크라이슬러 편곡)',
      'J.S. 바흐: 무반주 바이올린 파르티타 제2번 d단조 BWV 1004 (샤콘느 포함)',
      '루트비히 판 베토벤: 바이올린 소나타 제9번 A장조 Op.47 "크로이처"'
    ]
  },
  // 10. 율리우스 아살 피아노 리사이틀 [서울]
  'kopis-PF298876': {
    composers: ['벨라 버르토크', '루트비히 판 베토벤', '레라 아우어바흐'],
    pieces: [
      '벨라 버르토크: 모음곡 Op.14',
      '루트비히 판 베토벤: 피아노 소나타 제32번 c단조 Op.111',
      '루트비히 판 베토벤: 피아노 소나타 제1번 f단조 Op.2 No.1',
      '레라 아우어바흐: "엠마 하우크"',
      '벨라 버르토크: 세 개의 벌레스크 Op.8c'
    ]
  },
  // 11. 양인모 & 헬싱키 필하모닉 오케스트라 [대구]
  'kopis-PF298805': {
    composers: ['장 시벨리우스', '세르게이 프로코피예프'],
    pieces: [
      '장 시벨리우스: "펠레아스와 멜리장드" 모음곡 Op.46',
      '세르게이 프로코피예프: 바이올린 협주곡 제2번 g단조 Op.63 (협연: 양인모)',
      '장 시벨리우스: 교향곡 제2번 D장조 Op.43 (지휘: 유카-페카 사라스테)'
    ]
  },
  // 12. 양인모 & 헬싱키 필하모닉 오케스트라 [대전]
  'kopis-PF294529': {
    composers: ['장 시벨리우스', '세르게이 프로코피예프'],
    pieces: [
      '장 시벨리우스: "펠레아스와 멜리장드" 모음곡 Op.46',
      '세르게이 프로코피예프: 바이올린 협주곡 제2번 g단조 Op.63 (협연: 양인모)',
      '장 시벨리우스: 교향곡 제2번 D장조 Op.43 (지휘: 유카-페카 사라스테)'
    ]
  },
  // 13. 김유빈 피아노 독주회: 여정 시리즈 4. 러시아
  'kopis-PF301874': {
    composers: ['표트르 일리치 차이콥스키', '세르게이 라흐마니노프', '모데스트 무소륵스키'],
    pieces: [
      '표트르 일리치 차이콥스키: 사계 Op.37b 중 4월 "눈송이", 10월 "가을의 노래"',
      '표트르 일리치 차이콥스키: 둠카 C단조 Op.59',
      '세르게이 라흐마니노프: 코렐리 주제에 의한 변주곡 Op.42',
      '모데스트 무소륵스키: 전람회의 그림'
    ]
  },
  // 14. 낭만주의 거장, 시벨리우스 (부천아트센터 10/21)
  'kopis-PF291310': {
    composers: ['장 시벨리우스'],
    pieces: [
      '장 시벨리우스: 핀란디아 Op.26',
      '장 시벨리우스: 바이올린 협주곡 D단조 Op.47 (협연: 임지영)',
      '장 시벨리우스: 교향곡 제2번 D장조 Op.43'
    ]
  },
  // 15. 이나현 피아노 독주회
  'kopis-PF302991': {
    composers: ['프랑수아 쿠프랭', '루트비히 판 베토벤', '프레데리크 쇼팽'],
    pieces: [
      '프랑수아 쿠프랭: 틱-톡-쇼크 (Le Tic-Toc-Choc)',
      '루트비히 판 베토벤: 피아노 소나타 제30번 E장조 Op.109',
      '프레데리크 쇼팽: 4개의 발라드 전곡 (Ballades Nos. 1-4)'
    ]
  },
  // 16. 스미노 하야토 피아노 리사이틀
  'kopis-PF296224': {
    composers: ['프레데리크 쇼팽', '스미노 하야토', '모리스 라벨'],
    pieces: [
      '프레데리크 쇼팽: 에튀드 C장조 Op.10 No.1',
      '스미노 하야토: 리디안 하프 (Lydian Harp)',
      '프레데리크 쇼팽: 스케르초 제1번 b단조 Op.20',
      '프레데리크 쇼팽: 피아노 소나타 제2번 b♭단조 Op.35 "장송"',
      '프레데리크 쇼팽: 에튀드 G♭장조 Op.10 No.5 "흑건" & 스미노 하야토: "백건"',
      '모리스 라벨: 라 발스 (La Valse)'
    ]
  },
  // 17. 제5회 트리오 메리디오 정기연주회
  'kopis-PF301851': {
    composers: ['루트비히 판 베토벤', '펠릭스 멘델스존'],
    pieces: [
      '루트비히 판 베토벤: 피아노 3중주 제3번 c단조 Op.1 No.3',
      '펠릭스 멘델스존: 피아노 3중주 제2번 c단조 Op.66'
    ]
  },
  // 18. 대전시립교향악단 마스터즈 시리즈 9, 라흐마니노프 교향곡 제2번
  'kopis-PF284842': {
    composers: ['세르게이 라흐마니노프'],
    pieces: [
      '세르게이 라흐마니노프: 보칼리제 Op.34 No.14',
      '세르게이 라흐마니노프: 파가니니 주제에 의한 랩소디 Op.43',
      '세르게이 라흐마니노프: 교향곡 제2번 e단조 Op.27'
    ]
  },
  // 19. 이채영 피아노 독주회
  'kopis-PF301449': {
    composers: ['J.S. 바흐', '루트비히 판 베토벤', '클로드 드뷔시', '로베르트 슈만'],
    pieces: [
      'J.S. 바흐 / 에곤 페트리 편곡: 양들은 평온히 풀을 뜯고 BWV 208',
      '루트비히 판 베토벤: 피아노 소나타 제31번 A♭장조 Op.110',
      '클로드 드뷔시: 2개의 아라베스크 L.66',
      '로베르트 슈만: 크라이슬레리아나 Op.16'
    ]
  },
  // 20. 임재성 이유현 듀오 리사이틀
  'kopis-PF302600': {
    composers: ['클로드 드뷔시', '이고르 스트라빈스키', '프레데리크 쇼팽'],
    pieces: [
      '클로드 드뷔시: 첼로 소나타 d단조 L.135',
      '이고르 스트라빈스키: 첼로와 피아노를 위한 이탈리아 모음곡',
      '프레데리크 쇼팽: 첼로 소나타 g단조 Op.65'
    ]
  },
  // 21. M & M 시리즈 Ⅳ. 시벨리우스 & 박수예 [인천]
  'kopis-PF286624': {
    composers: ['장 시벨리우스', '세르게이 라흐마니노프'],
    pieces: [
      '장 시벨리우스: 바이올린 협주곡 d단조 Op.47 (협연: 박수예)',
      '세르게이 라흐마니노프: 교향곡 제2번 e단조 Op.27 (지휘: 지중배, KBS교향악단)'
    ]
  },
  // 22. 손열음 & 고잉홈프로젝트 3건 (독주곡이 잘못 복사되어 있었으므로 비우기)
  'kopis-PF302483': {
    composers: ['클래식 명작'],
    pieces: []
  },
  'kopis-PF303047': {
    composers: ['클래식 명작'],
    pieces: []
  },
  'kopis-PF290848': {
    composers: ['클래식 명작'],
    pieces: []
  },
  // 23. 김남조 탄생 100년 기념 이영자 작품 연주회 (공식 미기재 건 비우기)
  'kopis-PF302477': {
    composers: ['이영자'],
    pieces: []
  }
};

// We will parse the file as JS array, or parse the blocks
// Since initialRealConcerts is exported as `export const initialRealConcerts = [ ... ];`
// Let's use regex or eval to accurately update.

let updatedCount = 0;
for (const [id, data] of Object.entries(verifiedMap)) {
  const idPattern = new RegExp(`"id":\\s*"${id}"[\\s\\S]*?"pieces":\\s*\\[[^\\]]*\\]`);
  const match = content.match(idPattern);
  if (match) {
    const block = match[0];
    let newBlock = block;
    // Update pieces
    const piecesStr = JSON.stringify(data.pieces, null, 6).replace(/\n/g, '\n      ');
    newBlock = newBlock.replace(/"pieces":\s*\[[^\]]*\]/, `"pieces": ${piecesStr}`);
    
    // Also update composers if present in block
    if (data.composers && newBlock.includes('"composers":')) {
      const compStr = JSON.stringify(data.composers, null, 6).replace(/\n/g, '\n      ');
      newBlock = newBlock.replace(/"composers":\s*\[[^\]]*\]/, `"composers": ${compStr}`);
    }

    content = content.replace(block, newBlock);
    updatedCount++;
    console.log(`Updated [${id}] with verified data.`);
  } else {
    console.warn(`Could not find id: ${id}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Successfully updated ${updatedCount} concerts in initialRealConcerts.js`);
