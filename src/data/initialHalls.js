export const initialHalls = [
  {
    id: "hall-01",
    name: "예술의전당 (콘서트홀 / IBK챔버홀)",
    city: "서울 서초구",
    officialUrl: "https://www.sac.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2025-05-10 09:30",
    activeConcerts: 2,
    syncNote: "공식 공연정보망 전송 프로토콜 정상 수신 중"
  },
  {
    id: "hall-02",
    name: "롯데콘서트홀",
    city: "서울 송파구",
    officialUrl: "https://www.lotteconcerthall.com",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2025-05-10 09:30",
    activeConcerts: 1,
    syncNote: "빈야드 구조 공연장 일정 데이터 정상 갱신"
  },
  {
    id: "hall-03",
    name: "부천아트센터 (콘서트홀)",
    city: "경기 부천시",
    officialUrl: "https://www.bac.or.kr",
    crawlerStatus: "수집 차단됨",
    blocked: true,
    lastSyncTime: "2025-05-09 14:15",
    activeConcerts: 1,
    syncNote: "홈페이지 보안 방화벽 및 크롤링 접근 제한 감지됨 (관리자 수동 등록 필요)"
  },
  {
    id: "hall-04",
    name: "세종문화회관 (대극장 / 체임버홀)",
    city: "서울 종로구",
    officialUrl: "https://www.sejongpac.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2025-05-10 09:30",
    activeConcerts: 1,
    syncNote: "티켓 오픈 일정 및 프로그램 정보 자동 갱신"
  },
  {
    id: "hall-05",
    name: "아트센터인천 (콘서트홀)",
    city: "인천 연수구 송도",
    officialUrl: "https://www.aci.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2025-05-10 09:30",
    activeConcerts: 1,
    syncNote: "송도 해안 클래식 전용홀 일정 정상 연동"
  },
  {
    id: "hall-06",
    name: "해외 초청 / 프라이빗 홀",
    city: "전국 및 해외 기획사",
    officialUrl: "https://www.classic-concert.kr",
    crawlerStatus: "수집 차단됨",
    blocked: true,
    lastSyncTime: "2025-05-08 18:20",
    activeConcerts: 1,
    syncNote: "기획사 비공개 일정 / 크롤링 방지 정책 적용 (관리자 직접 업로드 필요)"
  },
  {
    id: "hall-07",
    name: "통영국제음악당",
    city: "경남 통영시",
    officialUrl: "https://www.timf.org",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2025-05-10 09:30",
    activeConcerts: 1,
    syncNote: "통영국제음악제 봄/가을 시즌 공연 자동 수집 완료"
  },
  {
    id: "hall-08",
    name: "대구콘서트하우스 (그랜드홀)",
    city: "대구 중구",
    officialUrl: "https://www.daeguconcerthouse.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2025-05-10 09:30",
    activeConcerts: 1,
    syncNote: "영남권 대표 클래식 전용홀 일정 연동 완료"
  }
];
