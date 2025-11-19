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
npm install
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
npm run dev

# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:frontend
```

### Build

```bash
# Build de todas las apps
npm run build

# Solo backend
npm run build:backend

# Solo frontend
npm run build:frontend
```

### Producción

```bash
# Iniciar ambas apps en modo producción
npm start

# Solo backend
npm start:backend

# Solo frontend
npm start:frontend
```

### Prisma

```bash
# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio
```

### Testing

```bash
# Tests de todas las apps
npm test

# Solo backend
npm test:backend

# Solo frontend
npm test:frontend
```

### Linting

```bash
# Lint de todas las apps
npm run lint

# Solo backend
npm run lint:backend

# Solo frontend
npm run lint:frontend
```

## 📝 Cambios en package.json

### Raíz (`package.json`)

Se agregó:
- `"workspaces": ["apps/*"]` - Define que apps/* son workspaces
- Scripts unificados que ejecutan comandos en todos los workspaces
- `concurrently` para ejecutar backend y frontend simultáneamente

### Backend (`apps/backend/package.json`)

**No requiere cambios** - Los scripts permanecen iguales:
- `npm run start:dev` sigue funcionando
- Prisma sigue en la misma ubicación relativa

### Frontend (`apps/frontend/package.json`)

**No requiere cambios** - Los scripts permanecen iguales:
- `npm run dev` sigue funcionando
- Next.js funciona igual

## 🔧 Ajustes de Configuración

### Variables de Entorno

Las variables de entorno **NO cambian**:

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL="postgresql://Alfonso:NoloseBaseDeDatos12345@@192.168.0.139:5432/AlignDesignsDemo?schema=aligndesigns"
MINIO_ENDPOINT=192.168.0.139
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
npm run dev:backend
```

Debe iniciar en `http://localhost:4000`

### 2. Frontend Funciona

```bash
npm run dev:frontend
```

Debe iniciar en `http://localhost:3000`

### 3. Ambos Simultáneamente

```bash
npm run dev
```

Debe iniciar ambos servicios

### 4. Prisma Studio

```bash
npm run prisma:studio
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
npm run clean
npm install
```

### Backend no encuentra Prisma Client

```bash
# Regenera Prisma Client
npm run prisma:generate
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
✅ **Instalación unificada** - Un solo `npm install`
✅ **Comandos centralizados** - Scripts en la raíz ejecutan todo
✅ **Desarrollo simultáneo** - Backend y frontend con un comando
✅ **Consistencia de versiones** - Dependencias compartidas
✅ **CI/CD simplificado** - Un solo pipeline

## 🔗 Recursos

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)

---

¿Preguntas? Consulta la documentación en `docs/` o abre un issue.
