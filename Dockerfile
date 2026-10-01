# LUXIKO catalog — everything is configured from the admin panel after start.
#   docker compose up -d --build
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# better-sqlite3 and sharp ship prebuilt binaries, so no compiler is needed
RUN npm ci --ignore-scripts
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev && rm -rf .next/cache

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATA_DIR=/app/data \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build /app ./
RUN chmod +x docker/entrypoint.sh
VOLUME /app/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
