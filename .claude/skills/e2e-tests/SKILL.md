---
name: e2e-tests
description: Tests E2E con Playwright para Align Designs. Usa esta skill para ejecutar tests E2E, escribir nuevos tests, debuggear fallos, o entender la estructura de tests en e2e/. Cubre flujos de login, usuarios, proyectos y pagos. Activa cuando el usuario mencione Playwright, E2E, tests de integración, o quiera probar flujos completos de la aplicación.
---

# E2E Tests - Align Designs

Tests End-to-End usando Playwright para probar flujos completos de la aplicación en un navegador real.

## Ejecutar Tests

```bash
# Todos los tests E2E
pnpm test:e2e

# Con interfaz visual interactiva
pnpm test:e2e:ui

# Con navegador visible (headful)
pnpm test:e2e:headed

# Un archivo específico
pnpm test:e2e e2e/auth.spec.ts

# Un test específico por nombre
pnpm test:e2e -g "should login successfully"
```

## Estructura del Proyecto

```
e2e/
├── fixtures/
│   └── test-data.ts           # Datos de prueba y credenciales
├── helpers/
│   └── auth.ts                # Funciones helper (login, logout)
├── auth.spec.ts               # Tests de login/logout
├── users.spec.ts              # Tests de crear empleados/clientes
├── projects.spec.ts           # Tests de proyectos y project brief
├── payments.spec.ts           # Tests de flujo de pagos
├── invoices.spec.ts           # Tests de facturas
├── file-uploads.spec.ts       # Tests de subida de archivos
├── feedback-cycle.spec.ts     # Tests de ciclo de feedback
├── project-lifecycle.spec.ts  # Tests de estados del proyecto
├── password-reset.spec.ts     # Tests de reset de contraseña
├── employee-assignment.spec.ts # Tests de asignación de empleados
├── time-tracking.spec.ts      # Tests de registro de horas
├── user-profile.spec.ts       # Tests de perfil de usuario
├── notifications.spec.ts      # Tests de notificaciones
├── search-filter.spec.ts      # Tests de búsqueda y filtros
├── full-project-flow.spec.ts  # Tests de flujo completo
├── multi-role.spec.ts         # Tests de roles múltiples
└── payment-approval.spec.ts   # Tests de aprobación de pagos

playwright.config.ts           # Configuración de Playwright
```

## Archivos de Tests

| Archivo | Flujos que Prueba |
|---------|-------------------|
| `auth.spec.ts` | Login, logout, validación de campos, redirect |
| `users.spec.ts` | Crear empleado, crear cliente, modales |
| `projects.spec.ts` | Crear proyecto, project brief, stages |
| `payments.spec.ts` | Pago inicial, métodos de pago, modal |
| `invoices.spec.ts` | Crear factura, ver lista, descargar PDF |
| `file-uploads.spec.ts` | Subir archivos a stages del proyecto |
| `feedback-cycle.spec.ts` | Ciclo de diseño, aprobar/rechazar |
| `project-lifecycle.spec.ts` | Estados: waiting → active → completed → archived |
| `password-reset.spec.ts` | Forgot password, OTP, nueva contraseña |
| `employee-assignment.spec.ts` | Asignar empleados a proyectos |
| `time-tracking.spec.ts` | Registrar horas, editar, reportes |
| `user-profile.spec.ts` | Ver/editar perfil, cambiar contraseña |
| `notifications.spec.ts` | Lista de notificaciones, marcar leído |
| `search-filter.spec.ts` | Búsqueda global, filtros, paginación |
| `full-project-flow.spec.ts` | Flujo completo de proyecto start-to-end |
| `multi-role.spec.ts` | Permisos por rol (admin/employee/client) |
| `payment-approval.spec.ts` | Aprobar/rechazar pagos pendientes |

## Escribir un Nuevo Test

```typescript
import { test, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from './fixtures/test-data';

test.describe('Mi Flujo', () => {
  // Setup: Login antes de cada test
  test.beforeEach(async ({ page }) => {
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;
    if (!adminPassword) {
      test.skip();
      return;
    }

    await page.goto(URLS.login);
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', adminPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test('should do something', async ({ page }) => {
    // Navegar
    await page.goto('/dashboard/my-page');

    // Interactuar
    await page.click('button:has-text("Action")');

    // Esperar resultado
    await expect(page.locator('h1')).toContainText('Expected');
  });
});
```

