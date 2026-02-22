# Plan de Mejora de Principios de Arquitectura

**Fecha:** 2026-02-22  
**Proyecto:** Align Designs Platform  
**Estado Actual:** ~85% cumplimiento  
**Objetivo:** 100% cumplimiento

---

## Resumen Ejecutivo

| Principio | Estado Actual | Prioridad |
|-----------|---------------|-----------|
| KISS | 85% | Alta |
| SoC | 90% | Media |
| DRY | 90% | Media |
| Single Source of Truth | 90% | Baja |
| Progressive Enhancement | 60% | Alta |
| Accessibility First | 85% | Alta |

---

## 1. KISS — Keep It Simple, Stupid

**Definición:** No sobrediseñar componentes. Si algo se puede hacer simple, hazlo simple.

**Estado Actual:** 85%

### Problemas Identificados

#### 1.1 Componentes Demasiado Grandes (>300 líneas)

| Archivo | Líneas | Acción |
|---------|--------|--------|
| `components/projects/PaymentsStageContent.tsx` | 666 | Dividir en 5-6 componentes |
| `app/dashboard/projects/[id]/components/ProjectWorkflowSection.tsx` | 610 | Dividir en 4 componentes |
| `app/dashboard/admin/users/page.tsx` | 543 | Extraer lógica a hooks |
| `app/dashboard/projects/[id]/payments/page.tsx` | 533 | Simplificar |
| `components/dashboard/ProjectModals.tsx` | 496 | Dividir por modal |
| `components/projects/ProjectStagesView.tsx` | 447 | Dividir por stage |

#### 1.2 Refactoring Requerido: PaymentsStageContent.tsx

**Ubicación:** `apps/frontend/components/projects/PaymentsStageContent.tsx`

**Dividir en:**
```
components/projects/payments/
├── PaymentsStageContent.tsx (contenedor, ~100 líneas)
├── InvoiceList.tsx (lista de facturas)
├── EmployeePaymentsList.tsx (pagos a empleados)
├── ClientPaymentsList.tsx (pagos de clientes)
├── PaymentActions.tsx (botones de acción por rol)
├── PaymentEmptyState.tsx (estado vacío)
└── hooks/
    └── usePaymentsData.ts (lógica de carga)
```

#### 1.3 Refactoring Requerido: ProjectWorkflowSection.tsx

**Ubicación:** `apps/frontend/app/dashboard/projects/[id]/components/ProjectWorkflowSection.tsx`

**Dividir en:**
```
app/dashboard/projects/[id]/components/workflow/
├── ProjectWorkflowSection.tsx (contenedor, ~80 líneas)
├── ProjectStatusSection.tsx (ya existe, usarlo)
├── DeadlinesSection.tsx (ya existe, usarlo)
├── EmployeesSection.tsx (ya existe, usarlo)
├── PaymentProgressSection.tsx (nuevo)
└── hooks/
    └── useWorkflowData.ts
```

#### 1.4 Refactoring Requerido: admin/users/page.tsx

**Ubicación:** `apps/frontend/app/dashboard/admin/users/page.tsx`

**Acciones:**
- Extraer `UserForm` a componente separado
- Extraer `UserTable` a componente separado
- Mover lógica de tabs a hook `useUserTabs`

---

## 2. SoC — Separation of Concerns

**Definición:** Separa lógica, UI y estado. Un componente no debería hacer todo.

**Estado Actual:** 90%

### Problemas Identificados

#### 2.1 Lógica de Negocio en Componentes UI

| Archivo | Problema |
|---------|----------|
| `PaymentsStageContent.tsx:92-140` | Lógica de carga de datos embebida |
| `ProjectWorkflowSection.tsx:73-100` | useEffect con lógica de negocio |
| `app/dashboard/projects/[id]/page.tsx:46-116` | Múltiples useEffect con fetch |

#### 2.2 Crear Hooks Especializados

**Crear:** `apps/frontend/hooks/usePaymentsStage.ts`
```typescript
// Extraer de PaymentsStageContent.tsx
export function usePaymentsStage(projectId: string, userRole: string, userId: string) {
  // Lógica de carga de facturas, pagos empleados, pagos cliente
  // Retorna: { invoices, employeePayments, clientPayments, loading, error, refetch }
}
```

**Crear:** `apps/frontend/hooks/useWorkflowData.ts`
```typescript
// Extraer de ProjectWorkflowSection.tsx
export function useWorkflowData(projectId: string) {
  // Lógica de invoice deadlines, payment progress, pending amounts
}
```

#### 2.3 Servicios con Lógica Duplicada

**Archivos afectados:**
- `services/invoices.service.ts`
- `services/payments.service.ts`
- `services/employee-payments.service.ts`

**Acción:** Crear base service o utilidades compartidas para operaciones CRUD comunes.

---

## 3. DRY — Don't Repeat Yourself

**Definición:** Componentes reutilizables, no copies el mismo JSX en 5 lados.

**Estado Actual:** 90%

### Problemas Identificados

#### 3.1 Patrones de Modal Duplicados

