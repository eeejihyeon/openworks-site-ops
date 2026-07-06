# facility-mgmt 프로젝트 문서

건설 현장 설비관제 및 자산관리 백오피스 시스템

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기획 & 요구사항](#2-기획--요구사항)
3. [기능 목록](#3-기능-목록)
4. [AI 활용 방향](#4-ai-활용-방향)

---

## 1. 프로젝트 개요

### 프로젝트 목적

건설 현장에 배치되는 CCTV, 가스센서, DID, 방송장비 등 인프라 장비의 수명 주기(입고 → 출고준비 → 출고완료)를 추적하고, 현장·건설사·사용자 정보를 통합 관리하는 사내 백오피스입니다.

영업팀, 시공팀, 기술지원팀, 개발팀이 공통으로 사용하며, 현장별 요구사항·노선정보·시스템 운영정보까지 원스톱으로 기록합니다.

| 항목 | 수치 |
|------|------|
| 패키지 (모노레포) | 3개 |
| 화면 수 | 10개 |
| DB 테이블 | 12개 |
| REST API 엔드포인트 | 30+ |

### 기술 스택

#### 프론트엔드

| 영역 | 라이브러리 / 버전 |
|------|-----------------|
| Framework | React 19 + Vite 7 |
| Language | TypeScript 5.9 |
| Router | React Router 7 |
| Server State | TanStack Query 5 |
| Client State | Zustand 5 |
| Form | React Hook Form 7 + Zod 4 |
| Styling | Emotion 11 |
| Charts | Recharts 3 |
| Dashboard Layout | react-grid-layout 2 |
| Icons | Lucide React |
| Test | Vitest 3 + Playwright |

#### 백엔드 & 인프라

| 영역 | 라이브러리 / 도구 |
|------|-----------------|
| Runtime | Node.js ≥ 20 |
| Framework | Express 4 |
| Database | SQLite (better-sqlite3, WAL 모드) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Monorepo | pnpm 10 + TurboRepo 2 |
| Dev | tsx watch |
| Proxy | Vite /api → localhost:4000 |
| UI Package | @facility/ui (Emotion DS) |
| Storybook | 9.1 |

### 모노레포 구조

| 패키지 | 경로 | 역할 | 포트 |
|--------|------|------|------|
| @facility/web | apps/web | React SPA — 모든 화면 | 5173 |
| @facility/api | apps/api | Express REST API + SQLite | 4000 |
| @facility/ui | packages/ui | 공유 디자인 시스템 (Button, Table, Modal…) | — |

> **운영 방식**: 실제 SQLite 백엔드를 사용합니다. 초기에는 axios mock adapter로 개발했으며, `pnpm dev` 실행 시 web + api가 동시에 기동됩니다. Mock adapter는 레거시 폴백으로 main.tsx에서 한 줄 활성화 가능합니다.

---

## 2. 기획 & 요구사항

### 기획 배경

건설 현장마다 수십 종의 IoT/영상 장비가 배치되며, 스프레드시트로 관리하던 팀에서는 출고 이력 누락·장비 위치 혼동·현장 담당자 정보 분산 등의 문제가 반복되었습니다. 단일 백오피스를 통해 장비 상태의 **단일 진실 공급원(Single Source of Truth)** 을 확보하고, 팀 간 커뮤니케이션 비용을 줄이는 것이 핵심 목표입니다.

### 핵심 목표

| # | 목표 | 세부 내용 |
|---|------|----------|
| 1 | 장비 생애주기 추적 | 입고 → 출고준비 → 출고완료 상태 전환, 장비별 IP/포트·코드 관리 |
| 2 | 현장-건설사 연계 | 건설사 ↔ 현장 ↔ 장비 출고 관계를 일관된 데이터 모델로 연결 |
| 3 | 출고 워크플로 표준화 | 요청 → 출고준비 → 출고완료 단계별 담당자·날짜·수량 검증 |
| 4 | 현장 운영정보 집중화 | 요구사항, 노선정보, 시스템 운영정보를 현장 단위로 일괄 관리 |
| 5 | 권한 기반 접근 제어 | 관리자 / 일반 사용자 역할 구분 — 부서·장비분류 관리, 사용자 수정 제한 |

### 기능 요구사항

#### 인증 & 사용자 관리

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| AUTH-01 | 이메일/비밀번호 JWT 로그인 | P0 | 완료 |
| AUTH-02 | 토큰 만료 시 자동 로그아웃 (localStorage persist) | P0 | 완료 |
| AUTH-03 | 관리자만 부서 관리·전체 사용자 수정 가능 | P1 | 완료 |
| AUTH-04 | 일반 사용자는 본인 계정만 수정 가능 | P1 | 완료 |
| USER-01 | 사용자 CRUD (이름·부서·권한·사용여부) | P0 | 완료 |
| USER-02 | 추가 필드: 연락처, 직급, 이메일, 내선번호 (선택사항) | P1 | 완료 |
| USER-03 | 부서 마스터 CRUD (관리자 전용 모달) | P1 | 완료 |
| USER-04 | 사용자 목록 부서별 필터링 + 이름 검색 | P1 | 완료 |
| USER-05 | 비밀번호 변경 (수정 모달, 6자 이상, 미입력 시 변경 없음) | P1 | 완료 |

#### 건설사 관리

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| COMP-01 | 건설사 CRUD (건설사명 필수, 나머지 선택) | P0 | 완료 |
| COMP-02 | 담당자 정보(이름·연락처·이메일) '담당자 정보 추가' 토글 시 표시 | P1 | 완료 |
| COMP-03 | 로고 이미지 업로드 (88×88, 2MB 제한, base64 저장, 미리보기) | P2 | 완료 |
| COMP-04 | 브랜드 색상 최대 3개 등록 (native color picker, HEX 표시) | P2 | 완료 |
| COMP-05 | 건설사명 검색 (대소문자 무시) | P1 | 완료 |
| COMP-06 | 목록에서 로고 썸네일·브랜드 색상 dot 표시 | P2 | 완료 |

#### 현장 관리

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| SITE-01 | 현장 CRUD (현장명·건설사·주소·상태·날짜 등) | P0 | 완료 |
| SITE-02 | 현장 상태: 입찰대기 / 계약전 / 계약완료 / 종료 | P0 | 완료 |
| SITE-03 | 시스템 상태: 구축중 / 운영중 / 종료 (시스템 사용 여부 ON 시만 표시) | P0 | 완료 |
| SITE-04 | 시스템 정보: 도메인, 운영서버 IP, 개발 담당자 | P1 | 완료 |
| SITE-05 | 현장 담당자 최대 3명 동적 추가 (이름+연락처 행) | P1 | 완료 |
| SITE-06 | 영업 담당자 최대 3명 — 사용자 목록 Select 선택, 연락처 자동 입력 | P1 | 완료 |
| SITE-07 | 목록에서 '요구사항' 버튼 → 해당 현장 RequirementsPage 이동 | P1 | 완료 |
| SITE-08 | 목록에서 '시스템 관리' 버튼 → 해당 현장 SystemInfoPage 이동 | P1 | 완료 |
| SITE-09 | 카카오맵 주소 좌표 연동 | P2 | 미구현 |

#### 장비 마스터

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| EQ-01 | 장비 CRUD (장비명·분류·타입·코드·제조사·모델) | P0 | 완료 |
| EQ-02 | 장비 분류 마스터 CRUD (관리자 전용 모달) | P1 | 완료 |
| EQ-03 | 장비 타입: 분류별 preset 목록 Select (CCTV → 이동형/고정형/대차형 등) | P1 | 완료 |
| EQ-04 | 장비 코드 자동 생성: {분류키}-{타입키}-{순번3자리}, '직접 입력' 체크 시 수동 입력 | P1 | 완료 |
| EQ-05 | IP/PORT 입력, 목록에서 연결 링크 클릭 시 새 탭 오픈 | P1 | 완료 |
| EQ-06 | 장비 상태: 입고 / 출고준비 / 출고완료 | P0 | 완료 |
| EQ-07 | 목록 행 클릭 시 아코디언 확장 → IP/PORT, 비고, 출고 완료 시 출고일·현장명 표시 | P1 | 완료 |
| EQ-08 | 목록 분류·상태 필터 | P1 | 완료 |
| EQ-09 | 타입 컬럼 분리 표시 (분류 옆에 타입 별도 컬럼) | P1 | 완료 |
| EQ-10 | 출고 연결 데이터 있는 장비는 상태 변경 불가 (수정 모달 비활성) | P1 | 완료 |

#### 출고 관리

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| SHIP-01 | 출고 CRUD | P0 | 완료 |
| SHIP-02 | 출고 상태 3단계: 요청 / 출고준비 / 출고완료 | P0 | 완료 |
| SHIP-03 | 요청 상태: 요청 담당자 + 납품 요청일 + 출고 요청 항목(분류·타입·수량) 입력 | P0 | 완료 |
| SHIP-04 | 출고 요청 항목은 분류+타입 중복 없이 행 추가, 수량 입력 | P0 | 완료 |
| SHIP-05 | 출고준비 상태: 요청 필드 비활성화, 출고 담당자 + 장비 카테고리 탭 UI 활성화 | P0 | 완료 |
| SHIP-06 | 장비 탭: 카테고리별 탭 → 해당 분류 장비 Select, 행 수 = 출고 수량 | P0 | 완료 |
| SHIP-07 | 출고 장비: 이미 출고완료 상태인 장비 선택 불가 | P1 | 완료 |
| SHIP-08 | 출고 담당자·납품 담당자는 사용자 목록 Select 선택 | P1 | 완료 |
| SHIP-09 | 출고완료 상태: 납품 담당자 지정, 요청 수량과 실제 장비 수량 불일치 시 에러 표시 | P0 | 완료 |
| SHIP-10 | 요청일·준비일·완료일 상태 변경 시 자동 타임스탬프 기록 | P1 | 완료 |
| SHIP-11 | 납품 요청일 1일 이내·당일·지남 시 빨간색 강조 + ⚠ 표시 (완료되면 정상 색) | P1 | 완료 |
| SHIP-12 | 목록에서 요청 상태 항목 항상 최상단 정렬 | P1 | 완료 |
| SHIP-13 | 출고완료 처리 시 연결된 장비 상태 자동 '출고완료' 변경 | P0 | 완료 |
| SHIP-14 | 출고 현황 대시보드: 장비 종류별 수량 막대 차트 + 분류 비중 도넛 차트 | P1 | 완료 |
| SHIP-15 | 대시보드 SSE mock 5초 간격 갱신, 실시간 연결 상태 표시 | P2 | 완료 (mock) |
| SHIP-16 | SSE 서버 엔드포인트 실제 구현 | P2 | 미구현 |

#### 현장 운영정보 & 시스템

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| REQ-01 | 현장 선택 후 요구사항 동적 행 추가/삭제/저장 (제목+상세) | P1 | 완료 |
| REQ-02 | 노선정보 동적 행 추가/삭제/저장 (노선명·위치·장비분류·비고) | P1 | 완료 |
| SYS-01 | 현장별 시스템 운영정보 저장 (운영내용·개발사구분·개발사명) | P1 | 완료 |

#### UI/UX & 디자인

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|----------|------|
| UI-01 | 화이트 베이스 + 블루 포인트 컬러 톤온톤 디자인 시스템 | P1 | 완료 |
| UI-02 | 사이드바 아이콘 전용 네비게이션 (Lucide 아이콘) | P1 | 완료 |
| UI-03 | 사이드바 메뉴 호버 시 툴팁으로 메뉴명 표시 | P1 | 완료 |
| UI-04 | 출고 차트 색상: 화이트~포인트 블루 그라데이션 팔레트 | P2 | 완료 |
| UI-05 | 대시보드 KPI 카드 drag-resize 레이아웃 (react-grid-layout) | P2 | 완료 |

### 비기능 요구사항

| 분류 | 요구사항 |
|------|----------|
| 보안 | JWT Bearer 토큰, bcrypt 비밀번호 해싱, CORS 설정, 관리자 권한 분리 |
| 성능 | SQLite WAL 모드, TanStack Query 캐싱, React.lazy 코드 스플리팅 |
| 유지보수 | pnpm + Turbo 모노레포, ESLint flat config, strict TypeScript |
| 테스트 | Vitest 단위 테스트, Playwright E2E, Storybook 컴포넌트 문서 |
| 확장성 | Mock adapter 폴백 레이어로 API 없이 개발 가능 (registerMockAdapter) |

---

## 3. 기능 목록

### 화면 & 라우트

| 경로 | 페이지 | 주요 기능 |
|------|--------|----------|
| /login | LoginPage | JWT 로그인, 에러 메시지, autoFocus |
| / | HomePage | KPI 카드 4종 (drag-resize), 현장 상태 분포 바, 최근 출고 5건 |
| /users | UsersListPage | 사용자 테이블, 부서/이름 필터, 권한 기반 수정·삭제, 부서 관리 모달 |
| /companies | CompaniesListPage | 건설사 테이블, 로고·색상 dot 표시, 이름 검색, CRUD 모달 |
| /sites | SitesListPage | 현장 테이블, 상태 배지, 요구사항/시스템 이동 버튼, CRUD 모달 |
| /equipment | EquipmentListPage | 장비 테이블, 아코디언 확장, 분류·상태 필터, 연결 링크, CRUD 모달 |
| /shipments | ShipmentsListPage | 출고 목록, 3단계 워크플로 상태 관리, 긴급 납품일 표시, 요청 최상단 정렬 |
| /shipments/dashboard | ShipmentDashboardPage | 막대 차트 + 도넛 차트, SSE mock 실시간 갱신 |
| /requirements | RequirementsPage | 현장별 요구사항 + 노선정보 동적 행 편집 |
| /system | SystemInfoPage | 현장별 시스템 운영정보 편집 |

### 특수 UI 기능

| 기능 | 위치 | 구현 방식 |
|------|------|----------|
| 드래그 앤 드롭 레이아웃 | HomePage KPI 카드 | react-grid-layout ResponsiveGridLayout |
| 차트 (막대·도넛) | ShipmentDashboardPage | Recharts BarChart + PieChart, 커스텀 색상 팔레트 |
| SSE 실시간 갱신 | ShipmentDashboardPage | useServerSentEvents hook, mock 5초 간격 |
| 네이티브 색상 피커 | CompanyFormModal | input type=color, 최대 3개, HEX 표시 |
| 로고 이미지 업로드 | CompanyFormModal | FileReader → base64, 2MB 제한, 미리보기 |
| 아코디언 테이블 행 | EquipmentListPage | 행 클릭 → chevron 회전 + 확장 패널 |
| 장비 카테고리 탭 UI | ShipmentFormModal | 분류별 탭 전환, 탭별 장비 Select 행 추가 |
| 동적 필드 배열 | SiteFormModal, ShipmentFormModal, RequirementsPage | 최대 3개 행, 추가/삭제 버튼 |
| 긴급 납품일 경고 | ShipmentsListPage | 1일 이내/당일/지남 → 빨간 bold + ⚠ (완료 시 정상) |
| 원격 연결 링크 | EquipmentListPage | http://ip:port 새 탭 오픈 |
| 장비 코드 자동 생성 | EquipmentFormModal | {분류키}-{타입키}-{순번} 패턴, 직접 입력 토글 |
| 수량 매칭 검증 | ShipmentFormModal | 출고완료 시 요청 수량 vs 실제 장비 수 불일치 에러 목록 |
| 영업담당자 연락처 자동입력 | SiteFormModal | 사용자 Select 선택 → 등록된 연락처 자동 fill |
| 권한 기반 버튼 제어 | UsersListPage, EquipmentListPage | isAdmin() + 본인 여부 체크 |

### 출고 워크플로 상태머신

| 상태 | 활성 필드 | 장비 상태 변경 |
|------|----------|--------------|
| 요청 | 요청담당자, 납품요청일, 출고요청항목(분류·타입·수량) | — (입고 유지) |
| 출고준비 | + 출고담당자, 장비 카테고리 탭 (요청 필드 비활성) | 출고준비로 변경 |
| 출고완료 | + 납품담당자, 수량 매칭 검증 (미일치 시 저장 차단) | 출고완료 자동 변경 |

### DB 테이블 목록

| 테이블 | PK | 주요 컬럼 |
|--------|-----|----------|
| departments | id | name |
| users | USR-hex | name, department, role, active, phone, position, email, extension, password_hash |
| companies | CO-hex | name, contactName/Phone/Email, address, active, logoUrl, colors(JSON) |
| sites | ST-hex | companyId, address, status, siteManagers(JSON), salesManagers(JSON), systemActive, systemStatus, systemDomain, systemServerIp, systemDeveloper |
| equipment_categories | EC-hex | name |
| equipment | EQ-hex | code, category, equipmentType, manufacturer, model, ip, port, status |
| shipments | SH-hex | shipmentNo, siteId, status, requesterName, deliveryRequestedAt, requestedAt, preparedAt, completedAt, shipperName, delivererName, note |
| shipment_items | SI-hex | shipmentId(FK), equipmentId(FK) |
| shipment_request_items | SRI-hex | shipmentId(FK), category, equipmentType, quantity |
| site_requirements | SR-hex | siteId, title, detail |
| site_routes | SRT-hex | siteId, routeName, location, equipmentCategory, note |
| system_infos | siteId(PK) | operationInfo, developerType, developerName |

---

## 4. AI 활용 방향

### 4-1. 활용 개요

Cursor IDE + Claude AI를 활용해 총 **6개 채팅 세션**에 걸쳐 프로젝트를 구축했습니다.

| 항목 | 수치 |
|------|------|
| 채팅 세션 수 | 6개 |
| 유저 프롬프트 수 | 40+ |
| 구현된 화면 | 10개 |
| 직접 작성 코드 비율 | ~0% |

### 세션별 작업 요약

| 세션 | 주요 작업 내용 | 프롬프트 유형 |
|------|--------------|-------------|
| 세션 1 | 사용자 관리 (부서 관리, 필터, 추가 필드) → 건설사 관리 (로고, 색상, 검색) → 장비 마스터 (종류 관리, IP, 아코디언, 상태, 필터) → 현장 관리 (담당자, 시스템 상태 분리) | 기능 명세형 |
| 세션 2 | 전체 디자인 개선 (화이트+블루 톤온톤) → 그래프 색상 → 사이드바 버그 수정 → 사이드바 아이콘화 + 툴팁 → 레이아웃 버그 수정 → 장비 아코디언 UI 개선 | 디자인 지시형 + 버그 페이스트형 |
| 세션 3 | 현장 담당자/영업 담당자 최대 3명 동적 추가 | 단일 기능 추가형 |
| 세션 4 | 출고 관리 (카테고리 탭, 담당자 Select) → 스크롤 제거·중복 선택 차단 → 장비 코드 자동 생성 + 타입 preset → 장비 수정 시 상태 변경 차단 + 타입 컬럼 분리 → 출고 소계/리스트 UI 개선 → 출고완료 시 장비 상태 자동 변경 | 기능 명세형 + 단일 기능 추가형 혼합 |
| 세션 5 | 목데이터 이슈 확인 → 백엔드 구축 여부 상담 → Express+SQLite 백엔드 전체 구축 → JWT 인증 → 권한 기반 사용자 수정 → 비밀번호 변경 버그 → ZodError 버그 | 아키텍처 상담형 + 버그 페이스트형 |
| 세션 6 | 출고 현황 차트 오류 수정 → 출고완료 장비 선택 차단 → 출고 상태 3단계 워크플로 전체 재설계 → StatusBadge 런타임 에러 → 납품 요청일 + 긴급 표시 → 수량 매칭 검증 → 요청 상태 최상단 정렬 → 500 에러 수정 → 목데이터 롤백 원인 → 계약확정→완료 변경 후 오류 | 기능 명세형 + 버그 페이스트형 혼합 |

---

### 4-2. 프롬프트 패턴 분류

실제 대화 기록에서 추출한 4가지 유형입니다.

#### 유형 1 — 페이지별 기능 명세형 (가장 많이 사용)

페이지를 지정하고, 필요한 기능들을 `**` 또는 `-` 로 구분해서 나열하는 방식입니다. 한 번의 프롬프트에 여러 기능을 묶어서 요청했습니다.

**실제 프롬프트 예시 (사용자 관리)**
```
먼저 사용자 관리 페이지야. 여기에서는 지금 사용자 정보 자체만 다루고 있는데,
여기서 사용자를 구성하는 부서 관리, 사용자 필터링 버튼이 필요해.

** 부서 관리
 이 부서 관리 패널은 관리자 권한일 경우에만 우측 상단에 부서관리 패널 활성화를 할 수
있는 버튼을 통해 보여지게 되고, 페이지 이동 또는 모달 형태 등 UX가 좋은 쪽으로 생성

** 사용자 관련
- 사용자 정보에 다음과 같은 사항 입력 추가해 주는데, 이건 필수 사항이 아니야.
  연락처, 직급, 이메일, 내선 번호
- 사용자 목록에 조회되는 데이터는 필터링을 할 수 있어야 해.
  부서별 필터링과 이름 검색창 패널을 추가
```

→ AI가 한 번에 DepartmentModal 컴포넌트 생성, 권한 분기 로직, 추가 필드 4개, 필터 UI를 모두 구현했습니다.

---

#### 유형 2 — 단일 기능 추가형

이미 구현된 페이지에서 한 가지 기능만 짧게 추가 요청하는 방식입니다.

| 프롬프트 | 처리 결과 |
|----------|----------|
| 장비 마스터 필터링에 분류도 추가해줘 | Toolbar에 카테고리 Select 필터 추가 |
| 출고 장비 탭 스크롤 없애주고, 이미 선택된 장비 선택 불가하게 해줘 | CSS 수정 + 중복 선택 방지 로직 |
| 현장 등록/수정 시 현장, 영업 담당자를 최대 3개까지 추가할 수 있었으면 좋겠어 | 동적 배열 필드 + 최대 3개 제한 로직 |
| 출고 관리에서 출고된 장비는 장비 마스터에서 출고완료로 상태 변경 자동으로 되면 좋겠어 | PUT /equipment/:id 자동 호출 로직 추가 |
| 장비 수정 시 연결된 출고 정보 데이터가 있다면 상태 변경을 못하게 막아줘 | hasShipmentData prop + 상태 Select disabled 처리 |

---

#### 유형 3 — 에러 메시지 페이스트형

브라우저 콘솔에서 에러를 복사해서 붙여넣으면 AI가 원인을 찾아 수정했습니다. 별도 설명 없이 에러만 붙여넣는 방식이 대부분이었습니다.

| 붙여넣은 에러 | 원인 & 해결 |
|-------------|------------|
| `TypeError: Cannot read properties of undefined (reading 'bg') at StatusBadge` | shipment.status 값이 statusColorMap에 없는 값 → 기본값 처리 추가 |
| `ZodError: Invalid option: expected one of '관리자'\|'일반' at role` | API 응답의 role 필드가 다른 타입으로 내려옴 → Zod transform 수정 |
| `POST http://localhost:5173/api/shipments 500 Internal Server Error` | shipment_request_items INSERT 쿼리 컬럼 불일치 → db.ts 수정 |
| `Cannot destructure property 'fg' of 'statusColor[status]' as it is undefined` | '계약확정' → '계약완료' 변경 후 StatusPill 색상 맵 미업데이트 → theme.ts 동기화 |
| 비밀번호 바꿔서 수정 저장하면 바꾼 비번으로 로그인 안 되는데 | PUT /users/:id에서 newPassword 있을 때 bcrypt.hash 누락 → 해싱 로직 추가 |

---

#### 유형 4 — 아키텍처 상담형

구현 방향이나 비용을 먼저 확인하고 나서 실제 구현을 지시한 방식입니다.

| 프롬프트 | 흐름 |
|----------|------|
| 지금 CRUD 하고 새로고침 하면 목데이터로 돌아오는 거 같은데 맞아? | → 확인 후 '백엔드 서버 연동하려면 시간 많이 들어?' 질문으로 이어짐 |
| Node.js + Express/Fastify로 해서 너가 서버 구축하는 건 오래 걸려? | → 비용·기간 확인 → Express + SQLite 백엔드 전체 구축 지시 |

→ 이 두 번의 질의 이후 Express 서버, SQLite 스키마, JWT 인증, 전체 REST API, 시드 데이터까지 한 세션에 완성되었습니다.

---

### 4-3. 자체 구현 vs AI 보조 구현 비교

> 아래 추정치는 프로젝트 규모(30+ REST 엔드포인트, 10개 화면, 7개 모달, 복잡한 상태 워크플로)와 일반적인 숙련 개발자 기준 작업 시간을 바탕으로 추정한 것입니다.

| 작업 항목 | 자체 구현 예상 | AI 활용 실제 | 절감률 |
|----------|-------------|------------|--------|
| Express + SQLite 백엔드 전체 구축 (스키마 12개, API 30+, JWT, 시드) | 3~5일 | 1 세션 (~2시간) | 약 90% |
| 출고 3단계 워크플로 상태머신 (폼 분기, 타임스탬프, 수량 검증) | 2~3일 | 4~5개 프롬프트 (~1시간) | 약 85% |
| 장비 코드 자동 생성 로직 (분류·타입·순번 조합, 직접 입력 토글) | 반나절 | 1 프롬프트 (~10분) | 약 95% |
| 건설사 로고 업로드 + 색상 피커 (base64, 미리보기, 2MB 제한) | 반나절 | 1 프롬프트 (~10분) | 약 95% |
| 전체 디자인 시스템 재정비 (화이트+블루 팔레트, 사이드바 아이콘화) | 1~2일 | 3~4 프롬프트 (~30분) | 약 90% |
| 런타임 에러 5건 디버깅 (ZodError, StatusBadge undefined 등) | 30분~2시간/건 | 에러 붙여넣기 → 즉시 수정 | 약 80% |
| 현장 담당자 동적 배열 (최대 3명) | 반나절 | 1 프롬프트 (~10분) | 약 95% |
| 출고 현황 Recharts 차트 (막대 + 도넛, 커스텀 색상) | 반나절 | 2 프롬프트 (~20분) | 약 85% |

### AI 활용의 실제 효과

#### 잘 작동한 영역

**반복적 CRUD 패턴**
사용자, 건설사, 현장, 장비 — 동일한 스키마→API→Query→Modal 패턴을 첫 번째 페이지가 완성되면 이후 페이지는 한 프롬프트로 90% 완성됐습니다.

**에러 메시지 기반 디버깅**
스택 트레이스를 그대로 붙여넣으면 원인 분석 + 코드 수정까지 즉시 처리됩니다. 특히 타입 불일치, undefined 접근, API 500 에러에서 효과가 컸습니다.

**복잡한 UI 상태 로직**
출고 워크플로처럼 상태에 따라 필드가 동적으로 바뀌는 복잡한 폼은, 요구사항을 자연어로 서술하면 분기 로직·disabled 처리·자동 타임스탬프까지 한 번에 처리됩니다.

#### 한계 및 주의점

**여러 파일 간 동기화 누락**
'계약확정 → 계약완료' 단어 변경 시 StatusPill 색상 맵이 동기화되지 않아 런타임 에러가 발생했습니다. 이름 변경처럼 전파 범위가 넓은 작업은 사후 검토가 필요합니다.

**Mock → 실서버 전환 후 데이터 일관성**
백엔드 전환 후 일부 화면에서 목데이터로 롤백되는 현상이 발생했습니다. 데이터 레이어 전환 시 전체 흐름을 명시적으로 지시해야 합니다.

**디자인 세부 취향 조율**
"끔찍해", "촌스럽지 않게" 같은 주관적 표현은 방향만 잡히고 세부 결과물은 1~2번의 추가 피드백이 필요했습니다.

### 효율적인 프롬프트 작성 패턴 (이 프로젝트에서 검증됨)

| 패턴 | 설명 | 예시 |
|------|------|------|
| 도메인 + 항목 나열 | 대상 페이지를 먼저 선언하고, 필요한 기능을 `**` 또는 `-` 로 구분해서 나열 | `이번엔 장비 마스터 페이지야. - 장비 종류 관리 버튼 및 모달 - IP, PORT 입력 추가 - 아코디언 row` |
| 상태 기반 동작 명세 | if/then 형태로 조건과 결과를 명시 | `요청 상태로 선택 시 출고 담당자 대신 요청 담당자만 보여주고, 출고 준비 상태로 바꾸면 요청 필드는 비활성화하고 출고 장비 활성화` |
| 에러 전문 붙여넣기 | 설명 없이 에러 스택 트레이스만 붙여넣어도 충분히 처리됨 | `installHook.js:1 TypeError: Cannot read properties of undefined...` |
| 비용/방향 먼저 확인 | 큰 아키텍처 변경 전 시간·복잡도를 물어본 뒤 진행 | `백엔드 서버 연동하려면 시간 많이 들어? / 오래 걸려?` |
