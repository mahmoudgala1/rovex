# ==========================================
# 1. Builder Stage
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --prefer-offline --no-audit --no-fund

COPY . .

RUN npm run build

RUN npm prune --production --no-audit --no-fund && npm cache clean --force

# ==========================================
# 2. Production Stage
# ==========================================
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/public ./dist/public
COPY --from=builder /app/src/protos ./dist/protos

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "dist/server.js"]

