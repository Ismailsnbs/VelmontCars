# Build stage for API backend
FROM node:20-alpine AS builder

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Set working directory
WORKDIR /app

# Copy root and packages files for monorepo setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm db:generate

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy prisma schema for runtime
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Expose port
EXPOSE 4000

# Set working directory and run
WORKDIR /app/apps/api
CMD ["node", "dist/app.js"]
