FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY . .
RUN bun run build

FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

COPY --from=builder /app/build ./build
COPY server.js ./

ENV PORT=5173
EXPOSE 5173

CMD ["bun", "run", "server.js"]
