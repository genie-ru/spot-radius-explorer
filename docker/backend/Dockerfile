# Nest.js（Node 24 / pnpm）。dev=ホットリロード / prod=distroless 非root。
FROM node:24-bookworm-slim AS deps
RUN corepack enable
WORKDIR /app
COPY services/backend/package.json services/backend/pnpm-lock.yaml services/backend/.npmrc ./
# lockfile と package.json のズレを検知して落とす（本番の再現性を担保）
RUN pnpm install --frozen-lockfile

FROM node:24-bookworm-slim AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/backend/ ./
RUN pnpm run build && pnpm prune --prod

# dev: ソースは compose の bind マウントで /app に入る。
# 生成物(node_modules 等)をホスト(ausbd=uid1000)所有にするため node ユーザー(uid/gid 1000)で
# 実行する。root のままだと root 所有ファイルが残り、ホスト側エディタが EACCES で保存できない。
# 名前指定(USER node)で HOME=/home/node が付き corepack/pnpm のストアも書ける。
FROM node:24-bookworm-slim AS dev
# nest start --watch(tsc-watch) は再起動時に tree-kill で旧プロセスを終了させるが、tree-kill は
# ps(procps) に依存する。slim には ps が無く、欠けると子プロセス(node)を kill できず orphan 化して
# 8080 を握り続け EADDRINUSE になる。dev のみ導入。
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends procps \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
RUN chown node:node /app
USER node
EXPOSE 8080
CMD ["sh", "-c", "pnpm install && pnpm run start:dev"]

# prod: distroless 非root（ENTRYPOINT=node）
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS prod
WORKDIR /app
USER 65532:65532
ENV NODE_ENV=production
COPY --from=builder --chown=65532:65532 /app/node_modules ./node_modules
COPY --from=builder --chown=65532:65532 /app/dist ./dist
COPY --from=builder --chown=65532:65532 /app/package.json ./
# 冪等シードが起動時に読む CSV（process.cwd()/seed/…）。dev は bind マウントで入るが prod は明示コピー。
COPY --from=builder --chown=65532:65532 /app/seed ./seed
EXPOSE 8080
CMD ["dist/main.js"]
