/**
 * venueUrls.js
 * 
 * 전국 주요 클래식 공연장 및 연주홀 공식 홈페이지 / 예매처 URL 매핑 시스템
 * 공연장 이름(fcltynm)에 맞춰 공식 사이트로 직접 연결합니다.
 */

export const VENUE_OFFICIAL_URLS = [
  // ───────────────────────── 서울 권역 ─────────────────────────
  {
    keywords: ['예술의전당', 'seoul arts center', 'sac'],
    name: '예술의전당',
    url: 'https://www.sac.or.kr'
  },
  {
    keywords: ['롯데콘서트홀', 'lotte concert hall'],
    name: '롯데콘서트홀',
    url: 'https://www.lotteconcerthall.com'
  },
  {
    keywords: ['세종문화회관', '세종체임버홀', '세종대극장', 'sejong center'],
    name: '세종문화회관',
    url: 'https://www.sejongpac.or.kr'
  },
  {
    keywords: ['lg아트센터', '엘지아트센터'],
    name: 'LG아트센터 서울',
    url: 'https://www.lgart.com'
  },
  {
    keywords: ['금호아트홀', '금호아트홀 연세'],
    name: '금호아트홀 연세',
    url: 'https://www.kumhoarthall.com'
  },
  {
    keywords: ['국립극장', '해오름극장', '달오름극장'],
    name: '국립극장',
    url: 'https://www.ntok.go.kr'
  },
  {
    keywords: ['영산아트홀'],
    name: '영산아트홀',
    url: 'https://www.youngsanarthall.com'
  },
  {
    keywords: ['일신홀'],
    name: '일신홀',
    url: 'https://ilshinhall.com'
  },
  {
    keywords: ['강동아트센터'],
    name: '강동아트센터',
    url: 'https://www.gdfac.or.kr'
  },
  {
    keywords: ['마포아트센터'],
    name: '마포아트센터',
    url: 'https://www.mfac.or.kr'
  },
  {
    keywords: ['노원문화예술회관'],
    name: '노원문화예술회관',
    url: 'https://www.nowonarts.kr'
  },
  {
    keywords: ['광림아트센터'],
    name: '광림아트센터',
    url: 'https://klarts.kr'
  },
  {
    keywords: ['반포심산아트홀'],
    name: '반포심산아트홀',
    url: 'https://seochocf.or.kr'
  },
  {
    keywords: ['구로아트밸리'],
    name: '구로아트밸리',
    url: 'https://www.guroartsvalley.or.kr'
  },

  // ───────────────────────── 경기 / 인천 권역 ─────────────────────────
  {
    keywords: ['부천아트센터', 'bucheon arts center', 'bac'],
    name: '부천아트센터',
    url: 'https://www.bac.or.kr'
  },
  {
    keywords: ['아트센터인천', '아트센터 인천', 'art center incheon'],
    name: '아트센터인천',
    url: 'https://www.aci.or.kr'
  },
  {
    keywords: ['경기아트센터', '경기도문화의전당'],
    name: '경기아트센터',
    url: 'https://www.ggac.or.kr'
  },
  {
    keywords: ['성남아트센터'],
    name: '성남아트센터',
    url: 'https://www.snart.or.kr'
  },
  {
    keywords: ['고양아람누리', '고양어울림누리'],
    name: '고양아람누리',
    url: 'https://www.artgy.or.kr'
  },
  {
    keywords: ['엘림아트센터'],
    name: '엘림아트센터',
    url: 'https://elimartcenter.co.kr'
  },
  {
    keywords: ['용인포은아트홀', '용인문화예술원'],
    name: '용인문화재단',
    url: 'https://www.yicf.or.kr'
  },
  {
    keywords: ['안양아트센터', '평촌아트홀'],
    name: '안양문화예술재단',
    url: 'https://www.ayac.or.kr'
  },
  {
    keywords: ['의정부예술의전당'],
    name: '의정부예술의전당',
    url: 'https://www.uac.or.kr'
  },
  {
    keywords: ['인천문화예술회관'],
    name: '인천문화예술회관',
    url: 'https://www.incheon.go.kr/art'
  },
  {
    keywords: ['하남문화예술회관'],
    name: '하남문화예술회관',
    url: 'https://www.hnart.or.kr'
  },

  // ───────────────────────── 충청 / 대전 / 세종 권역 ─────────────────────────
  {
    keywords: ['청주예술의전당', '청주예술'],
    name: '청주예술의전당',
    url: 'https://www.cheongju.go.kr/ac/index.do'
  },
  {
    keywords: ['대전예술의전당'],
    name: '대전예술의전당',
    url: 'https://www.daejeon.go.kr/djac'
  },
  {
    keywords: ['세종예술의전당'],
    name: '세종예술의전당',
    url: 'https://www.sjac.or.kr'
  },
  {
    keywords: ['천안예술의전당'],
    name: '천안예술의전당',
    url: 'https://www.cnac.or.kr'
  },

  // ───────────────────────── 대구 / 경북 권역 ─────────────────────────
  {
    keywords: ['대구콘서트하우스'],
    name: '대구콘서트하우스',
    url: 'https://www.daeguconcerthouse.or.kr'
  },
  {
    keywords: ['수성아트피아'],
    name: '수성아트피아',
    url: 'https://www.ssartpia.kr'
  },
  {
    keywords: ['대구오페라하우스'],
    name: '대구오페라하우스',
    url: 'https://www.daeguoperahouse.org'
  },
  {
    keywords: ['대구문화예술회관'],
    name: '대구문화예술회관',
    url: 'https://daeguartscenter.or.kr'
  },
  {
    keywords: ['경주예술의전당'],
    name: '경주예술의전당',
    url: 'https://garts.kr'
  },
  {
    keywords: ['안동문화예술의전당'],
    name: '안동문화예술의전당',
    url: 'https://www.andong.go.kr/arts'
  },
  {
    keywords: ['포항문화예술회관'],
    name: '포항문화예술회관',
    url: 'https://phcf.or.kr'
  },

  // ───────────────────────── 부산 / 울산 / 경남 권역 ─────────────────────────
  {
    keywords: ['부산문화회관', '부산시민회관'],
    name: '부산문화회관',
    url: 'https://www.bscc.or.kr'
  },
  {
    keywords: ['부산콘서트홀'],
    name: '부산콘서트홀',
    url: 'https://www.busan.go.kr'
  },
  {
    keywords: ['통영국제음악당'],
    name: '통영국제음악당',
    url: 'https://www.timf.org'
  },
  {
    keywords: ['영화의전당'],
    name: '영화의전당',
    url: 'https://www.dureraum.org'
  },
  {
    keywords: ['f1963'],
    name: 'F1963',
    url: 'http://www.f1963.org'
  },
  {
    keywords: ['울산문화예술회관'],
    name: '울산문화예술회관',
    url: 'https://ucac.ulsan.go.kr'
  },
  {
    keywords: ['3.15아트센터', '창원문화재단'],
    name: '창원문화재단',
    url: 'https://www.cwcf.or.kr'
  },
  {
    keywords: ['경상남도문화예술회관'],
    name: '경상남도문화예술회관',
    url: 'https://www.gnart.or.kr'
  },

  // ───────────────────────── 광주 / 전라 권역 ─────────────────────────
  {
    keywords: ['광주예술의전당'],
    name: '광주예술의전당',
    url: 'https://gjart.gwangju.go.kr'
  },
  {
    keywords: ['국립아시아문화전당', 'acc'],
    name: '국립아시아문화전당',
    url: 'https://www.acc.go.kr'
  },
  {
    keywords: ['우진문화공간'],
    name: '우진문화공간',
    url: 'http://www.woojin.or.kr'
  },
  {
    keywords: ['한국소리문화의전당'],
    name: '한국소리문화의전당',
    url: 'https://www.sori21.co.kr'
  },
  {
    keywords: ['익산예술의전당'],
    name: '익산예술의전당',
    url: 'https://arts.iksan.go.kr'
  },
  {
    keywords: ['군산예술의전당'],
    name: '군산예술의전당',
    url: 'https://www.gunsan.go.kr/arts'
  },
  {
    keywords: ['예울마루', 'gs칼텍스 예울마루'],
    name: 'GS칼텍스 예울마루',
    url: 'https://www.yeulmaru.org'
  },

  // ───────────────────────── 강원 / 제주 권역 ─────────────────────────
  {
    keywords: ['강릉아트센터'],
    name: '강릉아트센터',
    url: 'https://www.gn.go.kr/gnart'
  },
  {
    keywords: ['춘천문화예술회관'],
    name: '춘천문화예술회관',
    url: 'https://www.cccf.or.kr'
  },
  {
    keywords: ['원주문화재단', '치악예술관'],
    name: '원주문화재단',
    url: 'https://wcf.or.kr'
  },
  {
    keywords: ['제주아트센터'],
    name: '제주아트센터',
    url: 'https://www.jejusi.go.kr/acenter/index.do'
  },
  {
    keywords: ['서귀포예술의전당'],
    name: '서귀포예술의전당',
    url: 'https://culture.seogwipo.go.kr/sori'
  }
];

