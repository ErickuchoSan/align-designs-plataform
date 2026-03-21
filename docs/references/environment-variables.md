# Variables de Entorno

> Referencia de variables de entorno para el proyecto Align Designs.
>
> **NOTA:** Para credenciales reales, ver `.claude/PROJECT.md` (archivo local, no en Git).

## Backend (`apps/backend/.env`)

### Base de Datos

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexion PostgreSQL | `postgresql://user:pass@localhost:5432/dbname` |

### Autenticacion

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET` | Secret para firmar JWT (min 32 chars) | `your-super-secret-key-here` |
| `JWT_EXPIRES_IN` | Tiempo de expiracion access token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo de expiracion refresh token | `7d` |

### Storage (DigitalOcean Spaces / S3-compatible)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `STORAGE_ENDPOINT` | Endpoint S3 | `sfo3.digitaloceanspaces.com` |
| `STORAGE_PORT` | Puerto (443 para SSL) | `443` |
| `STORAGE_ACCESS_KEY` | Access key de DO Spaces | `DO801XXXXX` |
| `STORAGE_SECRET_KEY` | Secret key de DO Spaces | `your-secret-key` |
| `STORAGE_BUCKET` | Nombre del bucket | `aligndesigns-dev` |
| `STORAGE_USE_SSL` | Usar HTTPS | `true` |
| `STORAGE_REGION` | Region del bucket | `sfo3` |
| `STORAGE_SKIP_BUCKET_CHECK` | Omitir verificacion de bucket | `true` |

> **Nota**: El proyecto usa DigitalOcean Spaces (servicio S3-compatible).
> Funciona con cualquier servicio S3-compatible (AWS S3, MinIO, Backblaze B2, etc.)

### Servidor

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del backend | `3001` |
| `NODE_ENV` | Entorno | `development` |

## Frontend (`apps/frontend/.env`)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend | `http://localhost:3001` |
| `NEXT_PUBLIC_USE_BLOB_URLS` | Usar blob URLs para archivos | `true` |

## Plantilla de Configuracion

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Auth
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Storage (DigitalOcean Spaces / S3-compatible)
STORAGE_ENDPOINT=sfo3.digitaloceanspaces.com
STORAGE_PORT=443
STORAGE_ACCESS_KEY=your-do-spaces-access-key
STORAGE_SECRET_KEY=your-do-spaces-secret-key
STORAGE_BUCKET=aligndesigns-dev
STORAGE_USE_SSL=true
STORAGE_REGION=sfo3
STORAGE_SKIP_BUCKET_CHECK=true

# Server
PORT=3001
NODE_ENV=development
```

### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_BLOB_URLS=true
```

## SSH Tunnel para Desarrollo Local

Para conectar a la base de datos remota desde tu maquina local:

```powershell
.\scripts\ssh-tunnel.ps1
```

Esto mapea:
- `localhost:5433` -> Servidor PostgreSQL remoto

> **Nota**: Storage usa DigitalOcean Spaces (cloud), no requiere tunnel.

## Seguridad

- **NUNCA** commitear archivos `.env` al repositorio
- Credenciales reales estan en `.claude/PROJECT.md` (local)
- Usar GitHub Secrets para CI/CD
- Rotar JWT_SECRET periodicamente en produccion
