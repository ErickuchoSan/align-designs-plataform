# Plan de Limpieza de Documentación

## Archivos a CONSERVAR (Útiles y Actualizados)

### 1. **system_workflow_v2.md** (57K) - ⭐ PRINCIPAL
- Versión más reciente del flujo del sistema
- Incluye todas las mejoras v2.0
- **Acción**: Mantener

### 2. **payments-privacy-matrix.md** (9K)
- Matriz de privacidad de pagos
- Documentación técnica específica
- **Acción**: Mantener

### 3. **COMPLETE_AUDIT_REPORT.md** (16K)
- Reporte de auditoría completo
- Útil para referencia histórica
- **Acción**: Mantener

### 4. **MASTER_IMPLEMENTATION_PLAN.md** (34K)
- Plan maestro de implementación
- **Acción**: Revisar si está actualizado, sino eliminar

---

## Archivos OBSOLETOS/DUPLICADOS (Candidatos para eliminar)

### Documentos de Flujo Duplicados:
1. **flujo_sistema.md** (30K) - OBSOLETO
   - Versión antigua, reemplazada por `system_workflow_v2.md`
   - **Acción**: ELIMINAR

2. **flujo_sistema_v2.md** (50K) - DUPLICADO
   - Mismo contenido que `system_workflow_v2.md` pero en español
   - **Acción**: Revisar si es necesario mantener ambos idiomas

3. **system_workflow.md** (28K) - OBSOLETO
   - Versión antigua en inglés
   - **Acción**: ELIMINAR

### Documentos de Fase 1 (Ya completada):
4. **PHASE1_COMPLETED.md** (9.9K) - HISTÓRICO
5. **PHASE1_COMPLETION.md** (15K) - HISTÓRICO
6. **PHASE1_PROGRESS.md** (9.7K) - HISTÓRICO
7. **PHASE1_SUMMARY.md** (7.2K) - HISTÓRICO
   - **Acción**: CONSOLIDAR en un solo archivo `PHASE1_FINAL.md` y eliminar los 4

### Documentos de Planificación Antigua:
8. **implementation_plan.md** (9K) - OBSOLETO
   - Plan antiguo, reemplazado por MASTER_IMPLEMENTATION_PLAN
   - **Acción**: ELIMINAR

9. **priority_features.md** (21K) - POSIBLEMENTE OBSOLETO
   - **Acción**: Revisar si las prioridades siguen vigentes

10. **system_analysis_opportunities.md** (22K) - ANÁLISIS ANTIGUO
    - **Acción**: Revisar si sigue siendo relevante

11. **final_requirements.md** (42K) - REQUISITOS ANTIGUOS
    - **Acción**: Revisar si está actualizado o consolidar con system_workflow_v2

---

## Propuesta de Acciones

### Eliminar Inmediatamente (Obsoletos confirmados):
- flujo_sistema.md
- system_workflow.md
- implementation_plan.md

### Consolidar:
- PHASE1_*.md → Crear un solo PHASE1_ARCHIVE.md con resumen

### Revisar antes de decidir:
- flujo_sistema_v2.md vs system_workflow_v2.md (¿mantener ambos idiomas?)
- final_requirements.md (¿está actualizado?)
- priority_features.md (¿sigue vigente?)
- system_analysis_opportunities.md (¿sigue siendo relevante?)
- MASTER_IMPLEMENTATION_PLAN.md (¿está actualizado?)

---

## Estructura Propuesta Final

```
docs/
├── system_workflow_v2.md           # Flujo principal del sistema (español)
├── payments-privacy-matrix.md      # Matriz de privacidad
├── COMPLETE_AUDIT_REPORT.md        # Auditoría completa
├── PHASE1_ARCHIVE.md               # Consolidación de archivos de fase 1
├── dev/                            # Documentación de desarrollo (privada)
│   ├── NGROK.md
│   ├── NGINX.md
│   ├── ACCESS.md
│   └── ...
└── prod/                           # Documentación sanitizada (pública)
    └── ...
```
