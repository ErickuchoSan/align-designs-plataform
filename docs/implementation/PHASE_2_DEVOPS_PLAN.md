# Phase 2: DevOps & Infrastructure - Implementation Plan

**Status:** 📋 Planning
**Dependencies:** Phase 1 Complete ✅

## Objetivos de Fase 2

Implementar infraestructura DevOps completa con CI/CD, containerización, y automatización de pruebas para asegurar calidad y deployment confiable.

## Tareas Principales

### 1. 🐳 Docker Containerization

#### 1.1 Backend Dockerfile
- [ ] Crear Dockerfile multi-stage para backend
  - Stage 1: Builder (compile TypeScript, install dependencies)
  - Stage 2: Production (runtime mínimo, solo dependencies de producción)
- [ ] Optimizar capas para aprovechar cache de Docker
- [ ] Incluir health check endpoint
- [ ] Configurar usuario no-root para seguridad

#### 1.2 Frontend Dockerfile
- [ ] Crear Dockerfile multi-stage para Next.js
  - Stage 1: Dependencies (install packages)
  - Stage 2: Builder (compile Next.js)
  - Stage 3: Production (runtime con output standalone)
- [ ] Optimizar para Next.js 14+ standalone output
- [ ] Configurar variables de entorno correctamente

#### 1.3 Docker Compose
- [ ] Crear `docker-compose.yml` para desarrollo local completo
  - Backend service
  - Frontend service
  - PostgreSQL database
  - Redis cache
  - MinIO storage (S3-compatible)
- [ ] Crear `docker-compose.prod.yml` para producción
- [ ] Configurar networks y volumes correctamente
- [ ] Health checks para todos los servicios

#### 1.4 .dockerignore
- [ ] Crear `.dockerignore` para backend
- [ ] Crear `.dockerignore` para frontend
- [ ] Excluir node_modules, .git, logs, etc.

**Impacto:**
- Entorno consistente entre desarrollo/staging/producción
- Deployment simplificado
- Aislamiento de servicios

---

### 2. 🔄 GitHub Actions CI/CD

#### 2.1 CI Pipeline - Pull Requests
**File:** `.github/workflows/ci.yml`

- [ ] Trigger en pull requests a main/develop
- [ ] Jobs paralelos:
  - **Lint Backend:**
    - Checkout code
    - Setup Node.js
    - Install dependencies (con cache)
    - Run `npm run lint`
  - **Lint Frontend:**
    - Same structure para frontend
  - **Test Backend:**
    - Setup Node.js + PostgreSQL service
    - Run migrations
    - Run `npm test`
  - **Test Frontend:**
    - Run frontend tests
  - **Build Backend:**
    - Verificar que compile sin errores
    - `npm run build`
  - **Build Frontend:**
    - Verificar build de Next.js
    - `npm run build`
  - **Type Check:**
    - `npm run type-check` para ambos

**Reglas:**
- Todos los jobs deben pasar para merge
- Comentar en PR con resultados
- Generar coverage reports

#### 2.2 CD Pipeline - Production Deployment
**File:** `.github/workflows/cd-production.yml`

- [ ] Trigger en push a `main` branch
- [ ] Steps:
  1. Run full CI pipeline first
  2. Build Docker images (multi-platform si es necesario)
  3. Push images to registry (GitHub Container Registry o Docker Hub)
  4. Tag with git SHA + 'latest'
  5. Deploy to production (opcional - depende de infraestructura)

**Secrets requeridos:**
- DOCKER_USERNAME
- DOCKER_PASSWORD (o GITHUB_TOKEN)
- DATABASE_URL (producción)
- Otras variables de entorno sensibles

#### 2.3 CD Pipeline - Staging
**File:** `.github/workflows/cd-staging.yml`

- [ ] Trigger en push a `develop` branch
- [ ] Deploy a ambiente de staging
- [ ] Menor restrictivo que producción (para testing rápido)

#### 2.4 Dependency Update Automation
**File:** `.github/workflows/dependency-update.yml`

- [ ] Scheduled workflow (semanal)
- [ ] Run `npm audit`
- [ ] Create issue si hay vulnerabilidades críticas
- [ ] Opcional: Auto-update dependencies con Dependabot

---

### 3. 📋 Scripts de Automatización

#### 3.1 Health Check Scripts
- [ ] `scripts/health-check.sh`
  - Verificar que backend responda en /health
  - Verificar que frontend esté accesible
  - Verificar conexión a DB, Redis, MinIO
  - Exit codes apropiados para CI

#### 3.2 Database Migration Scripts
- [ ] `scripts/migrate-up.sh` - Run pending migrations
- [ ] `scripts/migrate-down.sh` - Rollback migrations
- [ ] `scripts/seed-db.sh` - Seed initial data
- [ ] Integrar con CI para test databases

#### 3.3 Build & Deploy Scripts
- [ ] `scripts/build-all.sh` - Build backend + frontend
- [ ] `scripts/deploy.sh` - Deploy a producción (parametrizable)
- [ ] `scripts/rollback.sh` - Rollback a versión anterior

---

### 4. 🔧 Configuración de Entornos

#### 4.1 Environment Files
- [ ] `.env.development` - Desarrollo local
- [ ] `.env.test` - Testing (CI)
- [ ] `.env.staging` - Staging environment
- [ ] `.env.production.example` - Template para producción

**Variables críticas:**
```env
# Backend
DATABASE_URL=
REDIS_ENABLED=
REDIS_URL=
MINIO_ENDPOINT=
JWT_SECRET=
CSRF_SECRET=

# Frontend
NEXT_PUBLIC_API_URL=
```

