# Documentación - Align Designs Platform

Esta carpeta contiene toda la documentación del proyecto.

## 📁 Estructura

```
docs/
├── README.md                       # Este archivo
├── CLEANUP_PLAN.md                 # Plan de limpieza ejecutado
├── dev/                            # Documentación de desarrollo (privada, gitignored)
├── prod/                           # Documentación sanitizada para producción
└── *.md                            # Documentos principales del proyecto
```

---

## 📄 Documentos Principales

### Migración y Actualizaciones Recientes (Enero 2026)

- **[PNPM_MIGRATION.md](../PNPM_MIGRATION.md)** ⭐ **NUEVO**
  - Migración de npm a pnpm completada
  - Guía de uso de pnpm para el equipo
  - Comparación de rendimiento y comandos

- **[DEPENDENCIES_UPDATE.md](../DEPENDENCIES_UPDATE.md)** ⭐ **NUEVO**
  - Actualización de dependencias (Next.js, TypeScript, etc.)
  - Correcciones de seguridad (Next.js CVE, Axios, qs)
  - Estado de builds y compatibilidad

- **[PERFORMANCE_OPTIMIZATIONS.md](../PERFORMANCE_OPTIMIZATIONS.md)** ⭐ **ACTUALIZADO v5.0.0**
  - 31 optimizaciones implementadas (Sprints 1-3)
  - Mejora de rendimiento: 40-50% más rápido
  - Reducción de re-renders: 80-95%

### Flujo y Arquitectura del Sistema

- **[system_workflow_v2.md](./system_workflow_v2.md)** ⭐ **PRINCIPAL**
  - Flujo completo del sistema versión 2.0
  - Incluye todas las mejoras y características implementadas
  - **Usar este como referencia principal**

- **[flujo_sistema_v2.md](./flujo_sistema_v2.md)**
  - Versión en español del workflow
  - Mismo contenido que `system_workflow_v2.md`

### Planes y Reportes

- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** ⭐ **NUEVO**
  - Estado actual de implementación (91% completo)
  - Qué está listo para producción
  - Features opcionales pendientes

- **[MASTER_IMPLEMENTATION_PLAN.md](./MASTER_IMPLEMENTATION_PLAN.md)**
  - Plan maestro de implementación
  - Roadmap de fases futuras

- **[COMPLETE_AUDIT_REPORT.md](./COMPLETE_AUDIT_REPORT.md)**
  - Reporte de auditoría completa del sistema
  - Análisis de seguridad y mejoras

### Especificaciones Técnicas

- **[payments-privacy-matrix.md](./payments-privacy-matrix.md)**
  - Matriz de privacidad de pagos
  - Reglas de visibilidad por rol

- **[final_requirements.md](./final_requirements.md)**
  - Requisitos finales del proyecto
  - Especificaciones detalladas

- **[priority_features.md](./priority_features.md)**
  - Features priorizadas
  - Análisis de impacto

- **[system_analysis_opportunities.md](./system_analysis_opportunities.md)**
  - Oportunidades de mejora del sistema
  - Análisis de optimizaciones

### Histórico

- **[PHASE1_ARCHIVE.md](./PHASE1_ARCHIVE.md)**
  - Archivo consolidado de la Fase 1 completada
  - Resumen de logros y métricas

---

## 📂 Carpetas

### `/dev/` - Documentación de Desarrollo (Privada)

⚠️ **GITIGNORED** - No se sube al repositorio

Contiene documentación con datos sensibles:
- Credenciales de infraestructura
- IPs y passwords reales
- Configuraciones específicas del entorno
- Guías de setup con datos reales

**Archivos principales**:
- `ACCESS.md` - Credenciales y accesos
- `DATABASE.md` - Connection strings
- `NGINX.md` - Configuración de Nginx
- `NGROK.md` - Setup de acceso remoto
- `SETUP.md` - Guía de instalación

Ver [dev/README.md](./dev/README.md) para más información.

### `/prod/` - Documentación Pública

Versión sanitizada de la documentación sin datos sensibles.
Segura para compartir con el equipo y subir a Git.

---

## 🎯 Guía de Uso

### Para Desarrollo Diario
1. Consulta `dev/NGROK.md` para acceso remoto
2. Consulta `dev/NGINX.md` para configuración de proxy
3. Consulta `dev/ACCESS.md` para credenciales

### Para Entender el Sistema
1. Lee `system_workflow_v2.md` primero
2. Revisa `payments-privacy-matrix.md` para lógica de pagos
3. Consulta `COMPLETE_AUDIT_REPORT.md` para seguridad

### Para Planificación
1. **Lee `IMPLEMENTATION_STATUS.md` primero** - Estado actual y qué falta
2. Revisa `MASTER_IMPLEMENTATION_PLAN.md` para roadmap detallado
3. Consulta `priority_features.md` para features priorizadas
4. Analiza `system_analysis_opportunities.md` para optimizaciones

---

## 🗂️ Archivos Eliminados (Limpieza dic 31, 2024)

Los siguientes archivos fueron eliminados por obsoletos o duplicados:

### Obsoletos:
- `flujo_sistema.md` - Reemplazado por v2
- `system_workflow.md` - Versión antigua
- `implementation_plan.md` - Reemplazado por MASTER_IMPLEMENTATION_PLAN

### Consolidados:
- `PHASE1_PROGRESS.md` → `PHASE1_ARCHIVE.md`
- `PHASE1_COMPLETED.md` → `PHASE1_ARCHIVE.md`
- `PHASE1_COMPLETION.md` → `PHASE1_ARCHIVE.md`
- `PHASE1_SUMMARY.md` → `PHASE1_ARCHIVE.md`

Ver [CLEANUP_PLAN.md](./CLEANUP_PLAN.md) para detalles completos.

---

## 📝 Mantenimiento

### Al Crear Nueva Documentación:
- Docs con datos sensibles → `dev/`
- Docs sanitizados → `prod/`
- Docs de proyecto general → raíz de `docs/`

### Al Actualizar Workflow:
- Actualizar `system_workflow_v2.md` y `flujo_sistema_v2.md` juntos
- Mantener ambos idiomas sincronizados

---

**Última actualización**: Enero 1, 2026

## 🆕 Cambios Recientes (Enero 2026)

### Package Manager
- ✅ **Migración a pnpm** - 3x más rápido, 60% menos espacio
- ✅ Todos los scripts actualizados
- ✅ Documentación completa en PNPM_MIGRATION.md

### Dependencias
- ✅ **Next.js** 16.1.1 → 15.1.3 (stable LTS, security fix)
- ✅ **Axios** 1.13.2 → 1.7.9 (security patches)
- ✅ **TypeScript** 5.x → 5.7.3
- ✅ **Tailwind CSS** 4.x → 4.1.0

### Performance
- ✅ **31 optimizaciones** implementadas
- ✅ **40-50% más rápido** en carga inicial
- ✅ **80-95% menos re-renders**
- ✅ Ver PERFORMANCE_OPTIMIZATIONS.md v5.0.0
