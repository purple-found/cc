/**
 * clean_fake_pieces.cjs
 * 임의로 생성/채워 넣은 가짜 클래식 작품 목록(템플릿) 전수 제거 및 무결성 정제 스크립트
 * 
 * 정제 규칙:
 * - KOPIS 및 공식 발표에 없는 템플릿(앙코르 특별 무대, 정규 클래식 레퍼토리, 실내악 선율, 걸작선, 소나타 및 모음곡 등) 전량 삭제 -> []
 * - 실제로 확인된 고유 연주곡 목록만 보존하고, 확인되지 않은 공연은 빈 배열 [] 유지
 */

const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'src', 'data', 'initialRealConcerts.js');
let initialRealConcerts = [];
try {
  delete require.cache[require.resolve(dataFilePath)];
  const imported = require(dataFilePath);
  initialRealConcerts = imported.initialRealConcerts || imported.default || imported;
} catch (err) {
  console.error('❌ 데이터 파일 로드 실패:', err.message);
  process.exit(1);
}

const fakePhrases = [
  '앙코르',
  '레퍼토리',
  '하모니',
  '협주곡 앙상블',
  '소나타 및 모음곡',
  '실내악 선율',
  '프로그램',
  '걸작선',
  '야상곡(녹턴) 및 발라드 선곡',
  '바이올린 소나타 선율'
];

function isFakePieceList(pieces) {
  if (!pieces || !Array.isArray(pieces) || pieces.length === 0) return false;

  // 1. 임의 생성 문구가 하나라도 포함된 경우
  if (pieces.some(p => fakePhrases.some(f => p.includes(f)))) return true;

  // 2. 여러 공연에 기계적으로 복제된 가짜 템플릿 목록 감지
  const joined = pieces.join(' | ');
  if (joined.includes('환상소곡집 Op.73') && joined.includes('BWV 1007') && joined.includes('첼로 소나타 G단조')) return true;
  if (joined.includes('피아노 협주곡 제1번') && joined.includes('피아노 협주곡 제2번') && joined.includes('안단테 스피아나토')) return true;
  if (joined.includes('서주와 론도') && joined.includes('바이올린 파르티타')) return true;
  if (joined.includes('교향곡 제44번') && joined.includes('실내교향곡 C단조') && joined.includes('디베르티멘토 K.136')) return true;

  return false;
}

let clearedCount = 0;
let preservedCount = 0;

initialRealConcerts.forEach(c => {
  if (isFakePieceList(c.pieces)) {
    c.pieces = [];
    clearedCount++;
  } else if (c.pieces && c.pieces.length > 0) {
    preservedCount++;
  }
});

console.log(`=======================================================`);
console.log(`[CLASSICALENDER] 임의 생성 작품 목록 전수 정제 완료`);
console.log(`- 가짜/임의 생성 목록 제거 (빈 배열 처리): ${clearedCount}건`);
console.log(`- 실제 확인된 고유 연주곡 보존: ${preservedCount}건`);
console.log(`- 전체 공연 수: ${initialRealConcerts.length}건`);
console.log(`=======================================================`);

const fileContent = `export const initialRealConcerts = ${JSON.stringify(initialRealConcerts, null, 2)};\n\nexport default initialRealConcerts;\n`;
fs.writeFileSync(dataFilePath, fileContent, 'utf8');
console.log(`✅ src/data/initialRealConcerts.js 저장 완료!`);
