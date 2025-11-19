# Sistema de Comentarios

Documentación completa del sistema de comentarios para archivos implementado en Align Designs.

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Características](#características)
3. [Arquitectura](#arquitectura)
4. [Implementación Backend](#implementación-backend)
5. [Implementación Frontend](#implementación-frontend)
6. [Flujos de Usuario](#flujos-de-usuario)
7. [API Reference](#api-reference)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El sistema de comentarios permite a los usuarios (Admin y Clientes) crear entradas en proyectos que pueden ser:
- **Archivos con comentario opcional**: Upload tradicional con texto adicional
- **Comentarios sin archivo**: Entradas de solo texto
- **Comentarios editables**: Modificar o eliminar comentarios existentes
- **Archivos agregables**: Añadir archivos a comentarios que inicialmente no tenían uno

Este sistema mejora la comunicación entre Admin y Cliente dentro de cada proyecto.

---

## Características

### ✅ Funcionalidades Implementadas

1. **Upload con Comentario Opcional**
   - Al subir un archivo, se puede agregar un comentario descriptivo
   - El comentario es completamente opcional
   - Se almacena junto con los metadatos del archivo

2. **Comentarios Sin Archivo**
   - Crear entradas que solo contengan texto
   - Útil para notas, instrucciones, o feedback
   - No requiere subir ningún archivo a MinIO

3. **Edición de Comentarios**
   - Modificar el texto de comentarios existentes
   - Eliminar comentarios (dejar campo vacío)
   - Mantiene historial con `updatedAt`

4. **Agregar Archivos a Comentarios**
   - Comentarios sin archivo pueden recibir uno posteriormente
   - Útil para adjuntar documentos a notas existentes
   - Convierte comentario simple en entrada completa

5. **Filtrado Inteligente**
   - Filtro "Solo Comentarios" para ver entradas sin archivo
   - Filtros por tipo de archivo excluyen comentarios automáticamente
   - Búsqueda por nombre ignora comentarios sin archivo

6. **Permisos y Roles**
   - Admin puede editar/eliminar cualquier entrada
   - Cliente solo edita/elimina sus propias entradas
   - Comentarios respetan permisos de proyecto

---

## Arquitectura

### Modelo de Datos (Prisma)

```prisma
model File {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId    String   @map("project_id") @db.Uuid
  uploadedBy   String   @map("uploaded_by") @db.Uuid

  // Campos de archivo - TODOS NULLABLE
  filename     String?  @db.VarChar(255)
  originalName String?  @map("original_name") @db.VarChar(255)
  mimeType     String?  @map("mime_type") @db.VarChar(100)
  sizeBytes    BigInt?  @map("size_bytes")
  storagePath  String?  @map("storage_path") @db.Text

  // Campo de comentario - NULLABLE
  comment      String?  @db.Text

  // Timestamps
  uploadedAt   DateTime @default(now()) @map("uploaded_at") @db.Timestamptz(6)
  updatedAt    DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  uploader User    @relation("UploadedFiles", fields: [uploadedBy], references: [id])
}
```

**Cambios Clave:**
- `filename`, `originalName`, `storagePath`, `mimeType`, `sizeBytes` → **Nullable**
- Nuevo campo `comment` → **TEXT nullable**
- Nuevo campo `updatedAt` → **Auto-actualizado con `@updatedAt`**

### Tipos de Entradas

| Tipo | filename | comment | Descripción |
|------|----------|---------|-------------|
| **Archivo con comentario** | ✅ | ✅ | Archivo + texto descriptivo |
| **Archivo sin comentario** | ✅ | ❌ | Solo archivo |
| **Comentario sin archivo** | ❌ | ✅ | Solo texto |

---

## Implementación Backend

### Estructura de Archivos

```
backend/src/files/
├── dto/
│   ├── upload-file.dto.ts      # Comentario opcional en upload
│   ├── create-comment.dto.ts   # Comentario requerido
│   └── update-file.dto.ts      # Comentario nullable (para eliminar)
├── files.controller.ts          # 3 endpoints principales
└── files.service.ts             # Lógica de negocio
```

### DTOs

**1. UploadFileDto** - Upload con comentario opcional
```typescript
export class UploadFileDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
```

**2. CreateCommentDto** - Comentario sin archivo
```typescript
export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  comment: string;
}
```

**3. UpdateFileDto** - Editar comentario
```typescript
export class UpdateFileDto {
  @IsOptional()
  @IsString()
  comment?: string | null; // null elimina el comentario
}
```

### Endpoints

#### 1. Upload con Comentario Opcional
```typescript
POST /files/:projectId/upload
Content-Type: multipart/form-data

Body:
  - file: File (required)
  - comment: string (optional)

Response: FileRecord con comentario
```

#### 2. Crear Comentario Sin Archivo
```typescript
POST /files/:projectId/comment
Content-Type: application/json

Body:
{
  "comment": "Este es un comentario sin archivo"
}

Response: FileRecord solo con comentario
```

#### 3. Editar Comentario/Agregar Archivo
```typescript
PATCH /files/:id
Content-Type: multipart/form-data

Body:
  - file: File (optional) - Para agregar archivo
  - comment: string (optional) - Para editar/eliminar comentario

Response: FileRecord actualizado
```

### Lógica de Servicio

**files.service.ts - Métodos Clave:**

```typescript
// 1. Upload con comentario
async uploadFile(
  projectId: string,
  file: Express.Multer.File,
  comment: string | undefined,
  uploadedBy: string,
  userRole: Role,
) {
  // Verifica permisos
  // Sube archivo a MinIO
  // Guarda en BD con comment
  // Convierte BigInt → Number
}

// 2. Crear comentario sin archivo
async createComment(
  projectId: string,
  comment: string,
  uploadedBy: string,
  userRole: Role,
) {
  // Verifica permisos
  // Crea entrada sin campos de archivo
  // Solo guarda comment + metadata
}

// 3. Actualizar entrada
async updateFile(
  fileId: string,
  file: Express.Multer.File | undefined,
  comment: string | null | undefined,
  userId: string,
  userRole: Role,
) {
  // Verifica permisos
  // Si hay file → sube a MinIO
  // Si hay comment !== undefined → actualiza
  // Si comment === null → elimina
  // Si comment === "" → elimina
}
```

**Manejo de BigInt:**
Todos los métodos convierten `sizeBytes` antes de retornar:

```typescript
return {
  ...record,
  sizeBytes: record.sizeBytes ? Number(record.sizeBytes) : null,
};
```

---

## Implementación Frontend

### Estructura de Componentes

```
frontend/app/dashboard/projects/[id]/
└── page.tsx
    ├── FileData interface (actualizada)
    ├── Estados de modales
    ├── Handlers de comentarios
    ├── Upload Modal (con comentario)
    ├── Comment Modal (nuevo)
    ├── Edit Modal (nuevo)
    └── Tabla con columna comentario
```

### Interface TypeScript

```typescript
interface FileData {
  id: string;
  filename: string | null;        // Nullable
  originalName: string | null;    // Nullable
  sizeBytes: number | null;       // Nullable
  mimeType: string | null;        // Nullable
  uploadedBy: string;
  comment?: string | null;        // Nuevo campo
  uploader: {
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadedAt: string;
}
```

### Estados

```typescript
// Upload con comentario
const [uploadComment, setUploadComment] = useState('');

// Comentario sin archivo
const [showCommentModal, setShowCommentModal] = useState(false);
const [commentText, setCommentText] = useState('');

// Edición
const [showEditModal, setShowEditModal] = useState(false);
const [fileToEdit, setFileToEdit] = useState<FileData | null>(null);
const [editComment, setEditComment] = useState('');
const [editFile, setEditFile] = useState<File | null>(null);
```

### Handlers

**1. Upload con Comentario**
```typescript
const handleFileUpload = async (e: React.FormEvent) => {
  const formData = new FormData();
  formData.append('file', selectedFile);
  if (uploadComment) {
    formData.append('comment', uploadComment);
  }

  await api.post(`/files/${projectId}/upload`, formData);
};
```

**2. Crear Comentario**
```typescript
const handleCreateComment = async (e: React.FormEvent) => {
  await api.post(`/files/${projectId}/comment`, {
    comment: commentText,
  });
};
```

**3. Editar Entrada**
```typescript
const handleEditEntry = async (e: React.FormEvent) => {
  const formData = new FormData();

  if (editComment !== fileToEdit.comment) {
    formData.append('comment', editComment);
  }

  if (editFile) {
    formData.append('file', editFile);
  }

  await api.patch(`/files/${fileToEdit.id}`, formData);
};
```

### UI Components

**Upload Modal - Campo de Comentario:**
```tsx
<div>
  <label className="block text-sm font-medium text-navy-900 mb-2">
    Comentario (opcional)
  </label>
  <textarea
    value={uploadComment}
    onChange={(e) => setUploadComment(e.target.value)}
    placeholder="Agrega un comentario sobre este archivo..."
    rows={3}
    className="w-full px-4 py-3 border rounded-lg"
  />
</div>
```

**Botón Crear Comentario:**
```tsx
<button
  onClick={() => setShowCommentModal(true)}
  className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 text-white rounded-lg"
>
  <svg>...</svg>
  Crear Comentario
</button>
```

**Tabla - Columna Comentario:**
```tsx
<td className="px-6 py-4 max-w-xs">
  {file.comment ? (
    <div className="text-sm text-stone-700 truncate" title={file.comment}>
      {file.comment}
    </div>
  ) : (
    <span className="text-sm text-stone-400 italic">Sin comentario</span>
  )}
</td>
```

**Indicador Visual - Sin Archivo:**
```tsx
{file.filename ? (
  <>
    <svg className="w-5 h-5 text-navy-700">...</svg>
    <div>{file.originalName}</div>
  </>
) : (
  <>
    <svg className="w-5 h-5 text-gold-600">...</svg>
    <div className="text-stone-500 italic">Sin archivo</div>
  </>
)}
```

### Filtrado

**Filtro "Solo Comentarios":**
```typescript
useEffect(() => {
  let filtered = files;

  if (typeFilter === 'comments') {
    // Solo entradas sin archivo
    filtered = filtered.filter(file => !file.filename);
  } else if (typeFilter !== 'all') {
    // Por tipo de archivo
    filtered = filtered.filter(file =>
      file.originalName && getFileExtension(file.originalName) === typeFilter
    );
  }

  setFilteredFiles(filtered);
}, [files, typeFilter]);
```

```tsx
<select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
  <option value="all">Todos los tipos</option>
  <option value="comments">Solo Comentarios</option>
  {availableTypes.map(type => (
    <option key={type} value={type}>{type.toUpperCase()}</option>
  ))}
</select>
```

---

## Flujos de Usuario

### 1. Subir Archivo con Comentario

```
Usuario hace clic en "Subir Archivo"
  ↓
Modal se abre
  ↓
Usuario selecciona archivo
  ↓
Usuario escribe comentario (opcional)
  ↓
Usuario hace clic en "Subir Archivo"
  ↓
Archivo sube a MinIO
  ↓
Entrada se crea en BD con comment
  ↓
Tabla se actualiza mostrando archivo + comentario
```

### 2. Crear Comentario Sin Archivo

```
Usuario hace clic en "Crear Comentario"
  ↓
Modal se abre
  ↓
Usuario escribe comentario
  ↓
Usuario hace clic en "Crear Comentario"
  ↓
Entrada se crea en BD sin archivo
  ↓
Tabla se actualiza mostrando "Sin archivo" + comentario
```

### 3. Editar Comentario Existente

```
Usuario hace clic en botón de edición
  ↓
Modal de edición se abre con comentario actual
  ↓
Usuario modifica comentario
  ↓
Usuario hace clic en "Guardar Cambios"
  ↓
Entrada se actualiza en BD
  ↓
Tabla se actualiza mostrando nuevo comentario
```

### 4. Agregar Archivo a Comentario

```
Usuario hace clic en botón de edición de comentario sin archivo
  ↓
Modal de edición se abre
  ↓
Usuario selecciona archivo
  ↓
Usuario hace clic en "Guardar Cambios"
  ↓
Archivo sube a MinIO
  ↓
Entrada se actualiza con datos de archivo
  ↓
Tabla muestra archivo + comentario original
```

### 5. Eliminar Comentario

```
Usuario hace clic en botón de edición
  ↓
Modal de edición se abre
  ↓
Usuario borra todo el texto del comentario
  ↓
Usuario hace clic en "Guardar Cambios"
  ↓
Campo comment se actualiza a null/empty
  ↓
Tabla muestra "Sin comentario"
```

### 6. Filtrar Solo Comentarios

```
Usuario selecciona "Solo Comentarios" en filtro
  ↓
Sistema filtra entradas donde filename === null
  ↓
Tabla muestra solo comentarios sin archivo
```

---

## API Reference

### Endpoints Completos

#### POST /files/:projectId/upload
Upload archivo con comentario opcional

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Path Params:**
- `projectId` (uuid): ID del proyecto

**Body (multipart/form-data):**
- `file` (file): Archivo a subir (requerido)
- `comment` (string): Comentario opcional

**Response 201:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "uploadedBy": "uuid",
  "filename": "90e3f534-xxx.zip",
  "originalName": "design.zip",
  "storagePath": "projects/uuid/90e3f534-xxx.zip",
  "mimeType": "application/zip",
  "sizeBytes": 1024000,
  "comment": "Diseño final aprobado",
  "uploadedAt": "2025-11-16T20:00:00Z",
  "updatedAt": "2025-11-16T20:00:00Z",
  "uploader": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Errores:**
- 400: No se proporcionó archivo
- 403: No tienes permisos para subir a este proyecto
- 404: Proyecto no encontrado

---

#### POST /files/:projectId/comment
Crear comentario sin archivo

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Path Params:**
- `projectId` (uuid): ID del proyecto

**Body:**
```json
{
  "comment": "Necesitamos revisar los colores del logo"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "uploadedBy": "uuid",
  "filename": null,
  "originalName": null,
  "storagePath": null,
  "mimeType": null,
  "sizeBytes": null,
  "comment": "Necesitamos revisar los colores del logo",
  "uploadedAt": "2025-11-16T20:00:00Z",
  "updatedAt": "2025-11-16T20:00:00Z",
  "uploader": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Errores:**
- 400: Comentario es requerido
- 403: No tienes permisos para crear comentarios en este proyecto
- 404: Proyecto no encontrado

---

#### PATCH /files/:id
Editar comentario y/o agregar archivo

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

**Path Params:**
- `id` (uuid): ID de la entrada (file/comment)

**Body (multipart/form-data):**
- `file` (file): Archivo a agregar (opcional)
- `comment` (string | null): Comentario a actualizar (opcional)

**Casos de Uso:**

1. **Solo editar comentario:**
```
comment: "Texto actualizado"
```

2. **Eliminar comentario:**
```
comment: "" o comment: null
```

3. **Solo agregar archivo:**
```
file: [archivo]
```

4. **Agregar archivo y comentario:**
```
file: [archivo]
comment: "Texto nuevo"
```

**Response 200:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "uploadedBy": "uuid",
  "filename": "abc123.pdf",
  "originalName": "document.pdf",
  "storagePath": "projects/uuid/abc123.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 512000,
  "comment": "Texto actualizado",
  "uploadedAt": "2025-11-16T20:00:00Z",
  "updatedAt": "2025-11-16T20:05:00Z",
  "uploader": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Errores:**
- 403: Solo puedes editar tus propias entradas
- 404: Entrada no encontrada

---

#### GET /files/project/:projectId
Listar archivos y comentarios del proyecto

**Response incluye:**
- Archivos con comentario
- Archivos sin comentario
- Comentarios sin archivo

**Ordenamiento:** `uploadedAt DESC`

---

#### DELETE /files/:id
Eliminar archivo o comentario

**Response:**
```json
{
  "message": "Archivo eliminado exitosamente"
}
// o
{
  "message": "Comentario eliminado exitosamente"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Cliente Sube Diseño con Nota

**Escenario:** Cliente sube archivo ZIP con feedback

**Frontend:**
```typescript
const formData = new FormData();
formData.append('file', selectedFile);
formData.append('comment', 'Primera versión del logo, esperando feedback');

await api.post('/files/project-123/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Backend procesa:**
1. Valida permisos del cliente
2. Sube `logo-v1.zip` a MinIO
3. Crea entrada en BD con comentario
4. Retorna entrada completa

**Resultado en UI:**
```
| Nombre        | Tipo | Tamaño | Comentario                            |
|---------------|------|--------|---------------------------------------|
| logo-v1.zip   | ZIP  | 2.5MB  | Primera versión del logo, esperando…  |
```

---

### Ejemplo 2: Admin Deja Nota Sin Archivo

**Escenario:** Admin deja instrucciones sin adjuntar nada

**Frontend:**
```typescript
await api.post('/files/project-123/comment', {
  comment: 'Por favor envía las fuentes en Adobe Illustrator, no PDF'
});
```

**Backend procesa:**
1. Valida permisos del admin
2. Crea entrada SIN archivo en BD
3. Todos los campos de archivo son `null`
4. Retorna entrada solo con comentario

**Resultado en UI:**
```
| Nombre      | Tipo       | Tamaño | Comentario                                    |
|-------------|------------|--------|-----------------------------------------------|
| Sin archivo | COMENTARIO | -      | Por favor envía las fuentes en Adobe Illus…  |
```

---

### Ejemplo 3: Cliente Agrega Archivo a Comentario

**Escenario:** Cliente creó nota, ahora adjunta el archivo solicitado

**Frontend:**
```typescript
const formData = new FormData();
formData.append('file', aiFile);
// No modificamos el comentario, solo agregamos archivo

await api.patch('/files/comment-456', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Backend procesa:**
1. Encuentra entrada existente (solo comentario)
2. Sube `logo-final.ai` a MinIO
3. Actualiza entrada agregando campos de archivo
4. Comentario original se mantiene
5. `updatedAt` se actualiza

**Resultado en UI:**
```
Antes:
| Nombre      | Tipo       | Comentario              |
|-------------|------------|-------------------------|
| Sin archivo | COMENTARIO | Aquí está el logo final |

Después:
| Nombre        | Tipo | Comentario              |
|---------------|------|-------------------------|
| logo-final.ai | AI   | Aquí está el logo final |
```

---

### Ejemplo 4: Filtrar Solo Comentarios

**Escenario:** Admin quiere ver solo notas/instrucciones sin archivos

**Frontend:**
```typescript
// Usuario selecciona "Solo Comentarios" en dropdown
setTypeFilter('comments');

// useEffect filtra
const filtered = files.filter(file => !file.filename);
```

**Resultado en UI:**
```
Mostrando 3 de 15 entradas

| Nombre      | Tipo       | Comentario                              |
|-------------|------------|-----------------------------------------|
| Sin archivo | COMENTARIO | Revisar paleta de colores               |
| Sin archivo | COMENTARIO | Falta aprobación del cliente            |
| Sin archivo | COMENTARIO | Recordar hacer backup antes de proceder |
```

---

## Consideraciones Técnicas

### Serialización BigInt

**Problema:** PostgreSQL `BigInt` no se serializa a JSON automáticamente

**Solución:** Convertir a `Number` en todos los métodos del service:

```typescript
return {
  ...record,
  sizeBytes: record.sizeBytes ? Number(record.sizeBytes) : null,
};
```

**Archivos afectados:**
- `files.service.ts`: uploadFile, createComment, updateFile, findAllByProject, getFileUrl
- `projects.service.ts`: create, update, findOne

### Nullability

Todos los campos de archivo son **nullable** para soportar comentarios sin archivo:

```typescript
filename: string | null
originalName: string | null
storagePath: string | null
mimeType: string | null
sizeBytes: number | null
```

Frontend debe manejar `null` en todas las operaciones:
- Formateo de tamaño: `file.sizeBytes ? formatFileSize(file.sizeBytes) : '-'`
- Extensión de archivo: `file.originalName ? getFileExtension(file.originalName) : ''`
- Descarga: Solo mostrar botón si `file.filename` existe

### Permisos RBAC

**Admin:**
- Crea comentarios en cualquier proyecto
- Edita/elimina cualquier entrada
- Ve todas las entradas

**Cliente:**
- Crea comentarios solo en sus proyectos
- Edita/elimina solo sus propias entradas
- Ve solo entradas de sus proyectos

**Validación en Backend:**
```typescript
if (userRole === Role.CLIENT) {
  if (file.uploadedBy !== userId) {
    throw new ForbiddenException('Solo puedes editar tus propias entradas');
  }
  if (file.project.clientId !== userId) {
    throw new ForbiddenException('No tienes acceso a este proyecto');
  }
}
```

---

## Troubleshooting

### Error: "Do not know how to serialize a BigInt"

**Causa:** No se está convirtiendo `sizeBytes` a Number

**Solución:** Verificar que todos los métodos del service retornen:
```typescript
return {
  ...record,
  sizeBytes: record.sizeBytes ? Number(record.sizeBytes) : null,
};
```

---

### Comentario no se actualiza

**Causa:** `comment !== undefined` no se cumple

**Solución:** Asegurar que el frontend envíe:
```typescript
if (editComment !== fileToEdit.comment) {
  formData.append('comment', editComment);
}
```

---

### Filtro "Solo Comentarios" muestra archivos

**Causa:** Condición de filtro incorrecta

**Solución:** Usar `!file.filename` en lugar de `!file.originalName`:
```typescript
filtered = filtered.filter(file => !file.filename);
```

---

### No se puede descargar comentario

**Causa:** Intentar descargar entrada sin archivo

**Solución:** Backend lanza error apropiado:
```typescript
if (!file.storagePath) {
  throw new BadRequestException('Esta entrada no tiene un archivo para descargar');
}
```

Frontend solo muestra botón de descarga si hay archivo:
```tsx
{file.filename && (
  <button onClick={() => handleDownload(file.id)}>Descargar</button>
)}
```

---

## Mejoras Futuras

### Potenciales Features

1. **Rich Text Comments**
   - Markdown o WYSIWYG editor
   - Formato de texto enriquecido
   - Links y menciones

2. **Respuestas a Comentarios**
   - Sistema de hilos/threads
   - Conversaciones anidadas
   - Notificaciones de respuestas

3. **Menciones de Usuarios**
   - @username para notificar
   - Autocompletado de usuarios
   - Notificaciones push

4. **Historial de Ediciones**
   - Ver versiones anteriores del comentario
   - Restaurar comentarios eliminados
   - Auditoría de cambios

5. **Adjuntar Múltiples Archivos**
   - Un comentario con varios archivos
   - Galería de archivos relacionados
   - Versionamiento de archivos

---

## Conclusión

El sistema de comentarios está completamente funcional y probado. Permite una comunicación fluida entre Admin y Cliente dentro de cada proyecto, soportando tanto archivos con comentarios como notas independientes.

**Archivos clave:**
- Backend: `files.service.ts`, `files.controller.ts`
- Frontend: `frontend/app/dashboard/projects/[id]/page.tsx`
- Schema: `backend/prisma/schema.prisma`

Para reportar issues o sugerir mejoras, contacta al equipo de desarrollo.

---

**Última actualización:** 16 de Noviembre, 2025
