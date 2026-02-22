# Plan de Mejora de Principios de Arquitectura

**Fecha última revisión:** 2026-02-22  
**Proyecto:** Align Designs Platform  
**Estado Real:** ~85% cumplimiento  
**Objetivo:** 100% cumplimiento

---

## Resumen Ejecutivo - ANÁLISIS HONESTO

| Principio | Estado Real | Faltante | Problema Principal |
|-----------|-------------|----------|-------------------|
| KISS | 70% | 30% | 6 archivos >300 líneas |
| SoC | 85% | 15% | Lógica embebida en componentes grandes |
| DRY | 75% | 25% | 5 modales de pago no usan FormModal |
| SSOT | 95% | 5% | Menor |
| Progressive Enhancement | 60% | 40% | TODO es CSR, sin SSR |
| Accessibility First | 90% | 10% | Falta auditoría formal |

---

## Problemas Reales Detectados

### 1. KISS — 70%

**Archivos que NO cumplen (<300 líneas):**

| Archivo | Líneas | Problema |
|---------|--------|----------|
| `AdminWorkflowView.tsx` | 419 | Lógica de negocio + UI + estado |
| `users/page.tsx` | 364 | Página no dividida |
| `FileList.tsx` | 356 | Lista compleja sin dividir |
| `ProjectStagesView.tsx` | 348 | Múltiples responsabilidades |
| `PaymentHistoryTable.tsx` | 323 | Tabla con demasiada lógica |
| `projects/[id]/page.tsx` | 312 | Página principal no dividida |

**Acción requerida:**
- Dividir `AdminWorkflowView.tsx` en 3-4 componentes
- Dividir `users/page.tsx` (ya tiene componentes pero la página es grande)
- Extraer lógica de `FileList.tsx` a hooks

---

### 2. SoC — 85%

**Problemas:**
- 65 `useEffect` distribuidos en componentes
- `AdminWorkflowView.tsx` tiene:
  - Estado de modales
  - Formateo de fechas
  - Lógica de permisos
  - Handlers de acciones

**Acción requerida:**
- Mover `formatDate` a utils (ya existe, usarla)
- Extraer handlers a `useAdminWorkflow` hook
- Separar secciones en componentes

---

### 3. DRY — 75%

**Modales de pago que NO usan FormModal:**

| Archivo | Líneas | Debería usar |
|---------|--------|--------------|
| `UploadPaymentProofModal.tsx` | 263 | FormModal |
| `RecordPaymentModal.tsx` | 260 | FormModal |
| `ClientPaymentUploadModal.tsx` | 253 | FormModal |
| `AdminPaymentReviewModal.tsx` | 249 | FormModal |
| `PayEmployeeModal.tsx` | 232 | FormModal |

**Total: 1,257 líneas que podrían ser ~400 líneas usando FormModal**

**Acción requerida:**
- Refactorizar los 5 modales para usar `FormModal`
- Crear variaciones si es necesario (FormModal con file upload, etc.)

---

### 4. SSOT — 95%

**Estado:** Casi completo

**Menores problemas:**
- Algunos estados locales duplicados entre padre/hijo
- Constantes OK (index.ts centralizado)

---

### 5. Progressive Enhancement — 60%

**PROBLEMA GRAVE: 84 archivos con `'use client'`**

Esto significa:
- **TODO es Client-Side Rendering**
- No hay Server Components
- Primera carga sin datos
- SEO limitado
- Sin hidratación progresiva

**Acción requerida (compleja):**

Páginas que deberían ser SSR:
```
app/dashboard/admin/clients/page.tsx
app/dashboard/admin/invoices/page.tsx
app/dashboard/admin/users/page.tsx
app/dashboard/projects/page.tsx
app/dashboard/projects/[id]/page.tsx
```

