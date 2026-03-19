# 🚀 PLAN MAESTRO DE IMPLEMENTACIÓN
## Align Designs Platform v2.0

> **Fecha de creación:** 27 de Diciembre, 2024
> **Estado actual:** Sistema base funcional (auth, users, projects, files)
> **Objetivo:** Implementar flujo completo del sistema v2.0 con todas las funcionalidades críticas

---

## 📋 ÍNDICE

1. [Estado Actual del Sistema](#1-estado-actual-del-sistema)
2. [Gap Analysis (Qué falta)](#2-gap-analysis)
3. [Fases de Implementación](#3-fases-de-implementación)
4. [Plan de Migraciones](#4-plan-de-migraciones)
5. [Checklist de Requisitos](#5-checklist-de-requisitos)
6. [Estimaciones y Prioridades](#6-estimaciones-y-prioridades)

---

## 1. ESTADO ACTUAL DEL SISTEMA

### ✅ Lo que ya funciona:

#### Backend:
- **Auth completo:** Login, registro, verificación de email, OTP, rate limiting, CSRF protection
- **Users:** CRUD completo con roles (ADMIN, CLIENT)
- **Projects:** CRUD básico con relación a cliente
- **Files:** Upload a MinIO, download con presigned URLs, soft delete
- **Cache:** Redis con invalidación inteligente
- **Audit:** Sistema de auditoría básico
- **Security:** CORS, Helmet, validación, sanitización

#### Frontend:
- **Dashboard:** Admin y client dashboards
- **Projects:** Lista, creación, edición, eliminación
- **Files:** Upload, download, vista de lista
- **Auth:** Login, register, password reset, email verification

### ❌ Lo que falta (según flujo v2.0):

#### Crítico:
1. **Rol EMPLOYEE** - No existe en el enum Role
2. **Project Status** - No hay estados (WAITING_PAYMENT, ACTIVE, COMPLETED, ARCHIVED)
3. **Employees Assignment** - No hay relación many-to-many entre Project y Employee
4. **Payment System** - No existe modelo de Payments
5. **Stages** - No hay sistema de etapas (Brief, Feedback, References, etc.)
6. **Feedback Cycles** - No hay modelo para rastrear ciclos de feedback
7. **Time Tracking** - No hay seguimiento de tiempos por empleado
8. **Versioning** - No hay versionado de archivos
9. **Invoices** - No hay sistema de facturas
10. **Client Analytics** - No hay vista de historial de cliente

---

## 2. GAP ANALYSIS

### 🔴 FASE 1 - CRÍTICA (Funcionalidad básica del negocio)

| Feature | Status | Prioridad | Complejidad |
|---------|--------|-----------|-------------|
| Rol EMPLOYEE + asignación a proyectos | ❌ | CRÍTICA | Media |
| Project Status + Initial Payment | ❌ | CRÍTICA | Media |
| Stages System (8 etapas fijas) | ❌ | CRÍTICA | Alta |
| File Stage Assignment | ❌ | CRÍTICA | Media |
| Basic Feedback System | ❌ | CRÍTICA | Alta |
| Employee Assignment Validation | ❌ | CRÍTICA | Baja |

### 🟡 FASE 2 - IMPORTANTE (Tracking y análisis)

| Feature | Status | Prioridad | Complejidad |
|---------|--------|-----------|-------------|
| Rejection Tracking | ❌ | ALTA | Media |
| Time Tracking per Employee | ❌ | ALTA | Alta |
| Payment System (Client→Admin) | ❌ | ALTA | Alta |
| Payment System (Admin→Employee) | ❌ | ALTA | Alta |
| File Versioning | ❌ | ALTA | Media |
| Client Analytics Dashboard | ❌ | ALTA | Media |
| Basic Audit Trail | ⚠️ | ALTA | Baja (ya parcial) |

### 🟢 FASE 3 - MEJORAS (Professional touches)

| Feature | Status | Prioridad | Complejidad |
|---------|--------|-----------|-------------|
| Invoice System | ❌ | MEDIA | Alta |
| Project Completion Checklist | ❌ | MEDIA | Baja |
| File Cleanup Policy (90 days) | ❌ | MEDIA | Media |
| Enhanced Analytics | ❌ | BAJA | Media |
| Notifications System | ❌ | BAJA | Alta |

---

## 3. FASES DE IMPLEMENTACIÓN

### 🔴 FASE 1: FUNDACIÓN DEL FLUJO DE TRABAJO (Semana 1-2)

**Objetivo:** Permitir que Admin cree proyectos con empleados, defina etapas, y que usuarios suban archivos a etapas.

#### 1.1 Database Schema Update

```prisma
// MIGRACIÓN 1: Agregar rol EMPLOYEE y estados de proyecto

enum Role {
  ADMIN
  CLIENT
  EMPLOYEE  // NUEVO
}

enum ProjectStatus {
  WAITING_PAYMENT   // Esperando pago inicial
  ACTIVE            // Proyecto activo
  COMPLETED         // Completado
  ARCHIVED          // Archivado
}

enum Stage {
  BRIEF_PROJECT
  FEEDBACK_CLIENT
  FEEDBACK_EMPLOYEE
  REFERENCES
  SUBMITTED
  ADMIN_APPROVED
  CLIENT_APPROVED
  PAYMENTS
}

model Project {
  // Campos existentes...
  status                  ProjectStatus  @default(WAITING_PAYMENT)  // NUEVO
  initialAmountRequired   Decimal?       @map("initial_amount_required") @db.Decimal(10,2)  // NUEVO
  amountPaid              Decimal        @default(0) @map("amount_paid") @db.Decimal(10,2)  // NUEVO
  startDate               DateTime?      @map("start_date") @db.Date  // NUEVO
  deadlineDate            DateTime?      @map("deadline_date") @db.Date  // NUEVO
  archivedAt              DateTime?      @map("archived_at") @db.Timestamptz(6)  // NUEVO

  // Relaciones nuevas
  employees               ProjectEmployee[]  // NUEVO
  payments                Payment[]         // NUEVO
  feedbackCycles          FeedbackCycle[]   // NUEVO
}

// Tabla intermedia para empleados asignados
model ProjectEmployee {
  projectId   String   @map("project_id") @db.Uuid
  employeeId  String   @map("employee_id") @db.Uuid
  assignedAt  DateTime @default(now()) @map("assigned_at") @db.Timestamptz(6)

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  employee    User     @relation("AssignedEmployees", fields: [employeeId], references: [id], onDelete: Cascade)

  @@id([projectId, employeeId])
  @@index([employeeId])
  @@map("project_employees")
}

model File {
  // Campos existentes...
  stage                   Stage?         // NUEVO - Etapa del archivo
  feedbackCycleId         String?        @map("feedback_cycle_id") @db.Uuid  // NUEVO
  approvedAdminAt         DateTime?      @map("approved_admin_at") @db.Timestamptz(6)  // NUEVO
  approvedClientAt        DateTime?      @map("approved_client_at") @db.Timestamptz(6)  // NUEVO
  pendingPayment          Boolean        @default(false) @map("pending_payment")  // NUEVO

  feedbackCycle           FeedbackCycle? @relation(fields: [feedbackCycleId], references: [id])
}

model FeedbackCycle {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId     String    @map("project_id") @db.Uuid
  employeeId    String    @map("employee_id") @db.Uuid
  startDate     DateTime  @map("start_date") @db.Timestamptz(6)
  endDate       DateTime? @map("end_date") @db.Timestamptz(6)
  status        String    @default("open")  // open, submitted, approved, rejected
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)

  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  employee      User      @relation("EmployeeCycles", fields: [employeeId], references: [id], onDelete: Restrict)
  files         File[]
  feedback      Feedback[]

  @@index([projectId])
  @@index([employeeId])
  @@index([status])
  @@map("feedback_cycles")
}

model Feedback {
  id                  String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  feedbackCycleId     String          @map("feedback_cycle_id") @db.Uuid
  projectId           String          @map("project_id") @db.Uuid
  createdBy           String          @map("created_by") @db.Uuid
  targetAudience      String          @map("target_audience")  // client_space, employee_space
  fileDocumentId      String?         @map("file_document_id") @db.Uuid  // El contenido del feedback
  sequenceInCycle     Int             @map("sequence_in_cycle")  // 1er, 2do, 3er feedback
  createdAt           DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)

  cycle               FeedbackCycle   @relation(fields: [feedbackCycleId], references: [id], onDelete: Cascade)
  project             Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator             User            @relation("CreatedFeedback", fields: [createdBy], references: [id], onDelete: Restrict)

  @@index([feedbackCycleId])
  @@index([projectId])
  @@index([targetAudience])
  @@map("feedback")
}

// Actualizar User model para incluir relaciones
model User {
  // Campos existentes...
  assignedProjects      ProjectEmployee[]    @relation("AssignedEmployees")
  feedbackCycles        FeedbackCycle[]      @relation("EmployeeCycles")
  createdFeedback       Feedback[]           @relation("CreatedFeedback")
}
```

#### 1.2 Backend Implementation

**Archivos a crear/modificar:**

1. **Database Migration**
   ```bash
   npx prisma migrate dev --name add_workflow_system
   ```

2. **Backend Services** (apps/backend/src/)
   - `users/services/employee.service.ts` - Gestión de empleados
   - `projects/services/project-employee.service.ts` - Asignación de empleados
   - `projects/services/project-status.service.ts` - Gestión de estados
   - `files/services/file-stage.service.ts` - Gestión de etapas de archivos
   - `feedback/feedback.module.ts` - Nuevo módulo
   - `feedback/feedback.service.ts` - Lógica de ciclos de feedback
   - `feedback/feedback.controller.ts` - Endpoints de feedback

3. **Backend DTOs** (apps/backend/src/)
   - `projects/dto/create-project.dto.ts` - Actualizar para incluir employees, dates, initialAmount
   - `projects/dto/update-project-status.dto.ts` - NUEVO
   - `files/dto/upload-file.dto.ts` - Actualizar para incluir stage
   - `feedback/dto/create-feedback.dto.ts` - NUEVO

4. **Validaciones críticas**
   - Validar que empleado no esté en otro proyecto ACTIVO al asignar
   - Validar que proyecto esté ACTIVE para subir archivos
   - Validar permisos por etapa según rol

#### 1.3 Frontend Implementation

**Archivos a crear/modificar:**

1. **Types** (apps/frontend/types/)
   - `index.ts` - Actualizar interfaces Project, File, User
   - `feedback.ts` - NUEVO: FeedbackCycle, Feedback

2. **Admin - Project Creation** (apps/frontend/app/dashboard/admin/)
   - `projects/new/page.tsx` - Actualizar form:
     - Multi-select de empleados
     - Campo de monto inicial requerido
     - Fecha de inicio y deadline
     - Validación de disponibilidad de empleados

3. **Project Detail View** (apps/frontend/app/dashboard/projects/[id]/)
   - `page.tsx` - Mostrar estado del proyecto, progreso de pago
   - `components/ProjectStatusBadge.tsx` - NUEVO
   - `components/PaymentProgressBar.tsx` - NUEVO
   - `components/StagesTabs.tsx` - NUEVO - Navegación por etapas
   - `components/FilesByStage.tsx` - NUEVO - Archivos filtrados por etapa

4. **File Upload with Stage** (apps/frontend/app/dashboard/projects/[id]/)
   - `hooks/useFileOperations.ts` - Actualizar para incluir stage selection
   - Validar que solo se puede subir si proyecto ACTIVE
   - Selector de etapa según rol y permisos

#### 1.4 Funcionalidad Completada Fase 1

- ✅ Rol EMPLOYEE funcionando
- ✅ Admin puede crear proyectos con empleados asignados
- ✅ Sistema valida que empleado no esté en otro proyecto activo
- ✅ Proyectos inician en WAITING_PAYMENT
- ✅ Archivos se suben con etapa asignada
- ✅ Vista de proyecto muestra estado y progreso de pago

---

### 🟡 FASE 2: PAGOS Y WORKFLOW (Semana 3-4)

**Objetivo:** Implementar sistema de pagos inicial, activación de proyectos, y ciclo básico de feedback.

#### 2.1 Database Schema Update

```prisma
// MIGRACIÓN 2: Sistema de pagos

enum PaymentType {
  INITIAL_PAYMENT    // Pago inicial del cliente para activar proyecto
  INVOICE            // Pago de factura (cliente → admin)
  EMPLOYEE_PAYMENT   // Pago a empleado por trabajo aprobado
}

enum PaymentMethod {
  TRANSFER
  CHECK
}

enum PaymentStatus {
  PENDING_CONFIRMATION  // Cheque pendiente de confirmar
  CONFIRMED             // Confirmado
}

model Payment {
  id                String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId         String         @map("project_id") @db.Uuid
  type              PaymentType
  fromUserId        String?        @map("from_user_id") @db.Uuid  // Quién paga
  toUserId          String?        @map("to_user_id") @db.Uuid    // Quién recibe
  amount            Decimal        @db.Decimal(10,2)
  paymentMethod     PaymentMethod  @map("payment_method")
  paymentDate       DateTime       @map("payment_date") @db.Date
  receiptFileUrl    String?        @map("receipt_file_url") @db.Text
  status            PaymentStatus  @default(CONFIRMED)
  notes             String?        @db.Text
  createdAt         DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)

  project           Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fromUser          User?          @relation("PaymentsFrom", fields: [fromUserId], references: [id], onDelete: Restrict)
  toUser            User?          @relation("PaymentsTo", fields: [toUserId], references: [id], onDelete: Restrict)
  relatedFiles      PaymentFile[]  // Archivos relacionados al pago

  @@index([projectId])
  @@index([type])
  @@index([fromUserId])
  @@index([toUserId])
  @@map("payments")
}

// Relación many-to-many entre Payment y File (para pagos a empleados)
model PaymentFile {
  paymentId  String  @map("payment_id") @db.Uuid
  fileId     String  @map("file_id") @db.Uuid

  payment    Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  file       File    @relation(fields: [fileId], references: [id], onDelete: Cascade)

  @@id([paymentId, fileId])
  @@map("payment_files")
}

// Actualizar File para relación
model File {
  // Campos existentes...
  paymentFiles  PaymentFile[]  // NUEVO
}

// Actualizar User para relaciones de pago
model User {
  // Campos existentes...
  paymentsFrom  Payment[]  @relation("PaymentsFrom")
  paymentsTo    Payment[]  @relation("PaymentsTo")
}
```

#### 2.2 Backend Implementation

**Servicios a crear:**

1. **Payment Service** (apps/backend/src/payments/)
   ```typescript
   // payments.service.ts

   // Registrar pago inicial del cliente
   async recordInitialPayment(
     projectId: string,
     amount: number,
     paymentMethod: PaymentMethod,
     paymentDate: Date,
     receiptFile?: Express.Multer.File,
     fromUserId?: string,
   ): Promise<Payment>

   // Actualizar proyecto si pago inicial completo
   async checkAndActivateProject(projectId: string): Promise<Project>

   // Registrar pago a empleado por archivo aprobado
   async recordEmployeePayment(
     projectId: string,
     employeeId: string,
     fileIds: string[],
     amount: number,
     paymentDate: Date,
     receiptFile: Express.Multer.File,
   ): Promise<Payment>

   // Obtener pagos pendientes por empleado
   async getPendingPaymentsByEmployee(
     projectId: string,
     employeeId: string,
   ): Promise<File[]>
   ```

2. **Feedback Service** (apps/backend/src/feedback/)
   ```typescript
   // feedback.service.ts

   // Crear ciclo de feedback cuando admin envía primer feedback a empleado
   async createFeedbackCycle(
     projectId: string,
     employeeId: string,
   ): Promise<FeedbackCycle>

   // Agregar feedback a ciclo existente
   async addFeedbackToCycle(
     cycleId: string,
     createdBy: string,
     targetAudience: 'client_space' | 'employee_space',
     fileDocumentId?: string,
   ): Promise<Feedback>

   // Marcar ciclo como completado cuando empleado entrega
   async completeFeedbackCycle(
     cycleId: string,
     submittedFileId: string,
   ): Promise<FeedbackCycle>

   // Calcular tiempo transcurrido (con regla de 12PM)
   async calculateTimeElapsed(cycleId: string): Promise<number>
   ```

3. **Project Status Service** (apps/backend/src/projects/services/)
   ```typescript
   // project-status.service.ts

   async activateProject(projectId: string): Promise<Project>
   async completeProject(projectId: string): Promise<Project>
   async archiveProject(projectId: string): Promise<Project>
   async getProjectCompletionStatus(projectId: string): Promise<ProjectCompletionStatus>
   ```

#### 2.3 Frontend Implementation

1. **Payment Flows**
   - `app/dashboard/projects/[id]/payments/` - NUEVA carpeta
   - `PaymentModal.tsx` - Modal para registrar pago
   - `InitialPaymentForm.tsx` - Form específico para pago inicial
   - `EmployeePaymentForm.tsx` - Form específico para pago a empleado
   - `PaymentsList.tsx` - Lista de pagos del proyecto

2. **Feedback Interface**
   - `app/dashboard/projects/[id]/feedback/` - NUEVA carpeta
   - `CreateFeedbackForm.tsx` - Form para crear feedback
   - `FeedbackList.tsx` - Lista de feedback por espacio (cliente/empleado)
   - `FeedbackCycleTimeline.tsx` - Timeline del ciclo de feedback

3. **Project Activation Flow**
   - Cuando proyecto está en WAITING_PAYMENT:
     - Mostrar modal con progreso de pago
     - Botón "Registrar Pago" visible
     - Cuando amountPaid >= initialAmountRequired:
       - Auto-activar proyecto
       - Mostrar notificación de activación

#### 2.4 Funcionalidad Completada Fase 2

- ✅ Cliente puede registrar pago inicial (transferencia o cheque)
- ✅ Sistema acumula pagos y activa proyecto cuando completo
- ✅ Admin puede crear feedback para cliente o empleado
- ✅ Sistema rastrea ciclos de feedback con timestamps
- ✅ Admin puede registrar pagos a empleados por archivos aprobados
- ✅ Empleados ven archivos pendientes de pago

---

### 🟢 FASE 3: VERSIONING Y TRACKING (Semana 5-6)

**Objetivo:** Implementar versionado de archivos, rechazo tracking, y time tracking completo.

#### 3.1 Database Schema Update

```prisma
// MIGRACIÓN 3: Versioning y Rejection Tracking

model File {
  // Campos existentes...

  // Versioning
  versionNumber         Int        @default(1) @map("version_number")
  versionLabel          String?    @map("version_label") @db.VarChar(20)  // "v1", "v2", "v3"
  parentFileId          String?    @map("parent_file_id") @db.Uuid
  isCurrentVersion      Boolean    @default(true) @map("is_current_version")
  versionNotes          String?    @map("version_notes") @db.Text
  fileDimensions        String?    @map("file_dimensions") @db.VarChar(50)  // "1920x1080"

  // Rejection Tracking
  rejectionCount        Int        @default(0) @map("rejection_count")
  lastRejectedAt        DateTime?  @map("last_rejected_at") @db.Timestamptz(6)
  lastRejectionFeedbackId String?  @map("last_rejection_feedback_id") @db.Uuid

  // Relations
  parentFile            File?      @relation("FileVersions", fields: [parentFileId], references: [id], onDelete: Restrict)
  childVersions         File[]     @relation("FileVersions")
  lastRejectionFeedback Feedback?  @relation("RejectedFile", fields: [lastRejectionFeedbackId], references: [id])

  @@index([parentFileId])
  @@index([isCurrentVersion])
}

model Feedback {
  // Campos existentes...

  // Rejection tracking
  rejectedFileId        String?    @map("rejected_file_id") @db.Uuid
  isRejectionFeedback   Boolean    @default(false) @map("is_rejection_feedback")

  rejectedFile          File?      @relation("RejectedFile", fields: [rejectedFileId], references: [id])
  rejectionFeedbacks    File[]     @relation("RejectionLink")  // Reversa de lastRejectionFeedback
}

model TimeTracking {
  id                String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  projectId         String          @map("project_id") @db.Uuid
  employeeId        String          @map("employee_id") @db.Uuid
  feedbackCycleId   String          @map("feedback_cycle_id") @db.Uuid
  startTime         DateTime        @map("start_time") @db.Timestamptz(6)
  endTime           DateTime?       @map("end_time") @db.Timestamptz(6)
  durationDays      Int?            @map("duration_days")
  approvedFileId    String?         @map("approved_file_id") @db.Uuid
  paymentId         String?         @map("payment_id") @db.Uuid
  rejectionCount    Int             @default(0) @map("rejection_count")
  versionCount      Int             @default(1) @map("version_count")
  createdAt         DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)

  project           Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  employee          User            @relation("EmployeeTracking", fields: [employeeId], references: [id], onDelete: Restrict)
  cycle             FeedbackCycle   @relation(fields: [feedbackCycleId], references: [id], onDelete: Cascade)
  approvedFile      File?           @relation("TrackingApproved", fields: [approvedFileId], references: [id])
  payment           Payment?        @relation(fields: [paymentId], references: [id])

  @@index([projectId])
  @@index([employeeId])
  @@index([feedbackCycleId])
  @@map("time_tracking")
}

// Actualizar Project, User, File, Payment para relaciones
model Project {
  // Campos existentes...
  timeTracking  TimeTracking[]
}

model User {
  // Campos existentes...
  timeTracking  TimeTracking[]  @relation("EmployeeTracking")
}

model File {
  // Campos existentes...
  timeTracking  TimeTracking[]  @relation("TrackingApproved")
}

model Payment {
  // Campos existentes...
  timeTracking  TimeTracking[]
}

model FeedbackCycle {
  // Campos existentes...
  timeTracking  TimeTracking[]
}
```

#### 3.2 Backend Implementation

1. **File Versioning Service** (apps/backend/src/files/services/)
   ```typescript
   // file-versioning.service.ts

   async uploadNewVersion(
     parentFileId: string,
     file: Express.Multer.File,
     versionNotes: string,
     uploadedBy: string,
   ): Promise<File>

   async getVersionHistory(fileId: string): Promise<File[]>

   async extractFileMetadata(file: Express.Multer.File): Promise<FileMetadata>
   ```

2. **Rejection Tracking Service** (apps/backend/src/feedback/)
   ```typescript
   // rejection-tracking.service.ts

   async linkFeedbackToRejectedFile(
     feedbackId: string,
     rejectedFileId: string,
   ): Promise<void>

   async incrementRejectionCount(fileId: string): Promise<File>

   async getFileRejectionHistory(fileId: string): Promise<Feedback[]>
   ```

3. **Time Tracking Service** (apps/backend/src/analytics/)
   ```typescript
   // time-tracking.service.ts

   async startTracking(
     projectId: string,
     employeeId: string,
     feedbackCycleId: string,
   ): Promise<TimeTracking>

   async endTracking(
     feedbackCycleId: string,
     approvedFileId: string,
   ): Promise<TimeTracking>

   async calculateDurationDays(
     startTime: Date,
     endTime: Date,
   ): Promise<number>

   async getEmployeePerformance(
     employeeId: string,
     projectId?: string,
   ): Promise<EmployeePerformanceStats>
   ```

#### 3.3 Frontend Implementation

1. **File Versioning UI**
   - `components/FileVersionHistory.tsx` - Mostrar timeline de versiones
   - `components/UploadNewVersionModal.tsx` - Modal para subir nueva versión
   - `components/VersionCompareView.tsx` - Comparar dos versiones

2. **Rejection Tracking UI**
   - `components/RejectionBadge.tsx` - Badge mostrando rechazos
   - `components/RejectionHistory.tsx` - Historial de rechazos
   - Actualizar CreateFeedbackForm para enlazar a archivo rechazado

3. **Analytics Dashboard** (apps/frontend/app/dashboard/admin/)
   - `analytics/` - NUEVA carpeta
   - `EmployeePerformance.tsx` - Estadísticas por empleado
   - `ProjectAnalytics.tsx` - Análisis del proyecto
   - `TimeTrackingChart.tsx` - Gráfica de tiempos

#### 3.4 Funcionalidad Completada Fase 3

- ✅ Empleados pueden subir versiones con notas
- ✅ Sistema auto-numera versiones (v1, v2, v3)
- ✅ Admin puede enlazar feedback a archivo rechazado
- ✅ Sistema cuenta rechazos por archivo
- ✅ Time tracking automático desde primer feedback hasta entrega
- ✅ Dashboard de performance de empleados con métricas

---

### 🔵 FASE 4: ANALYTICS Y INVOICES (Semana 7-8)

**Objetivo:** Sistema de facturas completo, analytics de clientes, y completion checklist.

#### 4.1 Database Schema Update

```prisma
// MIGRACIÓN 4: Invoices y Client Analytics

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

model Invoice {
  id                String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  invoiceNumber     String          @unique @map("invoice_number") @db.VarChar(50)  // INV-2024-12-20-001
  projectId         String          @map("project_id") @db.Uuid
  clientId          String          @map("client_id") @db.Uuid
  issueDate         DateTime        @map("issue_date") @db.Date
  dueDate           DateTime        @map("due_date") @db.Date
  paymentTermsDays  Int             @map("payment_terms_days")  // 15, 30, 60
  subtotal          Decimal         @db.Decimal(10,2)
  taxAmount         Decimal         @default(0) @map("tax_amount") @db.Decimal(10,2)
  totalAmount       Decimal         @map("total_amount") @db.Decimal(10,2)
  amountPaid        Decimal         @default(0) @map("amount_paid") @db.Decimal(10,2)
  status            InvoiceStatus   @default(DRAFT)
  invoiceFileUrl    String?         @map("invoice_file_url") @db.Text
  notes             String?         @db.Text
  sentToClientAt    DateTime?       @map("sent_to_client_at") @db.Timestamptz(6)
  createdAt         DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime        @updatedAt @map("updated_at") @db.Timestamptz(6)

  project           Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  client            User            @relation("ClientInvoices", fields: [clientId], references: [id], onDelete: Restrict)
  payments          Payment[]

  @@index([projectId])
  @@index([clientId])
  @@index([status])
  @@index([dueDate])
  @@map("invoices")
}

// Actualizar Payment para enlazar a Invoice
model Payment {
  // Campos existentes...
  invoiceId  String?  @map("invoice_id") @db.Uuid

  invoice    Invoice? @relation(fields: [invoiceId], references: [id])
}

// Actualizar User y Project para relaciones
model User {
  // Campos existentes...
  invoices  Invoice[]  @relation("ClientInvoices")
}

model Project {
  // Campos existentes...
  invoices  Invoice[]
}

// Vista calculada para Client Analytics
// NOTA: Implementar como query en servicio, no como vista de DB real
```

#### 4.2 Backend Implementation

1. **Invoice Service** (apps/backend/src/invoices/)
   ```typescript
   // invoice.service.ts

   async generateInvoiceNumber(): Promise<string>  // INV-YYYY-MM-DD-XXX

   async createInvoice(data: CreateInvoiceDTO): Promise<Invoice>

   async sendInvoiceToClient(invoiceId: string): Promise<Invoice>

   async recordPaymentToInvoice(
     invoiceId: string,
     paymentId: string,
   ): Promise<Invoice>

   async updateOverdueInvoices(): Promise<number>  // Cron job diario

   async getInvoicesByProject(projectId: string): Promise<Invoice[]>

   async getInvoicesByClient(clientId: string): Promise<Invoice[]>
   ```

2. **Client Analytics Service** (apps/backend/src/analytics/)
   ```typescript
   // client-analytics.service.ts

   async getClientAnalytics(clientId: string): Promise<ClientAnalytics>

   async getClientProjectHistory(clientId: string): Promise<Project[]>

   async calculatePaymentReliability(clientId: string): Promise<number>

   async getTopClients(limit: number, sortBy: string): Promise<ClientAnalytics[]>
   ```

3. **Project Completion Service** (apps/backend/src/projects/services/)
   ```typescript
   // project-completion.service.ts

   async getProjectCompletionStatus(projectId: string): Promise<ProjectCompletionStatus>

   async canArchiveProject(projectId: string): Promise<{
     canArchive: boolean;
     blockers: string[];
   }>

   async scheduleFileCleanup(projectId: string): Promise<void>  // 90 días después
   ```

#### 4.3 Frontend Implementation

1. **Invoice Management** (apps/frontend/app/dashboard/admin/)
   - `invoices/` - NUEVA carpeta
   - `CreateInvoiceForm.tsx` - Form completo de factura
   - `InvoiceList.tsx` - Lista de facturas con filtros
   - `InvoiceDetail.tsx` - Detalle de factura
   - `RecordPaymentModal.tsx` - Registrar pago a factura

2. **Client Profile** (apps/frontend/app/dashboard/admin/)
   - `clients/[id]/` - NUEVA carpeta
   - `ClientProfile.tsx` - Perfil completo del cliente
   - `ClientProjectHistory.tsx` - Historial de proyectos
   - `ClientFinancialSummary.tsx` - Resumen financiero
   - `PaymentReliabilityChart.tsx` - Gráfica de confiabilidad

3. **Project Completion Checklist** (apps/frontend/app/dashboard/)
   - `projects/[id]/components/CompletionChecklist.tsx` - Checklist visual
   - Validación antes de archivar

#### 4.4 Funcionalidad Completada Fase 4

- ✅ Sistema de facturas con auto-numeración
- ✅ Tracking de facturas vencidas automático
- ✅ Perfil completo de cliente con historial
- ✅ Cálculo de payment reliability
- ✅ Checklist de completitud antes de archivar
- ✅ Scheduled cleanup de archivos (90 días)

---

## 4. PLAN DE MIGRACIONES

### Orden de Ejecución

```bash
# MIGRACIÓN 1: Fundación del workflow
npx prisma migrate dev --name add_workflow_system

# MIGRACIÓN 2: Sistema de pagos
npx prisma migrate dev --name add_payment_system

# MIGRACIÓN 3: Versioning y tracking
npx prisma migrate dev --name add_versioning_tracking

# MIGRACIÓN 4: Invoices y analytics
npx prisma migrate dev --name add_invoices_analytics

# Deploy to Production
npx prisma migrate deploy
```

### Datos de Seed Actualizados

Crear seed data para:
- Usuarios con rol EMPLOYEE
- Proyectos de ejemplo en diferentes estados
- Archivos en diferentes etapas
- Ciclos de feedback de ejemplo
- Pagos de ejemplo

---

## 5. CHECKLIST DE REQUISITOS

### Fundamentos del Sistema

- [ ] Rol EMPLOYEE agregado y funcional
- [ ] Estados de proyecto (WAITING_PAYMENT, ACTIVE, COMPLETED, ARCHIVED)
- [ ] Asignación de múltiples empleados a proyectos
- [ ] Validación: empleado solo en 1 proyecto activo a la vez
- [ ] Sistema de 8 etapas fijas implementado
- [ ] Permisos por etapa según rol

### Workflow y Pagos

- [ ] Pago inicial para activar proyecto
- [ ] Acumulación de pagos parciales
- [ ] Auto-activación cuando pago inicial completo
- [ ] Ciclos de feedback rastreados
- [ ] Regla de 12PM para inicio de timer
- [ ] Pagos a empleados por archivos aprobados
- [ ] Vista de pagos pendientes para empleados

### Versioning y Tracking

- [ ] Versionado automático de archivos (v1, v2, v3)
- [ ] Notas de versión por empleado
- [ ] Metadata automática (dimensiones, tamaño, formato)
- [ ] Rejection tracking con conteo
- [ ] Enlace de feedback a archivo rechazado
- [ ] Time tracking automático por ciclo
- [ ] Analytics de performance por empleado

### Invoices y Analytics

- [ ] Sistema de facturas con auto-numeración
- [ ] Términos de pago flexibles (Net 15, 30, 60)
- [ ] Detección automática de facturas vencidas
- [ ] Enlace de pagos a facturas
- [ ] Perfil de cliente con historial
- [ ] Payment reliability score
- [ ] Top clients dashboard
- [ ] Project completion checklist
- [ ] File cleanup policy (90 días)

---

## 6. ESTIMACIONES Y PRIORIDADES

### Timeline Estimado

| Fase | Duración | Complejidad | Bloqueadores |
|------|----------|-------------|--------------|
| Fase 1 | 2 semanas | Alta | Ninguno - puede empezar YA |
| Fase 2 | 2 semanas | Alta | Requiere Fase 1 completa |
| Fase 3 | 2 semanas | Media | Requiere Fase 2 completa |
| Fase 4 | 2 semanas | Media | Requiere Fase 3 completa |
| **Total** | **8 semanas** | - | - |

### Recursos Necesarios

- 1 Developer Full-Stack (Backend + Frontend)
- Testing en cada fase antes de continuar
- Deploy incremental: cada fase se puede deployar por separado

### Estrategia de Deploy

1. **Testing Local**
   - Usar migrations en dev
   - Seed data completo
   - Testing manual de cada feature

2. **Staging Deploy**
   - Deploy cada fase a staging
   - Testing con usuarios reales (admin y 1 cliente)
   - Fix bugs antes de production

3. **Production Deploy**
   - Migrar database con prisma migrate deploy
   - Deploy backend primero
   - Deploy frontend después
   - Rollback plan: revert migration si algo falla

### Mitigación de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Migrations fallan en prod | Media | Alto | Testing exhaustivo en staging, backup antes de migrate |
| Breaking changes en API | Alta | Medio | Versioning de API, mantener backwards compatibility |
| Performance issues con queries complejos | Media | Medio | Indexes en todas las foreign keys, query optimization |
| File storage se llena | Baja | Alto | Cleanup policy, monitoring de storage |

---

## 📌 DECISIONES TÉCNICAS CONFIRMADAS

1. **Invoice Number Format:** `INV-YYYY-MM-DD-XXX` (día reseteado)
2. **Payment Terms:** Flexible por factura (15, 30, 60, o custom)
3. **File Retention:** 90 días después de archivar proyecto
4. **Version Notes:** Opcionales pero recomendadas
5. **Admin Roles:** Solo 1 admin (Poncho) por ahora, expandible después
6. **Employee Assignment Rule:** Estricta - solo 1 proyecto activo a la vez
7. **Time Tracking:** Solo días, no horas/minutos
8. **Feedback Cycle Rule:** Timer desde PRIMER feedback, no el último

---

## 🚦 LISTO PARA EMPEZAR

**Próximo paso inmediato:**

1. Revisar y aprobar este plan
2. Hacer backup de database actual
3. Crear branch `feature/workflow-v2` en Git
4. Empezar con MIGRACIÓN 1 de Fase 1

**¿Preguntas antes de empezar?**

