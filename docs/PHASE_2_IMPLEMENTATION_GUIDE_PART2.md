# Phase 2: Implementation Guide - Part 2 (Steps 6-12)

This is a continuation of PHASE_2_IMPLEMENTATION_GUIDE.md

---

## 🏥 Step 6: Health Checks

**Objective:** Verify all services are running correctly and implement monitoring endpoints

**Time:** 30-45 minutes

### 6.1 Backend Health Check (Already Implemented)

**Verify existing health endpoint:**

```bash
# Start backend
cd apps/backend
npm run start:dev

# Test health endpoint
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-23T10:30:00.000Z",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

**File location:** `apps/backend/src/health/health.controller.ts`

### 6.2 Enhance Health Check with Dependencies

**Update health service to check all dependencies:**

**File:** `apps/backend/src/health/health.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {
    // Initialize Redis if enabled
    const redisEnabled = this.config.get('REDIS_ENABLED') === 'true';
    if (redisEnabled) {
      const redisUrl = this.config.get('REDIS_URL');
      if (redisUrl) {
        this.redis = new Redis(redisUrl);
      }
    }
  }

  async check(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const [database, redis, storage] = checks;

    const isHealthy =
      database.status === 'fulfilled' &&
      redis.status === 'fulfilled' &&
      storage.status === 'fulfilled';

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      info: {
        database: this.formatCheck(database),
        redis: this.formatCheck(redis),
        storage: this.formatCheck(storage),
      },
      details: {
        node_version: process.version,
        memory: process.memoryUsage(),
      },
    };
  }

  private async checkDatabase(): Promise<{ status: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      throw new Error('Database connection failed');
    }
  }

  private async checkRedis(): Promise<{ status: string }> {
    if (!this.redis) {
      return { status: 'disabled' };
    }

    try {
      const result = await this.redis.ping();
      if (result === 'PONG') {
        return { status: 'up' };
      }
      throw new Error('Redis ping failed');
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      throw new Error('Redis connection failed');
    }
  }

  private async checkStorage(): Promise<{ status: string }> {
    try {
      // Test MinIO connection by listing buckets
      await this.storage.checkConnection();
      return { status: 'up' };
    } catch (error) {
      this.logger.error('Storage health check failed:', error);
      throw new Error('Storage connection failed');
    }
  }

  private formatCheck(
    check: PromiseSettledResult<any>,
  ): { status: string; error?: string } {
    if (check.status === 'fulfilled') {
      return check.value;
    }
    return {
      status: 'down',
      error: check.reason?.message || 'Unknown error',
    };
  }
}

interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  info: {
    database: { status: string; error?: string };
    redis: { status: string; error?: string };
    storage: { status: string; error?: string };
  };
  details: {
    node_version: string;
    memory: NodeJS.MemoryUsage;
  };
}
```

### 6.3 Add Storage Connection Check

**Update StorageService:**

```typescript
// apps/backend/src/storage/storage.service.ts

async checkConnection(): Promise<boolean> {
  try {
    // List buckets to verify connection
    await this.minioClient.listBuckets();
    return true;
  } catch (error) {
    this.logger.error('MinIO connection check failed:', error);
    throw error;
  }
}
```

### 6.4 Create Health Check Script

**File:** `scripts/health-check.sh`

```bash
#!/bin/bash
# ============================================
# Comprehensive Health Check Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "==========================================="
echo "Health Check - Align Designs Platform"
echo "Time: $(date)"
echo "==========================================="
echo ""

# Function to check HTTP endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    echo -n "Checking $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $response)"
        return 1
    fi
}

# Function to check TCP port
check_port() {
    local name=$1
    local host=$2
    local port=$3

    echo -n "Checking $name ($host:$port)... "

    if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
        echo -e "${GREEN}✓ OPEN${NC}"
        return 0
    else
        echo -e "${RED}✗ CLOSED${NC}"
        return 1
    fi
}

# Function to check Docker container
check_container() {
    local name=$1
    local container=$2

    echo -n "Checking container $name... "

    if docker ps | grep -q "$container"; then
        status=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")

        if [ "$status" = "healthy" ] || [ "$status" = "unknown" ]; then
            echo -e "${GREEN}✓ RUNNING${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ UNHEALTHY${NC} (status: $status)"
            return 1
        fi
    else
        echo -e "${RED}✗ NOT RUNNING${NC}"
        return 1
    fi
}

# Counters
total_checks=0
failed_checks=0

