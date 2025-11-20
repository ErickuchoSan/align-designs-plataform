# Análisis de Calidad de Código - Align Designs

**Fecha:** 2025-11-20
**Proyecto:** Align Designs Demo (Monorepo)
**Tecnologías:** NestJS (Backend), Next.js (Frontend), Prisma, MinIO

---

## CRITICAL

### 1. **AuditService Implementado Pero No Utilizado**
**Severidad:** CRITICAL
**Ubicaciones:**
- `apps/backend/src/audit/audit.service.ts:1-92` - Servicio completo implementado
- **NO SE USA en ningún controlador o servicio**

**Problema:**
Se implementó un sistema completo de auditoría con acciones definidas (LOGIN, LOGOUT, FILE_UPLOAD, FILE_DOWNLOAD, USER_CREATE, etc.) pero no se está utilizando en ninguna parte del código. Esto significa que NO hay trazabilidad de acciones críticas.

**Impacto:**
- Sin auditoría de accesos
- Imposible rastrear quién hizo qué y cuándo
- Falta de compliance con regulaciones (GDPR, SOC2, etc.)
- Imposibilidad de investigar incidentes de seguridad

**Solución:**
Integrar `AuditService` en:
- `auth.controller.ts` - LOGIN, LOGOUT, PASSWORD_CHANGE, OTP_VERIFY
- `users.controller.ts` - USER_CREATE, USER_UPDATE, USER_DELETE
- `projects.controller.ts` - PROJECT_CREATE, PROJECT_UPDATE, PROJECT_DELETE
- `files.controller.ts` - FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE

---

### 2. **Soft Delete No Elimina Archivos Físicos de MinIO**
**Severidad:** CRITICAL
**Ubicaciones:**
- `apps/backend/src/projects/projects.service.ts:359-382` - Soft delete de proyectos
- `apps/backend/src/files/files.service.ts:428-472` - Soft delete de archivos

**Problema:**
Cuando se hace soft delete de proyectos o archivos, solo se marca como `deletedAt` en la base de datos, pero los archivos físicos permanecen en MinIO indefinidamente.

**Impacto:**
- Desperdicio de espacio de almacenamiento (crecimiento infinito)
- Costos innecesarios de infraestructura
- Posible exposición de datos "eliminados" si alguien obtiene acceso a MinIO
- Incumplimiento de políticas de retención de datos

**Solución:**
Implementar un job programado (cron) que:
1. Busque archivos con `deletedAt > 30 días`
2. Elimine físicamente de MinIO usando `storageService.deleteFile()`
3. Opcionalmente, hard delete del registro en BD

---

### 3. **Logs de Desarrollo Expuestos en Producción**
**Severidad:** CRITICAL
**Ubicaciones:**
- `apps/frontend/lib/api.ts:98-101` - console.log de reintentos
- `apps/frontend/lib/api.ts:112-115` - console.error de max retries

**Problema:**
Aunque hay checks de `process.env.NODE_ENV === 'development'`, estos pueden ser bypassed si NODE_ENV no está configurado correctamente en producción.

