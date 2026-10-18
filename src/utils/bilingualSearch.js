/**
 * bilingualSearch.js
 * 클래식 음악 전용 한글 <-> 영문 완벽 양방향 지능형 검색 엔진
 * - 작품/작곡가/연주자/공연장/장르가 한글일 때 영문 검색 지원 (예: 'chopin' -> '쇼팽' 매칭)
 * - 작품/작곡가/연주자/공연장이 영문일 때 한글 검색 지원 (예: '스트라빈스키' -> 'Stravinsky' 매칭)
 * - 복수 토큰(다단어) 교차 바이링구얼 매칭 지원 (예: 'chopin ballade' -> '쇼팽 발라드' 매칭)
 */

// 다이아크리틱(악센트) 제거 및 소문자 정규화
export function normalizeText(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // 악센트 제거 (é -> e, ä -> a, 등)
    .toLowerCase()
    .trim();
}

/**
 * 클래식 음악 핵심 한/영 대역어 사전
 */
export const BILINGUAL_DICTIONARY = [
  // ── 작곡가 (Composers) ──
  {
    ko: ['쇼팽', '프레데리크 쇼팽', '쇼팡'],
    en: ['chopin', 'frederic chopin', 'frédéric chopin']
  },
  {
    ko: ['스트라빈스키', '이고르 스트라빈스키'],
    en: ['stravinsky', 'igor stravinsky']
  },
  {
    ko: ['베토벤', '루드비히 반 베토벤', '루트비히 판 베토벤'],
    en: ['beethoven', 'ludwig van beethoven', 'l.v. beethoven']
  },
  {
    ko: ['모차르트', '모짜르트', '볼프강 아마데우스 모차르트'],
    en: ['mozart', 'wolfgang amadeus mozart', 'w.a. mozart']
  },
  {
    ko: ['바흐', '요한 제바스티안 바흐', '바하'],
    en: ['bach', 'johann sebastian bach', 'j.s. bach', 'js bach']
  },
  {
    ko: ['브람스', '요하네스 브람스'],
    en: ['brahms', 'johannes brahms']
  },
  {
    ko: ['차이콥스키', '차이코프스키', '표트르 차이콥스키'],
    en: ['tchaikovsky', 'pyotr ilyich tchaikovsky', 'tschaikowsky']
  },
  {
    ko: ['슈만', '로베르트 슈만', '클라라 슈만'],
    en: ['schumann', 'robert schumann', 'clara schumann']
  },
  {
    ko: ['슈베르트', '프란츠 슈베르트'],
    en: ['schubert', 'franz schubert']
  },
  {
    ko: ['라흐마니노프', '세르게이 라흐마니노프'],
    en: ['rachmaninoff', 'rachmaninov', 'sergei rachmaninoff', 's. rachmaninoff']
  },
  {
    ko: ['드뷔시', '클로드 드뷔시'],
    en: ['debussy', 'claude debussy', 'c. debussy']
  },
  {
    ko: ['라벨', '모리스 라벨'],
    en: ['ravel', 'maurice ravel', 'm. ravel']
  },
  {
    ko: ['하이든', '요제프 하이든'],
    en: ['haydn', 'joseph haydn', 'j. haydn']
  },
  {
    ko: ['멘델스존', '펠릭스 멘델스존'],
    en: ['mendelssohn', 'felix mendelssohn']
  },
  {
    ko: ['리스트', '프란츠 리스트'],
    en: ['liszt', 'franz liszt', 'f. liszt']
  },
  {
    ko: ['말러', '구스타프 말러'],
    en: ['mahler', 'gustav mahler']
  },
  {
    ko: ['시벨리우스', '장 시벨리우스', '얀 시벨리우스'],
    en: ['sibelius', 'jean sibelius', 'j. sibelius']
  },
  {
    ko: ['비발디', '안토니오 비발디'],
    en: ['vivaldi', 'antonio vivaldi']
  },
  {
    ko: ['헨델', '조지 프레드릭 헨델'],
    en: ['handel', 'haendel', 'george frideric handel']
  },
  {
    ko: ['바그너', '리하르트 바그너'],
    en: ['wagner', 'richard wagner']
  },
  {
    ko: ['베르디', '주세페 베르디'],
    en: ['verdi', 'giuseppe verdi']
  },
  {
    ko: ['푸치니', '자코모 푸치니'],
    en: ['puccini', 'giacomo puccini']
  },
  {
    ko: ['드보르자크', '드보르작', '안토닌 드보르자크'],
    en: ['dvorak', 'dvořák', 'antonin dvorak']
  },
  {
    ko: ['프로코피예프', '세르게이 프로코피예프'],
    en: ['prokofiev', 'sergei prokofiev', 's. prokofiev']
  },
  {
    ko: ['쇼스타코비치', '드미트리 쇼스타코비치'],
    en: ['shostakovich', 'dmitri shostakovich']
  },
  {
    ko: ['브루크너', '안톤 브루크너'],
    en: ['bruckner', 'anton bruckner']
  },
  {
    ko: ['베를리오즈', '엑토르 베를리오즈'],
    en: ['berlioz', 'hector berlioz']
  },
  {
    ko: ['생상스', '생상', '카미유 생상스'],
    en: ['saint-saens', 'saint-saëns', 'saint saens', 'camille saint-saens']
  },
  {
    ko: ['포레', '가브리엘 포레'],
    en: ['faure', 'fauré', 'gabriel faure']
  },
  {
    ko: ['프랑크', '세자르 프랑크'],
    en: ['franck', 'cesar franck', 'césar franck']
  },
  {
    ko: ['그리그', '에드바르 그리그'],
    en: ['grieg', 'edvard grieg']
  },
  {
    ko: ['파가니니', '니콜로 파가니니'],
    en: ['paganini', 'niccolo paganini', 'niccolò paganini']
  },
  {
    ko: ['로시니', '조아키노 로시니'],
    en: ['rossini', 'gioachino rossini']
  },
  {
    ko: ['도니제티', '가에타노 도니제티'],
    en: ['donizetti', 'gaetano donizetti']
  },
  {
    ko: ['벨리니', '빈첸초 벨리니'],
    en: ['bellini', 'vincenzo bellini']
  },
  {
    ko: ['슈트라우스', '리하르트 슈트라우스'],
    en: ['strauss', 'richard strauss']
  },
  {
    ko: ['요한 슈트라우스'],
    en: ['johann strauss']
  },
  {
    ko: ['엘가', '에드워드 엘가'],
    en: ['elgar', 'edward elgar']
  },
  {
    ko: ['홀스트', '구스타프 홀스트'],
    en: ['holst', 'gustav holst']
  },
  {
    ko: ['본 윌리엄스', '본 윌리암스'],
    en: ['vaughan williams', 'ralph vaughan williams']
  },
  {
    ko: ['바르톡', '바르토크', '벨라 바르톡'],
    en: ['bartok', 'bartók', 'bela bartok']
  },
  {
    ko: ['코다이', '졸탄 코다이'],
    en: ['kodaly', 'kodály', 'zoltan kodaly']
  },
  {
    ko: ['사티', '에릭 사티'],
    en: ['satie', 'erik satie']
  },
  {
    ko: ['풀랑크', '프랑시스 풀랑크'],
    en: ['poulenc', 'francis poulenc']
  },
  {
    ko: ['레스피기', '오토리노 레스피기'],
    en: ['respighi', 'ottorino respighi']
  },
  {
    ko: ['메시앙', '올리비에 메시앙'],
    en: ['messiaen', 'olivier messiaen']
  },
  {
    ko: ['글린카', '미하일 글린카'],
    en: ['glinka', 'mikhail glinka']
  },
  {
    ko: ['무소르그스키', '무소륵스키', '모데스트 무소르그스키'],
    en: ['mussorgsky', 'moussorgsky', 'modest mussorgsky']
  },
  {
    ko: ['림스키코르사코프', '림스키 코르사코프', '니콜라이 림스키코르사코프'],
    en: ['rimsky-korsakov', 'rimsky korsakov', 'nikolai rimsky-korsakov']
  },
  {
    ko: ['보로딘', '알렉산더 보로딘'],
    en: ['borodin', 'alexander borodin']
  },
  {
    ko: ['스크랴빈', '알렉산드르 스크랴빈'],
    en: ['scriabin', 'skryabin', 'alexander scriabin']
  },
  {
    ko: ['글라주노프', '알렉산드르 글라주노프'],
    en: ['glazunov', 'alexander glazunov']
  },
  {
    ko: ['하차투리안', '하차투랸', '아람 하차투리안'],
    en: ['khachaturian', 'aram khachaturian']
  },
  {
    ko: ['로드리고', '호아킨 로드리고'],
    en: ['rodrigo', 'joaquin rodrigo', 'joaquín rodrigo']
  },
  {
    ko: ['알베니스', '이삭 알베니스'],
    en: ['albeniz', 'albéniz', 'isaac albeniz']
  },
  {
    ko: ['그라나도스', '엔리케 그라나도스'],
    en: ['granados', 'enrique granados']
  },
  {
    ko: ['피아졸라', '아스토르 피아졸라'],
    en: ['piazzolla', 'astor piazzolla']
  },
  {
    ko: ['거슈윈', '거쉰', '조지 거슈윈'],
    en: ['gershwin', 'george gershwin']
  },
  {
    ko: ['코플랜드', '애런 코플랜드'],
    en: ['copland', 'aaron copland']
  },
  {
    ko: ['번스타인', '레너드 번스타인'],
    en: ['bernstein', 'leonard bernstein']
  },
  {
    ko: ['몬테베르디', '클라우디오 몬테베르디'],
    en: ['monteverdi', 'claudio monteverdi']
  },
  {
    ko: ['퍼셀', '헨리 퍼셀'],
    en: ['purcell', 'henry purcell']
  },
  {
    ko: ['텔레만', '게오르크 필리프 텔레만'],
    en: ['telemann', 'georg philipp telemann']
  },
  {
    ko: ['스카를라티', '도메니코 스카를라티'],
    en: ['scarlatti', 'domenico scarlatti']
  },
  {
    ko: ['글루크', '크리스토프 빌리발트 글루크'],
    en: ['gluck', 'christoph willibald gluck']
  },
  {
    ko: ['보케리니', '루이지 보케리니'],
    en: ['boccherini', 'luigi boccherini']
  },
  {
    ko: ['클레멘티', '무치오 클레멘티'],
    en: ['clementi', 'muzio clementi']
  },
  {
    ko: ['체르니', '카를 체르니'],
    en: ['czerny', 'carl czerny']
  },
  {
    ko: ['브리튼', '벤저민 브리튼'],
    en: ['britten', 'benjamin britten']
  },
  {
    ko: ['에네스쿠', '조르주 에네스쿠'],
    en: ['enescu', 'george enescu']
  },
  {
    ko: ['야나체크', '레오시 야나체크'],
    en: ['janacek', 'janáček', 'leos janacek']
  },
  {
    ko: ['베베른', '안톤 베베른'],
    en: ['webern', 'anton webern']
  },
  {
    ko: ['베르크', '알반 베르크'],
    en: ['berg', 'alban berg']
  },
  {
    ko: ['쇤베르크', '아르놀트 쇤베르크'],
    en: ['schoenberg', 'schönberg', 'arnold schoenberg']
  },

  // ── 주요 연주자 / 지휘자 (Artists & Conductors) ──
  {
    ko: ['파보 예르비', '예르비'],
    en: ['paavo jarvi', 'paavo järvi', 'jarvi', 'järvi']
  },
  {
    ko: ['손열음'],
    en: ['yeol eum son', 'yeoleum son', 'yeol-eum son']
  },
  {
    ko: ['조성진'],
    en: ['seong-jin cho', 'seongjin cho', 'seong jin cho', 'cho seong-jin']
  },
  {
    ko: ['임윤찬'],
    en: ['yunchan lim', 'lim yunchan', 'yun-chan lim']
  },
  {
    ko: ['클라라 주미 강', '주미 강'],
    en: ['clara-jumi kang', 'clara jumi kang', 'jumi kang']
  },
  {
    ko: ['양인모'],
    en: ['inmo yang', 'yang inmo', 'in-mo yang']
  },
  {
    ko: ['스미노 하야토', '카틴'],
    en: ['hayato sumino', 'sumino hayato', 'cateen']
  },
  {
    ko: ['율리우스 아살'],
    en: ['julius asal', 'asal']
  },
  {
    ko: ['정명훈'],
    en: ['myung-whun chung', 'myung whun chung', 'chung myung-whun']
  },
  {
    ko: ['김도윤'],
    en: ['doyun kim', 'do yun kim', 'kim doyun']
  },
  {
    ko: ['김규연'],
    en: ['kyu yeon kim', 'kyuyeon kim', 'kim kyuyeon']
  },
  {
    ko: ['김봄소리'],
    en: ['bomsori kim', 'bomsori']
  },
  {
    ko: ['백건우'],
    en: ['kun-woo paik', 'kun woo paik', 'paik kun-woo']
  },
  {
    ko: ['선우예권'],
    en: ['yekwon sunwoo', 'sunwoo yekwon']
  },
  {
    ko: ['문지영'],
    en: ['ji-yeong mun', 'jiyeong mun', 'chloe jiyeong mun']
  },
  {
    ko: ['박재홍'],
    en: ['jae hong park', 'jaehong park', 'park jaehong']
  },
  {
    ko: ['이혁'],
    en: ['hyuk lee', 'lee hyuk']
  },
  {
    ko: ['신창용'],
    en: ['changyong shin', 'shin changyong']
  },
  {
    ko: ['김선욱'],
    en: ['sunwook kim', 'kim sunwook']
  },
  {
    ko: ['박혜상'],
    en: ['hera hyesang park', 'hyesang park']
  },
  {
    ko: ['황수미'],
    en: ['sumi hwang', 'hwang sumi']
  },
  {
    ko: ['조수미'],
    en: ['sumi jo', 'jo sumi']
  },
  {
    ko: ['이선아'],
    en: ['seonah lee', 'seona lee', 'lee seonah']
  },
  {
    ko: ['이진화'],
    en: ['jinhwa lee', 'lee jinhwa']
  },
  {
    ko: ['이원해'],
    en: ['wonhae lee', 'lee wonhae']
  },
  {
    ko: ['김호정'],
    en: ['hojeong kim', 'kim hojeong']
  },
  {
    ko: ['사이먼 래틀', '래틀'],
    en: ['simon rattle', 'sir simon rattle', 'rattle']
  },
  {
    ko: ['클라우스 메켈레', '메켈레'],
    en: ['klaus makela', 'klaus mäkelä', 'makela', 'mäkelä']
  },
  {
    ko: ['다니엘 바렌보임', '바렌보임'],
    en: ['daniel barenboim', 'barenboim']
  },
  {
    ko: ['요요 마', '요요마'],
    en: ['yo-yo ma', 'yoyo ma']
  },
  {
    ko: ['미샤 마이스키'],
    en: ['mischa maisky', 'maisky']
  },
  {
    ko: ['고티에 카퓌송'],
    en: ['gautier capucon', 'gautier capuçon']
  },
  {
    ko: ['르노 카퓌송'],
    en: ['renaud capucon', 'renaud capuçon']
  },
  {
    ko: ['힐러리 한'],
    en: ['hilary hahn']
  },
  {
    ko: ['레이 첸'],
    en: ['ray chen']
  },

  // ── 악곡 형태 / 장르 (Musical Forms & Genres) ──
  {
    ko: ['교향곡', '심포니'],
    en: ['symphony', 'symphonies', 'sinfonia']
  },
  {
    ko: ['협주곡', '콘체르토'],
    en: ['concerto', 'concertos', 'concerti']
  },
  {
    ko: ['소나타'],
    en: ['sonata', 'sonatas']
  },
  {
    ko: ['실내악', '체임버'],
    en: ['chamber', 'chamber music']
  },
  {
    ko: ['사중주', '4중주', '콰르텟', '쿼텟'],
    en: ['quartet', 'string quartet']
  },
  {
    ko: ['오중주', '5중주', '퀸텟'],
    en: ['quintet']
  },
  {
    ko: ['삼중주', '3중주', '트리오'],
    en: ['trio', 'piano trio']
  },
  {
    ko: ['이중주', '2중주', '듀오'],
    en: ['duo']
  },
  {
    ko: ['무반주', '독주'],
    en: ['solo', 'unaccompanied']
  },
  {
    ko: ['모음곡', '조곡'],
    en: ['suite']
  },
  {
    ko: ['서곡'],
    en: ['overture']
  },
  {
    ko: ['전주곡', '프렐류드'],
    en: ['prelude', 'preludes']
  },
  {
    ko: ['야상곡', '녹턴'],
    en: ['nocturne', 'nocturnes']
  },
  {
    ko: ['발라드'],
    en: ['ballade', 'ballades']
  },
  {
    ko: ['스케르초'],
    en: ['scherzo']
  },
  {
    ko: ['연습곡', '에튀드'],
    en: ['etude', 'étude', 'etudes', 'études']
  },
  {
    ko: ['왈츠', '원무곡'],
    en: ['waltz', 'valse']
  },
  {
    ko: ['폴로네이즈', '폴로네즈'],
    en: ['polonaise']
  },
  {
    ko: ['마주르카'],
    en: ['mazurka']
  },
  {
    ko: ['즉흥곡'],
    en: ['impromptu']
  },
  {
    ko: ['환상곡', '판타지'],
    en: ['fantasy', 'fantasie', 'phantasie', 'fantaisie']
  },
  {
    ko: ['광시곡', '랩소디'],
    en: ['rhapsody']
  },
  {
    ko: ['변주곡'],
    en: ['variation', 'variations']
  },
  {
    ko: ['세레나데', '소야곡'],
    en: ['serenade']
  },
  {
    ko: ['디베르티멘토', '희유곡'],
    en: ['divertimento']
  },
  {
    ko: ['교향시'],
    en: ['symphonic poem', 'tone poem']
  },
  {
    ko: ['카프리치오', '기상곡'],
    en: ['capriccio']
  },
  {
    ko: ['로망스'],
    en: ['romance']
  },
  {
    ko: ['비가', '엘레지'],
    en: ['elegy', 'elegie', 'élégie']
  },
  {
    ko: ['자장가'],
    en: ['lullaby', 'berceuse']
  },
  {
    ko: ['간주곡'],
    en: ['intermezzo']
  },
  {
    ko: ['오페라'],
    en: ['opera']
  },
  {
    ko: ['오라토리오'],
    en: ['oratorio']
  },
  {
    ko: ['칸타타'],
    en: ['cantata']
  },
  {
    ko: ['레퀴엠', '진혼곡'],
    en: ['requiem']
  },
  {
    ko: ['합창', '합창단'],
    en: ['choral', 'choir', 'chorus']
  },
  {
    ko: ['리사이틀', '독주회'],
    en: ['recital']
  },
  {
    ko: ['독창회'],
    en: ['vocal recital']
  },

  // ── 주요 클래식 명작 (Masterpieces) ──
  {
    ko: ['사계'],
    en: ['four seasons', 'le quattro stagioni']
  },
  {
    ko: ['봄의 제전'],
    en: ['the rite of spring', 'rite of spring', 'le sacre du printemps']
  },
  {
    ko: ['불새'],
    en: ['the firebird', 'firebird', "l'oiseau de feu"]
  },
  {
    ko: ['페트루슈카', '페트루시카'],
    en: ['petrushka']
  },
  {
    ko: ['마술피리'],
    en: ['magic flute', 'die zauberflote', 'zauberflöte']
  },
  {
    ko: ['피가로의 결혼'],
    en: ['marriage of figaro', 'le nozze di figaro']
  },
  {
    ko: ['돈 조반니', '돈 지오반니'],
    en: ['don giovanni']
  },
  {
    ko: ['라 트라비아타'],
    en: ['la traviata']
  },
  {
    ko: ['투란도트'],
    en: ['turandot']
  },
  {
    ko: ['토스카'],
    en: ['tosca']
  },
  {
    ko: ['나비부인'],
    en: ['madama butterfly', 'madame butterfly']
  },
  {
    ko: ['라 보엠'],
    en: ['la boheme', 'la bohème']
  },
  {
    ko: ['메시아'],
    en: ['messiah']
  },
  {
    ko: ['카르멘'],
    en: ['carmen']
  },
  {
    ko: ['볼레로'],
    en: ['bolero', 'boléro']
  },
  {
    ko: ['달빛'],
    en: ['clair de lune']
  },
  {
    ko: ['전람회의 그림'],
    en: ['pictures at an exhibition']
  },
  {
    ko: ['셰에라자드', '세헤라자데'],
    en: ['scheherazade']
  },
  {
    ko: ['핀란디아'],
    en: ['finlandia']
  },
  {
    ko: ['카르미나 부라나'],
    en: ['carmina burana']
  },
  {
    ko: ['행성'],
    en: ['the planets', 'planets']
  },
  {
    ko: ['백조의 호수'],
    en: ['swan lake']
  },
  {
    ko: ['호두까기 인형'],
    en: ['nutcracker', 'the nutcracker']
  },
  {
    ko: ['잠자는 숲속의 미녀'],
    en: ['sleeping beauty']
  },
  {
    ko: ['신세계', '신세계 교향곡', '신세계로부터'],
    en: ['new world', 'from the new world']
  },
  {
    ko: ['미완성', '미완성 교향곡'],
    en: ['unfinished']
  },
  {
    ko: ['영웅', '에로이카'],
    en: ['eroica']
  },
  {
    ko: ['운명', '운명 교향곡'],
    en: ['fate', 'schicksal']
  },
  {
    ko: ['전원', '전원 교향곡'],
    en: ['pastoral', 'pastorale']
  },
  {
    ko: ['월광', '월광 소나타'],
    en: ['moonlight']
  },
  {
    ko: ['비창', '비창 소나타', '비창 교향곡'],
    en: ['pathetique', 'pathétique']
  },
  {
    ko: ['열정', '열정 소나타'],
    en: ['appassionata']
  },
  {
    ko: ['템페스트'],
    en: ['tempest']
  },
  {
    ko: ['크로이처'],
    en: ['kreutzer']
  },
  {
    ko: ['죽음과 소녀'],
    en: ['death and the maiden']
  },
  {
    ko: ['밤의 가스파르'],
    en: ['gaspard de la nuit']
  },
  {
    ko: ['죽음의 무도'],
    en: ['danse macabre']
  },
  {
    ko: ['동물의 사육제'],
    en: ['carnival of the animals', 'le carnaval des animaux']
  },

  // ── 악기 (Instruments) ──
  {
    ko: ['피아노', '피아니스트'],
    en: ['piano', 'pianist']
  },
  {
    ko: ['바이올린', '바이올리니스트'],
    en: ['violin', 'violinist']
  },
  {
    ko: ['첼로', '첼리스트'],
    en: ['cello', 'cellist']
  },
  {
    ko: ['비올라', '비올리스트'],
    en: ['viola', 'violist']
  },
  {
    ko: ['더블베이스', '콘트라베이스', '베이스'],
    en: ['double bass', 'contrabass', 'bass']
  },
  {
    ko: ['플루트', '플룻', '플루티스트'],
    en: ['flute', 'flutist']
  },
  {
    ko: ['오보에', '오보이스트'],
    en: ['oboe', 'oboist']
  },
  {
    ko: ['클라리넷', '클라리네티스트'],
    en: ['clarinet', 'clarinetist']
  },
  {
    ko: ['바순', '파곳'],
    en: ['bassoon', 'fagotto']
  },
  {
    ko: ['호른', '프렌치 호른', '호르니스트'],
    en: ['horn', 'french horn', 'hornist']
  },
  {
    ko: ['트럼펫', '트럼페터'],
    en: ['trumpet', 'trumpeter']
  },
  {
    ko: ['트롬본'],
    en: ['trombone']
  },
  {
    ko: ['튜바'],
    en: ['tuba']
  },
  {
    ko: ['팀파니'],
    en: ['timpani']
  },
  {
    ko: ['하프', '하피스트'],
    en: ['harp', 'harpist']
  },
  {
    ko: ['오르간', '오르가니스트'],
    en: ['organ', 'organist']
  },
  {
    ko: ['기타', '기타리스트'],
    en: ['guitar', 'guitarist']
  },
  {
    ko: ['하프시코드', '쳄발로'],
    en: ['harpsichord', 'cembalo']
  },
  {
    ko: ['오케스트라', '교향악단', '필하모닉', '관현악단'],
    en: ['orchestra', 'philharmonic', 'symphony orchestra']
  },

  // ── 주요 공연장 (Venues) ──
  {
    ko: ['예술의전당', '서초 예술의전당'],
    en: ['seoul arts center', 'sac']
  },
  {
    ko: ['롯데콘서트홀', '롯데홀'],
    en: ['lotte concert hall', 'lotte hall']
  },
  {
    ko: ['세종문화회관'],
    en: ['sejong center', 'sejong center for the performing arts']
  },
  {
    ko: ['부천아트센터'],
    en: ['bucheon arts center', 'bac']
  },
  {
    ko: ['금호아트홀', '금호아트홀 연세'],
    en: ['kumho art hall', 'kumho arthall yonsei']
  },
  {
    ko: ['대구콘서트하우스'],
    en: ['daegu concert house']
  },
  {
    ko: ['대전예술의전당'],
    en: ['daejeon arts center']
  },
  {
    ko: ['광주예술의전당'],
    en: ['gwangju arts center']
  },
  {
    ko: ['부산문화회관'],
    en: ['busan cultural center']
  },
  {
    ko: ['부산콘서트홀'],
    en: ['busan concert hall']
  },
  {
    ko: ['통영국제음악당'],
    en: ['tongyeong concert hall', 'timf']
  },
  {
    ko: ['아트센터인천', '아트센터 인천'],
    en: ['art center incheon', 'aci']
  },
  {
    ko: ['성남아트센터'],
    en: ['seongnam arts center']
  }
];

