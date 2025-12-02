# Accesos e Infraestructura

> ⚠️ **NOTA DE SEGURIDAD:** Este archivo contiene placeholders. Para configuración real de desarrollo, consulta `docs/dev/ACCESS.md` (no versionado en Git).

## Hyper‑V
- VM: Your-VM-Name
- ISO: Ubuntu Server 22.04+ LTS
- Recursos: 2 vCPU, 6 GB RAM, 80 GB disco
- Red: External-Switch (conectado a adaptador físico)
- IP: YOUR_SERVER_IP (DHCP automático o estática)
- Usuario SO: your_username
- Contraseña SO: YOUR_VM_PASSWORD
- Conexión SSH: `ssh your_username@YOUR_SERVER_IP`

**Configuración de Red:**
- Usa External Switch para permitir conectividad desde el host
- La VM debe obtener IP del mismo segmento que tu red local
- Configura reglas de firewall según sea necesario

## Base de datos
- Motor: PostgreSQL 16 en Docker
- Host: YOUR_SERVER_IP
- Base: your_database_name
- Usuario admin: postgres
- Contraseña admin: YOUR_POSTGRES_ADMIN_PASSWORD
- Usuario app: your_app_user
- Contraseña app: YOUR_APP_USER_PASSWORD
- Puerto: 5432
- Conexión: `psql -h YOUR_SERVER_IP -U your_app_user -d your_database_name`

## MinIO (Almacenamiento S3)
- Host: YOUR_SERVER_IP
- Usuario: your_minio_user
- Contraseña: YOUR_MINIO_PASSWORD
- Puerto API: 9000
- Puerto Consola Web: 9001
- Consola Web: http://YOUR_SERVER_IP:9001
- Health Check: http://YOUR_SERVER_IP:9000/minio/health/ready
- Bucket: your-bucket-name
- Variables: `infra/.env` (VM) y `backend/.env` (Windows)

## Aplicación web
- Admin inicial: Admin User
- Email: admin@yourcompany.com
- Contraseña: YOUR_ADMIN_PASSWORD
- Teléfono: +1234567890
- Roles: Admin, Cliente

## Flujo funcional
- Admin registra clientes (email, datos básicos)
- Cliente inicia sesión por email → recibe OTP temporal → define contraseña
- Proyectos: creados por Admin o Cliente; asignación obligatoria a cliente
- Archivos: ambos suben; Admin elimina cualquiera; Cliente solo los suyos
- Vistas: Admin ve todos los proyectos; Cliente solo asignados

## Seguridad
- Secretos en `.env` y gestor de contraseñas (NUNCA en Git)
- OTP expira en 10 minutos, un solo uso
- Auditoría de eliminación de archivos
- Backups de volúmenes y dumps regulares

## Puesta en marcha

### 1. Infraestructura (VM)
```bash
# Conectar a la VM
ssh your_username@YOUR_SERVER_IP

# Navegar al directorio de infraestructura
cd ~/infra

# Levantar contenedores
sudo docker compose up -d

# Verificar estado
sudo docker ps
```

### 2. Backend (Windows/Host)
```bash
# Navegar al backend
cd "path/to/align-designs-demo/backend"

# Configurar .env con IP de la VM
MINIO_ENDPOINT=YOUR_SERVER_IP

# Instalar dependencias (primera vez)
npm install

# Ejecutar migraciones (primera vez)
npx prisma generate
npx prisma migrate deploy

# Iniciar backend en desarrollo
npm run start:dev
```

### 3. Frontend (Windows/Host)
```bash
# Navegar al frontend
cd "path/to/align-designs-demo/frontend"

# Instalar dependencias (primera vez)
npm install

# Iniciar frontend en desarrollo
npm run dev
```

### 4. Verificaciones
```bash
# Test de conectividad a MinIO
curl http://YOUR_SERVER_IP:9000/minio/health/ready

# Acceder a servicios
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - MinIO Console: http://YOUR_SERVER_IP:9001
# - PostgreSQL: psql -h YOUR_SERVER_IP -U your_app_user -d your_database_name
```

## Producción

Para producción, reemplaza:
- IP por dominio (example.com)
- Habilita SSL/TLS (HTTPS)
- Usa gestor de secretos (AWS Secrets Manager, Azure Key Vault)
- Configura backups automáticos
- Implementa monitoreo y alertas
