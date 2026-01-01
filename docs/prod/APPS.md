# Apps

Este directorio contiene todas las aplicaciones del monorepo.

## 📦 Aplicaciones

### [backend/](backend/)

Backend API construido con NestJS 10.

**Stack:**
- NestJS 10
- TypeScript
- Prisma ORM
- PostgreSQL
- MinIO S3
- JWT Authentication
- OTP System

**Puerto:** 4000

**Comandos:**
```bash
# Desde la raíz
pnpm dev:backend      # Desarrollo
pnpm build:backend    # Build
ppnpm start:backend    # Producción
pnpm prisma:generate  # Generar Prisma Client
pnpm prisma:studio    # Abrir Prisma Studio
```

**Documentación:** Ver [backend/README.md](backend/README.md)

---

### [frontend/](frontend/)

Frontend web construido con Next.js 15.

**Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Axios

**Puerto:** 3000

**Comandos:**
```bash
# Desde la raíz
pnpm dev:frontend     # Desarrollo
pnpm build:frontend   # Build
ppnpm start:frontend   # Producción
```

**Documentación:** Ver [frontend/README.md](frontend/README.md)

---

## 🚀 Desarrollo

### Iniciar Todas las Apps

```bash
pnpm dev
```

Esto inicia backend (4000) y frontend (3000) simultáneamente.

### Iniciar Apps Individualmente

```bash
# Solo backend
pnpm dev:backend

# Solo frontend
pnpm dev:frontend
```

## 📝 Agregar Nueva App

Para agregar una nueva aplicación al monorepo:

1. Crea una nueva carpeta en `apps/`:
   ```bash
   mkdir apps/nueva-app
   cd apps/nueva-app
   npm init -y
   ```

2. El `package.json` raíz detectará automáticamente el nuevo workspace.

3. Instala dependencias desde la raíz:
   ```bash
   pnpm install --workspace=apps/nueva-app <paquete>
   ```

4. Agrega scripts en el `package.json` raíz si es necesario.

## 🔗 Compartir Código Entre Apps

Para compartir código entre aplicaciones, crea un paquete interno:

```bash
mkdir -p packages/shared
cd packages/shared
npm init -y
```

Luego actualiza `package.json` raíz:
```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

## 📚 Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
