# ---- build: full toolchain (TypeScript, Tailwind) ----
FROM node:22-slim AS build
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev
COPY . .
# public/ is empty in the repo, and git does not keep empty folders, so make sure it exists for the copy below
RUN mkdir -p public
# keep the build well under the host's memory limit (see next.config.ts)
ENV NODE_OPTIONS=--max-old-space-size=3072
RUN npx prisma generate && npm run build

# ---- runtime: production dependencies only (no test runners, linters or test files) ----
FROM node:22-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Playwright is an optional peer of Next, so npm installs it even without dev dependencies; nothing here uses it
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force \
 && rm -rf node_modules/@playwright node_modules/playwright node_modules/playwright-core
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000
# Apply pending migrations, then start. Render injects $PORT.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]
