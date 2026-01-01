# Guía de Migración a Monorepo

Esta guía te ayudará a migrar el proyecto de estructura separada a monorepo.

## 📁 Nueva Estructura

```
align-designs-demo/              # Raíz del monorepo
├── apps/
│   ├── backend/                 # Backend NestJS (antes: ./backend)
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── ...
│   └── frontend/                # Frontend Next.js (antes: ./frontend)
│       ├── app/
│       ├── components/
│       ├── package.json
│       └── ...
├── docs/                        # Documentación del proyecto
├── infra/                       # Infraestructura (Docker, VM)
├── package.json                 # Configuración del monorepo
├── .gitignore                   # Gitignore global
└── README.md                    # README principal
```

## 🔄 Pasos de Migración

### Paso 1: Detener Servicios en Ejecución

```bash
# Detener backend y frontend actuales
# Cierra las terminales o presiona Ctrl+C en cada una
```

### Paso 2: Mover Carpetas a apps/

```bash
# Desde la raíz del proyecto
cd "d:\Desarrollos\Align Designs\align-designs-demo"

# Mover backend
move backend apps\backend

# Mover frontend
move frontend apps\frontend
```

### Paso 3: Limpiar node_modules Antiguos

```bash
# Eliminar node_modules de cada app
rmdir /s /q apps\backend\node_modules
rmdir /s /q apps\frontend\node_modules
```

### Paso 4: Instalar Dependencias

```bash
# Desde la raíz del monorepo
pnpm install
```

Esto instalará:
1. Dependencias de la raíz (concurrently)
2. Dependencias de `apps/backend`
3. Dependencias de `apps/frontend`

### Paso 5: Verificar Instalación

```bash
# Verificar que workspaces estén configurados
npm list --workspaces --depth=0
```

Deberías ver algo como:
```
align-designs-demo@1.0.0
└── apps
    ├── backend@0.0.1
    └── frontend@0.1.0
```

## 🚀 Comandos Disponibles

### Desarrollo

```bash
# Iniciar backend y frontend simultáneamente
pnpm dev

# Solo backend
pnpm dev:backend

# Solo frontend
pnpm dev:frontend
```

### Build

```bash
# Build de todas las apps
pnpm build

# Solo backend
pnpm build:backend

# Solo frontend
pnpm build:frontend
```

### Producción

```bash
# Iniciar ambas apps en modo producción
pnpm start

# Solo backend
pnpm start:backend

# Solo frontend
pnpm start:frontend
```

### Prisma

```bash
# Generar Prisma Client
pnpm prisma:generate

# Ejecutar migraciones
pnpm prisma:migrate

# Abrir Prisma Studio
pnpm prisma:studio
```

### Testing

```bash
# Tests de todas las apps
pnpm test

# Solo backend
pnpm test:backend

# Solo frontend
pnpm test:frontend
```

### Linting

```bash
# Lint de todas las apps
pnpm lint

# Solo backend
pnpm lint:backend

# Solo frontend
pnpm lint:frontend
```

## 📝 Cambios en package.json

### Raíz (`package.json`)

Se agregó:
- `"workspaces": ["apps/*"]` - Define que apps/* son workspaces
- Scripts unificados que ejecutan comandos en todos los workspaces
- `concurrently` para ejecutar backend y frontend simultáneamente

### Backend (`apps/backend/package.json`)

**No requiere cambios** - Los scripts permanecen iguales:
- `ppnpm start:dev` sigue funcionando
- Prisma sigue en la misma ubicación relativa

### Frontend (`apps/frontend/package.json`)

**No requiere cambios** - Los scripts permanecen iguales:
- `pnpm dev` sigue funcionando
- Next.js funciona igual

## 🔧 Ajustes de Configuración

### Variables de Entorno

Las variables de entorno **NO cambian**:

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL="postgresql://your_app_user:YOUR_APP_PASSWORD@YOUR_SERVER_IP:5432/AlignDesignsPlatform?schema=your_minio_user"
MINIO_ENDPOINT=YOUR_SERVER_IP
# ... resto igual
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Rutas en Documentación

Actualizar referencias de rutas en documentación:
- `backend/` → `apps/backend/`
- `frontend/` → `apps/frontend/`

## ✅ Verificación Post-Migración

### 1. Backend Funciona

```bash
pnpm dev:backend
```

Debe iniciar en `http://localhost:4000`

### 2. Frontend Funciona

```bash
pnpm dev:frontend
```

Debe iniciar en `http://localhost:3000`

### 3. Ambos Simultáneamente

```bash
pnpm dev
```

Debe iniciar ambos servicios

### 4. Prisma Studio

```bash
pnpm prisma:studio
```

Debe abrir en `http://localhost:5555`

## 🐛 Troubleshooting

### Error: "workspace not found"

```bash
# Verifica que la estructura sea correcta
ls apps/

# Debe mostrar: backend  frontend
```

### Error: "Cannot find module"

```bash
# Reinstala todas las dependencias
pnpm clean
pnpm install
```

### Backend no encuentra Prisma Client

```bash
# Regenera Prisma Client
pnpm prisma:generate
```

### Puerto en uso

```bash
# Windows - Liberar puerto 4000
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Windows - Liberar puerto 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 📚 Ventajas del Monorepo

✅ **Un solo repositorio Git** - Todo el código en un solo lugar
✅ **Instalación unificada** - Un solo `pnpm install`
✅ **Comandos centralizados** - Scripts en la raíz ejecutan todo
✅ **Desarrollo simultáneo** - Backend y frontend con un comando
✅ **Consistencia de versiones** - Dependencias compartidas
✅ **CI/CD simplificado** - Un solo pipeline

## 🔗 Recursos

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)

---

¿Preguntas? Consulta la documentación en `docs/` o abre un issue.
