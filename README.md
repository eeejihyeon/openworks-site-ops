# 설비관제 · 자산관리 시스템 (facility-mgmt)

CCTV / 가스센서 / DID / 방송장비 등 인프라 장비를 다루는 사내 관제·자산관리 백오피스입니다.
사용자/건설사/현장/장비/출고를 관리하고, 현장별 시스템 요구사항과 운영 정보를 기록합니다.

## 기술 스택

| 영역              | 사용 라이브러리                                 |
| ----------------- | ----------------------------------------------- |
| Language          | TypeScript 5.9                                  |
| Framework         | React 19.2                                      |
| Build Tool        | Vite 7.2                                        |
| Router            | React Router 7.9                                |
| Server State      | TanStack Query 5.90                             |
| Client State      | Zustand 5.0                                     |
| Form              | React Hook Form 7.65 + Zod 4.0                  |
| Styling           | Emotion 11.14                                   |
| Component / Table | 자체 DS (`packages/ui`)                         |
| Chart             | Recharts 3.8                                    |
| Grid              | react-grid-layout 2.2                           |
| Date              | Day.js 1.11                                     |
| HTTP Client       | axios 1.13                                      |
| Realtime          | SSE (`src/lib/sse.ts`)                          |
| Test              | Vitest 3.2, Testing Library 16, Playwright 1.56 |
| Monorepo          | TurboRepo + pnpm workspace                      |
| Lint/Format       | ESLint 9, Prettier 3.6, eslint-plugin-import    |
| Docs              | Storybook 9.1                                   |

## 폴더 구조

```
facility-mgmt/
├─ apps/
│  └─ web/                 # 실제 서비스 (Vite + React)
│     ├─ src/app/          # 라우터, 레이아웃(사이드바/헤더)
│     ├─ src/features/     # 도메인별 모듈 (아래 참고)
│     ├─ src/lib/          # axios, react-query client, mock adapter, SSE
│     ├─ src/store/        # zustand 스토어 (인증 세션, UI 상태)
│     └─ e2e/               # Playwright e2e 테스트
└─ packages/
   └─ ui/                  # 자체 디자인 시스템 (Table/Button/Modal/StatusPill 등)
```

### features 디렉토리 (도메인 = 요구사항 스펙과 1:1 매핑)

- `users` — 사용자 관리 (이름/부서/권한/사용여부)
- `companies` — 건설사 관리 (담당자/연락처/이메일/주소/사용여부/등록·수정일)
- `sites` — 현장 관리 (건설사 연결, 현장 상태, 담당자, 시스템 사용여부)
- `equipment` — 장비 마스터 (장비코드/분류/제조사/모델)
- `shipments` — 출고 관리 + 출고 현황 대시보드(종류별 수량 차트 · 출고 이력 · 실시간 갱신)
- `requirements` — 시스템 요구사항 (현장정보, 요구사항 명세, 노선정보 row 추가)
- `system` — 시스템 관리 (운영 정보, 개발사 구분)

각 feature는 `schema.ts`(zod) → `api.ts`(axios) → `queries.ts`(react-query) → `pages/*.tsx` 순서로 계층화되어 있습니다.

## 백엔드 연동 전 개발 방법

현재는 실제 API 서버 없이도 `pnpm dev`만으로 전체 화면을 확인할 수 있도록,
`src/lib/mock/adapter.ts`가 axios 요청을 가로채 인메모리 데이터로 응답합니다.

실제 백엔드가 준비되면 `src/main.tsx`의 `registerMockAdapter()` 호출 한 줄만 제거하면 됩니다.
(`api.ts`들은 이미 실제 REST 규약(`GET/POST/PUT/DELETE /api/...`)으로 작성되어 있어 별도 수정이 필요 없습니다.)

## 시작하기

```bash
pnpm install
pnpm dev            # apps/web 개발 서버 (http://localhost:5173)
pnpm build           # 전체 빌드
pnpm lint            # ESLint
pnpm test            # Vitest 단위 테스트
pnpm test:e2e        # Playwright e2e
pnpm storybook       # 자체 DS 컴포넌트 문서 (packages/ui)
```

## 디자인 방향

관제실 콘솔을 모티프로, 딥네이비(`#182849`) + 시그널 틸(`#0EA5A0`, 가동 상태 표시) 팔레트를 사용합니다.
장비코드·출고번호 같은 식별자는 모노스페이스 서체와 브래킷 태그(`CCTV-IPC-200`)로 표기해
실물 자산 라벨을 붙인 듯한 느낌을 주는 것이 이 디자인 시스템의 시그니처입니다.
토큰은 `packages/ui/src/theme.ts`에 정의되어 있습니다.

## 남은 작업 (실서비스 전환 시)

- 실제 백엔드 API 연동 (`registerMockAdapter()` 제거)
- 로그인/인증 플로우 (`store/authStore.ts`는 세션 형태만 정의됨)
- 카카오맵 연동 (현장 주소 좌표 표시) — 아직 미구현, `sites` 상세 화면에 추가 예정
- 권한(관리자/일반)에 따른 메뉴·액션 노출 제어
