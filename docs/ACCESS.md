# Accesos e Infraestructura

## Hyper‑V
- VM: Ebionix-Software-Design
- ISO: Ubuntu Server 22.04.5 LTS
- Recursos: 2 vCPU, 6 GB RAM, 80 GB disco
- Red: External-Switch (conectado a adaptador físico "Ethernet")
- IP: 192.168.0.139 (DHCP automático)
- Usuario SO: erick
- Contraseña SO: NoloseMaquinaVirtual12345
- Conexión SSH: ssh erick@192.168.0.139

**⚠️ Cambio Importante (16/11/2025)**:
- IP anterior: 172.24.215.214 (NAT-Internal - no funcionaba)
- IP actual: 192.168.0.139 (External Switch - totalmente funcional)

## Base de datos
- Motor: PostgreSQL 16 en Docker
- Host: 192.168.0.139
- Base: AlignDesignsDemo
- Usuario admin: postgres
- Contraseña admin: NolosePostgres12345!
- Usuario app: Alfonso
- Contraseña app: NoloseBaseDeDatos12345@
- Puerto: 5432
- Conexión: `psql -h 192.168.0.139 -U Alfonso -d AlignDesignsDemo`

## MinIO (Almacenamiento S3)
- Host: 192.168.0.139
- Usuario: aligndesigns
- Contraseña: NoloseMinIO12345!
- Puerto API: 9000
- Puerto Consola Web: 9001
- Consola Web: http://192.168.0.139:9001
- Health Check: http://192.168.0.139:9000/minio/health/ready
- Bucket: align-designs
- Variables: `infra/.env` (VM) y `backend/.env` (Windows)

## Aplicación web
- Admin inicial: Alfonzo Guzman
- Email: alf.guzman@outlook.com
- Contraseña: NoloseAlfonso12345
- Teléfono: +19565344110
- Roles: Admin, Cliente

## Flujo funcional
- Admin registra clientes (email, datos básicos)
- Cliente inicia sesión por email → recibe OTP temporal → define contraseña
- Proyectos: creados por Admin o Cliente; asignación obligatoria a cliente
- Archivos: ambos suben; Admin elimina cualquiera; Cliente solo los suyos
- Vistas: Admin ve todos los proyectos; Cliente solo asignados

## Seguridad
- Secretos en `.env` y gestor de contraseñas
- OTP expira en 10 minutos, un solo uso
- Auditoría de eliminación de archivos
- Backups de volúmenes y dumps regulares

## Puesta en marcha

### 1. Infraestructura (VM)
```bash
# Conectar a la VM
ssh erick@192.168.0.139

# Navegar al directorio de infraestructura
cd ~/infra

# Levantar contenedores
sudo docker compose up -d

# Verificar estado
sudo docker ps
```

### 2. Backend (Windows)
```bash
# Navegar al backend
cd "D:\Desarrollos\Align Designs\align-designs-demo\backend"

# Configurar .env con IP de la VM
MINIO_ENDPOINT=192.168.0.139

# Instalar dependencias (primera vez)
npm install

# Ejecutar migraciones (primera vez)
npx prisma generate
npx prisma migrate deploy

# Iniciar backend en desarrollo
npm run start:dev
```

### 3. Frontend (Windows)
```bash
# Navegar al frontend
cd "D:\Desarrollos\Align Designs\align-designs-demo\frontend"

# Instalar dependencias (primera vez)
npm install

# Iniciar frontend en desarrollo
npm run dev
```

### 4. Verificaciones
```bash
# Test de conectividad a MinIO
curl http://192.168.0.139:9000/minio/health/ready

# Acceder a servicios
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - MinIO Console: http://192.168.0.139:9001
# - PostgreSQL: psql -h 192.168.0.139 -U Alfonso -d AlignDesignsDemo
```