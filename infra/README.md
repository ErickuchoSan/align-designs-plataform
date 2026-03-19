# Local Development Infrastructure

Docker Compose configuration for running PostgreSQL and MinIO locally.

## Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your credentials
# (any values work for local development)

# 3. Start services
docker compose up -d

# 4. Verify services are running
docker compose ps
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| MinIO | 9000 | S3-compatible storage |
| MinIO Console | 9001 | Web UI for storage |

## Files

```
infra/
├── compose.yml           # Docker Compose config
├── .env.example          # Environment template
├── .env                  # Your local config (gitignored)
├── db/
│   └── postgres/
│       ├── Dockerfile    # Custom PostgreSQL image
│       └── init/         # Initialization scripts
└── scripts/
    ├── build-and-up.sh   # Linux/Mac start script
    ├── build-and-up.ps1  # Windows start script
    ├── bootstrap-ubuntu.sh  # Server bootstrap
    └── hyperv-create-vm.ps1 # Hyper-V VM creation
```

## Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
```

## Connection Strings

### PostgreSQL
```
Host: localhost
Port: 5432
Database: AlignDesignsPlatform
User: postgres
Password: (from .env)
```

### MinIO
```
Endpoint: http://localhost:9000
Console: http://localhost:9001
Access Key: (MINIO_USER from .env)
Secret Key: (MINIO_PASSWORD from .env)
```

## Notes

- Data is persisted in Docker volumes (`postgres_data`, `minio_data`)
- For production deployment, see `.claude/skills/` documentation
- The init scripts in `db/postgres/init/` run on first container start
