# CI/CD Pipeline

> Documentacion del proceso de Integracion y Despliegue Continuo de Align Designs.

## Flujo General

```
Push a main → Build → Tests → SonarCloud → Backup DB → Deploy → Health Check → E2E Tests
```

## Diagrama del Pipeline

```
┌─────────────┐
│  Push main  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Job 1: validate                                        │
│  ├── Checkout code                                      │
│  ├── Setup pnpm + Node.js 20                           │
│  ├── Install dependencies                               │
│  ├── Lint backend + frontend                           │
│  ├── Generate Prisma client                            │
│  ├── Run backend tests (Jest)                          │
│  ├── Run frontend tests (Vitest)                       │
│  └── Upload coverage to Codecov                        │
└──────────────────────┬──────────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐               ┌──────────────┐
│ Job 2:       │               │ Job 3:       │
│ sonarcloud   │               │ backup       │
│ (analisis)   │               │ (DB backup)  │
└──────┬───────┘               └──────┬───────┘
       │                               │
       └───────────────┬───────────────┘
                       ▼
              ┌──────────────┐
              │ Job 4:       │
              │ deploy       │
              │ (git pull +  │
              │  docker)     │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Job 5:       │
              │ health-check │
              │ (45s wait +  │
              │  curl test)  │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Job 6:       │
              │ e2e-tests    │
              │ (Playwright) │
              │ [opcional]   │
              └──────────────┘
```

## Jobs Detallados

### Job 1: Validate

**Proposito:** Verificar que el codigo compila, pasa lint y tests.

| Paso | Descripcion |
|------|-------------|
| Checkout | Clonar repositorio |
| Setup pnpm | Instalar pnpm |
| Setup Node.js | Node 20 con cache de pnpm |
| Install | `pnpm install --frozen-lockfile` |
| Lint Backend | `pnpm --filter backend lint` |
| Lint Frontend | `pnpm --filter frontend lint` |
| Prisma Generate | Generar cliente de Prisma |
| Backend Tests | `pnpm --filter backend test:cov` |
| Frontend Tests | `pnpm --filter frontend test:coverage` |

### Job 2: SonarCloud

**Proposito:** Analisis de calidad de codigo.

- Detecta code smells, bugs, vulnerabilidades
- Verifica cobertura de tests
- Quality Gate debe pasar para continuar

### Job 3: Backup

**Proposito:** Respaldar base de datos antes del deploy.

```bash
# Crea backup en /var/www/align-designs/backups/
pg_dump ... > backup_YYYYMMDD_HHMMSS.sql
```

### Job 4: Deploy

**Proposito:** Desplegar cambios al servidor.

```bash
cd /var/www/align-designs
git pull origin main
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
docker exec backend-dev npx prisma migrate deploy
docker image prune -f
```

### Job 5: Health Check

**Proposito:** Verificar que los servicios esten funcionando.

| Endpoint | Esperado |
|----------|----------|
| `/api/v1/health` | 200 OK |
| `/` (frontend) | 200 OK |

Si falla: rollback automatico.

### Job 6: E2E Tests (Opcional)

**Proposito:** Tests end-to-end con Playwright.

- Solo se ejecuta si `E2E_ADMIN_PASSWORD` esta configurado
- Prueba flujos completos: login, crear proyecto, etc.

## Secrets Requeridos

| Secret | Descripcion |
|--------|-------------|
| `DEV_SERVER_SSH_KEY` | Llave SSH para conectar al servidor |
| `SONAR_TOKEN` | Token de SonarCloud |
| `E2E_ADMIN_PASSWORD` | Password para tests E2E (opcional) |

## Archivo de Configuracion

`.github/workflows/deploy-dev.yml`

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| Tests fallan | Ver logs en GitHub Actions |
| SonarCloud falla | Ver issues en sonarcloud.io |
| Deploy falla | Revisar SSH key, verificar servidor |
| Health check falla | Ver `/docker-logs`, rollback automatico |

## Ver Tambien

- [/github-actions skill](./../.claude/skills/github-actions/) - Debug del pipeline
- [/deploy-status skill](./../.claude/skills/deploy-status/) - Estado del servidor
- [/sonar-fix skill](./../.claude/skills/sonar-fix/) - Corregir issues de SonarCloud