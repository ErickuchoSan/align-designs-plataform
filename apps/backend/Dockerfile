# Development Dockerfile - single stage with all dependencies
FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

# Copy workspace config and lock file from monorepo root
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma/

# Install ALL dependencies (including dev)
RUN pnpm install --filter backend

# Copy backend source — ARG busts cache so code changes are always picked up
ARG CACHE_BUST=1
RUN echo "Backend source cache bust: $CACHE_BUST"
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Generate Prisma Client and build the application
RUN pnpm prisma:generate && pnpm build

EXPOSE 3001

CMD ["pnpm", "start:prod"]
