# Arquitectura de Infraestructura

## Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    Windows Host (Tu PC)                      │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  pgAdmin   │  │   Browser    │  │   VS Code / IDE     │ │
│  │  (5432)    │  │  (9001)      │  │                     │ │
│  └──────┬─────┘  └──────┬───────┘  └─────────────────────┘ │
│         │                │                                  │
│         │                │                                  │
└─────────┼────────────────┼──────────────────────────────────┘
          │                │
          │                │  SSH (22)
          │                │  ┌────────────────────────────────┐
          │                └──┤                                │
          │                   │  IP: 192.168.0.139             │
          │  PostgreSQL (5432)│                                │
          │  ┌────────────────┤  Hyper-V VM                    │
          │  │                │  "Ebionix-Software-Design"     │
          │  │                │                                │
          │  │   ┌────────────┴─────────────────────────────┐  │
          │  │   │  Ubuntu Server 22.04 LTS                 │  │
          │  │   │  User: erick                             │  │
          │  │   │  RAM: 6 GB, CPU: 2 cores, Disk: 80 GB    │  │
          │  │   │                                          │  │
          │  │   │  ┌──────────────────────────────────┐   │  │
          │  │   │  │  Docker Engine 29.0.1            │   │  │
          │  │   │  │                                  │   │  │
          │  │   │  │  ┌────────────────────────────┐  │   │  │
          │  └───┼──┼──┤ aligndesigns-postgres      │  │   │  │
          │      │  │  │ Image: infra-db (custom)   │  │   │  │
          │      │  │  │ Port: 5432                 │  │   │  │
          │      │  │  │ Volume: postgres_data      │  │   │  │
          │      │  │  │ DB: AlignDesignsDemo       │  │   │  │
          │      │  │  │ User: Alfonso / postgres   │  │   │  │
          │      │  │  └────────────────────────────┘  │   │  │
          │      │  │                                  │   │  │
          │      │  │  ┌────────────────────────────┐  │   │  │
          └──────┼──┼──┤ aligndesigns-minio         │  │   │  │
                 │  │  │ Image: minio/minio:latest  │  │   │  │
                 │  │  │ Ports: 9000, 9001          │  │   │  │
                 │  │  │ Volume: minio_data         │  │   │  │
                 │  │  └────────────────────────────┘  │   │  │
                 │  │                                  │   │  │
                 │  └──────────────────────────────────┘   │  │
                 │                                         │  │
                 └─────────────────────────────────────────┘  │
                                                              │
                                                              │
┌──────────────────────────────────────────────────────────────┘
│  Futuro: Backend NestJS (Puerto 3000)
│  Futuro: Frontend Next.js (Puerto 3001)
└─────────────────────────────────────────────────────────────
```

## Componentes

### 1. Hyper-V Virtual Machine

**Especificaciones:**
- **Nombre:** Ebionix-Software-Design
- **Generación:** 2 (UEFI)
- **Sistema Operativo:** Ubuntu Server 22.04.5 LTS
- **Recursos:**
  - **RAM:** 6 GB (6144 MB)
  - **CPU:** 2 vCPUs
  - **Disco:** 80 GB (dinámico, VHDX)
- **Red:** External-Switch (conectado a adaptador físico "Ethernet")
- **IP Asignada:** 192.168.0.139 (DHCP automático de la red local)

**Ubicación de archivos:**
```
D:\VMs\Ebionix-Software-Design\
├── Ebionix-Software-Design.vhdx      # Disco virtual (crece hasta 80GB)
└── Virtual Machines\                 # Configuración de la VM
```

**Configuración de Firmware:**
- Secure Boot: Habilitado (Microsoft UEFI CA)
- Boot Order: Disco Duro → DVD → Red

### 2. Ubuntu Server

**Versión:** 22.04.5 LTS (Jammy Jellyfish)
- **Kernel:** 5.15.0-161-generic
- **Arquitectura:** x86_64
- **Usuario del sistema:** erick
- **Hostname:** ebionix-software-design

**Particiones:**
```
/dev/sda1  → /boot/efi  (1 GB, fat32)   - Partición EFI
/dev/sda2  → /boot      (2 GB, ext4)    - Kernel y boot files
/dev/sda3  → LVM PV     (76.9 GB)       - Volume Group
  └─ ubuntu-vg
      ├─ ubuntu-lv → / (38.47 GB, ext4) - Sistema raíz
      └─ libre         (38.47 GB)       - Espacio para crecimiento futuro
