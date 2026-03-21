# Instrucciones para Claude - Align Designs Platform

## REGLA PRINCIPAL: Revisar Skills ANTES de Implementar

**IMPORTANTE**: Antes de implementar CUALQUIER cambio o tarea, SIEMPRE:

1. **Revisar las skills disponibles** en `.claude/skills/` para ver cuáles aplican
2. **Leer las referencias** de las skills relevantes para seguir los patrones del proyecto
3. **Solo entonces** proceder con la implementación

### Skills del Proyecto

| Skill | Cuándo Usar |
|-------|-------------|
| `/deploy-status` | Estado del servidor, health checks |
| `/server-ssh` | Comandos en el servidor remoto |
| `/prisma-ops` | Migraciones, base de datos |
| `/sonar-fix` | Issues de calidad de código |
| `/docker-logs` | Debug de errores en producción |
| `/github-actions` | CI/CD, pipeline de deploy |
| `/frontend-review` | Cambios en Next.js/React |
| `/backend-review` | Cambios en NestJS |
| `/database-review` | Cambios en Prisma/PostgreSQL |
| `/security-audit` | Cambios de seguridad |
| `/nestjs-patterns` | Patrones del backend |
| `/backend-tests` | Tests unitarios del backend (Jest) |
| `/e2e-tests` | Tests E2E con Playwright |
| `/minio-storage` | Operaciones de archivos (S3-compatible) |
| `/server-security` | Seguridad: fail2ban, UFW, SSH hardening |
| `/test-generator` | Generar tests automáticamente |
| `/performance-analyzer` | Análisis de rendimiento |
| `/dependency-health` | Salud de dependencias |

### Flujo de Trabajo Obligatorio

```
1. Usuario pide algo
2. PRIMERO: Identificar qué skills aplican
3. SEGUNDO: Revisar referencias de esas skills
4. TERCERO: Implementar siguiendo los patrones
5. CUARTO: Commit y push si aplica
```

## Configuración del Proyecto

Ver `.claude/PROJECT.md` para:
- Credenciales del servidor (144.126.221.76)
- Conexión SSH (puerto 29)
- Base de datos y MinIO
- Comandos útiles

## Patrones de Código

### Frontend (Next.js)
- Usar hooks custom en `apps/frontend/hooks/`
- Estilos en `apps/frontend/lib/styles.ts`
- Validación con toast para errores de usuario
- FormData para uploads (NO JSON.stringify archivos)

### Backend (NestJS)
- Permisos de stage en `apps/backend/src/common/helpers/stage-permissions.helper.ts`
- Validación con class-validator
- Manejo de errores con excepciones HTTP

### Base de Datos
- Prisma schema en `apps/backend/prisma/schema.prisma`
- SSH tunnel para desarrollo local: `.\scripts\ssh-tunnel.ps1`
- Puerto SSH: 29 (NO 22)

## Testing

### Frontend (Vitest)
- Tests en `apps/frontend/**/__tests__/`
- Ejecutar: `pnpm --filter frontend test`
- Coverage: `pnpm --filter frontend test:coverage`
- Hooks: `usePagination`, `useModal`, `useClickOutside`
- Utils: `AuthStorage`, `SafeStorage`

### Backend (Jest)
- Tests en `apps/backend/src/**/*.spec.ts`
- Ejecutar: `pnpm --filter backend test`
- Coverage: `pnpm --filter backend test:cov`

### E2E (Playwright)
- Tests en `e2e/*.spec.ts`
- Ejecutar: `pnpm test:e2e`
- Requiere servidor corriendo

## CI/CD

Push a `main` → Build → Tests → SonarCloud → Deploy → Health Check → E2E

El workflow está en `.github/workflows/deploy-dev.yml`

### Jobs del Pipeline
1. `validate` - Build, lint, tests con coverage
2. `sonarcloud` - Análisis de código
3. `backup` - Backup de DB
4. `deploy` - Deploy a Digital Ocean
5. `health-check` - Verificar servicios
6. `e2e-tests` - Tests E2E (si `E2E_ADMIN_PASSWORD` está configurado)
