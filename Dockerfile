FROM node:20-slim

# better-sqlite3 네이티브 모듈 컴파일 도구
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10

WORKDIR /app

# 의존성 파일 먼저 복사
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# 의존성 설치 + better-sqlite3 명시적 재빌드
RUN pnpm install --no-frozen-lockfile
RUN pnpm rebuild better-sqlite3

# 소스 복사 후 빌드
COPY . .
RUN pnpm build

# 서버 시작 확인용 진단 출력 포함
CMD node -e "console.log('Node:', process.version, '| CWD:', process.cwd()); require('./apps/api/dist/index.js')"
