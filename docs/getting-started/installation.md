# Instalacion

> Guia para configurar el entorno de desarrollo local de Align Designs Platform.

## Prerrequisitos

| Herramienta | Version | Instalacion |
|-------------|---------|-------------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

## Pasos de Instalacion

### 1. Clonar el Repositorio

```bash
git clone https://github.com/ErickuchoSan/align-designs-plataform.git
cd align-designs-plataform
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env
```

Edita los archivos `.env` con tus credenciales. Ver [environment-variables.md](../references/environment-variables.md) para detalles.

### 4. Configurar Base de Datos (Desarrollo)

**Opcion A: SSH Tunnel al servidor de desarrollo**

```powershell
# En PowerShell (mantener abierto)
.\scripts\ssh-tunnel.ps1
```

Esto conecta `localhost:5433` al PostgreSQL del servidor de desarrollo.

**Opcion B: PostgreSQL local con Docker**

```bash
docker-compose -f docker-compose.local.yml up -d postgres
```

### 5. Generar Cliente Prisma

```bash
pnpm --filter backend exec prisma generate
```

### 6. Iniciar Servicios

```bash
# Terminal 1: Backend
pnpm --filter backend dev

# Terminal 2: Frontend
pnpm --filter frontend dev
```

### 7. Verificar Instalacion

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1/health
- Swagger Docs: http://localhost:3001/api/docs

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| `ECONNREFUSED` en Prisma | Verificar que SSH tunnel esta activo |
| Puerto 3000 en uso | Cerrar otras instancias de Next.js |
| `prisma generate` falla | Ejecutar `pnpm install` de nuevo |

## Siguiente Paso

Ver [first-run.md](./first-run.md) para crear tu primer usuario admin.