**Estrategia:**
```typescript
// ANTES (CSR)
'use client';
export default function UsersPage() {
  const { users } = useUsers(); // fetch en cliente
  return <UsersTable users={users} />;
}

// DESPUÉS (SSR + Client)
// page.tsx (Server Component)
import { UsersClient } from './components/UsersClient';
import { UsersService } from '@/services/users.service';

export default async function UsersPage() {
  const initialUsers = await UsersService.getAll();
  return <UsersClient initialUsers={initialUsers} />;
}

// components/UsersClient.tsx (Client Component)
'use client';
export function UsersClient({ initialUsers }) {
  // Solo interactividad
}
```

---

### 6. Accessibility First — 90%

**Completado:**
- [x] SkipLinks
- [x] FormField con useId
- [x] DataTable con teclado
- [x] aria-live en errores
- [x] scope="col" en tablas

**Falta:**
- [ ] Auditoría formal con axe DevTools
- [ ] Focus management en modales específicos
- [ ] Verificar contraste WCAG AA

---

## Plan Real para 100%

### Fase 1: KISS (Semana 1-2)
- [ ] Dividir `AdminWorkflowView.tsx` (419 → ~150)
- [ ] Dividir `FileList.tsx` (356 → ~150)
- [ ] Dividir `ProjectStagesView.tsx` (348 → ~150)

### Fase 2: DRY (Semana 3)
- [ ] Refactorizar `UploadPaymentProofModal` con FormModal
- [ ] Refactorizar `RecordPaymentModal` con FormModal
- [ ] Refactorizar `ClientPaymentUploadModal` con FormModal
- [ ] Refactorizar `AdminPaymentReviewModal` con FormModal
- [ ] Refactorizar `PayEmployeeModal` con FormModal

### Fase 3: SoC (Semana 4)
- [ ] Crear `useAdminWorkflow` hook
- [ ] Crear `useFileList` hook
- [ ] Mover funciones de formato a utils

### Fase 4: Progressive Enhancement (Semana 5-6)
- [ ] SSR en `/admin/clients`
- [ ] SSR en `/admin/invoices`
- [ ] SSR en `/admin/users`
- [ ] SSR en `/projects`

### Fase 5: A11y (Semana 7)
- [ ] Auditoría con axe DevTools
- [ ] Corregir problemas encontrados

---

## Checklist Real

### KISS 70%
- [ ] AdminWorkflowView < 300 líneas
- [ ] users/page < 300 líneas
- [ ] FileList < 300 líneas
- [ ] ProjectStagesView < 300 líneas
- [ ] PaymentHistoryTable < 300 líneas
- [ ] projects/[id]/page < 300 líneas

### SoC 85%
- [ ] useAdminWorkflow hook
- [ ] useFileList hook
- [ ] Funciones de formato en utils

### DRY 75%
- [ ] UploadPaymentProofModal usa FormModal
- [ ] RecordPaymentModal usa FormModal
- [ ] ClientPaymentUploadModal usa FormModal
- [ ] AdminPaymentReviewModal usa FormModal
- [ ] PayEmployeeModal usa FormModal

### SSOT 95%
- [x] Contextos por dominio
- [x] constants/index.ts
- [ ] Sin estado duplicado

### Progressive Enhancement 60%
- [ ] SSR en admin/clients
- [ ] SSR en admin/invoices
- [ ] SSR en admin/users
- [ ] SSR en projects
- [ ] Server Components

### Accessibility First 90%
- [x] SkipLinks
- [x] FormField useId
- [x] DataTable teclado
- [ ] Auditoría axe DevTools
- [ ] WCAG AA verificado

---

## Conclusión

**Estado real: ~85%**

Los principales problemas son:
1. **6 archivos >300 líneas** (KISS)
2. **5 modales sin FormModal** (DRY) - 1,257 líneas desperdiciadas
3. **Todo es CSR** (Progressive Enhancement) - 84 archivos 'use client'
4. **Falta auditoría formal** (A11y)

El documento anterior era optimista. Este es el estado real.
