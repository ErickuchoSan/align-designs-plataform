# Documentación del Proyecto Align Designs Demo

Bienvenido a la documentación completa del proyecto Align Designs Demo. Este proyecto implementa un sistema de gestión de proyectos con subida de archivos, autenticación por roles (Admin/Cliente) y OTP para clientes.

## 📚 Índice de Documentación

### 🚀 Guías de Inicio

1. **[SETUP.md](./SETUP.md)** - Guía completa de instalación paso a paso
   - Creación de la máquina virtual con Hyper-V
   - Instalación de Ubuntu Server
   - Configuración de Docker
   - Levantamiento de contenedores
   - Verificación de la infraestructura

### 🏗️ Arquitectura e Infraestructura

2. **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)** - Arquitectura completa del sistema
   - Diagrama de componentes
   - Especificaciones de la VM
   - Configuración de Docker Compose
   - Networking y puertos
   - Comandos útiles de administración

3. **[COMMENTS.md](./COMMENTS.md)** - ⭐ Sistema de Comentarios
   - Funcionalidades del sistema de comentarios
   - Arquitectura y modelo de datos
   - Implementación backend (DTOs, endpoints, servicios)
   - Implementación frontend (UI, handlers, filtros)
   - API Reference completa con ejemplos
   - Flujos de usuario paso a paso
   - Troubleshooting y mejoras futuras

4. **[HYPERV-NETWORKING.md](./HYPERV-NETWORKING.md)** - ⭐ Configuración de Red Hyper-V
   - Problema con NAT-Internal y solución con External Switch
   - Tipos de switches en Hyper-V
   - Configuración paso a paso
   - Troubleshooting de conectividad
   - Comandos útiles de red

5. **[MINIO.md](./MINIO.md)** - ⭐ MinIO - Almacenamiento S3
   - Por qué MinIO vs almacenamiento local
   - Arquitectura y configuración
   - API de subida/descarga de archivos
   - Consola web y gestión
   - Backup y restauración
   - Troubleshooting completo

6. **[DATABASE.md](./DATABASE.md)** - Documentación de la base de datos
   - Conexiones y credenciales
   - Modelo de datos (schema Prisma)
   - Permisos de usuarios
   - Queries útiles
   - Mantenimiento y backups
   - Troubleshooting

7. **[ACCESS.md](./ACCESS.md)** - Accesos y credenciales rápidas
   - Hyper-V VM (IP actualizada: 192.168.0.139)
   - Base de datos
   - MinIO
   - Aplicación web
   - Comandos de inicio rápido

---

## 🎯 Stack Tecnológico

### Backend
- **Framework:** NestJS 10
- **ORM:** Prisma
- **Base de Datos:** PostgreSQL 16
- **Autenticación:** JWT + OTP (One-Time Password)
- **Almacenamiento:** MinIO (S3-compatible)

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI / shadcn/ui
- **Forms:** React Hook Form + Zod
- **State Management:** Zustand / React Query

### Infraestructura
- **Virtualización:** Hyper-V
- **SO:** Ubuntu Server 22.04 LTS
- **Contenedores:** Docker + Docker Compose
- **Reverse Proxy (Futuro):** Nginx

---

## 📋 Estado del Proyecto

### ✅ Completado

**Infraestructura:**
- [x] Máquina virtual Hyper-V creada
- [x] Ubuntu Server 22.04.5 LTS instalado y configurado
- [x] Docker y Docker Compose instalados
- [x] PostgreSQL 16 corriendo en Docker
- [x] MinIO corriendo en Docker (S3-compatible storage)
- [x] Red Hyper-V configurada (External Switch para conectividad completa)
- [x] Base de datos `AlignDesignsDemo` creada
- [x] Usuario de aplicación `Alfonso` configurado
- [x] Esquema `aligndesigns` inicializado
- [x] Extensiones PostgreSQL instaladas (uuid-ossp, pgcrypto)

**Backend NestJS:**
- [x] Estructura de módulos (Auth, Users, Projects, Files, Storage)
- [x] Prisma schema y migraciones
- [x] Autenticación JWT (1 día de expiración)
- [x] Sistema OTP para clientes de 8 dígitos (10 minutos de expiración)
- [x] CRUD de usuarios con roles (ADMIN, CLIENT)
- [x] CRUD de proyectos
- [x] Upload de archivos a MinIO (hasta 8GB) con URLs firmadas (15 min)
- [x] Sistema de comentarios para archivos y proyectos
- [x] Comentarios sin archivos (entradas solo de texto)
- [x] Edición de comentarios y archivos
- [x] Permisos basados en roles (RBAC)
- [x] Eliminación de archivos con verificación de permisos
- [x] Recuperación de contraseña (Forgot/Reset Password)
- [x] Cambio de contraseña autenticado
- [x] Rate limiting en todos los endpoints críticos
- [x] Validación de magic numbers para prevenir file spoofing
- [x] Paginación en listado de archivos
- [x] Throttling personalizado por tipo de operación
- [x] Global exception filters para rate limiting

