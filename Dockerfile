FROM node:20-bookworm-slim

# better-sqlite3 네이티브 컴파일 도구
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# 소스에서 강제 빌드 (prebuild 바이너리 의존 금지)
ENV npm_config_build_from_source=true

RUN pnpm install --frozen-lockfile \
  && pnpm rebuild better-sqlite3 \
  && BINDING="$(find /app/node_modules -name 'better_sqlite3.node' | head -n 1)" \
  && echo "Found binding: $BINDING" \
  && test -n "$BINDING" \
  && cd apps/api \
  && node -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); console.log('better-sqlite3 runtime ok'); db.close();"

COPY . .
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
