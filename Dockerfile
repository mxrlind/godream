# Multi-stage build para GoDream (API + Frontend)
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm --filter api build
RUN pnpm --filter web build

# ─── Runtime ───────────────────────────────
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copy from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Copy root files
COPY pnpm-workspace.yaml package.json ./

# Install prod dependencies only
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000 3001

# Default to API
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