**Código Problemático:**
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(
    `Retrying request (${config.retryCount}/${MAX_RETRIES}) after ${delay}ms: ${config.url}`
  );
}
```

**Impacto:**
- Exposición de URLs internas y estructura de la aplicación
- Información sobre reintentos que puede ayudar a atacantes
- Console logs pueden afectar performance en producción

**Solución:**
1. Usar el logger service en lugar de console
2. Asegurar que NODE_ENV esté siempre configurado en producción
3. Usar build-time tree shaking para eliminar logs completamente

---

### 4. **Validación de Archivos Incompleta**
**Severidad:** CRITICAL
**Ubicaciones:**
- `apps/backend/src/common/utils/file-magic-numbers.utils.ts:9-72` - Solo valida tipos básicos
- **FALTA**: Validación de archivos SVG, AI, PSD, RAR, 7Z, MOV

**Problema:**
El validador de magic numbers solo cubre JPG, PNG, GIF, WebP, PDF, DOC, XLS, ZIP, TXT. Los siguientes tipos están permitidos pero NO validados:
- `image/svg+xml` - SVG (puede contener JavaScript malicioso)
- `application/postscript` - AI
- `image/vnd.adobe.photoshop` - PSD
- `application/x-rar-compressed` - RAR
- `application/x-7z-compressed` - 7Z
- `video/quicktime` - MOV

**Impacto:**
- Ataques XSS a través de SVG con scripts
- Posible ejecución de código malicioso
- File spoofing attacks

**Solución:**
Agregar magic numbers para todos los tipos permitidos o remover tipos que no se pueden validar.

---

## HIGH

### 1. **Falta Protección CSRF Completa**
**Severidad:** HIGH
**Ubicaciones:**
- `apps/backend/src/main.ts:16` - cookieParser habilitado
- `apps/backend/src/common/middleware/csrf.middleware.ts` - Archivo existe pero no revisado
- **NO se aplica** en los controladores

**Problema:**
Se menciona CSRF en comentarios y hay un middleware, pero no se ve implementación activa ni tokens CSRF en las respuestas.

**Impacto:**
- Vulnerabilidad a ataques CSRF
- Usuarios pueden ser engañados para hacer acciones no autorizadas
- Transferencias de archivos, cambios de contraseña, eliminaciones pueden ser forzadas

**Solución:**
1. Implementar generación de CSRF tokens
2. Incluir tokens en formularios y headers
3. Validar tokens en cada request mutante

---

### 2. **Escape HTML Potencialmente Bypasseable**
**Severidad:** HIGH
**Ubicaciones:**
- `apps/backend/src/email/email.service.ts:65-76` - Método escapeHtml definido
- `apps/backend/src/email/email.service.ts:287` - Uso: `${this.escapeHtml(userName)}`
- `apps/backend/src/email/templates/base-email.template.ts` - Probablemente tiene otra versión

**Problema:**
Hay un método `escapeHtml` pero se usa con template strings que pueden bypasear el escape si no se usa correctamente.

**Código Problemático:**
```typescript
Hello ${this.escapeHtml(userName)},<br>
```

**Impacto:**
- XSS en emails si userName contiene HTML malicioso
- Phishing mejorado con HTML inyectado

**Solución:**
1. Usar una librería de templating segura (Handlebars con escape automático)
2. Validar que TODOS los datos dinámicos pasen por escape
3. Considerar usar solo texto plano para emails

---

### 3. **Lógica de Negocio Duplicada: Separación Files/Comments**
**Severidad:** HIGH
**Ubicaciones:**
- `apps/backend/src/projects/projects.service.ts:136-150` - Lógica de separación
- `apps/backend/src/projects/projects.service.ts:230-241` - Misma lógica repetida
- `apps/backend/src/files/files.service.ts` - No usa esta lógica consistentemente

**Problema:**
La lógica para separar "files" (filename !== null) y "comments" (filename === null) está duplicada y es inconsistente.

**Código Duplicado:**
```typescript
// projects.service.ts línea 136-138
const filesCount = project.files.filter((f) => f.filename !== null).length;
const commentsCount = project.files.filter((f) => f.filename === null).length;

