# Plan de Implementación: Actualización del Flujo del Sistema

Este documento detalla el plan para actualizar la plataforma "Align Designs" basándose en los nuevos requerimientos de flujo de trabajo.

## 1. Análisis del Estado Actual vs. Requerimientos

### Estado Actual (Backend/DB)
*   **Usuarios**: Existe modelo `User` con roles `ADMIN` y `CLIENT`.
*   **Proyectos**: Existe modelo `Project` con relación 1:1 a `Client` y `Creator` (Admin).
*   **Archivos**: Existe modelo `File` vinculado a `Project` y `User` (uploader).
*   **Faltantes Críticos**:
    *   No existe rol `WORKER`.
    *   No hay asignación de múltiples trabajadores a proyectos.
    *   No existen "Categorías" ni permisos por categoría.
    *   No hay fechas de inicio/deadline en proyectos.
    *   No hay manejo de Links ni Comentarios independientes.
    *   No hay registro de pagos/tiempos.

## 2. Soluciones a Preguntas Pendientes

Para cada pregunta, presento 3 opciones. **Recomiendo la Opción 1 en cada caso por balance entre usabilidad y rapidez de desarrollo.**

### Pregunta 1: Links de trabajadores (Imágenes 360, etc.)
*   **Opción 1: Tratamiento como "Archivo Virtual" (Recomendada)**
    *   *Cómo funciona:* En el botón de subir, hay una pestaña "Subir Archivo" y otra "Agregar Link". El link se guarda en la misma tabla de archivos pero con un tipo `LINK`.
    *   *Pros:* Se integra perfecto en la galería existente, se le puede asignar categoría igual que a un archivo.
    *   *Contras:* Requiere validar que el link sea seguro.
*   **Opción 2: Campo de metadatos en archivo**
    *   *Cómo funciona:* Subes un archivo (ej. un PDF o imagen preview) y hay un campo opcional "Link Externo".
    *   *Pros:* Siempre hay un "entregable" visual.
    *   *Contras:* Confuso si solo quieres mandar el link sin archivo.
*   **Opción 3: Sección separada de "Recursos"**
    *   *Cómo funciona:* Una lista aparte solo para links.
    *   *Pros:* Separación clara.
    *   *Contras:* Fragmenta la información; el cliente tiene que buscar en dos lados.

### Pregunta 2: Comentarios sin archivo
*   **Opción 1: Comentarios como Items del Feed (Recomendada)**
    *   *Cómo funciona:* El botón de acción principal dice "Nuevo Item". Puedes elegir: Archivo, Link, o Nota/Comentario. La nota TIENE categoría (ej. "General", "Dudas").
    *   *Pros:* Todo centralizado en la misma vista/tabla. Se puede filtrar por categoría igual que los archivos.
    *   *Contras:* Puede llenar la vista si hay demasiados comentarios tipo "chat".
*   **Opción 2: Chat por Proyecto**
    *   *Cómo funciona:* Una ventana de chat lateral o pestaña "Discusión".
    *   *Pros:* Familiar para usuarios de redes sociales.
    *   *Contras:* Difícil de referenciar temas específicos o categorías. Se pierde el hilo fácil.
*   **Opción 3: Comentarios solo en archivos**
    *   *Cómo funciona:* No se permiten comentarios sueltos; deben comentar sobre un archivo existente o crear un "placeholder".
    *   *Pros:* Mantiene el orden estricto.
    *   *Contras:* Muy rígido; impide hacer preguntas generales.

### Pregunta 3: Información de Pagos (Cliente)
*   **Opción 1: Presupuesto Global y Lista de Conceptos (Recomendada)**
    *   *Cómo funciona:* Admin define un "Monto Total" y sube un PDF/Lista de "Conceptos a Pagar" en una categoría especial "Pagos" (visible solo Admin/Cliente).
    *   *Pros:* Simple, usa el sistema de categorías existente.
    *   *Contras:* No es un sistema de facturación completo (no genera facturas reales).
*   **Opción 2: Módulo de Cotizaciones**
    *   *Cómo funciona:* Un creador de tablas donde admin pone items y precios, y el sistema suma.
    *   *Pros:* Más estructurado y profesional.
    *   *Contras:* Mayor tiempo de desarrollo.
*   **Opción 3: Solo campo de texto "Monto Acordado"**
    *   *Cómo funciona:* Un simple campo en la info del proyecto.
    *   *Pros:* Inmediato.
    *   *Contras:* Muy poca información para el cliente.

### Pregunta 4: Pagos a Trabajadores
*   **Opción 1: Registro de "Gastos/Pagos" por Proyecto (Recomendada)**
    *   *Cómo funciona:* Admin tiene una pestaña "Finanzas" en el proyecto. Agrega registros: "Pago a Juan - $500 - Fecha".
    *   *Pros:* Flexible, permite pagos parciales o por hito.
    *   *Contras:* Entrada manual.
