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

### MinIO (Storage)

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `MINIO_ENDPOINT` | Host de MinIO | `localhost` |
| `MINIO_PORT` | Puerto de MinIO | `9000` |
| `MINIO_ACCESS_KEY` | Access key | `minioadmin` |
| `MINIO_SECRET_KEY` | Secret key | `minioadmin` |
| `MINIO_BUCKET` | Nombre del bucket | `dev-bucket` |
| `MINIO_USE_SSL` | Usar HTTPS | `false` |

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

# MinIO Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=dev-bucket
MINIO_USE_SSL=false

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
- `localhost:9000` -> Servidor MinIO remoto

## Seguridad

- **NUNCA** commitear archivos `.env` al repositorio
- Credenciales reales estan en `.claude/PROJECT.md` (local)
- Usar GitHub Secrets para CI/CD
- Rotar JWT_SECRET periodicamente en produccion