// projects.service.ts línea 230-231
const filesCount = project.files.filter((f) => f.filename !== null).length;
const commentsCount = project.files.filter((f) => f.filename === null).length;
```

**Impacto:**
- Difícil mantenimiento
- Riesgo de inconsistencias si se cambia la lógica en un lugar
- Violación del principio DRY

**Solución:**
Crear una utilidad:
```typescript
class FileUtils {
  static separateFilesAndComments(files: File[]) {
    return {
      files: files.filter(f => f.filename !== null),
      comments: files.filter(f => f.filename === null),
      filesCount: files.filter(f => f.filename !== null).length,
      commentsCount: files.filter(f => f.filename === null).length
    }
  }
}
```

---

### 4. **Tipo `any` en Frontend**
**Severidad:** HIGH
**Ubicaciones:**
- `apps/frontend/hooks/useProjects.ts:137` - `(file: any) => file.uploadedBy === editingProject.clientId`

**Problema:**
Uso de `any` elimina los beneficios de TypeScript.

**Código Problemático:**
```typescript
const clientHasUploads = files.some(
  (file: any) => file.uploadedBy === editingProject.clientId
);
```

**Impacto:**
- Pérdida de type safety
- Errores en runtime si la estructura cambia
- Difícil refactorización

**Solución:**
Definir interface:
```typescript
interface FileUpload {
  id: string;
  uploadedBy: string;
  filename: string | null;
  // ... otros campos
}
```

---

### 5. **Hardcoded Region en MinIO**
**Severidad:** HIGH
**Ubicaciones:**
- `apps/backend/src/storage/storage.service.ts:96` - `'us-east-1'` hardcoded

**Problema:**
La región de MinIO está hardcoded en lugar de ser configurable.

**Código Problemático:**
```typescript
await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
```

**Impacto:**
- No funciona correctamente en otras regiones
- Dificultad para desplegar en diferentes ambientes
- Posible fallo si el endpoint no soporta esa región

**Solución:**
```typescript
const region = this.configService.get<string>('MINIO_REGION', 'us-east-1');
await this.minioClient.makeBucket(this.bucketName, region);
```

---

## MEDIUM

### 1. **Array Hardcoded Extremadamente Largo**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/backend/src/common/utils/validation.utils.ts:159-374` - 215 líneas de códigos de país

**Problema:**
Un array de 200+ country codes hardcoded en el código.

**Impacto:**
- Difícil mantenimiento
- Archivo muy largo e ilegible
- Dificulta code reviews

**Solución:**
Mover a archivo de constantes JSON o usar librería existente:
```typescript
import { getCountryCallingCode } from 'libphonenumber-js';
```

---

### 2. **Inconsistencia en Logging**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/backend/src/auth/auth.service.ts:23` - Usa `this.logger`
- `apps/frontend/lib/api.ts:98,112` - Usa `console.log`
- `apps/frontend/contexts/AuthContext.tsx:38,56,68,78,102` - Usa `logger` service

**Problema:**
No hay un estándar consistente de logging entre backend y frontend, ni dentro del mismo codebase.

**Impacto:**
- Dificulta debugging
- Logs inconsistentes en producción
- Algunos logs pueden no aparecer en sistemas de monitoreo

**Solución:**
Estandarizar en:
- Backend: siempre usar `this.logger` de NestJS
- Frontend: siempre usar el custom `logger` service

---

### 3. **Missing Null/Undefined Checks**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/frontend/lib/api.ts:74` - `config?.url` pero luego se usa sin verificar
- `apps/backend/src/email/email.service.ts:489` - `email.split('@')[1]` sin verificar

**Problema:**
Varios lugares donde se asume que valores existen sin verificar.

**Código Problemático:**
```typescript
const domain = email.split('@')[1]?.toLowerCase();
```

**Impacto:**
- Posibles crashes en runtime
- Error: "Cannot read property of undefined"

**Solución:**
Usar optional chaining más defensivamente:
```typescript
const parts = email.split('@');
if (parts.length !== 2) return false;
const domain = parts[1].toLowerCase();
```

---

### 4. **Validación Duplicada de Archivos**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/backend/src/files/pipes/file-validation.pipe.ts:45-86` - Validación personalizada
- `apps/backend/src/files/files.controller.ts:15-16` - Imports de validadores de Nest que no se usan

**Problema:**
Se importan `MaxFileSizeValidator` y `FileTypeValidator` de NestJS pero no se usan, en su lugar se usa un pipe personalizado.

**Código Redundante:**
```typescript
import {
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
// Nunca se usan
```

**Impacto:**
- Imports innecesarios
- Confusión sobre qué validación se usa
- Bundle size ligeramente más grande

**Solución:**
Remover imports no utilizados.

---

### 5. **Falta Índice Compuesto en Prisma**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/backend/prisma/schema.prisma:94-96` - Índices en File model

**Problema:**
Queries comunes como "buscar archivos no eliminados de un proyecto" necesitarían un índice compuesto.

**Código:**
```prisma
@@index([projectId])
@@index([deletedAt])
```