## Selectores Comunes

### Por ID
```typescript
await page.fill('#email', 'test@test.com');
await page.fill('#create-firstName', 'John');
```

### Por Texto del Botón
```typescript
await page.click('button:has-text("Continue")');
await page.click('button:has-text("Create Client")');
```

### Por Rol
```typescript
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
await page.getByRole('button', { name: /submit/i }).click();
```

### Por Placeholder
```typescript
await page.fill('input[placeholder*="Email"]', 'test@test.com');
```

### Modales
```typescript
// Esperar que abra
await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

// Verificar que cerró
await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });
```

## Patrones de Espera

```typescript
// Esperar URL
await page.waitForURL(/dashboard/, { timeout: 15000 });

// Esperar elemento visible
await expect(page.locator('#my-element')).toBeVisible({ timeout: 10000 });

// Esperar que red esté idle
await page.waitForLoadState('networkidle');

// Esperar tiempo fijo (evitar si es posible)
await page.waitForTimeout(500);
```

## Upload de Archivos

```typescript
// Archivo simple
await page.locator('#payment-receipt').setInputFiles('path/to/file.pdf');

// Múltiples archivos
await page.locator('#upload-files').setInputFiles([
  'path/to/file1.pdf',
  'path/to/file2.png'
]);
```

## Debuggear Tests Fallando

### 1. Ejecutar con navegador visible
```bash
pnpm test:e2e:headed
```

### 2. Usar UI interactiva
```bash
pnpm test:e2e:ui
```

### 3. Ver screenshots de fallos
Los screenshots se guardan en `test-results/` cuando un test falla.

### 4. Agregar pausa para inspeccionar
```typescript
test('debug this', async ({ page }) => {
  await page.goto('/my-page');
  await page.pause(); // Abre inspector de Playwright
});
```

### 5. Ver logs del navegador
```typescript
page.on('console', msg => console.log('BROWSER:', msg.text()));
```

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `E2E_BASE_URL` | URL base para tests | `http://45.55.71.127` |
| `E2E_ADMIN_PASSWORD` | Contraseña del admin | (confidencial) |

Para desarrollo local:
```bash
E2E_BASE_URL=http://localhost:3000 E2E_ADMIN_PASSWORD=mypass pnpm test:e2e
```

## CI/CD

Los tests E2E se ejecutan opcionalmente en GitHub Actions después del deploy:

```yaml
# Solo si E2E_ADMIN_PASSWORD está configurado como variable de repositorio
e2e-tests:
  needs: health-check
  if: success() && vars.E2E_ADMIN_PASSWORD != ''
```

Para habilitar:
1. Ir a **GitHub > Settings > Secrets and variables > Actions > Variables**
2. Crear variable: `E2E_ADMIN_PASSWORD`

## Errores Comunes

### 1. Test timeout
**Causa**: Elemento no encontrado o página no cargó.

```typescript
// MAL: Selector muy específico
await page.click('#btn-submit-123');

// BIEN: Selector flexible
await page.click('button:has-text("Submit")');
```

### 2. Test pasa local pero falla en CI
**Causa**: Diferencias de timing, viewport, o network.

```typescript
// Agregar más tolerancia
await expect(page.locator('#element')).toBeVisible({ timeout: 15000 });
```

### 3. "Element not visible"
**Causa**: El elemento está fuera del viewport.

```typescript
// Hacer scroll antes de interactuar
await page.locator('#my-element').scrollIntoViewIfNeeded();
await page.click('#my-element');
```

### 4. Modal no cierra
**Causa**: Validación fallando o request pendiente.

```typescript
// Verificar que el modal cerró con timeout
await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });
```

## Agregar Datos de Test

Editar `e2e/fixtures/test-data.ts`:

```typescript
export const TEST_NEW_ENTITY = {
  name: `E2E Test ${Date.now()}`, // Único para evitar colisiones
  email: `e2e.test.${Date.now()}@test.com`,
};
```

## Ver Reportes

Después de ejecutar tests:
```bash
npx playwright show-report
```

Esto abre el reporte HTML con detalles de cada test.