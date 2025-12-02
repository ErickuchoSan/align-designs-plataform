# Guía de Integración de Sentry

> 📊 **Monitoreo de Errores en Producción**
> Rastrea, depura y resuelve problemas antes de que afecten a tus usuarios.

## Beneficios

✅ Rastreo de errores en tiempo real
✅ Stack traces completos con source maps
✅ Información de usuario y contexto
✅ Alertas automáticas (Email/Slack)
✅ Dashboards de performance
✅ Session Replay para debugging

---

## Paso 1: Crear Cuenta en Sentry

1. Ve a https://sentry.io/signup/
2. Crea cuenta gratuita (5,000 eventos/mes gratis)
3. Crea proyectos:
   - Frontend: **Next.js**
   - Backend: **Node.js**

4. Guarda los DSN (Data Source Name)

---

## Paso 2: Instalación

### Frontend
```bash
cd apps/frontend
npm install @sentry/nextjs
```

### Backend
```bash
cd apps/backend
npm install @sentry/node @sentry/profiling-node
```

---

## Paso 3: Variables de Entorno

### apps/frontend/.env.local
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### apps/backend/.env
```env
SENTRY_DSN=https://yyy@yyy.ingest.sentry.io/yyy
SENTRY_ENVIRONMENT=production
```

---

## Paso 4: Integración con ErrorBoundary

Tu ErrorBoundary ya está implementado. Solo agrega Sentry:

```typescript
// components/ErrorBoundary.tsx (línea 37)
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  logger.error('ErrorBoundary caught an error:', error);

  // ✅ Agregar esta línea:
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    });
  }

  if (this.props.onError) {
    this.props.onError(error, errorInfo);
  }
}
```

---

## Paso 5: Backend - Global Exception Filter

Crea un filtro global para capturar errores del backend:

```typescript
// apps/backend/src/common/filters/sentry.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    super.catch(exception, host);
  }
}
```

Regístralo en `main.ts`:

```typescript
import { SentryFilter } from './common/filters/sentry.filter';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  // Inicializar Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || 'development',
      tracesSampleRate: 0.1, // 10% de transacciones
    });
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new SentryFilter());
  // ... resto de configuración
}
```

---

## Paso 6: Probar

### Test Frontend
```typescript
// En cualquier componente
<button onClick={() => { throw new Error('Test Sentry!'); }}>
  Test Error
</button>
```

### Test Backend
```typescript
// En cualquier endpoint
@Get('/test-error')
testError() {
  throw new Error('Test Sentry Backend!');
}
```

Ve a tu dashboard de Sentry y verás los errores aparecer.

---

## Configurar Alertas

1. Sentry Dashboard → **Alerts** → **Create Alert Rule**
2. Ejemplos útiles:
   - Email cuando error ocurre > 10 veces/hora
   - Slack para nuevos tipos de errores
   - Email inmediato para errores críticos

---

## Performance Monitoring (Opcional)

### Frontend - Trace Custom Operations
```typescript
import * as Sentry from '@sentry/nextjs';

async function uploadLargeFile(file: File) {
  const transaction = Sentry.startTransaction({
    name: 'Large File Upload',
    op: 'upload',
  });

  try {
    await api.uploadFile(file);
    transaction.setStatus('ok');
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}
```

---

## Mejores Prácticas

### ✅ DO
- Agregar contexto útil a errores (userId, projectId)
- Configurar source maps para production
- Usar releases para trackear versiones
- Configurar alertas relevantes
- Reducir sample rate en prod (0.1 = 10%)

### ❌ DON'T
- Enviar información sensible (passwords)
- Usar 100% sampling en prod (costoso)
- Ignorar todos los errores
- Exponer DSN en código público

---

## Costo

| Plan | Precio | Eventos/mes |
|------|--------|-------------|
| **Free** | $0 | 5,000 |
| **Team** | $26 | 50,000 |
| **Business** | $80 | 100,000 |

💡 Para proyectos pequeños-medianos, el tier gratuito es suficiente.

---

## Recursos

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Node.js Docs](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

## Estado Actual

⚠️ Sentry NO está instalado actualmente. Usa esta guía cuando estés listo para monitoreo en producción.

Tu aplicación ya tiene:
- ✅ ErrorBoundary robusto
- ✅ Logger service
- ✅ Global exception filters

Solo necesitas agregar Sentry cuando despliegues a producción.
