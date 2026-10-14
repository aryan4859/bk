FROM node:22-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000
# Apply pending migrations, then start. Render injects $PORT.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]