// 빠른 조회를 위한 전방위 인덱스 캐시 구축
const termToSynonymsMap = new Map();

BILINGUAL_DICTIONARY.forEach(entry => {
  const allTerms = [...entry.ko, ...entry.en];
  const normalizedTerms = allTerms.map(normalizeText).filter(Boolean);

  normalizedTerms.forEach(t => {
    let existing = termToSynonymsMap.get(t);
    if (!existing) {
      existing = new Set();
      termToSynonymsMap.set(t, existing);
    }
    normalizedTerms.forEach(syn => existing.add(syn));
  });
});

/**
 * 단일 토큰 또는 프레이즈의 대역어 목록 반환 (없으면 자기 자신만 포함)
 */
export function getSynonyms(term) {
  const norm = normalizeText(term);
  if (!norm) return [];
  const set = termToSynonymsMap.get(norm);
  if (set) {
    return Array.from(set);
  }
  // 부분 일치 탐색 (예: "chopin's" -> chopin, "쇼팽의" -> 쇼팽)
  for (const [key, synSet] of termToSynonymsMap.entries()) {
    if (norm === key || norm.startsWith(key) || key.startsWith(norm)) {
      if (key.length >= 2) {
        return Array.from(synSet);
      }
    }
  }
  return [norm];
}

/**
 * 텍스트 또는 텍스트 배열로부터 검색용 인덱스 텍스트 생성
 * (포함된 모든 한/영 단어의 대역어를 인덱스에 함께 주입하여 양방향 고속 탐색 보장)
 */