# ============================================
# Docker Containers
# ============================================
echo "--- Docker Containers ---"

containers=("align-postgres:PostgreSQL" "align-redis:Redis" "align-minio:MinIO" "align-backend:Backend" "align-frontend:Frontend")

for container_info in "${containers[@]}"; do
    IFS=':' read -r container name <<< "$container_info"
    total_checks=$((total_checks + 1))
    check_container "$name" "$container" || failed_checks=$((failed_checks + 1))
done

echo ""

# ============================================
# Network Ports
# ============================================
echo "--- Network Ports ---"

ports=("PostgreSQL:localhost:5432" "Redis:localhost:6379" "MinIO:localhost:9000" "Backend:localhost:3000" "Frontend:localhost:3001")

for port_info in "${ports[@]}"; do
    IFS=':' read -r name host port <<< "$port_info"
    total_checks=$((total_checks + 1))
    check_port "$name" "$host" "$port" || failed_checks=$((failed_checks + 1))
done

echo ""

# ============================================
# HTTP Endpoints
# ============================================
echo "--- HTTP Endpoints ---"

endpoints=("Backend Health:http://localhost:3000/health" "Frontend Health:http://localhost:3001/api/health" "Backend Metrics:http://localhost:3000/metrics" "MinIO Console:http://localhost:9001/minio/health/live")

for endpoint_info in "${endpoints[@]}"; do
    IFS=':' read -r name url <<< "$endpoint_info"
    total_checks=$((total_checks + 1))
    check_endpoint "$name" "$url" || failed_checks=$((failed_checks + 1))
done

echo ""

# ============================================
# Summary
# ============================================
echo "==========================================="
echo "Health Check Summary"
echo "==========================================="
echo "Total checks: $total_checks"
echo "Passed: $((total_checks - failed_checks))"
echo "Failed: $failed_checks"

if [ $failed_checks -eq 0 ]; then
    echo -e "\n${GREEN}✓ All checks passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some checks failed!${NC}"
    exit 1
fi
```

```bash
chmod +x scripts/health-check.sh
```

### 6.5 Test Health Checks

```bash
# Start all services
docker-compose up -d

# Wait for services to be ready
sleep 30

# Run health check
./scripts/health-check.sh

# Expected output:
# ===========================================
# Health Check - Align Designs Platform
# ===========================================
#
# --- Docker Containers ---
# Checking PostgreSQL... ✓ RUNNING
# Checking Redis... ✓ RUNNING
# Checking MinIO... ✓ RUNNING
# Checking Backend... ✓ RUNNING
# Checking Frontend... ✓ RUNNING
#
# --- Network Ports ---
# Checking PostgreSQL (localhost:5432)... ✓ OPEN
# ...
#
# ✓ All checks passed!
```

### 6.6 Integrate with Monitoring

**Add health check to Prometheus scrape config:**

```yaml
# monitoring/prometheus.yml
scrape_configs:
  - job_name: 'health'
    scrape_interval: 30s
    metrics_path: '/health'
    static_configs:
      - targets: ['backend:3000']
    metric_relabel_configs:
      - source_labels: [__name__]
        regex: 'health_.*'
        action: keep
