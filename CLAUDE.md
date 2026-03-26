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
| `/minio-storage` | Storage con DigitalOcean Spaces (S3-compatible) |
| `/server-security` | Seguridad: fail2ban, UFW, SSH hardening |
| `/test-generator` | Generar tests automáticamente |
| `/performance-analyzer` | Análisis de rendimiento |
| `/dependency-health` | Salud de dependencias |
| `/webapp-testing` | Verificación visual con Playwright |
| `/tanstack-query` | Data fetching y cache en frontend |
| `/zod-validation` | Validación de schemas type-safe |
| `/date-fns` | Manipulación de fechas |
| `/pino-logging` | Logging estructurado de alto rendimiento |
| `/nestjs-cls` | Contexto de request (AsyncLocalStorage) |
| `/framer-motion` | Animaciones en React |
| `/sonner-toasts` | Notificaciones toast modernas |

### Flujo de Trabajo Obligatorio

```
1. Usuario pide algo
2. PRIMERO: Identificar qué skills aplican
3. SEGUNDO: Revisar referencias de esas skills
4. TERCERO: Implementar siguiendo los patrones
5. CUARTO: Commit y push si aplica
```

## Configuración del Proyecto

Ver `.claude/PROJECT.md` para credenciales completas.

### Servidores

| Entorno | IP | Dominio | Clave SSH |
|---------|-----|---------|-----------|
| **Desarrollo** | 144.126.221.76 | dev.aligndesignsllc.com | `aligndesigns-dev.key` |
| **Producción** | 64.23.223.235 | aligndesignsllc.com | `aligndesigns-prod.key` |

Puerto SSH: **29** (ambos servidores)

## Patrones de Código

### Frontend (Next.js)
- Usar hooks custom en `apps/frontend/hooks/`
- Estilos en `apps/frontend/lib/styles.ts`
- Validación con toast para errores de usuario
- FormData para uploads (NO JSON.stringify archivos)

### Backend (NestJS)
- Permisos de stage en `apps/backend/src/common/helpers/stage-permissions.helper.ts`
- **Validación con Zod** - 100% migrado, ver `/zod-validation` skill
- Schemas en `apps/backend/src/*/schemas/`
- Pipe: `zodPipe(Schema)` en controllers
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

## Verificación Visual con Playwright MCP

Cuando hagas cambios de UI, fixes visuales, o cualquier modificación que afecte la interfaz:

### Flujo de Verificación (Loop)

```
1. Hacer el cambio de código
2. Abrir el navegador con Playwright MCP (browser_navigate)
3. Navegar a la página afectada
4. Tomar screenshot (browser_screenshot)
5. Leer la consola por errores JavaScript
6. Evaluar el resultado:
   - ¿Se ve correcto visualmente?
   - ¿Hay errores en consola?
   - ¿Funciona la interacción esperada?
7. Si hay problemas → corregir y repetir desde paso 1
8. Si todo está bien → continuar con la tarea
```

### Herramientas MCP Disponibles

El proyecto tiene configurado en `.mcp.json`:
- **Playwright MCP**: `browser_navigate`, `browser_screenshot`, `browser_click`, `browser_type`
- **Puppeteer MCP**: Alternativa para control de Chrome

### Cuándo Usar Verificación Visual

| Situación | Acción |
|-----------|--------|
| Cambios de CSS/Tailwind | Verificar visualmente |
| Nuevos componentes | Screenshot + revisar consola |
| Fixes de layout | Comparar antes/después |
| Cambios en formularios | Probar interacción |
| Errores reportados por usuario | Reproducir y verificar fix |

### Ejemplo de Uso

```
Usuario: "El botón de login está desalineado"

1. Navegar a /login
2. Screenshot para ver el problema
3. Identificar el CSS incorrecto
4. Hacer el fix
5. Screenshot para verificar
6. Si se ve bien → commit
7. Si no → repetir
```

### Skill Relacionada

Usa `/webapp-testing` para scripts más complejos de automatización con Playwright.

## CI/CD

### Desarrollo (Automático)

Push a `main` despliega automáticamente a **desarrollo**:

```
Push to main → validate → sonarcloud → backup → deploy-dev → health-check
```

Workflow: `.github/workflows/deploy-dev.yml`

### Producción (Manual)

Después de verificar que desarrollo funciona (mostrar al cliente si es necesario):

```
GitHub Actions → "Deploy to Production" → Run workflow
```

Workflow: `.github/workflows/deploy-prod.yml`

### Flujo Recomendado

1. Push cambios a `main` → deploya a desarrollo automáticamente
2. Verificar en http://144.126.221.76 que todo funciona
3. Mostrar al cliente si es necesario
4. Cuando esté listo: GitHub Actions → "Deploy to Production"

### Features de Seguridad

- **Backup automático** antes de cada deploy a producción
- **Rollback automático** si health check de producción falla
- **Rollback manual** disponible via workflow manual
- **Retención**: últimos 5 backups
