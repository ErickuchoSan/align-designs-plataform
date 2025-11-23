# Align Designs Demo

Sistema de gestión de proyectos y archivos con autenticación diferenciada para administradores y clientes.

## Tecnologías Utilizadas

### Backend
- **NestJS 10** - Framework de Node.js
- **PostgreSQL** - Base de datos relacional
- **Prisma ORM** - ORM para acceso a base de datos
- **JWT** - Autenticación para administradores
- **OTP** - Autenticación basada en código de un solo uso para clientes
- **MinIO** - Almacenamiento de objetos compatible con S3
- **TypeScript** - Lenguaje de programación

### Frontend
- **Next.js 15** - Framework de React con App Router
- **React 19** - Biblioteca de UI
- **Tailwind CSS** - Framework de utilidades CSS
- **Axios** - Cliente HTTP
- **TypeScript** - Lenguaje de programación

## Estructura del Proyecto (Monorepo)

```
align-designs-demo/                 # Monorepo raíz
├── apps/
│   ├── backend/                    # Backend API (NestJS)
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Esquema de base de datos
│   │   │   └── seed.ts            # Datos iniciales
│   │   ├── src/
│   │   │   ├── auth/              # Módulo de autenticación
│   │   │   │   ├── guards/        # Guards JWT y Roles
│   │   │   │   ├── decorators/    # Decoradores personalizados
│   │   │   │   └── strategies/    # Estrategia JWT
│   │   │   ├── otp/               # Módulo de OTP
│   │   │   ├── users/             # CRUD de usuarios
│   │   │   ├── projects/          # CRUD de proyectos
│   │   │   ├── files/             # Gestión de archivos
│   │   │   ├── storage/           # Servicio de MinIO
│   │   │   └── prisma/            # Servicio de Prisma
│   │   └── .env                   # Variables de entorno backend
│   └── frontend/                   # Frontend Web (Next.js)
│       ├── app/
│       │   ├── login/             # Página de login
│       │   └── dashboard/         # Dashboard principal
│       ├── contexts/              # Contextos de React
│       │   └── AuthContext.tsx    # Contexto de autenticación
│       ├── lib/
│       │   └── api.ts             # Cliente API con Axios
│       ├── types/
│       │   └── index.ts           # Tipos TypeScript
│       └── .env.local             # Variables de entorno frontend
├── docs/                          # Documentación completa
├── infra/                         # Infraestructura (Docker, VM)
├── package.json                   # Configuración del monorepo
└── .gitignore                     # Gitignore global

```

## Características Implementadas

### 1. Autenticación
- **Administradores**: Login con email y contraseña + JWT
- **Clientes**: Login con email + código OTP de 8 dígitos
- Protección de rutas con guards
- Control de acceso basado en roles (RBAC)
- Sistema de recuperación de contraseña (Forgot Password)
- Cambio de contraseña autenticado
- Rate limiting en endpoints de autenticación

### 2. CRUD de Usuarios
- Crear clientes (solo admin)
- Listar usuarios (admin ve todos, cliente solo a sí mismo)
- Actualizar perfil (con restricciones por rol)
- Eliminar usuarios (solo admin, no puede eliminar admins)

### 3. CRUD de Proyectos
- Crear proyectos con asignación a cliente
- Listar proyectos (admin ve todos, cliente solo los suyos)
- Actualizar información del proyecto
- Eliminar proyectos (con permisos por rol)
- Ver archivos asociados al proyecto

### 4. Gestión de Archivos
- Subir archivos a MinIO (hasta 8GB por archivo)
- Listar archivos por proyecto con paginación
- Generar URLs de descarga presignadas (15 minutos de expiración)
- Eliminar archivos (admin cualquiera, cliente solo de sus proyectos)
- Organización automática: `projects/{projectId}/{uuid}.{extension}`
- Validación de tipos de archivo con magic numbers (prevención de spoofing)
- Sistema de comentarios para archivos
- Comentarios sin archivos adjuntos
- Edición de comentarios y archivos
- Filtros avanzados: por nombre, tipo y "Solo Comentarios"
- Rate limiting en operaciones de archivos
- Barra de progreso en subida de archivos

### 5. Frontend con Next.js 15
- Autenticación con contexto de React
- Rutas protegidas
- Login diferenciado (Admin/Cliente)
- Dashboard básico
- Cliente API configurado con interceptores
- Diseño responsive con Tailwind CSS

## Configuración

### Base de Datos (PostgreSQL)

```env
DATABASE_URL="postgresql://Alfonso:NoloseBaseDeDatos12345@@192.168.0.139:5432/AlignDesignsDemo?schema=aligndesigns"
```

### MinIO

```env
MINIO_ENDPOINT=192.168.0.139
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=aligndesigns
MINIO_SECRET_KEY=NoloseMinIO12345!
MINIO_BUCKET=align-designs
```

### JWT

```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1d
JWT_AUDIENCE=align-designs-client
JWT_ISSUER=align-designs-api
```

## Usuarios de Prueba

### Administrador
- **Email**: alf.guzman@outlook.com
- **Password**: NoloseAlfonso12345
- **Rol**: ADMIN

### Cliente
- **Email**: erickuchoxd@gmail.com
- **Autenticación**: OTP de 8 dígitos (enviado por email)
- **Rol**: CLIENT

