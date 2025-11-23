# Phase 2: DevOps Implementation - Complete Guide

**Version:** 1.0
**Date:** 2025-01-23
**Estimated Time:** 9-14 hours
**Difficulty:** Intermediate

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Implementation Steps Overview](#implementation-steps-overview)
3. [Step 1: Docker Setup (Backend)](#step-1-docker-setup-backend)
4. [Step 2: Docker Setup (Frontend)](#step-2-docker-setup-frontend)
5. [Step 3: Docker Compose Configuration](#step-3-docker-compose-configuration)
6. [Step 4: Environment Configuration](#step-4-environment-configuration)
7. [Step 5: Backup Scripts](#step-5-backup-scripts)
8. [Step 6: Health Checks](#step-6-health-checks)
9. [Step 7: GitHub Actions CI](#step-7-github-actions-ci)
10. [Step 8: GitHub Actions CD](#step-8-github-actions-cd)
11. [Step 9: DigitalOcean Setup](#step-9-digitalocean-setup)
12. [Step 10: SSL & Domain Configuration](#step-10-ssl--domain-configuration)
13. [Step 11: Monitoring Setup](#step-11-monitoring-setup)
14. [Step 12: Documentation](#step-12-documentation)
15. [Troubleshooting](#troubleshooting)
16. [Testing Checklist](#testing-checklist)

---

## ✅ Prerequisites

### Local Development Environment

- [x] Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- [x] Node.js 18+ installed
- [x] Git installed and configured
- [x] Code editor (VSCode recommended)
- [x] Basic terminal/bash knowledge

### Accounts & Access

- [x] GitHub account with repository access
- [x] DigitalOcean account (sign up at digitalocean.com)
- [x] Domain name (optional for production, can use DO IP initially)

### Project Status

- [x] Phase 1 completed (caching & metrics implemented)
- [x] Backend builds successfully (`npm run build`)
- [x] Frontend builds successfully (`npm run build`)
- [x] All critical features working locally

---

## 🗺️ Implementation Steps Overview

```
Phase 2 Implementation Flow:
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  STEP 1-2: Dockerfiles                    [2-3 hours]  │
│  ├─ Backend Dockerfile (multi-stage)                   │
│  └─ Frontend Dockerfile (Next.js optimized)            │
│                                                         │
│  STEP 3-4: Docker Compose & Env          [1-2 hours]  │
│  ├─ docker-compose.yml (all services)                  │
│  ├─ docker-compose.prod.yml                            │
│  └─ Environment templates                              │
│                                                         │
│  STEP 5-6: Scripts & Health Checks       [1-2 hours]  │
│  ├─ Backup automation scripts                          │
│  └─ Health check endpoints verification                │
│                                                         │
│  STEP 7-8: GitHub Actions CI/CD          [2-3 hours]  │
│  ├─ CI workflow (lint, test, build)                    │
│  └─ CD workflow (deploy to DO)                         │
│                                                         │
│  STEP 9-10: DigitalOcean Setup          [2-3 hours]  │
│  ├─ Droplet provisioning                               │
│  ├─ Docker installation                                │
│  ├─ SSL with Let's Encrypt                             │
│  └─ Domain/DNS configuration                           │
│                                                         │
│  STEP 11-12: Monitoring & Docs          [1-2 hours]  │
│  ├─ Prometheus/Grafana dashboards                      │
│  └─ Deployment documentation                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Step 1: Docker Setup (Backend)

**Objective:** Create optimized multi-stage Dockerfile for NestJS backend

**Time:** 45-60 minutes

### 1.1 Create Backend Dockerfile

**File:** `apps/backend/Dockerfile`

```dockerfile
# ============================================
# Stage 1: Builder - Compile TypeScript
# ============================================
FROM node:18-alpine AS builder

# Install dependencies for node-gyp (if needed for native modules)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove devDependencies to reduce size
RUN npm prune --production

# ============================================
# Stage 2: Production - Runtime Only
# ============================================
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files and production dependencies from builder
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy Prisma files
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Copy other necessary files
COPY --from=builder --chown=nestjs:nodejs /app/.env.example ./.env.example

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/main.js"]
```

### 1.2 Create .dockerignore for Backend

**File:** `apps/backend/.dockerignore`

```
# Node modules
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
dist
build

# Environment files
.env
.env.local
.env.*.local

# Test files
**/*.spec.ts
**/*.test.ts
coverage

# IDE
.vscode
.idea

# Git
.git
.gitignore

# Documentation
*.md
docs

# Logs
logs
*.log

# OS files
.DS_Store
Thumbs.db

# Temporary files
tmp
temp
```

### 1.3 Test Backend Docker Build

```bash
# Navigate to backend directory
cd apps/backend

# Build Docker image
docker build -t align-designs-backend:test .

# Test the image
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e NODE_ENV=production \
  align-designs-backend:test

# In another terminal, test health endpoint
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"..."}

# Stop container
docker ps
docker stop <container_id>
```

### 1.4 Optimize Build Performance

**Create `.dockerignore` optimizations:**

```dockerfile
# Add this to top of Dockerfile for better caching
# Docker will cache this layer if package.json doesn't change

FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# ... rest of config
```

**Expected build time:**
- First build: 3-5 minutes
- Subsequent builds (no code changes): 10-30 seconds (cached layers)
- Subsequent builds (code changes only): 1-2 minutes

---

## 🎨 Step 2: Docker Setup (Frontend)

**Objective:** Create optimized Dockerfile for Next.js with standalone output

**Time:** 45-60 minutes

### 2.1 Configure Next.js for Standalone Output

**File:** `apps/frontend/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Environment variables for runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Image optimization (optional)
  images: {
    domains: ['localhost', 'your-domain.com'],
    // For production with CDN
    // loader: 'custom',
    // loaderFile: './imageLoader.js',
  },

  // Disable telemetry in production
  telemetry: false,

  // Production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
```

### 2.2 Create Frontend Dockerfile

**File:** `apps/frontend/Dockerfile`

```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# ============================================
# Stage 2: Builder - Build Next.js
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build Next.js application
RUN npm run build

# ============================================
# Stage 3: Production - Runner
# ============================================
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files for standalone
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start Next.js
CMD ["node", "server.js"]
```

### 2.3 Add Health Check Endpoint to Frontend

**File:** `apps/frontend/app/api/health/route.ts` (App Router)

```typescript
// apps/frontend/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export const dynamic = 'force-dynamic';
```

**Or for Pages Router:** `apps/frontend/pages/api/health.ts`

```typescript
// apps/frontend/pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

### 2.4 Create .dockerignore for Frontend

**File:** `apps/frontend/.dockerignore`

```
node_modules
.next
out
dist
build

# Environment
.env*.local
.env

# Testing
coverage
**/*.spec.ts
**/*.test.ts
**/*.spec.tsx
**/*.test.tsx

# IDE
.vscode
.idea

# Git
.git
.gitignore

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# Documentation
*.md
docs

# Temporary
tmp
temp
```

### 2.5 Test Frontend Docker Build

```bash
cd apps/frontend

# Build image
docker build -t align-designs-frontend:test .

# Run container
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  align-designs-frontend:test

# Test in browser
open http://localhost:3001

# Test health endpoint
curl http://localhost:3001/api/health

# Stop
docker stop <container_id>
```

---

## 🐳 Step 3: Docker Compose Configuration

**Objective:** Orchestrate all services together

**Time:** 60-90 minutes

### 3.1 Create docker-compose.yml (Development)

**File:** `docker-compose.yml` (root directory)

```yaml
version: '3.8'

services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:14-alpine
    container_name: align-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-align_designs}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups/postgres:/backups
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - align-network

  # ============================================
  # Redis Cache
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: align-redis
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD:-redis_secret_password}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - align-network

  # ============================================
  # MinIO Object Storage
  # ============================================
  minio:
    image: minio/minio:latest
    container_name: align-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "${MINIO_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - align-network

  # ============================================
  # Backend API (NestJS)
  # ============================================
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: align-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000

      # Database
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-align_designs}

      # Redis
      REDIS_ENABLED: "true"
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redis_secret_password}

      # MinIO
      MINIO_ENDPOINT: http://minio:9000
      MINIO_PORT: 9000
      MINIO_USE_SSL: "false"
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin}
      MINIO_BUCKET_NAME: ${MINIO_BUCKET_NAME:-align-designs}

      # JWT & Security
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: ${JWT_EXPIRATION:-86400}
      CSRF_SECRET: ${CSRF_SECRET}

      # Email (optional)
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}

    ports:
      - "${BACKEND_PORT:-3000}:3000"
    volumes:
      - ./apps/backend/.env:/app/.env
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - align-network

  # ============================================
  # Frontend (Next.js)
  # ============================================
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: align-frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3000}
      PORT: 3001
    ports:
      - "${FRONTEND_PORT:-3001}:3001"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - align-network

  # ============================================
  # Prometheus (Metrics Collection) - Optional
  # ============================================
  prometheus:
    image: prom/prometheus:latest
    container_name: align-prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "${PROMETHEUS_PORT:-9090}:9090"
    networks:
      - align-network

  # ============================================
  # Grafana (Metrics Visualization) - Optional
  # ============================================
  grafana:
    image: grafana/grafana:latest
    container_name: align-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_INSTALL_PLUGINS: grafana-clock-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "${GRAFANA_PORT:-3002}:3000"
    depends_on:
      - prometheus
    networks:
      - align-network

# ============================================
# Networks
# ============================================
networks:
  align-network:
    driver: bridge

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  minio_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
```

### 3.2 Create Prometheus Configuration

**File:** `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'align-designs'
    environment: 'production'

# Scrape configurations
scrape_configs:
  # Backend metrics (from Phase 1)
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
        labels:
          service: 'api'
    metrics_path: '/metrics'
    scrape_interval: 30s

  # PostgreSQL metrics (optional, requires postgres_exporter)
  # - job_name: 'postgres'
  #   static_configs:
  #     - targets: ['postgres-exporter:9187']

  # Redis metrics (optional, requires redis_exporter)
  # - job_name: 'redis'
  #   static_configs:
  #     - targets: ['redis-exporter:9121']

  # Node exporter for system metrics (optional)
  # - job_name: 'node'
  #   static_configs:
  #     - targets: ['node-exporter:9100']
```

### 3.3 Test Docker Compose

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with your secrets
nano .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Test endpoints
curl http://localhost:3000/health  # Backend
curl http://localhost:3001/api/health  # Frontend
curl http://localhost:3000/metrics  # Prometheus metrics

# Access services
# Backend API: http://localhost:3000
# Frontend: http://localhost:3001
# MinIO Console: http://localhost:9001
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002 (admin/admin)

# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data!)
docker-compose down -v
```

### 3.4 Create Production docker-compose

**File:** `docker-compose.prod.yml`

```yaml
version: '3.8'

# Production overrides
services:
  postgres:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

**Usage:**
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## ⚙️ Step 4: Environment Configuration

**Objective:** Set up environment variables for all environments

**Time:** 30-45 minutes

### 4.1 Create Root .env.example

**File:** `.env.example` (root)

```env
# ============================================
# Align Designs - Environment Configuration
# ============================================

# ============================================
# Database (PostgreSQL)
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_postgres_password_here
POSTGRES_DB=align_designs
POSTGRES_PORT=5432

# ============================================
# Redis Cache
# ============================================
REDIS_ENABLED=true
REDIS_PASSWORD=your_secure_redis_password_here
REDIS_PORT=6379

# ============================================
# MinIO Object Storage
# ============================================
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key
MINIO_BUCKET_NAME=align-designs
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# ============================================
# Backend API
# ============================================
BACKEND_PORT=3000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
JWT_EXPIRATION=86400

# CSRF Protection
CSRF_SECRET=your_csrf_secret_key_minimum_32_characters

# ============================================
# Frontend
# ============================================
FRONTEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3000

# ============================================
# Email (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM="Align Designs <noreply@aligndesigns.com>"

# ============================================
# Monitoring (Optional)
# ============================================
PROMETHEUS_PORT=9090
GRAFANA_PORT=3002
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# ============================================
# File Upload Limits
# ============================================
MAX_FILE_SIZE=8589934592
MAX_FILES_PER_PROJECT=1000

# ============================================
# Rate Limiting
# ============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# ============================================
# OTP Configuration
# ============================================
OTP_EXPIRATION=300
MAX_OTP_ATTEMPTS=3

# ============================================
# Bcrypt
# ============================================
BCRYPT_ROUNDS=14
```

### 4.2 Generate Secure Secrets

Create a script to generate random secrets:

**File:** `scripts/generate-secrets.sh`

```bash
#!/bin/bash

echo "==================================="
echo "Generating Secure Secrets"
echo "==================================="
echo ""

echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "CSRF_SECRET=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo "MINIO_ACCESS_KEY=$(openssl rand -hex 16)"
echo "MINIO_SECRET_KEY=$(openssl rand -hex 32)"

echo ""
echo "Copy these to your .env file!"
echo "==================================="
```

```bash
# Make executable and run
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh
```

### 4.3 Create .env for Development

```bash
# Copy example
cp .env.example .env

# Edit with generated secrets
nano .env

# Or use script to auto-populate
./scripts/generate-secrets.sh >> .env.new
# Manually merge .env.new into .env
```

### 4.4 Create Production .env Template

**File:** `.env.production.example`

```env
# ============================================
# PRODUCTION ENVIRONMENT
# DO NOT COMMIT THIS FILE!
# ============================================

# Database - Use DigitalOcean Managed Database URL
DATABASE_URL=postgresql://doadmin:XXXXX@db-postgresql-nyc3-12345.db.ondigitalocean.com:25060/align_designs?sslmode=require

# Redis - Use DigitalOcean Managed Redis or Docker
REDIS_ENABLED=true
REDIS_URL=redis://:PASSWORD@redis:6379

# MinIO - Use DigitalOcean Spaces or Docker
MINIO_ENDPOINT=https://nyc3.digitaloceanspaces.com
# OR for self-hosted: http://minio:9000

# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=REPLACE_WITH_SECURE_SECRET
CSRF_SECRET=REPLACE_WITH_SECURE_SECRET

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdo main.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.XXXXX
```

---

## 💾 Step 5: Backup Scripts

**Objective:** Automate database and file backups

**Time:** 45-60 minutes

### 5.1 Create Backup Directory Structure

```bash
mkdir -p scripts/backups
mkdir -p backups/postgres
mkdir -p backups/redis
mkdir -p backups/minio
```

### 5.2 PostgreSQL Backup Script

**File:** `scripts/backup-postgres.sh`

```bash
#!/bin/bash
# ============================================
# PostgreSQL Backup Script
# ============================================

set -e

# Configuration
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
CONTAINER_NAME="align-postgres"
DB_NAME="${POSTGRES_DB:-align_designs}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "================================="
echo "PostgreSQL Backup Started"
echo "Time: $(date)"
echo "================================="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run pg_dump inside container
echo "Creating backup: db_${DATE}.sql.gz"
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_DIR/db_${DATE}.sql.gz"

    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/db_${DATE}.sql.gz" | cut -f1)
    echo "   Size: $BACKUP_SIZE"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups (keep last RETENTION_DAYS days)
echo "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | wc -l)
echo "✅ Backup completed. Total backups: $BACKUP_COUNT"

echo "================================="
```

### 5.3 Redis Backup Script

**File:** `scripts/backup-redis.sh`

```bash
#!/bin/bash
# ============================================
# Redis Backup Script
# ============================================

set -e

BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
CONTAINER_NAME="align-redis"

echo "================================="
echo "Redis Backup Started"
echo "Time: $(date)"
echo "================================="

mkdir -p "$BACKUP_DIR"

# Trigger Redis BGSAVE
echo "Triggering Redis BGSAVE..."
docker exec "$CONTAINER_NAME" redis-cli BGSAVE

# Wait for save to complete
sleep 5

# Copy dump.rdb from container
echo "Copying dump.rdb from container..."
docker cp "$CONTAINER_NAME:/data/dump.rdb" "$BACKUP_DIR/dump_${DATE}.rdb"

if [ $? -eq 0 ]; then
    # Compress backup
    gzip "$BACKUP_DIR/dump_${DATE}.rdb"
    echo "✅ Redis backup created: $BACKUP_DIR/dump_${DATE}.rdb.gz"
else
    echo "❌ Redis backup failed!"
    exit 1
fi

# Clean up old backups
find "$BACKUP_DIR" -name "dump_*.rdb.gz" -type f -mtime +$RETENTION_DAYS -delete

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/dump_*.rdb.gz 2>/dev/null | wc -l)
echo "✅ Redis backup completed. Total backups: $BACKUP_COUNT"

echo "================================="
```

### 5.4 MinIO Backup Script

**File:** `scripts/backup-minio.sh`

```bash
#!/bin/bash
# ============================================
# MinIO Backup Script
# ============================================

set -e

BACKUP_DIR="/backups/minio"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
CONTAINER_NAME="align-minio"

echo "================================="
echo "MinIO Backup Started"
echo "Time: $(date)"
echo "================================="

mkdir -p "$BACKUP_DIR"

# Create tar archive of MinIO data
echo "Creating MinIO data archive..."
docker run --rm \
  -v align-designs-demo_minio_data:/data:ro \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine \
  tar czf "/backup/minio_${DATE}.tar.gz" -C /data .

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/minio_${DATE}.tar.gz" | cut -f1)
    echo "✅ MinIO backup created: $BACKUP_DIR/minio_${DATE}.tar.gz"
    echo "   Size: $BACKUP_SIZE"
else
    echo "❌ MinIO backup failed!"
    exit 1
fi

# Clean up old backups
find "$BACKUP_DIR" -name "minio_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/minio_*.tar.gz 2>/dev/null | wc -l)
echo "✅ MinIO backup completed. Total backups: $BACKUP_COUNT"

echo "================================="
```

### 5.5 Master Backup Script

**File:** `scripts/backup-all.sh`

```bash
#!/bin/bash
# ============================================
# Master Backup Script - Runs all backups
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "Starting Full Backup"
echo "Time: $(date)"
echo "========================================"
echo ""

# Run PostgreSQL backup
echo "1/3: Backing up PostgreSQL..."
bash "$SCRIPT_DIR/backup-postgres.sh"
echo ""

# Run Redis backup
echo "2/3: Backing up Redis..."
bash "$SCRIPT_DIR/backup-redis.sh"
echo ""

# Run MinIO backup
echo "3/3: Backing up MinIO..."
bash "$SCRIPT_DIR/backup-minio.sh"
echo ""

echo "========================================"
echo "✅ Full Backup Completed Successfully"
echo "Time: $(date)"
echo "========================================"
```

### 5.6 Make Scripts Executable

```bash
chmod +x scripts/backup-*.sh
```

### 5.7 Test Backups Manually

```bash
# Test individual backups
./scripts/backup-postgres.sh
./scripts/backup-redis.sh
./scripts/backup-minio.sh

# Or run all at once
./scripts/backup-all.sh

# Verify backups were created
ls -lh backups/postgres/
ls -lh backups/redis/
ls -lh backups/minio/
```

### 5.8 Set Up Cron Jobs (Production)

```bash
# Edit crontab
crontab -e

# Add these lines:

# Daily backups at 2 AM
0 2 * * * /path/to/align-designs-demo/scripts/backup-postgres.sh >> /var/log/postgres-backup.log 2>&1
0 2 * * * /path/to/align-designs-demo/scripts/backup-redis.sh >> /var/log/redis-backup.log 2>&1

# Weekly MinIO backups (Sunday at 3 AM)
0 3 * * 0 /path/to/align-designs-demo/scripts/backup-minio.sh >> /var/log/minio-backup.log 2>&1

# Monthly full backup (1st of month at 1 AM)
0 1 1 * * /path/to/align-designs-demo/scripts/backup-all.sh >> /var/log/full-backup.log 2>&1
```

### 5.9 Restore Scripts

**File:** `scripts/restore-postgres.sh`

```bash
#!/bin/bash
# ============================================
# PostgreSQL Restore Script
# ============================================

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh backups/postgres/db_*.sql.gz
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="align-postgres"
DB_NAME="${POSTGRES_DB:-align_designs}"
DB_USER="${POSTGRES_USER:-postgres}"

echo "================================="
echo "PostgreSQL Restore Started"
echo "WARNING: This will overwrite current database!"
echo "Backup file: $BACKUP_FILE"
echo "================================="

read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Decompress and restore
echo "Restoring database..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi

echo "================================="
```

```bash
chmod +x scripts/restore-postgres.sh

# Usage:
./scripts/restore-postgres.sh backups/postgres/db_20250123_020000.sql.gz
```

---

**🎯 Summary of Step 5:**

✅ Created backup scripts for:
- PostgreSQL (daily automated)
- Redis (daily automated)
- MinIO (weekly automated)

✅ Implemented:
- Automatic cleanup (7-day retention)
- Compression to save space
- Error handling
- Restore scripts

✅ Next: Set up health checks

---

**End of Part 1/3 of Implementation Guide**

This guide continues with Steps 6-12 in the next sections. Would you like me to continue with:
- Step 6: Health Checks
- Step 7-8: GitHub Actions CI/CD
- Step 9-10: DigitalOcean Setup
- Step 11-12: Monitoring & Documentation

Let me know if you want me to continue creating the complete guide! 🚀