/**
 * 공연 객체 또는 공연장 이름을 바탕으로 해당 공연장의 공식 홈페이지 URL을 반환
 */
export function getVenueOfficialUrl(concertOrVenue) {
  if (!concertOrVenue) return 'https://www.sac.or.kr';

  let venueName = '';
  let customTicketUrl = '';

  if (typeof concertOrVenue === 'string') {
    venueName = concertOrVenue;
  } else {
    venueName = concertOrVenue.venue || concertOrVenue.sourceHall || '';
    customTicketUrl = concertOrVenue.ticketUrl || '';
  }

  const vLower = venueName.toLowerCase();

  // 1. 전국 지방 예술의전당 우선 정밀 판별 (서울 예술의전당 오연결 원천 방지)
  if (vLower.includes('군산') && vLower.includes('예술')) {
    return 'https://www.gunsan.go.kr/arts';
  }
  if (vLower.includes('서귀포') && vLower.includes('예술')) {
    return 'https://culture.seogwipo.go.kr/sori';
  }
  if (vLower.includes('제천') && vLower.includes('예술')) {
    return 'https://www.jecheon.go.kr/jcart';
  }
  if (vLower.includes('의정부') && vLower.includes('예술')) {
    return 'https://www.uac.or.kr';
  }
  if (vLower.includes('화성') && vLower.includes('예술')) {
    return 'https://www.hcf.or.kr';
  }
  if (vLower.includes('안산') && vLower.includes('예술')) {
    return 'https://www.ansanart.com';
  }
  if (vLower.includes('진천') && vLower.includes('예술')) {
    return 'https://www.jincheon.go.kr';
  }
  if (vLower.includes('계룡') && vLower.includes('예술')) {
    return 'https://www.gyeryong.go.kr/art';
  }
  if (vLower.includes('청주') && vLower.includes('예술')) {
    return 'https://www.cheongju.go.kr/ac/index.do';
  }
  if (vLower.includes('대전') && vLower.includes('예술')) {
    return 'https://www.daejeon.go.kr/djac';
  }
  if (vLower.includes('광주') && vLower.includes('예술')) {
    return 'https://gjart.gwangju.go.kr';
  }
  if (vLower.includes('세종') && vLower.includes('예술')) {
    return 'https://www.sjac.or.kr';
  }
  if (vLower.includes('천안') && vLower.includes('예술')) {
    return 'https://www.cnac.or.kr';
  }
  if (vLower.includes('안동') && vLower.includes('예술')) {
    return 'https://www.andong.go.kr/arts';
  }
  if (vLower.includes('경주') && vLower.includes('예술')) {
    return 'https://garts.kr';
  }
  if (vLower.includes('익산') && vLower.includes('예술')) {
    return 'https://arts.iksan.go.kr';
  }

  // 2. 주요 공연장 테이블 매핑 (서울 예술의전당 제외 타 공연장 우선)
  for (const item of VENUE_OFFICIAL_URLS) {
    if (item.name === '예술의전당') continue;
    for (const kw of item.keywords) {
      if (vLower.includes(kw)) {
        return item.url;
      }
    }
  }

  // 3. 서울 예술의전당 판별 (순수 서울 예술의전당만 매칭)
  if (
    vLower.includes('예술의전당 [서울]') ||
    vLower.includes('예술의전당(서울)') ||
    vLower.includes('sac') ||
    vLower.includes('seoul arts center') ||
    vLower === '예술의전당' ||
    /^예술의전당(\s|$|\[|\()/.test(venueName.trim())
  ) {
    return 'https://www.sac.or.kr';
  }

  // 4. 만약 기존 ticketUrl이 인터파크나 특정 공식 예매처 등으로 직접 지정되어 있다면 사용
  if (customTicketUrl && !customTicketUrl.includes('kopis.or.kr')) {
    return customTicketUrl;
  }

  // 5. 기본 폴백: 포털 공식 예매 검색 연계
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(venueName + ' 공식 예매')}`;
}