**Frontend Next.js:**
- [x] Configuración de Tailwind CSS
- [x] Layout y navegación con sidebar
- [x] Login para Admin con email + contraseña
- [x] Login OTP para Cliente (email → OTP de 8 dígitos → set password)
- [x] Dashboard con estadísticas (admin y cliente)
- [x] Gestión de proyectos (lista, crear, editar, eliminar)
- [x] Gestión de usuarios - Admin (lista, crear, editar, toggle status, eliminar)
- [x] Página de detalles de proyecto con lista de archivos
- [x] Upload de archivos hasta 8GB con comentario opcional
- [x] Barra de progreso en subida de archivos
- [x] Descarga de archivos con URLs firmadas temporales (15 min)
- [x] Sistema de comentarios en archivos
- [x] Creación de comentarios sin archivo adjunto
- [x] Edición de comentarios y archivos
- [x] Agregar archivos a comentarios existentes
- [x] Perfil de usuario con cambio de contraseña
- [x] Filtrado de archivos por nombre, tipo y "Solo Comentarios"
- [x] Roles y permisos en UI (admin ve todo, cliente solo lo suyo)
- [x] Prevención de envíos duplicados en formularios
- [x] Errores mostrados en contexto (modales)
- [x] Manejo correcto de respuestas paginadas
- [x] Validación defensiva de datos (type checking)

**Documentación:**
- [x] Documentación completa de infraestructura
- [x] Documentación detallada de MinIO
- [x] Guía de troubleshooting de red Hyper-V
- [x] Accesos y credenciales actualizadas
- [x] README principal actualizado con todos los cambios
- [x] Documentación de límites de archivo (8GB)
- [x] Documentación de OTP de 8 dígitos
- [x] Changelog completo con fechas

### 🔄 En Progreso

- [ ] Testing
  - [ ] Unit tests backend (Jest)
  - [ ] Unit tests frontend (Jest)
  - [ ] Integration tests (Supertest)
  - [ ] E2E tests (Playwright)

### 📅 Pendiente

- [ ] Mejoras de funcionalidad
  - [ ] Notificaciones en tiempo real (WebSockets)
  - [ ] Búsqueda avanzada de proyectos
  - [ ] Paginación de listados
  - [ ] Filtros avanzados
  - [ ] Export de datos (CSV/PDF)

- [ ] CI/CD
  - [ ] GitHub Actions pipeline
  - [ ] Docker Registry setup
  - [ ] Automated testing en PR
  - [ ] Deployment automático

