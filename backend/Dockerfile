# ── Stage 1: production deps ───────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: generate Prisma client ───────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

# ── Stage 3: final production image ───────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

# Proper signal handling
RUN apk add --no-cache dumb-init

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Prisma generated client
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# App source
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs prisma ./prisma
COPY --chown=nodejs:nodejs package*.json ./

# Frontend static files
RUN mkdir -p /app/public
COPY --chown=nodejs:nodejs ../index.html /app/public/index.html
COPY --chown=nodejs:nodejs ../app.js /app/public/app.js
COPY --chown=nodejs:nodejs ../styles.css /app/public/styles.css

# SQLite data directory (mount as volume in production)
RUN mkdir -p /data && chown nodejs:nodejs /data

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:/data/app.db"
ENV FRONTEND_ROOT="/app/public"

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