#### 4.2 Docker Environment
- [ ] Crear `.env.docker` para docker-compose
- [ ] Documentar todas las variables en README

---

### 5. 📚 Documentación DevOps

#### 5.1 Deployment Guide
- [ ] `docs/DEPLOYMENT.md`
  - Cómo hacer deploy manual
  - Cómo usar CI/CD
  - Cómo hacer rollback
  - Troubleshooting común

#### 5.2 Development Setup
- [ ] `docs/DEVELOPMENT.md`
  - Setup con Docker
  - Setup sin Docker
  - Cómo correr tests
  - Cómo contribuir

#### 5.3 CI/CD Documentation
- [ ] `docs/CI_CD.md`
  - Explicación de pipelines
  - Cómo agregar secrets
  - Cómo agregar nuevos workflows

---

## Orden de Implementación Propuesto

### Paso 1: Docker Setup (Base)
1. Backend Dockerfile
2. Frontend Dockerfile
3. docker-compose.yml para desarrollo
4. .dockerignore files
5. Test local: `docker-compose up`

### Paso 2: CI Pipeline (Testing)
1. GitHub Actions CI workflow
2. Lint + Test + Build jobs
3. Test con PR de prueba

### Paso 3: CD Pipeline (Deployment)
1. Production deployment workflow
2. Docker image building y pushing
3. Staging deployment workflow

### Paso 4: Scripts & Automation
1. Health check scripts
2. Migration scripts
3. Deploy/rollback scripts

### Paso 5: Documentation
1. DEPLOYMENT.md
2. DEVELOPMENT.md
3. CI_CD.md
4. Update main README.md

---

## Configuración Recomendada

### GitHub Actions Runners
- **Free tier:** Ubuntu-latest runners (suficiente para este proyecto)
- **Self-hosted:** Si necesitas más control o runners privados

### Docker Registry
**Opción 1: GitHub Container Registry (ghcr.io)**
- ✅ Gratis para repos públicos
- ✅ Integrado con GitHub
- ✅ No requiere cuenta adicional

**Opción 2: Docker Hub**
- ✅ Gratis con límites
- ⚠️ Rate limiting en pulls

### PostgreSQL en CI
- Usar PostgreSQL service container en GitHub Actions
- Versión 14+ para match con producción

### Redis en CI
- Redis service container (opcional)
- Puede usar in-memory cache para tests

---

## Testing Strategy en CI

### Backend Tests
```yaml
- Unit tests: Jest (rápido, sin DB)
- Integration tests: Jest + TestContainers/PostgreSQL service
- E2E tests: Supertest (opcional, más lento)
```

### Frontend Tests
```yaml
- Unit tests: Jest + React Testing Library
- Component tests: Jest
- E2E tests: Playwright (Fase 3)
```

### Coverage Requirements
- Mínimo: 70% coverage (realista)
- Ideal: 80%+ coverage
- Fail CI si coverage baja del umbral

---

## Monitoreo Post-Deployment

### Health Checks
- `/health` endpoint (ya existe en HealthModule)
- `/metrics` endpoint para Prometheus (Phase 1 ✅)

### Logs
- Structured logging (Winston o Pino)
- Agregación con Loki/CloudWatch (opcional)

### Alerting
- Prometheus Alertmanager (opcional)
- Email/Slack notifications en deploy failures

---

## Security Considerations

### Secrets Management
- ❌ NO commitear secrets en código
- ✅ Usar GitHub Secrets para CI/CD
- ✅ Usar .env files en servidores (fuera de git)
- ✅ Rotar secrets regularmente

### Docker Security
- ✅ Non-root user en containers
- ✅ Minimal base images (alpine cuando posible)
- ✅ Scan images con Trivy/Snyk
- ✅ No incluir development dependencies en producción

### CI/CD Security
- ✅ Limit workflow permissions
- ✅ Pin action versions (no @main, usar @v1.2.3)
- ✅ Review third-party actions

---

## Estimación de Tiempo

| Tarea | Tiempo Estimado |
|-------|-----------------|
| Docker Setup | 2-3 horas |
| CI Pipeline | 2-3 horas |
| CD Pipeline | 1-2 horas |
| Scripts | 1 hora |
| Documentation | 1-2 horas |
| Testing & Debugging | 2-3 horas |
| **TOTAL** | **9-14 horas** |

---

## Success Criteria

### ✅ Phase 2 Complete When:
- [ ] Docker compose up funciona completamente en local
- [ ] CI pipeline corre en cada PR
- [ ] Todos los tests pasan en CI
- [ ] Build exitoso en CI
- [ ] Docker images se construyen correctamente
- [ ] CD pipeline despliega a staging/producción
- [ ] Documentación completa y actualizada
- [ ] Scripts de automatización funcionan
- [ ] Health checks funcionan en todos los ambientes

---

## Next Phase Preview

**Phase 3: Testing (Lo dejamos para el final según tu request)**
- Fix 76 failing tests
- Increase coverage to 70-80%
- Add E2E tests with Playwright
- Visual regression testing (opcional)

---

## Preguntas para el Usuario

Antes de empezar, necesito confirmar:

1. **Docker Registry:** ¿Prefieres GitHub Container Registry (ghcr.io) o Docker Hub?
2. **Deployment Target:** ¿Dónde vas a deployar? (AWS, Azure, DigitalOcean, VPS, etc.)
3. **Database en Producción:** ¿Ya tienes PostgreSQL configurado o necesitamos incluirlo en docker-compose?
4. **Redis en Producción:** ¿Vas a usar Redis en producción o solo in-memory?
5. **MinIO:** ¿Usarás MinIO en producción o AWS S3?

---

**¿Aprobado para comenzar implementación?** 🚀