export function buildEnhancedSearchIndex(textOrArray) {
  const rawList = Array.isArray(textOrArray) ? textOrArray : [textOrArray];
  const combined = rawList.filter(Boolean).join(' ');
  const norm = normalizeText(combined);

  // 사전에 등록된 키워드가 포함되어 있다면 그 대역어들도 인덱스에 추가
  const extraSynonyms = new Set();
  for (const [key, synSet] of termToSynonymsMap.entries()) {
    if (key.length >= 2 && norm.includes(key)) {
      synSet.forEach(s => extraSynonyms.add(s));
    }
  }

  return `${norm} ${Array.from(extraSynonyms).join(' ')}`;
}

/**
 * 공연 객체의 전체 검색 가능 인덱스 텍스트 생성
 */
export function getConcertSearchIndex(concert) {
  if (!concert) return '';
  if (concert._searchIndex) return concert._searchIndex;

  const parts = [
    concert.title,
    (concert.composers || []).join(' '),
    (concert.performers || []).join(' '),
    (concert.pieces || []).join(' '),
    concert.venue,
    concert.hall,
    concert.city,
    concert.description
  ];

  const index = buildEnhancedSearchIndex(parts);
  // 객체에 캐싱 (성능 최적화)
  concert._searchIndex = index;
  return index;
}