- [ ] Producción
  - [ ] Nginx reverse proxy
  - [ ] SSL/TLS certificates (Let's Encrypt)
  - [ ] Domain setup y DNS
  - [ ] Monitoring (Prometheus/Grafana)
  - [ ] Log aggregation (ELK Stack)
  - [ ] Backup automatizado
  - [ ] Disaster recovery plan
  - [ ] CDN para archivos estáticos

---

## 🔐 Credenciales de Desarrollo

Ver [ACCESS.md](./ACCESS.md) para todas las credenciales.

### Resumen Rápido

```bash
# SSH a la VM
ssh erick@192.168.0.139
Password: NoloseMaquinaVirtual12345

# PostgreSQL
Host: 192.168.0.139:5432
Database: AlignDesignsDemo
User: Alfonso
Password: NoloseBaseDeDatos12345@

# MinIO Console
URL: http://192.168.0.139:9001
API: http://192.168.0.139:9000
User: aligndesigns
Password: NoloseMinIO12345!

# Admin de la App
Email: alf.guzman@outlook.com
Password: NoloseAlfonso12345

# Aplicación
Frontend: http://localhost:3000
Backend API: http://localhost:4000
```

⚠️ **Estas son credenciales de desarrollo. NUNCA uses estas contraseñas en producción.**

---

## 🚦 Inicio Rápido

### 1. Verificar que la infraestructura está corriendo

```bash
# Verificar conectividad a la VM
ping 192.168.0.139

# Ver estado de contenedores
ssh erick@192.168.0.139 "sudo docker ps"
```

Deberías ver:
- `aligndesigns-postgres` - Status: Up (healthy)
- `aligndesigns-minio` - Status: Up

### 2. Iniciar Backend y Frontend

**Terminal 1 - Backend**:
```bash
cd "D:\Desarrollos\Align Designs\align-designs-demo\backend"
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd "D:\Desarrollos\Align Designs\align-designs-demo\frontend"
npm run dev
```

### 3. Verificar Servicios

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **MinIO Console**: http://192.168.0.139:9001
- **PostgreSQL**: `psql -h 192.168.0.139 -U Alfonso -d AlignDesignsDemo`

---

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# SSH a la VM
ssh erick@192.168.0.139

# Ver logs
sudo docker logs -f aligndesigns-postgres
sudo docker logs -f aligndesigns-minio

# Reiniciar servicios
cd ~/infra
sudo docker compose restart

# Detener todo
sudo docker compose down

# Levantar todo
sudo docker compose up -d

# Ver estado
sudo docker ps
sudo docker stats

# Verificar health de MinIO
curl http://localhost:9000/minio/health/ready
```

### Gestión de la VM

```powershell
# Ver estado
Get-VM -Name 'Ebionix-Software-Design'

# Iniciar/Detener
Start-VM -Name 'Ebionix-Software-Design'
Stop-VM -Name 'Ebionix-Software-Design'

# Crear snapshot
Checkpoint-VM -Name 'Ebionix-Software-Design' -SnapshotName "Pre-Backend"

# Abrir consola
vmconnect localhost 'Ebionix-Software-Design'
```

### Base de Datos

```bash
# Conectarse a PostgreSQL
psql -h 192.168.0.139 -U Alfonso -d AlignDesignsDemo

# Backup
pg_dump -h 192.168.0.139 -U postgres AlignDesignsDemo > backup.sql

# Restore
psql -h 192.168.0.139 -U postgres AlignDesignsDemo < backup.sql

# Ver tablas
psql -h 192.168.0.139 -U Alfonso -d AlignDesignsDemo -c "\dt"
```

---

## 📖 Flujo de Trabajo del Sistema

Ver diagrama completo en [INFRASTRUCTURE.md](./INFRASTRUCTURE.md#flujo-de-trabajo)

### Roles

#### Admin
- Registro completo (nombre, apellido, email, teléfono, contraseña)
- Login con email + contraseña
- Crea clientes
- Crea proyectos
- Sube y elimina cualquier archivo

#### Cliente
- Creado por Admin (solo email requerido inicialmente)
- Login con email → recibe OTP temporal por email
- Crea su contraseña en primer login
- Ve solo sus proyectos
- Sube archivos
- Elimina solo sus propios archivos

### Flujo de Creación

```
1. Admin crea Cliente (email)
   ↓
2. Cliente recibe email de bienvenida
   ↓
3. Cliente inicia sesión con email
   ↓
4. Sistema envía OTP al email
   ↓
5. Cliente ingresa OTP
   ↓
6. Sistema pide crear contraseña
   ↓
7. Admin o Cliente crea Proyecto
   ↓
8. Usuarios suben archivos al proyecto (con comentario opcional)
   ↓
9. Usuarios crean comentarios sin archivos
   ↓
10. Usuarios editan comentarios o agregan archivos a comentarios existentes
```

---

## 📞 Soporte y Troubleshooting

### Problemas Comunes

1. **No puedo conectarme a MinIO desde el backend**
   - Ver [MINIO.md - Troubleshooting](./MINIO.md#troubleshooting)
   - Ver [HYPERV-NETWORKING.md](./HYPERV-NETWORKING.md) para problemas de red

2. **Puertos de la VM no responden**
   - Ver [HYPERV-NETWORKING.md - Troubleshooting](./HYPERV-NETWORKING.md#troubleshooting)

3. **No puedo conectarme a la VM por SSH**
   - Verificar IP: `ssh erick@192.168.0.139`
   - Ver [SETUP.md - Solución de Problemas](./SETUP.md#no-puedo-conectarme-por-ssh)

4. **Los contenedores no inician**
   - Ver [SETUP.md - Los contenedores no inician](./SETUP.md#los-contenedores-no-inician)

5. **No puedo conectarme a PostgreSQL**
   - Ver [DATABASE.md - Troubleshooting](./DATABASE.md#no-puedo-conectarme-a-la-bd)

6. **Error al subir archivos (500)**
   - Verificar logs del backend para errores de MinIO
   - Ver [MINIO.md - Error: BigInt Serialization](./MINIO.md#error-bigint-serialization)

### Logs Importantes

```bash
# Logs de Docker
sudo journalctl -u docker.service -f

# Logs de contenedores
sudo docker compose logs -f

# Logs del sistema
sudo tail -f /var/log/syslog
```

---

## 🔄 Próximos Pasos

### Para Nuevos Desarrolladores

1. ✅ Leer [SETUP.md](./SETUP.md) - Configurar infraestructura
2. ✅ Revisar [HYPERV-NETWORKING.md](./HYPERV-NETWORKING.md) - Entender la red
3. ✅ Leer [MINIO.md](./MINIO.md) - Configuración de almacenamiento
4. ✅ Familiarizarse con [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Arquitectura completa
5. ✅ Revisar [DATABASE.md](./DATABASE.md) - Modelo de datos

### Para Continuar Desarrollo

1. **Testing**: Implementar tests unitarios y E2E
2. **Optimización**: Mejorar rendimiento de queries y carga de archivos
3. **Features**: Agregar notificaciones en tiempo real
4. **DevOps**: Setup de CI/CD con GitHub Actions
5. **Producción**: Preparar deploy con Nginx + SSL

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 👥 Equipo

- **Desarrollador:** Erick Rodríguez Bores Isaías
- **Cliente:** Alfonzo Guzman
- **Email:** alf.guzman@outlook.com

---

**Última actualización:** 19 de Noviembre, 2025

### Cambios Recientes

**19/11/2025 - Optimizaciones y Límites de Archivo**:
- ✅ **Aumento de límite de archivos: 50MB → 15GB → 8GB (ajustado por seguridad)**
  - Backend: Actualizado `MAX_FILE_SIZE_BYTES` y `MAX_FILE_SIZE_MB` en `timeouts.constants.ts`
  - Frontend: Actualizado `FILE_UPLOAD` constants en `ui.constants.ts`
  - Pipe de validación: Actualizado para mostrar tamaño en GB
  - UI: Mensajes de error y límites mostrados en GB
  - Rate limiting ajustado: 3×8GB = 24GB/min max
- ✅ **Cambio de OTP: 6 dígitos → 8 dígitos**
  - Backend: Actualizado generador de OTP y DTOs de validación
  - Frontend: Actualizado inputs y placeholders (maxLength=8)
  - Mayor seguridad: 100,000,000 combinaciones vs 1,000,000
- ✅ **Mejoras en UX de subida de archivos**
  - Prevención de envíos duplicados durante carga
  - Mensajes de error dentro del modal (no en página general)
  - Limpieza de errores al cerrar/cancelar modal
  - Manejo correcto de respuestas paginadas del backend
- ✅ **Seguridad mejorada**
  - Reducción de URLs presignadas: 1 hora → 15 minutos
  - Rate limiting más estricto en autenticación
  - Throttling en operaciones de archivos
- ✅ **Correcciones de bugs**
  - Fix: Comentarios y archivos no se mostraban (paginación)
  - Fix: Validación defensiva de arrays en useEffect
  - Fix: Triple envío de formulario de upload

### Cambios Recientes (Histórico)

**16/11/2025 - Parte 2 (Sistema de Comentarios)**:
- ✅ Implementación completa del sistema de comentarios para archivos
- ✅ Modificación de schema Prisma: campos de archivo nullables + campo `comment` + `updatedAt`
- ✅ Backend - Nuevos endpoints:
  - `POST /files/:projectId/comment` - Crear comentario sin archivo
  - `PATCH /files/:id` - Editar comentario y/o agregar archivo
  - `POST /files/:projectId/upload` - Actualizado para comentario opcional
- ✅ Backend - DTOs creados: `UploadFileDto`, `CreateCommentDto`, `UpdateFileDto`
- ✅ Backend - Corrección de serialización BigInt en método `createComment`
- ✅ Frontend - Upload modal con campo de comentario opcional
- ✅ Frontend - Botón "Crear Comentario" para entradas sin archivo
- ✅ Frontend - Modal de edición para comentarios y archivos
- ✅ Frontend - Columna "Comentario" en tabla de archivos
- ✅ Frontend - Filtro "Solo Comentarios" para entradas sin archivo
- ✅ Frontend - Manejo visual de entradas sin archivo (ícono + "Sin archivo")
- ✅ Flujos soportados:
  - Subir archivo con/sin comentario
  - Crear comentario sin archivo
  - Editar comentarios existentes
  - Agregar archivo a comentario existente
  - Eliminar comentarios
  - Filtrar solo comentarios

**16/11/2025 - Parte 1 (Infraestructura y Archivos)**:
- ✅ Migración de NAT-Internal a External Switch en Hyper-V
- ✅ Actualización de IP de VM: 172.24.215.214 → 192.168.0.139
- ✅ Implementación completa de upload/download de archivos con MinIO
- ✅ Corrección COMPLETA de serialización BigInt en todas las respuestas JSON
  - Archivos modificados: `files.service.ts` (uploadFile, findAllByProject, getFileUrl)
  - Archivos modificados: `projects.service.ts` (create, update, findOne)
- ✅ Resolución de errores de firma MinIO con reinicio de cliente
- ✅ Sistema de archivos totalmente funcional y probado (ADMIN y CLIENT)
- ✅ Documentación exhaustiva de MinIO y networking actualizada

**15/11/2025**:
- ✅ Backend NestJS completado
- ✅ Frontend Next.js completado
- ✅ Sistema de autenticación con JWT y OTP

---

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.
