# [개발 표준 지침] 7-Gate 무결점 소프트웨어 개발 및 배포 품질 보증 시스템

본 저장소의 모든 코드 작성, 수정, 리팩토링 및 배포 작업은 아래 '7-Gate 품질 보증 시스템'을 의무적으로 준수해야 합니다.
모든 작업 완료 후에는 7개 게이트를 전수 검증하는 독립 자동화 테스트 스크립트(`qa_matrix_7gates`)를 작성 및 실행하여 7/7 (100%) 통과 증빙을 제출해야 합니다.

---

## [GATE 1] DOM 구조, 태그 무결성 및 사용자 인터페이스 정제 (Structure & Cleanliness)
1. **HTML/컴포넌트 태그 불일치 제로**: 닫히지 않은 태그, 중복 선언된 ID, 잘못된 부모-자식 태그 중첩 원천 차단.
2. **개발자 전문용어 노출 제로**: API 명칭(Gemini, OpenAI, Claude 등), 인프라 용어(API Key, Token, Payload, Regex, AST), DB 컬럼명, 영문 엔지니어링 약어를 일반 사용자 화면에 노출 금지. 직관적인 사용자 친화적 자연어로 번역 표기.
3. **중복/난잡한 아이콘 제로**: SVG 벡터 아이콘과 불필요한 이모지 중복 배치 배제, 단일 아이콘 및 타이포그래피 표준 준수.

## [GATE 2] 이벤트 리스너 및 미구현 요소 제로화 (Zero Dead-Button Policy)
1. **껍데기 버튼 제로**: 화면의 모든 클릭/터치 가능 요소(버튼, 링크, 탭, 드롭다운, 닫기 등)는 100% 실제 동작 함수에 바인딩. 무반응 또는 콘솔 에러 발생 절대 금지.
2. **모달 규격 준수**: 모든 모달 컨테이너는 최상위 오버레이 규격 준수, 열림/닫힘 및 ESC/배경 클릭 이벤트 완전 바인딩.
3. **반응형 줄바꿈 방지**: 모바일 및 좁은 뷰포트에서도 버튼 및 헤더 텍스트 줄바꿈 방지 레이아웃 안전장치(`flex-nowrap`, `shrink-0`, `truncate` 등) 필수 적용.

## [GATE 3] 동적 상태 동기화 및 도메인 규칙 완전성 (State Sync & Integrity)
1. **화면-데이터 100% 동기화**: 데이터 변경 시 화면 즉각 반영, 이전 상태 잔재 및 비동기화(Desync) 원천 차단.
2. **Mock 데이터 실제 로직 격리**: 임시 Mock/샘플 데이터가 실제 비즈니스 흐름(회원가입, 로그인 등)을 방해하거나 초기 화면에 오염 노출되지 않도록 격리.
3. **완전한 분기 대응**: 성공, 실패, 로딩, 데이터 없음(Empty), 권한 없음 등 모든 상태에 대응하는 UI 및 피드백 메시지 제공.

## [GATE 4] 시각 렌더링, 고대비 명도 및 글자 이탈 방지 아머 (Visual Render & Overflow Armor)
1. **글자 박스 이탈(Overflow) 원천 차단**:
   - 모든 카드, 뱃지, 안내 박스 내 텍스트는 좌우 최소 10px 이상 안전 여백(Margin) 확보.
   - 긴 텍스트/수식 분할 또는 충분한 너비 및 중앙 정렬(`text-anchor="middle"`) 적용.
2. **명도 충돌(Dark-on-Dark / White-on-White) 제로**:
   - 라이트 모드: 어두운 배경에 어두운 글씨 방지, 파스텔톤 밝은 배경 + 고대비 진한 텍스트로 WCAG 10:1 이상 명도 대비 보장.
   - 다크 모드: 어두운 바탕 + 선명한 발광성 밝은 텍스트 보장.

## [GATE 5] 풀스택 구문, 타입 및 런타임 컴파일 무결성 (Syntax & Runtime Compilation)
1. **런타임 오류 제로**: Syntax Error, 호이스팅 문제, TDZ, ReferenceError 원천 차단.
2. **엄격한 타입 안전성**: TypeScript/정적 분석 도구 사용 시 `any` 남발을 금지하고 엄격한 타입 정의 유지.

## [GATE 6] 데이터 파싱 및 외부 통신 다단계 내결함성 (Robust Crash-Proof Protocol)
1. **다단계 견고 파서(Robust Parser)**: 외부 API, AI 응답, JSON 파싱 시 따옴표 누락, 줄바꿈, 이스케이프 오류에 의한 무음 충돌(Silent Crash) 100% 방어.
2. **통신 실패 복구 프로토콜**: 네트워크 단절, 타임아웃 발생 시 친절한 안내 메시지, 재시도(Retry) 버튼 및 안전한 대체(Fallback) UI 제공.

## [GATE 7] 실사용자 시나리오 E2E 라이프사이클 시뮬레이션 (End-to-End Simulation)
1. **페르소나 & 뷰포트 전수 검증**: 주요 사용자 역할 및 반응형 환경(모바일, 데스크톱) 전 과정 시뮬레이션.
2. **라이프사이클 루프 검증**: 설정 변경, 권한 전환, 필터 선택 시 일관성 유지 검증.

---

## 작업 완료 시 의무 증빙 양식
```
[GATE 1 PASS] DOM Structure & Zero-Jargon Cleanliness
[GATE 2 PASS] Event Listeners & Zero-Dead-Button Integrity
[GATE 3 PASS] Dynamic State Synchronization & Domain Logic
[GATE 4 PASS] Visual Render Integrity, Contrast & Overflow Armor
[GATE 5 PASS] Fullstack Syntax & Runtime Compilation
[GATE 6 PASS] Crash-Proof Data Parsing & Robust Protocol
[GATE 7 PASS] End-to-End Lifecycle & Persona Simulation
최종 결과: 7-GATE 무결점 검증 7/7 (100%) 통과 완료
```