**Archivos con patrones similares:**
- `components/modals/UploadPaymentProofModal.tsx`
- `components/modals/PayEmployeeModal.tsx`
- `components/modals/GenerateInvoiceModal.tsx`
- `components/modals/ApproveEmployeePaymentModal.tsx`
- `components/payments/ClientPaymentUploadModal.tsx`
- `components/payments/RecordPaymentModal.tsx`
- `components/payments/AdminPaymentReviewModal.tsx`

**Acción:** Crear `components/common/FormModal.tsx` con:
- Header con título y botón cerrar
- Body con formulario
- Footer con botones de acción
- Estados de loading/error

#### 3.2 Patrones de Lista/Tabla Duplicados

**Archivos con tablas similares:**
- `components/payments/PaymentHistoryTable.tsx`
- `app/dashboard/admin/users/page.tsx` (tablas de usuarios)
- `app/dashboard/users/page.tsx` (tablas de usuarios)

**Acción:** Crear componentes:
- `components/common/DataTable.tsx` - tabla reutilizable
- `components/common/EmptyState.tsx` - estado vacío reutilizable

#### 3.3 Estilos de Status Badge Duplicados

**Ubicación:** `PaymentsStageContent.tsx:26-44`

```typescript
const getStatusColor = (status: InvoiceStatus | EmployeePaymentStatus): string => {
  // Función duplicada en múltiples archivos
}
```

**Acción:** Mover a `lib/utils/status-colors.ts` o integrar en `ProjectStatusBadge.tsx`

#### 3.4 Formularios de Usuario Duplicados

**Archivos:**
- `app/dashboard/admin/users/page.tsx` - formulario de creación
- `app/dashboard/profile/page.tsx` - formulario de edición

**Acción:** Crear `components/users/UserForm.tsx` compartido

---

## 4. Single Source of Truth

**Definición:** El estado vive en un solo lugar, no duplicado entre componentes.

**Estado Actual:** 90%

### Problemas Identificados

#### 4.1 Estado de Proyecto Duplicado

**Archivos afectados:**
- `contexts/ProjectContext.tsx` - contexto
- `app/dashboard/projects/[id]/page.tsx` - estado local adicional

**Problema:** En `page.tsx:46-116` hay useEffect que carga proyecto, pero también existe ProjectContext.

**Acción:** Usar consistentemente ProjectContext, eliminar estado local duplicado.

#### 4.2 Estado de Usuario en Múltiples Lugares

**Archivos:**
- `contexts/AuthContext.tsx`
- `hooks/useUsers.ts`
- Estado local en páginas de admin

**Acción:** Centralizar estado de usuario en AuthContext + useUsers hook como única fuente.

#### 4.3 Constantes Dispersas

**Ubicaciones actuales:**
- `lib/constants.ts`
- `lib/constants/ui.constants.ts`
- `lib/constants/validation.constants.ts`
- `lib/constants/password-regex.constants.ts`

**Acción:** Mantener estructura pero documentar en `lib/constants/index.ts` con exports centralizados.

---

## 5. Progressive Enhancement

**Definición:** Que lo básico funcione siempre, lo fancy es extra.

**Estado Actual:** 60%

### Problemas Identificados

#### 5.1 Todo es Client-Side Rendering

**Problema:** 59 archivos con `'use client'` al inicio, incluyendo páginas.

**Archivos de página que deberían ser SSR:**
- `app/dashboard/admin/clients/page.tsx`
- `app/dashboard/admin/invoices/page.tsx`
- `app/dashboard/admin/users/page.tsx`
- `app/dashboard/projects/page.tsx`

#### 5.2 Estrategia de Mejora

**Para páginas de listado (admin/clients, admin/invoices, etc.):**

1. **Eliminar `'use client'`** del componente página
2. **Crear Server Component** que:
   - Haga fetch inicial de datos en el servidor
   - Pase datos como props a componente cliente
3. **Crear Client Component** separado para interactividad:
   ```
   app/dashboard/admin/users/
   ├── page.tsx (Server Component - fetch inicial)
   └── components/
       └── UsersTable.tsx (Client Component - interactividad)
   ```

#### 5.3 Ejemplo de Refactoring: admin/users/page.tsx

**Actual:**
```typescript
'use client';
// Todo el código aquí...
```

**Propuesto:**
```typescript
// page.tsx (Server Component)
import { UsersClient } from './components/UsersClient';
import { UsersService } from '@/services/users.service';

export default async function UsersPage() {
  const initialUsers = await UsersService.getAll();
  return <UsersClient initialUsers={initialUsers} />;
}
```

```typescript
// components/UsersClient.tsx (Client Component)
'use client';
// Solo interactividad aquí
```

#### 5.4 OfflineIndicator Exists pero Limitado

**Ubicación:** `components/ui/OfflineIndicator.tsx`

**Mejoras necesarias:**
- Integrar con Service Worker para offline real
- Agregar cola de operaciones offline
- Sincronización cuando vuelve la conexión

#### 5.5 Loading States

**Bien implementado:**
- `components/ui/Loader.tsx` - PageLoader, ButtonLoader, etc.
- Skeleton loaders en algunas páginas