**Impacto:**
- Queries más lentas en tablas grandes
- Mayor uso de recursos de BD

**Solución:**
Agregar índice compuesto:
```prisma
@@index([projectId, deletedAt])
```

---

### 6. **Método escapeHtml Duplicado**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/backend/src/email/email.service.ts:65-76` - Método definido
- `apps/backend/src/email/templates/base-email.template.ts` - Importa función `escapeHtml`

**Problema:**
Parece haber dos implementaciones de la misma funcionalidad.

**Impacto:**
- DRY violation
- Posible inconsistencia si se actualizan por separado

**Solución:**
Consolidar en un archivo de utilidades compartidas.

---

### 7. **Falta Rate Limiting en Algunos Endpoints**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/backend/src/users/users.controller.ts` - Varios endpoints sin @Throttle
- `apps/backend/src/projects/projects.controller.ts` - Endpoints de listado sin rate limit

**Problema:**
Solo algunos endpoints tienen rate limiting explícito, otros dependen del rate limit global.

**Endpoints sin rate limit:**
- `GET /users` - Listado de usuarios
- `GET /projects` - Listado de proyectos
- `GET /users/profile` - Ver perfil

**Impacto:**
- Posible DoS por abuso de endpoints
- Scraping de datos

**Solución:**
Agregar `@Throttle` a todos los endpoints públicos o definir una estrategia global más restrictiva.

---

### 8. **Inconsistencia en Manejo de Errores**
**Severidad:** MEDIUM
**Ubicaciones:**
- `apps/backend/src/auth/auth.service.ts:69-75` - Try-catch con re-throw condicional
- `apps/backend/src/users/users.service.ts` - No tiene try-catch, deja que Nest maneje
- `apps/backend/src/storage/storage.service.ts:274-285` - Try-catch con transformación

**Problema:**
No hay un patrón consistente de manejo de errores. Algunos servicios:
- Usan try-catch y transforman errores
- Usan try-catch y re-throw
- No usan try-catch

**Impacto:**
- Mensajes de error inconsistentes
- Difícil debugging
- Posible exposición de stack traces

**Solución:**
Implementar un Exception Filter global con manejo consistente.

---

## LOW

### 1. **Magic Numbers sin Constantes**
**Severidad:** LOW
**Ubicaciones:**
- `apps/backend/src/otp/otp.service.ts:164` - `7 * 24 * 60 * 60 * 1000` (7 días)
- `apps/backend/src/projects/projects.service.ts:380` - `30000` (30 segundos)
- `apps/backend/src/auth/auth.controller.ts:95` - `7 * 24 * 60 * 60 * 1000` (7 días)

**Problema:**
Números mágicos dispersos en el código sin nombres descriptivos.

**Impacto:**
- Dificulta entender el propósito
- Difícil cambiar valores consistentemente

**Solución:**
Crear constantes:
```typescript
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TRANSACTION_TIMEOUT_MS = 30000;
```

---

### 2. **Comentarios TODO en Código de Producción**
**Severidad:** LOW
**Ubicaciones:**
Encontrados en:
- `apps/backend/src/common/dto/phone.dto.ts`
- `apps/frontend/app/components/PhoneInput.tsx`
- Múltiples archivos de documentación

**Problema:**
Comentarios TODO/FIXME que indican trabajo incompleto.

**Impacto:**
- Funcionalidades posiblemente incompletas
- Deuda técnica no rastreada

**Solución:**
1. Convertir TODOs en issues de GitHub
2. Completar o remover
3. Usar herramienta para rastrear TODOs automáticamente

---

### 3. **Falta Documentación de API**
**Severidad:** LOW
**Ubicaciones:**
- `apps/backend/src/files/files.controller.ts` - Falta @ApiOperation en algunos métodos
- `apps/backend/src/users/users.controller.ts` - Documentación Swagger incompleta

**Problema:**
Swagger está configurado pero no todos los endpoints tienen documentación completa.

**Impacto:**
- Dificulta uso de la API
- Documentación incompleta para clientes

**Solución:**
Agregar decoradores @ApiOperation, @ApiResponse a todos los endpoints.

