# Backend antrianMadani (Express + Sequelize). Dua tahap: build TypeScript, lalu image runtime ramping.
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:22-alpine
# tzdata: supaya TZ=Asia/Makassar dihormati (jadwal "hari ini", jam praktik, filter hanya hari ini)
RUN apk add --no-cache tzdata
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
# Folder cache MP3 dan foto; keduanya dipasang sebagai volume oleh compose
RUN mkdir -p /data/suara /data/foto && chown -R node:node /data /app
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
