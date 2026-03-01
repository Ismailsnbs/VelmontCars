# Dependency installation stage
FROM node:20-alpine AS deps

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy root and packages files for monorepo setup
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM node:20-alpine AS builder

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

# Build application with standalone output
WORKDIR /app/apps/web
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

# Expose port
EXPOSE 3000

# Run Next.js server
CMD ["node", "server.js"]
