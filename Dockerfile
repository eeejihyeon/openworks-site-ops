FROM node:20-slim

# better-sqlite3 네이티브 모듈 컴파일에 필요한 빌드 도구
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10

WORKDIR /app

# 의존성 파일 먼저 복사 (레이어 캐시 활용)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# pnpm install 시 better-sqlite3가 Linux용으로 컴파일됨
RUN pnpm install --frozen-lockfile

# 소스 전체 복사 후 빌드
COPY . .
RUN pnpm build

EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
