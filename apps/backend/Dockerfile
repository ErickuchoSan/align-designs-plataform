# Builder stage
FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /usr/src/app

COPY pnpm-lock.yaml package.json ./
COPY prisma ./prisma/

# Install dependencies including dev dependencies for build
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN pnpm prisma:generate

# Build the application
RUN pnpm build

# Production stage
FROM node:18-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /usr/src/app

COPY pnpm-lock.yaml package.json ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3001

CMD ["pnpm", "start:prod"]