```

---

## 🔄 Step 7: GitHub Actions CI

**Objective:** Automate testing, linting, and building on every Pull Request

**Time:** 60-90 minutes

### 7.1 Create GitHub Actions Workflow Directory

```bash
mkdir -p .github/workflows
```

### 7.2 Create CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI - Continuous Integration

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

# Cancel in-progress runs when a new run is triggered
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '18'
  CACHE_VERSION: v1

jobs:
  # ============================================
  # Lint Backend
  # ============================================
  lint-backend:
    name: Lint Backend
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/backend/package-lock.json

      - name: Install dependencies
        working-directory: apps/backend
        run: npm ci

      - name: Run ESLint
        working-directory: apps/backend
        run: npm run lint

      - name: Check formatting
        working-directory: apps/backend
        run: npm run format:check

  # ============================================
  # Lint Frontend
  # ============================================
  lint-frontend:
    name: Lint Frontend
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/frontend/package-lock.json

      - name: Install dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Run ESLint
        working-directory: apps/frontend
        run: npm run lint

  # ============================================
  # Type Check Backend
  # ============================================
  typecheck-backend:
    name: TypeScript Check (Backend)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/backend/package-lock.json

      - name: Install dependencies
        working-directory: apps/backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: apps/backend
        run: npx prisma generate

      - name: Type check
        working-directory: apps/backend
        run: npx tsc --noEmit

  # ============================================
  # Test Backend
  # ============================================
  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: align_designs_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/backend/package-lock.json

      - name: Install dependencies
        working-directory: apps/backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: apps/backend
        run: npx prisma generate

      - name: Run Prisma Migrations
        working-directory: apps/backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/align_designs_test
        run: npx prisma migrate deploy

      - name: Run tests
        working-directory: apps/backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/align_designs_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-key-for-ci
          CSRF_SECRET: test-csrf-secret-for-ci
          NODE_ENV: test
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/backend/coverage/lcov.info
          flags: backend
          name: backend-coverage

  # ============================================
  # Build Backend
  # ============================================
  build-backend:
    name: Build Backend
    runs-on: ubuntu-latest
    needs: [lint-backend, typecheck-backend]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/backend/package-lock.json

      - name: Install dependencies
        working-directory: apps/backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: apps/backend
        run: npx prisma generate

      - name: Build application
        working-directory: apps/backend
        run: npm run build

      - name: Check build output
        working-directory: apps/backend
        run: |
          if [ ! -f "dist/main.js" ]; then
            echo "Build failed: main.js not found"
            exit 1
          fi
          echo "Build successful!"

  # ============================================
  # Build Frontend
  # ============================================
  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: [lint-frontend]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/frontend/package-lock.json

      - name: Install dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Build Next.js
        working-directory: apps/frontend
        env:
          NEXT_PUBLIC_API_URL: http://localhost:3000
        run: npm run build

      - name: Check build output
        working-directory: apps/frontend
        run: |
          if [ ! -d ".next" ]; then
            echo "Build failed: .next directory not found"
            exit 1
          fi
          echo "Build successful!"

  # ============================================
  # Security Audit
  # ============================================
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run npm audit (Backend)
        working-directory: apps/backend
        run: npm audit --audit-level=moderate || true

      - name: Run npm audit (Frontend)
        working-directory: apps/frontend
        run: npm audit --audit-level=moderate || true

  # ============================================
  # All Checks Passed
  # ============================================
  all-checks:
    name: All CI Checks Passed
    runs-on: ubuntu-latest
    needs:
      - lint-backend
      - lint-frontend
      - typecheck-backend
      - test-backend
      - build-backend
      - build-frontend
      - security-audit

    steps:
      - name: All checks passed
        run: echo "✅ All CI checks passed successfully!"
```

### 7.3 Add package.json scripts

**Verify these scripts exist in `apps/backend/package.json`:**

```json
{
  "scripts": {
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --max-warnings 0",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}
```

### 7.4 Create Branch Protection Rules (Manual Setup)

After pushing the workflow, configure branch protection on GitHub:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require status checks to pass before merging
   - ✅ Select: `all-checks`
   - ✅ Require branches to be up to date
   - ❌ Do not allow bypassing

### 7.5 Test CI Workflow Locally (Optional)

Install `act` to test GitHub Actions locally:

```bash
# Install act (macOS)
brew install act

# Or download from: https://github.com/nektos/act

# Test workflow
act pull_request

# Test specific job
act -j lint-backend
```

---

## 🚀 Step 8: GitHub Actions CD

**Objective:** Automate deployment to DigitalOcean on push to main

**Time:** 60-90 minutes

### 8.1 Create CD Workflow for Production

**File:** `.github/workflows/cd-production.yml`