*   **Opción 2: Tarifa por Hora/Proyecto en Perfil**
    *   *Cómo funciona:* Al asignar al trabajador, le pones "Sueldo por este proyecto: $1000".
    *   *Pros:* Automático si es pago fijo.
    *   *Contras:* No maneja pagos parciales o extras imprevistos bien.
*   **Opción 3: Trabajador envía "Cobros"**
    *   *Cómo funciona:* El trabajador sube una "Solicitud de Pago" y admin aprueba.
    *   *Pros:* Delega la tarea al trabajador.
    *   *Contras:* Puede generar fricción o desorden si el trabajador se equivoca.

### Pregunta 5: Análisis Final
*   **Opción 1: Dashboard de Resumen (Recomendada)**
    *   *Cómo funciona:* Una vista simple con 3 tarjetas: "Tiempo Transcurrido", "Rentabilidad (Cobrado vs Gastado)", "Archivos Totales".
    *   *Pros:* Información clave de un vistazo.
    *   *Contras:* No es un reporte profundo (business intelligence).
*   **Opción 2: Reporte Exportable (PDF/Excel)**
    *   *Cómo funciona:* Botón "Generar Reporte Cierre" que baja un archivo.
    *   *Pros:* Bueno para archivar.
    *   *Contras:* No es interactivo.
*   **Opción 3: Gráficas de Evolución**
    *   *Cómo funciona:* Gráfica de línea de tiempo mostrando subidas de archivos y pagos.
    *   *Pros:* Visualmente impactante.
    *   *Contras:* Puede ser overkill (excesivo) para proyectos simples.

---

## 3. Cambios Técnicos Propuestos (Schema)

### Nuevos Modelos y Enums

```prisma
// 1. Actualizar Rol
enum Role {
  ADMIN
  CLIENT
  WORKER // Nuevo
}

// 2. Categorías
model Category {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @db.VarChar(100)
  projectId   String   @map("project_id") @db.Uuid
  permissions String   @default("ALL") // "ALL", "ADMIN_CLIENT", "ADMIN_WORKER", "ADMIN_ONLY"
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  files       File[]
  comments    Comment[] // Si se elige Opción 1 de Q2

  @@map("categories")
}

// 3. Actualizar Proyecto
model Project {
  // ... campos existentes
  startDate   DateTime? @map("start_date") // Nuevo
  deadline    DateTime? // Nuevo
  
  // Relaciones
  workers     ProjectWorker[] // Nueva tabla intermedia para muchos trabajadores
  categories  Category[]
  // ...
}

// 4. Tabla Intermedia Trabajadores-Proyectos
model ProjectWorker {
  projectId   String   @map("project_id") @db.Uuid
  userId      String   @map("user_id") @db.Uuid // El trabajador
  assignedAt  DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
  @@map("project_workers")
}

// 5. Actualizar File (o crear Item general)
model File {
  // ...
  categoryId  String?   @map("category_id") @db.Uuid // Nuevo
  type        String    @default("FILE") // "FILE", "LINK"
  linkUrl     String?   @map("link_url") // Para links
  
  category    Category? @relation(fields: [categoryId], references: [id])
}

// 6. Pagos/Gastos (Para Q3 y Q4)
model Transaction {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId   String   @map("project_id") @db.Uuid
  amount      Decimal  @db.Decimal(10, 2)
  type        String   // "INCOME" (Cobro a cliente), "EXPENSE" (Pago a trabajador)
  description String?
  relatedUserId String? @map("related_user_id") @db.Uuid // A quién se pagó o quién pagó
  date        DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id])
  @@map("transactions")
}
```

## 4. Roadmap de Implementación

1.  **Fase 1: Base de Datos y Modelos**
    *   Modificar `schema.prisma` con los cambios arriba.
    *   Ejecutar migración.
    *   Actualizar scripts de seed si es necesario.

2.  **Fase 2: Gestión de Usuarios y Proyectos**
    *   Actualizar creación de usuarios para permitir rol `WORKER`.
    *   Actualizar creación de proyectos para incluir `startDate`, `deadline` y asignación de `Workers`.

3.  **Fase 3: Categorías y Permisos**
    *   Implementar CRUD de categorías dentro de un proyecto.
    *   Implementar lógica de permisos (backend check antes de devolver datos).

4.  **Fase 4: Archivos, Links y Comentarios**
    *   Actualizar subida de archivos para exigir Categoría.
    *   Implementar soporte para Links.
    *   Implementar vista de "Feed" del proyecto con filtros.

5.  **Fase 5: Finanzas y Dashboard**
    *   Implementar registro de transacciones.
    *   Crear vista de análisis/dashboard.