## Instalación y Ejecución

### Instalación Inicial (Monorepo)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd align-designs-demo

# 2. Instalar todas las dependencias (raíz + backend + frontend)
npm install

# 3. Configurar variables de entorno
# Backend
cp apps/backend/.env.example apps/backend/.env
# Editar apps/backend/.env con tus credenciales

# Frontend
cp apps/frontend/.env.local.example apps/frontend/.env.local
# Editar apps/frontend/.env.local

# 4. Configurar base de datos
npm run prisma:generate   # Generar Prisma Client
npm run prisma:migrate    # Ejecutar migraciones
npx prisma db seed --workspace=apps/backend  # Seeds iniciales
```

### Desarrollo

```bash
# Iniciar backend y frontend simultáneamente
npm run dev

# O iniciar cada uno por separado:
npm run dev:backend    # Backend en http://localhost:4000
npm run dev:frontend   # Frontend en http://localhost:3000
```

### Producción

```bash
# Build de todas las apps
npm run build

# Iniciar en modo producción
npm start

# O cada app por separado:
npm run start:backend
npm run start:frontend
```

### Otros Comandos Útiles

```bash
# Prisma Studio (DB GUI)
npm run prisma:studio

# Tests
npm test                # Todas las apps
npm run test:backend    # Solo backend
npm run test:frontend   # Solo frontend

# Linting
npm run lint           # Todas las apps
npm run lint:backend
npm run lint:frontend

# Limpiar todo
npm run clean
```

## Endpoints del API

### Autenticación

```
POST /auth/check-email        # Verificar si email existe y requiere password
POST /auth/login              # Login admin (email + password)
POST /auth/otp/request        # Solicitar código OTP de 8 dígitos
POST /auth/otp/verify         # Verificar código OTP
POST /auth/set-password       # Establecer contraseña (primer login cliente)
POST /auth/change-password    # Cambiar contraseña (autenticado)
POST /auth/forgot-password    # Solicitar recuperación de contraseña
POST /auth/reset-password     # Resetear contraseña con OTP
POST /auth/logout             # Cerrar sesión
```

### Usuarios

```
POST   /users                 # Crear cliente (admin only)
GET    /users                 # Listar usuarios (admin only)
GET    /users/:id             # Ver usuario (con restricciones)
PATCH  /users/:id             # Actualizar usuario
DELETE /users/:id             # Eliminar usuario (admin only)
```

### Proyectos

```
POST   /projects              # Crear proyecto
GET    /projects              # Listar proyectos
GET    /projects/:id          # Ver proyecto
PATCH  /projects/:id          # Actualizar proyecto
DELETE /projects/:id          # Eliminar proyecto
```

### Archivos

```
POST   /files/:projectId/upload       # Subir archivo con comentario opcional
POST   /files/:projectId/comment      # Crear comentario sin archivo
PATCH  /files/:id                     # Editar comentario y/o agregar archivo
GET    /files/project/:projectId      # Listar archivos del proyecto (paginado)
GET    /files/:id/download            # Obtener URL de descarga presignada
DELETE /files/:id                     # Eliminar archivo o comentario
```

## Seguridad

- ✅ Autenticación JWT con expiración (1 día)
- ✅ Protección de rutas con guards (JWT + Roles)
- ✅ Control de acceso basado en roles (RBAC)
- ✅ Validación de DTOs con class-validator
- ✅ Hasheado de contraseñas con bcrypt (12 rounds)
- ✅ URLs presignadas con expiración (15 minutos)
- ✅ Rate limiting en todos los endpoints críticos
- ✅ Validación de magic numbers en archivos (anti-spoofing)
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado con whitelist
- ✅ Throttling personalizado por endpoint
- ✅ OTP de 8 dígitos con expiración (10 minutos)
- ✅ Límite de tamaño de archivo (8GB)
- ✅ Interceptores de autenticación en frontend

## Permisos por Rol

### ADMIN
- Crear usuarios (clientes)
- Ver todos los usuarios y proyectos
- Crear proyectos para cualquier cliente
- Subir/eliminar archivos de cualquier proyecto
- Actualizar cualquier proyecto

### CLIENT
- Ver solo su información y sus proyectos
- Subir archivos a sus propios proyectos
- Eliminar solo archivos de sus proyectos
- Actualizar su perfil (campos limitados)

## Próximos Pasos Sugeridos

1. Implementar páginas completas de gestión en frontend:
   - Lista de proyectos con filtros
   - Detalle de proyecto con galería de archivos
   - Gestión de usuarios (admin)
   - Perfil de usuario editable

2. Mejorar la experiencia de usuario:
   - Notificaciones toast
   - Modales de confirmación
   - Paginación de listados
   - Búsqueda y filtros

3. Funcionalidades adicionales:
   - Preview de imágenes
   - Descarga múltiple de archivos
   - Comentarios en proyectos
   - Historial de cambios
   - Notificaciones por email

4. Testing:
   - Tests unitarios (Jest)
   - Tests E2E (Playwright)
   - Tests de integración

5. DevOps:
   - Docker Compose para desarrollo
   - CI/CD con GitHub Actions
   - Deploy en producción

## Licencia

Este es un proyecto demo para Align Designs.
