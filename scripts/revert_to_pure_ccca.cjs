/**
 * scripts/revert_to_pure_ccca.cjs
 * 순수 서양음악(CCCA - 클래식) 100% 원칙 준수:
 * 비-CCCA(발레, 재즈, 국악, 크로스오버 대중음악 등 31건) 전량 제거 및
 * 순수 클래식 공연 212건(221 전산망)의 실존 프로그램 보존 완료
 */

const fs = require('fs');
const path = require('path');

const pureCcca = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'kopis_pure_ccca_dec.json'), 'utf8'));
const pureCccaIds = new Set(pureCcca.map(c => c.id));

const filePath = path.resolve(__dirname, '../src/data/initialRealConcerts.js');
const fileContent = fs.readFileSync(filePath, 'utf8');
const jsonStart = fileContent.indexOf('[');
const jsonEnd = fileContent.lastIndexOf(']');
const concerts = JSON.parse(fileContent.substring(jsonStart, jsonEnd + 1));

console.log(`정리 전 전체 DB 공연 수: ${concerts.length}건`);

// 12월 공연 중 순수 CCCA에 속하지 않는 31건 제거
const filteredConcerts = concerts.filter(c => {
  const d = c.date || c.startDate || '';
  const isDec = d.startsWith('2026-12') || (c.startDate && c.startDate.startsWith('2026-12'));
  if (!isDec) return true; // 12월 외는 유지

  const kid = (c.kopisId || (c.id || '').replace(/^kopis-/, '')).trim();
  // 순수 CCCA 목록에 있는 경우만 유지
  return pureCccaIds.has(kid);
});

console.log(`정리 후 전체 DB 공연 수: ${filteredConcerts.length}건 (제거된 비클래식: ${concerts.length - filteredConcerts.length}건)`);

const decRemaining = filteredConcerts.filter(c => {
  const d = c.date || c.startDate || '';
  return d.startsWith('2026-12') || (c.startDate && c.startDate.startsWith('2026-12'));
});
console.log(`12월 순수 서양음악(클래식) 공연 수: ${decRemaining.length}건`);
const withPieces = decRemaining.filter(c => c.pieces && c.pieces.length > 0);
console.log(`12월 순수 클래식 중 실존 프로그램 보유 공연: ${withPieces.length}건`);

// 날짜순 정렬
filteredConcerts.sort((a, b) => {
  const da = a.date || a.startDate || '';
  const db = b.date || b.startDate || '';
  return da.localeCompare(db);
});

const newFileContent = `// KOPIS 공식 OpenAPI 순수 서양음악(CCCA/클래식) 전수 적재 및 실존 프로그램 완전 동기화
export const INITIAL_REAL_CONCERTS = ${JSON.stringify(filteredConcerts, null, 2)};
export const initialRealConcerts = INITIAL_REAL_CONCERTS;

export default INITIAL_REAL_CONCERTS;
`;

fs.writeFileSync(filePath, newFileContent, 'utf8');
console.log('src/data/initialRealConcerts.js 순수 클래식 정제 저장 완료!');
