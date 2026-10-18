export const initialHalls = [
  {
    id: "hall-01",
    name: "예술의전당 콘서트홀 (Seoul Arts Center Concert Hall)",
    city: "서울 서초구 (Seoul)",
    officialUrl: "https://www.sac.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2026-10-07 09:30",
    activeConcerts: 3,
    syncNote: "공식 전산망 프로토콜 정상 수신 중 (2026년 10월 일정 갱신 완료)"
  },
  {
    id: "hall-02",
    name: "롯데콘서트홀 (Lotte Concert Hall)",
    city: "서울 송파구 (Seoul)",
    officialUrl: "https://www.lotteconcerthall.com",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2026-10-07 09:30",
    activeConcerts: 2,
    syncNote: "빈야드형 콘서트홀 일정 데이터 정상 연동 중"
  },
  {
    id: "hall-03",
    name: "부천아트센터 콘서트홀 (Bucheon Arts Center Concert Hall)",
    city: "경기 부천시 (Bucheon)",
    officialUrl: "https://www.bac.or.kr",
    crawlerStatus: "수집 차단됨",
    blocked: true,
    lastSyncTime: "2026-10-06 14:15",
    activeConcerts: 1,
    syncNote: "홈페이지 보안 방화벽 및 크롤링 접근 제한 감지됨 (관리자 수동 등록 필요)"
  },
  {
    id: "hall-04",
    name: "세종문화회관 대극장 (Sejong Center Main Auditorium)",
    city: "서울 종로구 (Seoul)",
    officialUrl: "https://www.sejongpac.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2026-10-07 09:30",
    activeConcerts: 2,
    syncNote: "티켓 오픈 일정 및 프로그램 정보 자동 갱신"
  },
  {
    id: "hall-05",
    name: "아트센터인천 콘서트홀 (Art Center Incheon Concert Hall)",
    city: "인천 연수구 송도 (Incheon)",
    officialUrl: "https://www.aci.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2026-10-07 09:30",
    activeConcerts: 1,
    syncNote: "송도 해안 클래식 전용홀 10월 정기공연 연동 완료"
  },
  {
    id: "hall-06",
    name: "해외 초청 / 프라이빗 홀 (International Tour Organizers)",
    city: "전국 및 해외 기획사",
    officialUrl: "https://www.classic-concert.kr",
    crawlerStatus: "수집 차단됨",
    blocked: true,
    lastSyncTime: "2026-10-05 18:20",
    activeConcerts: 1,
    syncNote: "기획사 보안 정책 및 크롤링 차단 적용 (빈 필하모닉 등 관리자 직접 등록)"
  },
  {
    id: "hall-07",
    name: "통영국제음악당 콘서트홀 (Tongyeong International Music Hall)",
    city: "경남 통영시 (Tongyeong)",
    officialUrl: "https://www.timf.org",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2026-10-07 09:30",
    activeConcerts: 1,
    syncNote: "가을 시즌 바흐 콜레기움 재팬 초청공연 일정 자동 수신"
  },
  {
    id: "hall-08",
    name: "대구콘서트하우스 그랜드홀 (Daegu Concert House Grand Hall)",
    city: "대구 중구 (Daegu)",
    officialUrl: "https://www.daeguconcerthouse.or.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2026-10-07 09:30",
    activeConcerts: 1,
    syncNote: "영남권 대표 클래식 전용홀 백건우 리사이틀 일정 연동 완료"
  },
  {
    id: "hall-09",
    name: "부산콘서트홀 (Busan Concert Hall)",
    city: "부산 부산진구 (Busan)",
    officialUrl: "https://www.busan.go.kr",
    crawlerStatus: "연동 정상",
    blocked: false,
    lastSyncTime: "2026-10-18 09:30",
    activeConcerts: 15,
    syncNote: "영남권 최초 2,000석 규모 빈야드형 파이프오르간 클래식 전용홀 공식 일정 정상 연동 중"
  }
];
