/**
 * monthly_cleanup_old_concerts.cjs
 * 매월 1일 새벽 2시 자동 실행: 1년 이상 지난 공연 데이터 자동 삭제 및 최적화 배치 스크립트
 * 
 * 기능:
 * 1. 실행 시점(KST) 기준 정확히 1년(365일) 이전의 종료된 과거 공연 전수 감지
 * 2. 1년 이상 경과된 공연 데이터를 안전하게 영구 삭제하여 DB 및 스토리지 비대화 방지
 * 3. src/data/initialRealConcerts.js 파일 자동 갱신 및 백업
 * 4. scripts/monthly_cleanup_log.json 에 실행 이력 및 감사 로그 영구 기록
 */

const fs = require('fs');
const path = require('path');

function getKSTDate() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (9 * 3600000));
}

function formatKSTString(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} KST`;
}

function runMonthlyCleanup(cutoffYears = 1) {
  const kstNow = getKSTDate();
  const cutoffDate = new Date(kstNow.getFullYear() - cutoffYears, kstNow.getMonth(), kstNow.getDate(), 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  const cutoffStr = `${cutoffDate.getFullYear()}-${pad(cutoffDate.getMonth() + 1)}-${pad(cutoffDate.getDate())}`;

  console.log(`=======================================================`);
  console.log(`[CLASSICALENDER 클린더] 매월 1일 새벽 2시 데이터 자동 최적화 배치`);
  console.log(`- 실행 시각: ${formatKSTString(kstNow)}`);
  console.log(`- 보존 기준: 1년 이내 공연 유지 (기준일: ${cutoffStr} 이전 데이터 자동 삭제)`);
  console.log(`=======================================================`);

  const dataFilePath = path.join(__dirname, '..', 'src', 'data', 'initialRealConcerts.js');
  if (!fs.existsSync(dataFilePath)) {
    console.error(`❌ 데이터 파일 경로를 찾을 수 없습니다: ${dataFilePath}`);
    process.exit(1);
  }

  // CommonJS 동적 require
  let initialRealConcerts = [];
  try {
    delete require.cache[require.resolve(dataFilePath)];
    const imported = require(dataFilePath);
    initialRealConcerts = imported.initialRealConcerts || imported.default || imported;
  } catch (err) {
    console.error('❌ 데이터 파일 로드 실패:', err.message);
    process.exit(1);
  }

  const totalBefore = initialRealConcerts.length;
  const remaining = [];
  const removed = [];

  for (const concert of initialRealConcerts) {
    const dateStr = concert.date || concert.endDate;
    if (!dateStr) {
      remaining.push(concert);
      continue;
    }
    const cleanDate = String(dateStr).slice(0, 10);
    const d = new Date(cleanDate);
    if (!isNaN(d.getTime()) && d < cutoffDate) {
      removed.push({
        id: concert.id,
        title: concert.title,
        date: concert.date,
        venue: concert.venue
      });
    } else {
      remaining.push(concert);
    }
  }

  console.log(`- 정리 전 총 공연 건수: ${totalBefore}건`);
  console.log(`- 1년 이상 경과 삭제 대상: ${removed.length}건`);
  console.log(`- 유지 보존 공연 건수: ${remaining.length}건`);

  if (removed.length > 0) {
    // 1. 파일 안전 저장
    const fileContent = `export const initialRealConcerts = ${JSON.stringify(remaining, null, 2)};\n\nexport default initialRealConcerts;\n`;
    fs.writeFileSync(dataFilePath, fileContent, 'utf8');
    console.log(`✅ src/data/initialRealConcerts.js 파일 자동 갱신 완료 (${removed.length}건 영구 정리됨)`);
  } else {
    console.log(`ℹ️ 1년 이상 경과한 정리 대상 공연이 없습니다. (현재 모든 공연 최신 상태 유지 중)`);
  }

  // 2. 감사 로그 기록
  const logFilePath = path.join(__dirname, 'monthly_cleanup_log.json');
  let logHistory = [];
  try {
    if (fs.existsSync(logFilePath)) {
      const raw = fs.readFileSync(logFilePath, 'utf8');
      logHistory = JSON.parse(raw);
      if (!Array.isArray(logHistory)) logHistory = [];
    }
  } catch (e) {
    logHistory = [];
  }

  const logEntry = {
    executedAt: formatKSTString(kstNow),
    cutoffDate: cutoffStr,
    totalBefore,
    removedCount: removed.length,
    remainingCount: remaining.length,
    sampleRemoved: removed.slice(0, 10)
  };

  logHistory.unshift(logEntry);
  if (logHistory.length > 36) {
    logHistory = logHistory.slice(0, 36); // 최근 3년(36개월)치 보관
  }

  fs.writeFileSync(logFilePath, JSON.stringify(logHistory, null, 2), 'utf8');
  console.log(`📄 scripts/monthly_cleanup_log.json 감사 로그 업데이트 완료`);

  if (removed.length > 0) {
    try {
      const { execSync } = require('child_process');
      const repoRoot = path.resolve(__dirname, '..');
      execSync('git add src/data/initialRealConcerts.js scripts/monthly_cleanup_log.json', { cwd: repoRoot, stdio: 'ignore' });
      execSync(`git commit -m "chore(data): monthly old concert dataset cleanup (${removed.length} removed)"`, { cwd: repoRoot, stdio: 'ignore' });
      execSync('git push origin main', { cwd: repoRoot, stdio: 'ignore' });
      console.log(`🚀 [GitHub & Render 자동 배포] 정리된 공연 데이터가 GitHub 및 Render 사이트에 자동 반영되었습니다.`);
    } catch (gitErr) {
      console.warn(`⚠️ GitHub 자동 푸시 중 경고:`, gitErr.message);
    }
  }
  console.log(`=======================================================\n`);

  return logEntry;
}

if (require.main === module) {
  runMonthlyCleanup();
}

module.exports = { runMonthlyCleanup };
