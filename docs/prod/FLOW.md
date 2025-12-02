# Flujo del Sistema Align Designs

Este documento describe en detalle el flujo completo del sistema, desde el registro de usuarios hasta la gestión de archivos en proyectos.

## Tabla de Contenidos

1. [Roles y Permisos](#roles-y-permisos)
2. [Registro e Inicio de Sesión](#registro-e-inicio-de-sesión)
3. [Gestión de Usuarios](#gestión-de-usuarios)
4. [Gestión de Proyectos](#gestión-de-proyectos)
5. [Gestión de Archivos](#gestión-de-archivos)
6. [Diagramas de Flujo](#diagramas-de-flujo)

---

## Roles y Permisos

### Comparación de Roles

| Característica | Admin | Cliente |
|---|---|---|
| **Registro** | Completo (nombre, apellido, email, teléfono, contraseña) | Creado por Admin (solo email inicial) |
| **Login** | Email + Contraseña | Email → OTP → Set Password (primer login) |
| **Ver Proyectos** | Todos los proyectos | Solo proyectos asignados |
| **Crear Proyectos** | ✅ Sí | ✅ Sí (opcional según config) |
| **Asignar Proyectos** | ✅ Sí | ❌ No |
| **Subir Archivos** | ✅ Sí | ✅ Sí |
| **Ver Archivos** | Todos los archivos del proyecto | Todos los archivos del proyecto |
| **Eliminar Archivos** | ✅ Cualquier archivo | ⚠️ Solo sus archivos |
| **Crear Usuarios** | ✅ Sí (crear Clientes) | ❌ No |
| **Gestionar Usuarios** | ✅ Sí | ❌ No |

---

## Registro e Inicio de Sesión

### Admin

#### Registro de Admin

```
┌─────────────────────────────────────────┐
│  Formulario de Registro de Admin       │
├─────────────────────────────────────────┤
│  • Nombre: [___________]                │
│  • Apellido: [___________]              │
│  • Email: [___________]                 │
│  • Teléfono: [___________]              │
│  • Contraseña: [___________]            │
│  • Confirmar: [___________]             │
│                                         │
│  [Registrarse]                          │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Validaciones                           │
├─────────────────────────────────────────┤
│  ✓ Email único                          │
│  ✓ Contraseña ≥ 8 caracteres           │
│  ✓ Todos los campos requeridos         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Usuario creado con role='ADMIN'        │
│  password_hash generado con bcrypt      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Redirección a /login                   │
└─────────────────────────────────────────┘
```

#### Login de Admin

```
┌─────────────────────────────────────────┐
│  Formulario de Login                    │
├─────────────────────────────────────────┤
│  • Email: [___________]                 │
│  • Contraseña: [___________]            │
│                                         │
│  [Iniciar Sesión]                       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend valida credenciales            │
├─────────────────────────────────────────┤
│  1. Busca user por email                │
│  2. Verifica role = 'ADMIN'             │
│  3. Compara password con hash           │
└─────────────────────────────────────────┘
         │
         ├── ❌ Credenciales inválidas
         │      └─> "Email o contraseña incorrectos"
         │
         └── ✅ Credenciales válidas
                │
                ▼
         ┌─────────────────────────────────────────┐
         │  Genera JWT Token                       │
         │  { userId, email, role: 'ADMIN' }       │
         └─────────────────────────────────────────┘
                │
                ▼
         ┌─────────────────────────────────────────┐
         │  Redirección a /dashboard               │
         └─────────────────────────────────────────┘
```

### Cliente

#### Creación de Cliente (por Admin)

```
┌─────────────────────────────────────────┐
│  Admin - Panel de Usuarios              │
│  [+ Crear Cliente]                      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Modal: Crear Nuevo Cliente             │
├─────────────────────────────────────────┤
│  • Email: [___________] (requerido)     │
│  • Nombre: [___________] (opcional)     │
│  • Apellido: [___________] (opcional)   │
│  • Teléfono: [___________] (opcional)   │
│                                         │
│  [Crear]   [Cancelar]                   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Usuario creado con:                    │
│  - role='CLIENT'                        │
│  - password_hash=NULL                   │
│  - is_active=true                       │
│  - email_verified=false                 │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Sistema envía email de bienvenida:     │
│  "Has sido invitado a Align Designs"    │
│  "Inicia sesión en [URL]"               │
└─────────────────────────────────────────┘
```

#### Primer Login de Cliente (OTP Flow)

```
┌─────────────────────────────────────────┐
│  Paso 1: Ingresar Email                 │
├─────────────────────────────────────────┤
│  Email: [___________]                   │
│  [Continuar]                            │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend verifica:                      │
│  1. Usuario existe                      │
│  2. role = 'CLIENT'                     │
│  3. Si password_hash es NULL:           │
│     → Primer login (necesita OTP)       │
│     Si no:                              │
│     → Pide contraseña directamente      │
└─────────────────────────────────────────┘
         │
         ├── Cliente con contraseña
         │      └─> Ir a login normal (email + password)
         │
         └── Cliente sin contraseña (primer login)
                │
                ▼
         ┌─────────────────────────────────────────┐
         │  Genera OTP de 8 dígitos                │
         │  Guarda en tabla otp_tokens:            │
         │  - token (8 dígitos)                    │
         │  - user_id                              │
         │  - expires_at (NOW() + 10 min)          │
         │  - used = false                         │
         └─────────────────────────────────────────┘
                │
                ▼
         ┌─────────────────────────────────────────┐
         │  Envía email con OTP:                   │
         │  "Tu código de acceso: 12345678"        │
         │  "Válido por 10 minutos"                │
         └─────────────────────────────────────────┘
                │
                ▼
         ┌─────────────────────────────────────────┐
         │  Paso 2: Ingresar OTP                   │
         ├─────────────────────────────────────────┤
         │  Código de 8 dígitos: [________]        │
         │  [Verificar]                            │
         │  [Reenviar código]                      │
         └─────────────────────────────────────────┘
                │
                ▼
         ┌─────────────────────────────────────────┐
         │  Backend valida OTP:                    │
         │  1. Token existe                        │
         │  2. Coincide con user_id                │
         │  3. expires_at > NOW()                  │
         │  4. used = false                        │
         └─────────────────────────────────────────┘
                │
                ├── ❌ OTP inválido o expirado
                │      └─> "Código inválido"
                │          [Reenviar código]
                │
                └── ✅ OTP válido
                       │
                       ▼
                ┌─────────────────────────────────────────┐
                │  Marca OTP como usado:                  │
                │  UPDATE otp_tokens SET used=true        │
                └─────────────────────────────────────────┘
                       │
                       ▼
                ┌─────────────────────────────────────────┐
                │  Paso 3: Crear Contraseña               │
                ├─────────────────────────────────────────┤
                │  Nueva contraseña: [___________]        │
                │  Confirmar: [___________]               │
                │  [Establecer Contraseña]                │
                └─────────────────────────────────────────┘
                       │
                       ▼
                ┌─────────────────────────────────────────┐
                │  Validaciones:                          │
                │  ✓ Contraseña ≥ 8 caracteres           │
                │  ✓ Ambas contraseñas coinciden          │
                └─────────────────────────────────────────┘
                       │
                       ▼
                ┌─────────────────────────────────────────┐
                │  Actualiza usuario:                     │
                │  UPDATE users SET                       │
                │    password_hash = bcrypt(password)     │
                │    email_verified = true                │
                └─────────────────────────────────────────┘
                       │
                       ▼
                ┌─────────────────────────────────────────┐
                │  Genera JWT Token                       │
                │  { userId, email, role: 'CLIENT' }      │
                └─────────────────────────────────────────┘
                       │
                       ▼
                ┌─────────────────────────────────────────┐
                │  Redirección a /dashboard               │
                └─────────────────────────────────────────┘
```

#### Logins Subsecuentes del Cliente

Una vez que el cliente ya tiene contraseña:

```
┌─────────────────────────────────────────┐
│  Formulario de Login                    │
├─────────────────────────────────────────┤
│  Email: [___________]                   │
│  Contraseña: [___________]              │
│  [Iniciar Sesión]                       │
└─────────────────────────────────────────┘
         │
         ▼
     (Mismo flujo que Admin)
```

---

## Gestión de Usuarios

### Admin: Ver Lista de Clientes

```
GET /api/users?role=CLIENT

Response:
[
  {
    id: "uuid",
    email: "cliente@example.com",
    first_name: "Juan",
    last_name: "Pérez",
    phone: "+1234567890",
    role: "CLIENT",
    is_active: true,
    email_verified: true,
    created_at: "2025-11-15T10:00:00Z"
  },
  ...
]
```

### Admin: Desactivar Cliente

```
PATCH /api/users/:id

Body:
{
  is_active: false
}

Efecto:
- Cliente no puede iniciar sesión
- Sus proyectos siguen visibles para Admin
- Puede ser reactivado después
```

---

## Gestión de Proyectos

### Crear Proyecto

```
┌─────────────────────────────────────────┐
│  Formulario: Nuevo Proyecto             │
├─────────────────────────────────────────┤
│  Nombre: [___________] (requerido)      │
│  Descripción: [___________]             │
│  Cliente: [Dropdown] ▼ (requerido)      │
│    - Juan Pérez (cliente@example.com)   │
│    - María López (maria@example.com)    │
│                                         │
│  Archivos Iniciales: [Seleccionar]      │
│  (opcional)                             │
│                                         │
│  [Crear Proyecto]   [Cancelar]          │
└─────────────────────────────────────────┘
         │
         ▼
POST /api/projects

Body:
{
  name: "Diseño de Logo",
  description: "Logo para empresa tech",
  client_id: "uuid-del-cliente",
  files: [FormData con archivos opcionales]
}
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend:                               │
│  1. Crea proyecto en BD                 │
│  2. Si hay archivos:                    │
│     - Sube a MinIO                      │
│     - Crea registros en tabla files     │
│  3. Retorna proyecto creado             │
└─────────────────────────────────────────┘
```

### Ver Proyectos

#### Admin - Ve Todos

```
GET /api/projects

Response:
[
  {
    id: "uuid",
    name: "Diseño de Logo",
    description: "...",
    client: {
      id: "uuid",
      name: "Juan Pérez",
      email: "cliente@example.com"
    },
    created_by: {
      id: "uuid",
      name: "Alfonzo Guzman"
    },
    files_count: 5,
    created_at: "2025-11-15T10:00:00Z"
  },
  ...
]
```

#### Cliente - Solo los Suyos

```
GET /api/projects

Response: (filtrado por client_id = user.id)
[
  {
    id: "uuid",
    name: "Diseño de Logo",
    description: "...",
    files_count: 5,
    created_at: "2025-11-15T10:00:00Z"
  }
]
```

---

## Gestión de Archivos

### Subir Archivo

```
┌─────────────────────────────────────────┐
│  Vista: Detalle de Proyecto             │
│  "Diseño de Logo"                       │
├─────────────────────────────────────────┤
│  Archivos (5):                          │
│  📄 logo-v1.pdf    (Admin)    [Delete]  │
│  📷 referencia.jpg (Juan)     [Delete]  │  <- Solo si soy Juan o Admin
│  📄 brief.docx     (Admin)    [Delete]  │
│                                         │
│  [Subir Archivo]                        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Modal: Subir Archivo                   │
│  Arrastra archivos aquí o               │
│  [Seleccionar Archivos]                 │
│                                         │
│  Archivos seleccionados:                │
│  • logo-v2.pdf (2.3 MB)                 │
│  • mockup.png (1.1 MB)                  │
│                                         │
│  [Subir]   [Cancelar]                   │
└─────────────────────────────────────────┘
         │
         ▼
POST /api/projects/:projectId/files
Content-Type: multipart/form-data

Files: [logo-v2.pdf, mockup.png]
         │
         ▼
┌─────────────────────────────────────────┐
│  Backend:                               │
│  Para cada archivo:                     │
│  1. Genera nombre único:                │
│     {uuid}-{originalname}               │
│  2. Sube a MinIO bucket:                │
│     minio.upload(bucket, filename)      │
│  3. Crea registro en BD:                │
│     INSERT INTO files (...)             │
│  4. Retorna metadata                    │
└─────────────────────────────────────────┘
         │
         ▼
Response:
{
  uploaded: [
    {
      id: "uuid",
      filename: "abc-123-logo-v2.pdf",
      original_name: "logo-v2.pdf",
      size_bytes: 2400000,
      mime_type: "application/pdf",
      storage_path: "projects/uuid/abc-123-logo-v2.pdf",
      uploaded_by: {
        id: "uuid",
        name: "Juan Pérez"
      },
      uploaded_at: "2025-11-15T10:30:00Z"
    },
    ...
  ]
}
```

### Eliminar Archivo

#### Admin (puede eliminar cualquiera)

```
DELETE /api/files/:fileId

Backend:
1. Verifica que el usuario es Admin
2. Obtiene metadata del archivo desde BD
3. Elimina de MinIO: minio.delete(storage_path)
4. Elimina de BD: DELETE FROM files WHERE id = :fileId
5. Retorna success
```

#### Cliente (solo sus archivos)

```
DELETE /api/files/:fileId

Backend:
1. Obtiene archivo: SELECT * FROM files WHERE id = :fileId
2. Verifica: uploaded_by = user.id
3. Si no coincide → 403 Forbidden
4. Si coincide:
   - Elimina de MinIO
   - Elimina de BD
5. Retorna success
```

---

## Diagramas de Flujo

### Flujo Completo del Sistema

```
┌─────────────┐
│   Admin     │
│  (Alfonzo)  │
└──────┬──────┘
       │
       │ 1. Registra cliente (juan@example.com)
       ▼
┌─────────────┐       Email de invitación
│  Cliente    │ <──────────────────────────
│   (Juan)    │
└──────┬──────┘
       │
       │ 2. Login → Recibe OTP
       │ 3. Ingresa OTP → Crea contraseña
       ▼
┌──────────────────────────────────────┐
│        Sistema Autenticado           │
├──────────────────────────────────────┤
│  JWT Token en cookie/localStorage    │
└──────┬───────────────────────────────┘
       │
       ├─ Admin Dashboard
       │    │
       │    ├─ Ver todos los proyectos
       │    ├─ Crear nuevo proyecto → Asigna a Juan
       │    ├─ Subir archivos a proyecto
       │    └─ Eliminar cualquier archivo
       │
       └─ Cliente Dashboard
            │
            ├─ Ver solo proyectos asignados
            ├─ Subir archivos a proyectos
            └─ Eliminar solo sus archivos
```

### Flujo de Datos: Subida de Archivo

```
Frontend              Backend              PostgreSQL           MinIO
   │                     │                      │                 │
   │  POST /files        │                      │                 │
   │ (FormData)          │                      │                 │
   │────────────────────>│                      │                 │
   │                     │  Valida JWT          │                 │
   │                     │  Extrae user_id      │                 │
   │                     │                      │                 │
   │                     │  Genera filename     │                 │
   │                     │  único               │                 │
   │                     │                      │                 │
   │                     │  PUT /bucket/file    │                 │
   │                     │──────────────────────────────────────>│
   │                     │                      │                 │
   │                     │    <200 OK>          │                 │
   │                     │<──────────────────────────────────────│
   │                     │                      │                 │
   │                     │  INSERT INTO files   │                 │
   │                     │─────────────────────>│                 │
   │                     │                      │                 │
   │                     │  <file record>       │                 │
   │                     │<─────────────────────│                 │
   │                     │                      │                 │
   │  <201 Created>      │                      │                 │
   │  {file metadata}    │                      │                 │
   │<────────────────────│                      │                 │
   │                     │                      │                 │
```

---

## Rate Limiting y Seguridad

### OTP Rate Limiting

Para prevenir ataques de fuerza bruta:

```typescript
// Máximo 3 intentos de OTP por sesión
// Máximo 5 OTPs generados por email en 1 hora
// OTP expira en 10 minutos
// Código de 8 dígitos = 100,000,000 combinaciones
```

### Validaciones de Archivos

```typescript
// Tamaño máximo: 8 GB por archivo
// Tipos permitidos:
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Design files
  'application/postscript', // AI files
  'image/vnd.adobe.photoshop', // PSD files
  // Compressed
  'application/zip',
  'application/x-rar-compressed',
  // Videos
  'video/mp4',
  'video/quicktime',
  // etc.
];

// Validación de magic numbers (anti-spoofing)
// Sanitización de nombres de archivo
filename = sanitize(originalName);
```

### Permisos RBAC

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CLIENT')
@Get('projects')
async getProjects(@User() user) {
  if (user.role === 'ADMIN') {
    return this.projectsService.findAll();
  } else {
    return this.projectsService.findByClientId(user.id);
  }
}
```

---

## Eventos y Notificaciones

### Eventos del Sistema

| Evento | Trigger | Acción |
|--------|---------|--------|
| `user.created` | Admin crea cliente | Enviar email de bienvenida |
| `otp.generated` | Cliente solicita OTP | Enviar email con código |
| `user.password_set` | Cliente crea contraseña | Marcar email como verificado |
| `project.created` | Creación de proyecto | Notificar al cliente asignado |
| `file.uploaded` | Subida de archivo | Notificar a miembros del proyecto |
| `file.deleted` | Eliminación de archivo | Auditoría (quién eliminó qué) |

---

## Próximos Pasos

1. Implementar el backend NestJS con este flujo
2. Crear el frontend Next.js siguiendo estos wireframes
3. Configurar el sistema de emails (Resend/SendGrid)
4. Implementar tests E2E de estos flujos
5. Deploy a producción

Ver [BACKEND.md](./BACKEND.md) para comenzar la implementación.
