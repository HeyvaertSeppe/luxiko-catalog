FROM node:22-bookworm-slim AS build
WORKDIR /app
# Build tools, only used if no prebuilt better-sqlite3 binary is available
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 DATA_DIR=/app/data PORT=3000
COPY --from=build /app ./
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME /app/data
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
