FROM node:20-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY prisma ./prisma
COPY next.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.* postcss.config.* ./
COPY postcss.config.mjs ./

# Generate Prisma client and build Next.js
RUN npx prisma generate
RUN npm run build

# Step 2. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 关键修复：全局安装 prisma CLI，一次性解决所有依赖链问题
RUN npm install -g prisma@6.19.2

# Ensure uploads directory exists and is writable
RUN mkdir -p public/uploads
RUN chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run migrations and start the app
CMD prisma db push && node server.js