```

**Servicios instalados:**
- SSH (OpenSSH Server) - Puerto 22
- Docker Engine 29.0.1
- Docker Compose Plugin 2.40.3

### 3. Docker Containers

#### Container 1: PostgreSQL

```yaml
Nombre: aligndesigns-postgres
Imagen: infra-db (custom build)
Base: postgres:16.11
Puerto: 5432
Volumen: infra_postgres_data → /var/lib/postgresql/data
Red: infra_default
Health Check: pg_isready -U postgres
```

**Base de Datos:**
- **Nombre:** AlignDesignsDemo
- **Esquema:** aligndesigns
- **Extensiones:**
  - `uuid-ossp` - Generación de UUIDs
  - `pgcrypto` - Funciones criptográficas

**Usuarios:**
```sql
-- Usuario administrativo (superuser)
Usuario: postgres
Password: NolosePostgres12345!
Permisos: Todos

-- Usuario de aplicación (limitado)
Usuario: Alfonso
Password: NoloseBaseDeDatos12345@
Permisos:
  - USAGE en schema aligndesigns
  - SELECT, INSERT, UPDATE, DELETE en todas las tablas
  - Permisos por defecto en nuevas tablas
```

**Scripts de Inicialización:**
```
/docker-entrypoint-initdb.d/
├── 01-init.sql     # Crea DB, schema, extensiones
└── 02-user.sql     # Crea usuario Alfonso y permisos
```

#### Container 2: MinIO

```yaml
Nombre: aligndesigns-minio
Imagen: minio/minio:latest
Puertos:
  - 9000: API (S3-compatible)
  - 9001: Consola Web
Volumen: infra_minio_data → /data
Red: infra_default
Comando: server /data --address ":9000" --console-address ":9001"
```

**⚠️ Importante**: El flag `--address ":9000"` es crítico. Sin él, MinIO puede no escuchar correctamente en todas las interfaces.

**Credenciales:**
- **Usuario:** aligndesigns
- **Password:** NoloseMinIO12345!

**Uso:** Almacenamiento de archivos del proyecto (archivos .zip, .pdf, .docx, imágenes, etc.)

**Documentación Detallada**: Ver [MINIO.md](./MINIO.md) para configuración completa, troubleshooting y uso.

### 4. Docker Compose Configuration

**Archivo:** `infra/compose.yml`

```yaml
services:
  db:
    container_name: aligndesigns-postgres
    build: ./db/postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: AlignDesignsDemo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  storage:
    container_name: aligndesigns-minio
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  minio_data:

networks:
  default:
    name: infra_default
```

## Networking

### Red Hyper-V

**Tipo:** External Switch (conectado al adaptador físico del host)

**Configuración de la VM:**
- **Adaptador:** eth0
- **Switch:** External-Switch
- **Tipo:** DHCP (automático)
- **IP Asignada:** 192.168.0.139 (obtenida del router/DHCP local)
- **Subnet:** 192.168.0.0/24
- **Gateway:** 192.168.0.1 (Router de la red local)

**⚠️ Nota Importante**: Cambio de arquitectura de red realizado el 16/11/2025:
- **Antes**: NAT-Internal switch → Bloqueaba acceso desde Windows host
- **Después**: External switch → Conectividad completa Windows ↔ VM

### Red Docker

**Nombre:** infra_default
**Driver:** bridge
**Subnet:** 172.18.0.0/16 (automático)

**Contenedores en la red:**
```
aligndesigns-postgres  → 172.18.0.2
aligndesigns-minio     → 172.18.0.3
```

Los contenedores pueden comunicarse entre sí usando sus nombres como hostname:
```bash
# Desde postgres:
ping storage  # → 172.18.0.3

# Desde minio:
ping db       # → 172.18.0.2
```

## Puertos Expuestos

### Desde Windows Host

| Servicio   | Puerto | Protocolo | Acceso                        |
|------------|--------|-----------|-------------------------------|
| SSH        | 22     | TCP       | ssh erick@192.168.0.139       |
| PostgreSQL | 5432   | TCP       | psql -h 192.168.0.139         |
| MinIO API  | 9000   | TCP       | http://192.168.0.139:9000     |
| MinIO Web  | 9001   | TCP       | http://192.168.0.139:9001     |

**Verificación de conectividad**:
```powershell
# Test de ping
ping 192.168.0.139

# Test de puertos específicos
Test-NetConnection -ComputerName 192.168.0.139 -Port 9000
Test-NetConnection -ComputerName 192.168.0.139 -Port 5432

# Health check de MinIO
curl http://192.168.0.139:9000/minio/health/ready
```

### Backend y Frontend (En desarrollo)

| Servicio      | Puerto | Protocolo | Acceso                        |
|---------------|--------|-----------|-------------------------------|
| NestJS API    | 4000   | HTTP      | http://localhost:4000         |
| Next.js App   | 3000   | HTTP      | http://localhost:3000         |

**Nota**: Backend y Frontend corren en Windows (no en la VM) y conectan a MinIO en la VM mediante la IP 192.168.0.139.

## Almacenamiento

### VM Host (Windows)

```
D:\
├── VMs\
│   └── Ebionix-Software-Design\
│       └── Ebionix-Software-Design.vhdx  (~10-80 GB, dinámico)
│
└── ISOs\
    └── ubuntu-24.04.1-live-server-amd64.iso  (2 GB)