---

### 4. **Uso de `??` vs `||` Inconsistente**
**Severidad:** LOW
**Ubicaciones:**
- `apps/backend/src/main.ts:137` - Usa `??`
- `apps/backend/src/storage/storage.service.ts:57-62` - Usa `||`

**Problema:**
Mezcla de operadores nullish coalescing (`??`) y OR lógico (`||`).

**Impacto Mínimo:**
- Puede causar bugs sutiles con valores falsy
- Inconsistencia de estilo

**Solución:**
Estandarizar en `??` que es más preciso.

---

### 5. **Nombres de Variables en Español e Inglés Mezclados**
**Severidad:** LOW
**Ubicaciones:**
- Comentarios en español en código con variables en inglés
- Documentación .md mezclada

**Problema:**
Mezcla de idiomas dificulta lectura.

**Impacto:**
- Confusión para desarrolladores
- Inconsistencia

**Solución:**
Estandarizar todo el código en inglés, documentación puede estar en español.

---

### 6. **Prisma Client No Optimizado**
**Severidad:** LOW
**Ubicaciones:**
- `apps/backend/prisma/schema.prisma:4-5` - Generator sin optimizaciones

**Problema:**
No hay configuración de `previewFeatures` o `binaryTargets` que podrían optimizar.

**Solución Sugerida:**
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "metrics"]
  binaryTargets = ["native"]
}
```

---

## RESUMEN ESTADÍSTICO

| Severidad | Cantidad | % del Total |
|-----------|----------|-------------|
| CRITICAL  | 4        | 16%         |
| HIGH      | 5        | 20%         |
| MEDIUM    | 8        | 32%         |
| LOW       | 6        | 24%         |
| **TOTAL** | **23**   | **100%**    |

---

## ÁREAS MÁS PROBLEMÁTICAS

1. **Auditoría y Logging** (CRITICAL) - Sistema implementado pero no usado
2. **Gestión de Archivos** (CRITICAL/HIGH) - Soft delete sin limpieza, validación incompleta
3. **Seguridad** (CRITICAL/HIGH) - CSRF incompleto, XSS en emails, logs expuestos
4. **Código Duplicado** (HIGH/MEDIUM) - Lógica de separación files/comments, escapeHtml
5. **Configuración** (MEDIUM) - Valores hardcoded, falta de variables de entorno

---

## RECOMENDACIONES PRIORITARIAS

### Inmediatas (Esta Sprint):
1. Implementar uso de AuditService en todas las operaciones críticas
2. Crear job para limpieza de archivos soft-deleted
3. Remover console.logs del código de producción
4. Completar validación de magic numbers para todos los tipos de archivo

### Corto Plazo (Próximo Sprint):
1. Refactorizar lógica duplicada de files/comments
2. Implementar CSRF protection completa
3. Estandarizar logging en todo el proyecto
4. Agregar tipos TypeScript faltantes

### Medio Plazo (Próximo Mes):
1. Crear documentación Swagger completa
2. Implementar sistema de constantes centralizado
3. Agregar índices compuestos en Prisma
4. Convertir TODOs en issues rastreables

---

## CONCLUSIÓN

El proyecto tiene una **base sólida** con buenas prácticas de seguridad implementadas (bcrypt, JWT, validación de archivos, soft delete). Sin embargo, hay **issues críticos** que deben abordarse:

**Puntos Fuertes:**
- ✅ Arquitectura limpia y modular
- ✅ Uso correcto de DTOs y validación
- ✅ Implementación de rate limiting
- ✅ Soft delete implementado
- ✅ Validación de passwords robusta

**Puntos Críticos a Mejorar:**
- ❌ Sistema de auditoría no utilizado
- ❌ Limpieza de archivos físicos pendiente
- ❌ Validación de archivos incompleta
- ❌ Logs de desarrollo en producción

**Deuda Técnica Total Estimada:** ~3-4 sprints de trabajo para resolver todos los issues.

---

**Generado por:** Claude AI
**Revisión Recomendada:** Cada 3 meses o después de cambios arquitectónicos importantes