**Falta:**
- Implementar en todas las páginas de listado
- Agregar `loading.tsx` por ruta para transiciones suaves

**Archivos a crear:**
```
app/dashboard/admin/users/loading.tsx
app/dashboard/admin/clients/loading.tsx
app/dashboard/admin/invoices/loading.tsx
app/dashboard/projects/loading.tsx
app/dashboard/projects/[id]/loading.tsx
```

---

## 6. Accessibility First

**Definición:** Diseña pensando en todos los usuarios desde el inicio.

**Estado Actual:** 85%

### Problemas Identificados

#### 6.1 Falta de Memoización en Componentes de Lista

**Problema:** Solo 1 componente usa `React.memo` (ProjectCard).

**Archivos que necesitan memoización:**
- `components/projects/StageCard.tsx`
- `components/projects/PaymentProgressBar.tsx`
- `components/dashboard/invoices/InvoiceStatusBadge.tsx`
- `components/feedback/FeedbackTimeline.tsx`
- Cualquier componente renderizado en listas

#### 6.2 Focus Management Incompleto

**Bien implementado:**
- `Modal.tsx:64-97` - Focus trap correcto
- `Pagination.tsx` - Focus en elementos de paginación

**Falta:**
- Focus en modales de confirmación después de abrir
- Focus en campos de formulario con error
- Focus en notificaciones toast

**Archivos a revisar:**
- `components/modals/ConfirmModal.tsx` - agregar autoFocus
- `components/common/ErrorModal.tsx` - focus en mensaje

#### 6.3 Skip Links Faltantes

**Crear:** `components/common/SkipLinks.tsx`

```typescript
// Agregar al inicio de cada página
<nav className="sr-only">
  <a href="#main-content">Skip to main content</a>
  <a href="#sidebar">Skip to navigation</a>
</nav>
```

#### 6.4 Contraste de Colores

**Revisar:**
- Badge de status con colores (verificar WCAG AA)
- Texto en fondos stone-*

**Herramienta sugerida:** axe DevTools para auditoría

#### 6.5 Formularios Sin Labels Asociados

**Archivos con problemas:**
- `app/dashboard/admin/users/page.tsx` - formularios inline
- Varios modales con inputs sin label visible

**Acción:** Usar `FormField` component consistentemente o agregar `aria-label`

#### 6.6 Imágenes Sin Alt Text

**Buscar:** Elementos `<img>` o `<Image>` sin alt

**Acción:** Agregar `alt` descriptivo a todas las imágenes

#### 6.7 Errores de Validación No Anunciados

**Problema:** Errores de formulario no se anuncian a screen readers

**Acción:** Agregar `aria-live="polite"` a contenedores de error de formulario

**Modificar:** `components/ui/inputs/FormField.tsx`
```typescript
<p className={FORM_ERROR} role="alert" aria-live="polite">
```

#### 6.8 Tablas Sin Headers Apropiados

**Archivos:**
- `components/payments/PaymentHistoryTable.tsx`
- Tablas en páginas de admin

**Verificar:** `<thead>`, `<th scope="col">`, `<th scope="row">`

---

## Plan de Implementación

### Fase 1: Crítico (Semana 1-2)
- [ ] Dividir `PaymentsStageContent.tsx`
- [ ] Dividir `ProjectWorkflowSection.tsx`
- [ ] Crear `FormModal.tsx` base
- [ ] Agregar `loading.tsx` a rutas principales

### Fase 2: Importante (Semana 3-4)
- [ ] Dividir `admin/users/page.tsx`
- [ ] Crear hooks `usePaymentsStage`, `useWorkflowData`
- [ ] Implementar SSR en páginas de listado
- [ ] Agregar `React.memo` a componentes de lista

### Fase 3: Mejora (Semana 5-6)
- [ ] Crear `DataTable.tsx` reutilizable
- [ ] Unificar formularios de usuario
- [ ] Implementar Skip Links
- [ ] Auditoría de accesibilidad con axe DevTools

### Fase 4: Polish (Semana 7-8)
- [ ] Service Worker para offline
- [ ] Focus management completo
- [ ] Documentar arquitectura final
- [ ] Tests de accesibilidad

---

## Checklist Final

### KISS
- [ ] Ningún componente > 300 líneas
- [ ] Máximo 3 useEffect por componente
- [ ] Funciones auxiliares fuera del componente

### SoC
- [ ] Lógica de datos en hooks/servicios
- [ ] UI en componentes
- [ ] Estado en contexts/hooks

### DRY
- [ ] Sin código duplicado
- [ ] Componentes base reutilizables
- [ ] Utilidades centralizadas

### SSOT
- [ ] Un contexto por dominio
- [ ] Props derivadas de una fuente
- [ ] Sin estado duplicado

### Progressive Enhancement
- [ ] SSR en páginas de listado
- [ ] Loading states por ruta
- [ ] Funcionalidad offline básica

### Accessibility First
- [ ] 100% aria-labels en acciones
- [ ] Focus trap en todos los modales
- [ ] Skip links en todas las páginas
- [ ] Contraste WCAG AA
- [ ] Screen reader friendly

---

**Documento generado para revisión y asignación de tareas.**