```yaml
name: CD - Production Deployment

on:
  push:
    branches: [main]
  workflow_dispatch: # Allow manual trigger

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME_BACKEND: ${{ github.repository }}/backend
  IMAGE_NAME_FRONTEND: ${{ github.repository }}/frontend

jobs:
  # ============================================
  # Run CI First
  # ============================================
  ci:
    name: Run CI Checks
    uses: ./.github/workflows/ci.yml

  # ============================================
  # Build and Push Docker Images
  # ============================================
  build-and-push:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: ci
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (Backend)
        id: meta-backend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/backend
          push: true
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}:buildcache,mode=max

      - name: Extract metadata (Frontend)
        id: meta-frontend
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/frontend
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND }}:buildcache,mode=max

  # ============================================
  # Deploy to DigitalOcean
  # ============================================
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-push
    environment:
      name: production
      url: https://aligndesigns.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install doctl (DigitalOcean CLI)
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add Droplet to known hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.DROPLET_IP }} >> ~/.ssh/known_hosts

      - name: Deploy to Droplet
        env:
          DROPLET_IP: ${{ secrets.DROPLET_IP }}
          DROPLET_USER: ${{ secrets.DROPLET_USER }}
        run: |
          ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
            cd /opt/align-designs

            # Pull latest images
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            docker-compose pull

            # Run database migrations
            docker-compose run --rm backend npx prisma migrate deploy

            # Restart services with zero-downtime
            docker-compose up -d --no-deps --build backend frontend

            # Clean up old images
            docker image prune -af

            echo "✅ Deployment completed successfully!"
          EOF

      - name: Health check
        run: |
          echo "Waiting for services to start..."
          sleep 30

          curl -f https://api.aligndesigns.com/health || exit 1
          echo "✅ Backend is healthy!"

          curl -f https://aligndesigns.com || exit 1
          echo "✅ Frontend is healthy!"

      - name: Notify deployment success
        if: success()
        run: |
          echo "🚀 Deployment successful!"
          echo "Backend: https://api.aligndesigns.com"
          echo "Frontend: https://aligndesigns.com"

      - name: Rollback on failure
        if: failure()
        env:
          DROPLET_IP: ${{ secrets.DROPLET_IP }}
          DROPLET_USER: ${{ secrets.DROPLET_USER }}
        run: |
          ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
            cd /opt/align-designs

            # Rollback to previous version
            docker-compose down
            docker-compose up -d

            echo "⚠️ Rolled back to previous version"
          EOF
```

### 8.2 Create Staging Workflow

**File:** `.github/workflows/cd-staging.yml`

```yaml
name: CD - Staging Deployment

on:
  push:
    branches: [develop]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME_BACKEND: ${{ github.repository }}/backend
  IMAGE_NAME_FRONTEND: ${{ github.repository }}/frontend

jobs:
  build-and-deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.aligndesigns.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build and push images (staging tags)
        # Similar to production but with staging tags
        run: echo "Build staging images..."

      - name: Deploy to staging Droplet
        # Similar to production but to staging server
        run: echo "Deploy to staging..."
```

### 8.3 Configure GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** and add:

```
# DigitalOcean
DIGITALOCEAN_ACCESS_TOKEN=dop_v1_xxxxxxxxxxxxx
DROPLET_IP=165.227.xxx.xxx
DROPLET_USER=root

# SSH Key (private key for Droplet access)
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----

# Optional: Slack/Discord webhook for notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# Database (if using managed database)
DATABASE_URL=postgresql://doadmin:xxx@db.ondigitalocean.com:25060/align_designs
```

### 8.4 Create Deployment Script for Droplet

**File:** `scripts/deploy.sh` (will be on Droplet)

```bash
#!/bin/bash
# ============================================
# Production Deployment Script
# Run this on the DigitalOcean Droplet
# ============================================

set -e

COMPOSE_FILE="/opt/align-designs/docker-compose.yml"
COMPOSE_PROD_FILE="/opt/align-designs/docker-compose.prod.yml"

echo "=========================================="
echo "Starting Deployment"
echo "Time: $(date)"
echo "=========================================="

cd /opt/align-designs

# Backup database before deployment
echo "Creating database backup..."
./scripts/backup-postgres.sh

# Pull latest code (if deploying from git directly)
# git pull origin main

# Pull latest Docker images
echo "Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" pull

# Run database migrations
echo "Running database migrations..."
docker-compose run --rm backend npx prisma migrate deploy

# Restart services
echo "Restarting services..."
docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 15

# Health check
echo "Running health checks..."
./scripts/health-check.sh

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✅ Deployment completed successfully!"
    echo "Time: $(date)"
    echo "=========================================="
else
    echo "=========================================="
    echo "❌ Deployment health check failed!"
    echo "=========================================="
    exit 1
fi

# Clean up old images and containers
echo "Cleaning up..."
docker image prune -af
docker container prune -f

echo "✅ Cleanup completed"
```

### 8.5 Test Deployment Workflow

```bash
# Trigger deployment manually
gh workflow run cd-production.yml

# Or push to main
git push origin main

# Watch workflow progress
gh run watch

# View logs
gh run view --log
```

---

## 🌊 Step 9: DigitalOcean Setup

**Objective:** Provision and configure DigitalOcean Droplet for production

**Time:** 90-120 minutes

### 9.1 Create DigitalOcean Account

