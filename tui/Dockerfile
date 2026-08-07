# Dark Clawd sandbox image for Fly Machines / local Docker
# Deploy: fly apps create dark-clawd-sandbox && fly deploy
FROM oven/bun:1.2-alpine AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY tsconfig.json ./
COPY src ./src
COPY install.sh ./
RUN bun run build && bun run build:lib

FROM oven/bun:1.2-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=18790
ENV CLAWD_SANDBOX_MODE=fly
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/install.sh ./install.sh
EXPOSE 18790
# Alpine image may not ship wget; probe with bun fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:18790/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "run", "dist/cli.js", "sandbox", "--port", "18790", "--host", "0.0.0.0"]