/**
 * 양방향 한/영 교차 검색 매칭 함수
 * @param {object} concert - 공연 데이터 객체
 * @param {string} query - 사용자가 입력한 검색어
 * @returns {boolean} 일치 여부
 */
export function matchesBilingualConcert(concert, query) {
  if (!query || !query.trim()) return true;
  if (!concert) return false;

  const normQuery = normalizeText(query);
  const searchIndex = getConcertSearchIndex(concert);

  // 1. 단순 전체 문자열 직접 포함 검사 (가장 빠름)
  if (searchIndex.includes(normQuery)) {
    return true;
  }

  // 2. 검색어 자체의 전체 대역어 프레이즈 검사
  const querySynonyms = getSynonyms(normQuery);
  if (querySynonyms.some(syn => searchIndex.includes(syn))) {
    return true;
  }

  // 3. 공백으로 구분된 개별 검색 토큰 분할 (다단어 AND 조건)
  // 예: "chopin ballade" -> [chopin(쇼팽), ballade(발라드)] 둘 다 포함해야 참
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every(token => {
      // 직접 포함
      if (searchIndex.includes(token)) return true;
      // 토큰 대역어 중 하나라도 포함
      const tokenSyns = getSynonyms(token);
      return tokenSyns.some(s => searchIndex.includes(s));
    });

    if (allTokensMatch) {
      return true;
    }
  }

  return false;
}

/**
 * 공연 데이터 목록의 검색 인덱스를 백그라운드에서 1회 사전 생성하여
 * 검색 버튼 클릭 시 10ms 이내 초고속 즉시 응답 보장
 */
export function prewarmSearchIndex(concerts) {
  if (!Array.isArray(concerts)) return;
  for (let i = 0; i < concerts.length; i++) {
    getConcertSearchIndex(concerts[i]);
  }
}

export default {
  normalizeText,
  BILINGUAL_DICTIONARY,
  getSynonyms,
  buildEnhancedSearchIndex,
  getConcertSearchIndex,
  matchesBilingualConcert,
  prewarmSearchIndex
};