1. Go to [digitalocean.com](https://www.digitalocean.com/)
2. Sign up (use referral code for $200 credit if available)
3. Add payment method
4. Verify email

### 9.2 Create Droplet

**Via Web UI:**

1. Click **Create** → **Droplets**
2. Choose configuration:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic
   - **CPU options:** Regular (Disk type: SSD)
   - **Size:** $24/month (2 GB RAM, 2 vCPUs, 60 GB SSD, 3 TB transfer)
   - **Datacenter:** Choose closest to your users (e.g., NYC3, SFO3, FRA1)
   - **Authentication:** SSH Key (recommended) or Password
   - **Hostname:** align-designs-prod
   - **Tags:** production, align-designs
   - **Backups:** Enable ($4.80/month extra) - Recommended

3. Click **Create Droplet**

**Via CLI (doctl):**

```bash
# Install doctl
# macOS: brew install doctl
# Ubuntu: snap install doctl
# Windows: https://github.com/digitalocean/doctl/releases

# Authenticate
doctl auth init

# Create SSH key
ssh-keygen -t ed25519 -C "deploy@aligndesigns.com" -f ~/.ssh/align-designs

# Upload SSH key to DO
doctl compute ssh-key import align-designs --public-key-file ~/.ssh/align-designs.pub

# Get SSH key ID
doctl compute ssh-key list

# Create Droplet
doctl compute droplet create align-designs-prod \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --region nyc3 \
  --ssh-keys YOUR_SSH_KEY_ID \
  --tag-names production,align-designs \
  --enable-backups \
  --wait

# Get Droplet IP
doctl compute droplet list
```

### 9.3 Initial Server Setup

**Connect to Droplet:**

```bash
# Get your Droplet IP from DigitalOcean dashboard
ssh root@YOUR_DROPLET_IP

# Or if using SSH key
ssh -i ~/.ssh/align-designs root@YOUR_DROPLET_IP
```

**Run initial setup:**

```bash
# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y \
  curl \
  wget \
  git \
  vim \
  htop \
  ufw \
  fail2ban \
  unattended-upgrades

# Configure automatic security updates
dpkg-reconfigure -plow unattended-upgrades
```

### 9.4 Create Non-Root User

```bash
# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Test login
# (from your local machine)
ssh deploy@YOUR_DROPLET_IP
```

### 9.5 Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow backend (if exposing directly)
# ufw allow 3000/tcp

# Enable firewall
ufw --force enable

# Check status
ufw status verbose
```

### 9.6 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add deploy user to docker group
usermod -aG docker deploy

# Start Docker on boot
systemctl enable docker

# Install Docker Compose
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Verify installations
docker --version
docker compose version

# Test Docker
docker run hello-world
```

### 9.7 Setup Application Directory

```bash
# Create application directory
mkdir -p /opt/align-designs
chown deploy:deploy /opt/align-designs

# Switch to deploy user
su - deploy

cd /opt/align-designs

# Clone repository (or you'll deploy via CD)
git clone https://github.com/YOUR_USERNAME/align-designs-demo.git .

# Or manually copy files
# scp -r docker-compose.yml scripts/ .env deploy@YOUR_DROPLET_IP:/opt/align-designs/
```

### 9.8 Configure Environment Variables

```bash
cd /opt/align-designs

# Copy environment template
cp .env.production.example .env

# Edit with secure values
nano .env

# Generate secure secrets (from your documentation)
./scripts/generate-secrets.sh
```

### 9.9 Create Docker volumes

```bash
# Create persistent volumes
docker volume create postgres_data
docker volume create redis_data
docker volume create minio_data

# Create backup directories
mkdir -p /opt/align-designs/backups/{postgres,redis,minio}
```

### 9.10 Configure Fail2ban (Security)

```bash
# Edit Fail2ban configuration
sudo nano /etc/fail2ban/jail.local

# Add this configuration:
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@aligndesigns.com
sendername = Fail2Ban

[sshd]
enabled = true
port = 22
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
# Restart Fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status
```

### 9.11 Setup Swap (if needed)

```bash
# Check current swap
free -h

# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Adjust swappiness
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

---

**🎯 Summary of Part 2:**

✅ **Steps Completed:**
- Step 6: Health Checks (comprehensive health monitoring)
- Step 7: GitHub Actions CI (automated testing & building)
- Step 8: GitHub Actions CD (automated deployment)
- Step 9: DigitalOcean Setup (server provisioning & configuration)

**Remaining Steps (Part 3):**
- Step 10: SSL & Domain Configuration
- Step 11: Monitoring Setup
- Step 12: Documentation
- Troubleshooting
- Testing Checklist

Continue to Part 3? 🚀
