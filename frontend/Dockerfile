# Frontend antrianMadani (Vite + React). Tahap build menghasilkan berkas statis, lalu dilayani nginx
# yang juga mem-proxy API & SSE ke backend (lihat nginx.conf), sehingga TV cukup tahu satu alamat:port.
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# "/" = backend di origin yang sama (di-proxy nginx). Lihat src/lib/api.ts.
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
