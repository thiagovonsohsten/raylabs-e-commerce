# Backend multi-stage Dockerfile.
# Stage 1: build (instala devDeps, gera Prisma Client, compila TS)
# Stage 2: runtime (apenas deps de produção + dist + Prisma)

FROM node:20-bullseye-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY tsconfig*.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:20-bullseye-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev --no-audit --no-fund && \
    npx prisma generate

COPY --from=builder /app/dist ./dist

# A imagem é compartilhada entre api e workers — o command em docker-compose
# decide qual entrypoint executar.
CMD ["node", "dist/main/bootstrap-api.js"]
