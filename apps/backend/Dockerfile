# Builder stage
FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Copy workspace config and lock file from monorepo root
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma/

# Install dependencies including dev dependencies for build
RUN pnpm install --filter backend

# Copy backend source
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Generate Prisma Client
RUN pnpm prisma:generate

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Copy workspace config and lock file
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN pnpm install --prod --filter backend

WORKDIR /app/apps/backend

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma

# Generate Prisma Client in production stage
RUN pnpm prisma:generate

EXPOSE 3001

CMD ["pnpm", "start:prod"]