```

### Dentro de la VM (Ubuntu)

```
/home/erick/
└── infra/                    # Configuración de Docker
    ├── .env                  # Variables de entorno
    ├── compose.yml           # Docker Compose
    ├── db/
    │   └── postgres/
    │       ├── Dockerfile
    │       └── init/
    │           ├── 01-init.sql
    │           └── 02-user.sql
    └── scripts/
        └── bootstrap-ubuntu.sh
```

### Volúmenes Docker

```bash
# Ver volúmenes
sudo docker volume ls

# Ubicación física
/var/lib/docker/volumes/
├── infra_postgres_data/      # ~100MB-1GB+ (depende de datos)
└── infra_minio_data/         # Dinámico (archivos subidos)
```

**Backup de volúmenes:**
```bash
# Postgres
sudo docker run --rm -v infra_postgres_data:/data -v /backup:/backup \
  alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data

# MinIO
sudo docker run --rm -v infra_minio_data:/data -v /backup:/backup \
  alpine tar czf /backup/minio-$(date +%Y%m%d).tar.gz /data
```

## Seguridad

### Firewall (UFW)

Actualmente **no configurado**. Para producción:

```bash
# Habilitar firewall
sudo ufw enable

# Permitir solo puertos necesarios
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 5432/tcp    # PostgreSQL
sudo ufw allow 9000:9001/tcp # MinIO

# Ver reglas
sudo ufw status verbose
```

### Secrets Management

**Actual:** Variables en `infra/.env` (archivo local, no versionado)

**Recomendación para producción:**
- Docker Secrets
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault

### PostgreSQL Security

```sql
-- Usuario Alfonso tiene permisos LIMITADOS:
NOSUPERUSER      -- No puede crear otros superusers
NOCREATEDB       -- No puede crear bases de datos
NOCREATEROLE     -- No puede crear otros roles
NOINHERIT        -- No hereda permisos de otros roles

-- Solo puede:
SELECT, INSERT, UPDATE, DELETE en schema aligndesigns
```

## Monitoreo y Logs

### Logs de Contenedores

```bash
# Ver logs en tiempo real
sudo docker logs -f aligndesigns-postgres
sudo docker logs -f aligndesigns-minio

# Ver últimas 100 líneas
sudo docker logs --tail 100 aligndesigns-postgres

# Ver logs con timestamps
sudo docker logs -t aligndesigns-postgres
```

### Métricas Docker

```bash
# Uso de recursos
sudo docker stats

# Inspeccionar contenedor
sudo docker inspect aligndesigns-postgres

# Ver eventos
sudo docker events
```

### Logs del Sistema

```bash
# Logs de Docker daemon
sudo journalctl -u docker.service

# Logs de SSH
sudo journalctl -u ssh.service

# Logs del sistema
sudo tail -f /var/log/syslog
```

## Comandos Útiles

### Gestión de la VM

```powershell
# Ver estado
Get-VM -Name 'Ebionix-Software-Design'

# Iniciar
Start-VM -Name 'Ebionix-Software-Design'

# Detener (apagado graceful)
Stop-VM -Name 'Ebionix-Software-Design'

# Forzar apagado
Stop-VM -Name 'Ebionix-Software-Design' -Force

# Reiniciar
Restart-VM -Name 'Ebionix-Software-Design'

# Snapshot
Checkpoint-VM -Name 'Ebionix-Software-Design' -SnapshotName "Pre-Backend-Dev"

# Eliminar
Remove-VM -Name 'Ebionix-Software-Design' -Force
```

### Gestión de Contenedores

```bash
# En la VM
cd ~/infra

# Levantar todo
sudo docker compose up -d

# Ver logs
sudo docker compose logs -f

# Detener todo
sudo docker compose down

# Detener y eliminar volúmenes
sudo docker compose down -v

# Rebuild sin caché
sudo docker compose build --no-cache

# Restart de un servicio específico
sudo docker compose restart db
```

## Próximos Pasos

1. ✅ Infraestructura Base Completa
2. ⏭️ Desarrollar Backend NestJS
3. ⏭️ Configurar Prisma ORM
4. ⏭️ Implementar autenticación JWT
5. ⏭️ Desarrollar Frontend Next.js
6. ⏭️ Configurar CI/CD
7. ⏭️ Desplegar a producción

Ver [DEVELOPMENT.md](./DEVELOPMENT.md) para continuar.
