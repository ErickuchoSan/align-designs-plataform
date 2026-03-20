# Flujo Completo del Sistema v2.0 - Plataforma Align Designs

> **Versión 2.0** - Actualizado con mejoras: Reglas de asignación de empleados, seguimiento de rechazos, historial de clientes, versionado de archivos, sistema de facturas y registro de auditoría.

---

## Tabla de Contenidos
1. [Usuarios del Sistema](#1-usuarios-del-sistema)
2. [Creación de Proyecto y Configuración Inicial](#2-creación-de-proyecto-y-configuración-inicial)
3. [Etapas del Sistema](#3-etapas-del-sistema-etapas-de-flujo-de-trabajo)
4. [Carga de Contenido](#4-carga-de-contenido)
5. [Flujo de Trabajo Principal](#5-flujo-de-trabajo-principal)
6. [Flujo de Pago Cliente → Admin](#6-flujo-de-pago-cliente--admin)
7. [Vista del Proyecto](#7-vista-del-proyecto)
8. [Sistema de Análisis](#8-sistema-de-análisis-solo-admin)
9. [Restricciones y Validaciones](#9-restricciones-y-validaciones)
10. [Estructura de Base de Datos](#10-estructura-de-base-de-datos---relaciones-clave)
11. [Mejoras de UI/UX](#11-mejoras-de-uiux)
12. [Notificaciones/Alertas](#12-notificacionesalertas)
13. [🆕 Nuevas Características v2.0](#13-nuevas-características-v20)

---

## 1. Usuarios del Sistema

- **Admin** (Poncho) - Un solo admin con acceso completo
- **Clientes** (rol cliente)
- **Empleados** (rol empleado, sin posiciones específicas)

---

## 2. Creación de Proyecto y Configuración Inicial

### PASO 1: Admin crea la estructura base

El administrador crea clientes en el sistema, empleados, y luego crea un proyecto con:

- Nombre y descripción
- **UN** cliente asignado
- Empleados asignados (pueden ser múltiples)
- Fecha de inicio planificada
- Fecha límite/objetivo
- **Monto inicial requerido** (cantidad necesaria para activar el proyecto)

**🆕 NUEVA REGLA:** Los empleados solo pueden ser asignados si NO están trabajando en otro proyecto ACTIVO.

**Validación:**
- Solo aparecen en la lista de selección los empleados que NO tienen un proyecto activo
- Si un empleado está trabajando en otro proyecto activo, no aparece como opción disponible
- El empleado vuelve a estar disponible cuando su proyecto actual esté Completado o Archivado

### PASO 2: Proyecto en estado "INACTIVO"

**Estado del Proyecto:** `ESPERANDO PAGO`

**🆕 GENERACIÓN AUTOMÁTICA DE FACTURAS:**
Cuando el admin crea el proyecto con `initialAmountRequired = $8000`:
- ✅ El sistema **crea automáticamente** la Factura #INV-YYYY-MM-DD-001
- ✅ La factura se guarda en la etapa de Pagos
- ✅ El cliente puede ver esta factura inmediatamente en su sección de Pagos
- ✅ Estado de factura: `PENDING` (Pendiente)

**Indicadores visuales:**
- Badge visible: 🔒 **ESPERANDO PAGO**
- Mensaje: *"Este proyecto se activará una vez que el cliente pague el monto inicial de $X"*

**El Admin PUEDE:**
- ✅ Editar información del proyecto (nombre, fechas, cliente, empleados, monto inicial)
- ✅ Ver detalles del proyecto
- ✅ Eliminar proyecto si es necesario

**El Admin NO PUEDE:**
- ❌ Subir archivos/enlaces/comentarios (visualmente deshabilitado/grisado)
- ❌ Crear contenido de etapas

**El Cliente PUEDE:**
- ✅ Ver el proyecto asignado
- ✅ Ver requisito de pago

**El Cliente NO PUEDE:**
- ❌ Subir nada (proyecto está bloqueado)

### PASO 3: Cliente realiza el pago inicial

1. El cliente entra al proyecto
2. El sistema muestra modal: *"Se requiere pago inicial de $X para activar este proyecto"*
3. El cliente hace clic en **"Realizar Pago"**
4. Se abre modal con opciones de pago:

> **Nota:** Idealmente, el cliente debe subir el comprobante oficial compartido desde su app bancaria para asegurar legibilidad.

#### Opción A - Transferencia Bancaria:
- Subir comprobante (captura de pantalla/PDF) (Opcional en versión actual)
- Ingresar monto
- Seleccionar fecha de pago (calendario)
- Al guardar, el pago cuenta inmediatamente
- El sistema acumula pagos

#### Opción B - Cheque:
- Ingresar monto del cheque
- Seleccionar fecha estimada del cheque
- El cliente **NO** sube archivo
- El registro queda como *"Pendiente de confirmación de cheque"*
- El admin posteriormente:
  - Ingresa ese registro de cheque
  - Sube comprobante del cheque (foto/escaneo)
  - Confirma/selecciona fecha real de pago
- El sistema ahora registra el pago como confirmado

#### 3.1 Revisión y Aprobación de Pago por Admin (Backend Listo / UI En Desarrollo)

El Admin recibe notificación y revisa el pago con **3 opciones**:

**Opción A - Aprobar con monto reclamado:**
- ✅ Comprobante correcto, monto correcto
- ✅ Estado de pago → `CONFIRMED`
- ✅ Monto agregado a `amountPaid` del proyecto

**Opción B - Aprobar con corrección de monto:**
- ✅ Comprobante correcto, pero cliente ingresó monto erróneo
- ✅ Admin corrige el monto
- ✅ Estado de pago → `CONFIRMED` con monto corregido

**Opción C - Rechazar pago:**
- ❌ Comprobante ilegible / formato incorrecto
- ❌ Estado de pago → `REJECTED`
- ✅ Notificación al cliente para volver a subir

**Progreso de Pago:**
- Muestra: *"Progreso de pago: $2,000 / $5,000 (40%)"*
- Permite pagos parciales
- Acumula todos los pagos (transferencias + cheques confirmados)

**Una vez que el monto inicial está 100% cubierto → El Proyecto se ACTIVA automáticamente**
- El estado cambia a: ✅ **ACTIVO**
- El badge cambia a: ● **ACTIVO**
- Ahora se pueden subir archivos/enlaces/comentarios (según permisos de etapa)

> **Nota:** El admin aún puede editar/reducir el monto inicial requerido si negocia con el cliente.

---

## 3. Etapas del Sistema (Etapas de Flujo de Trabajo)

### 8 Etapas Fijas:

1. **Brief del Proyecto**
2. **Feedback (Espacio del Cliente)**
3. **Feedback (Espacio del Empleado)**
4. **Referencias**
5. **Entregado**
6. **Aprobado por Admin**
7. **Aprobado por Cliente**
8. **Pagos**

### Permisos por Etapa:

| Etapa | Admin | Cliente | Empleado | Notas |
|-------|-------|---------|----------|-------|
| **Brief del Proyecto** | Leer + Escribir | SIN acceso | Solo lectura | Admin sube especificaciones iniciales. Requerido antes de que empleados puedan trabajar. |
| **Feedback (Cliente)** | Leer + Escribir | Leer + Escribir | SIN acceso | Cliente crea feedback. Admin responde. Espacio separado del feedback de empleado. |
| **Feedback (Empleado)** | Leer + Escribir | SIN acceso | Solo lectura | Admin crea feedback para empleados. Empleados solo pueden leer. Espacio separado del feedback de cliente. **🆕 Puede enlazarse a archivos rechazados** |
| **Referencias** | Leer + Escribir | Leer + Escribir | SIN acceso | Cliente puede subir enlaces (Google, referencias visuales). |
| **Entregado** | Leer + Escribir | SIN acceso | Leer + Escribir | Empleados envían trabajo aquí. **🆕 Soporta versionado con notas** |
| **Aprobado por Admin** | Leer + Escribir | SIN acceso | SIN acceso | Solo admin. Archivos aprobados por admin. |
| **Aprobado por Cliente** | Leer + Escribir | SIN acceso | SIN acceso | Solo admin (puede escribir). El cliente NO ve esta etapa. |
| **Pagos** | Leer + Escribir | Leer + Escribir (solo facturas/pagos) | Leer (solo sus pagos) | Separado por tipo de pago. **🆕 Sistema de facturas con numeración automática** |

### Sub-etapas de Pagos:

#### 🆕 Facturas (Admin → Cliente) - NUEVO SISTEMA:
- Admin crea factura con número auto-generado: `INV-2024-12-20-001`
- Admin establece términos de pago (Net 15, 30, 60, o días personalizados)
- El sistema calcula fecha de vencimiento automáticamente
- Rastrea estado de factura: Borrador, Enviada, Pagada, Vencida
- Cliente sube comprobantes de pago (transferencia con archivo + monto + fecha, o cheque con monto + fecha)
- Si es cheque, admin sube comprobante después + confirma fecha
- El sistema marca automáticamente facturas vencidas
- **Visible para:** Solo Admin y Cliente

#### Pagos a Empleados (Admin → Empleado):
- Admin sube comprobante de transferencia + monto + fecha
- Admin selecciona qué archivo(s) "Pendiente de pago" está pagando
- **🆕 Rastrea historial de pagos por empleado**
- **Visible para:** Admin y empleado específico que recibe el pago

#### Pagos Pendientes (Vista del Empleado):
- El empleado ve lista de archivos aprobados por cliente que no tienen pago asociado todavía
- **🆕 Muestra conteo de rechazos y fechas de aprobación**
- Da transparencia al empleado sobre lo que está pendiente

---

## 4. Carga de Contenido

### Regla General:
`(ARCHIVO || ENLACE || COMENTARIO) && ETAPA`

### Tipos Permitidos:
- **Archivos:** PDFs, imágenes, capturas de pantalla (máx 2GB)
- **Enlaces:** Empleados pueden enviar enlaces en cualquier etapa permitida. Clientes pueden enviar enlaces **SOLO** en etapa "Referencias"
- **Comentarios:** Texto libre

### Restricciones:
- ✅ El proyecto debe estar **ACTIVO**
- ✅ Máx 2GB por archivo
- ✅ Debe tener permisos de escritura para esa etapa
- ✅ Enlaces: Empleados en cualquier etapa permitida, Clientes solo en "Referencias"

### 🆕 Información Automática al Subir:
- Fecha y hora de carga
- Usuario que subió (el sistema identifica si es cliente o empleado)
- Etapa asignada
- **Número de versión** (si es una revisión)
- **Metadata del archivo:** tamaño, dimensiones (para imágenes), formato
- **Notas de versión** (empleado puede explicar qué cambió)

---

## 5. Flujo de Trabajo Principal

### FASE 1: Proyecto inicia (Admin prepara)

**Requisito:** El proyecto debe estar **ACTIVO** (pago inicial recibido)

1. Admin ya habló con el cliente (fuera del sistema)
2. Admin conoce los requisitos iniciales del cliente
3. **OBLIGATORIO:** Admin sube información/archivos iniciales a la etapa **"Brief del Proyecto"**

> **Importante:** Los empleados **NO PUEDEN** empezar a trabajar hasta que al menos 1 archivo esté subido en "Brief del Proyecto"
> - Mensaje mostrado a empleados: *"⚠️ Esperando Brief del Proyecto. Se te notificará cuando esté listo."*

4. Una vez que Brief del Proyecto tiene contenido, los empleados pueden recibir feedback y trabajar

### FASE 2: Cliente solicita cambios/correcciones

1. Cliente revisa progreso (admin muestra fuera del sistema)
2. Cliente crea **Feedback** en su espacio (comentarios/archivos con correcciones)
3. Este feedback queda como evidencia en el espacio del cliente
4. Los empleados **NO VEN** el feedback del cliente

### FASE 3: Admin procesa y delega a empleados

1. Admin revisa feedback del cliente (en espacio del cliente)
2. Admin crea **NUEVO** feedback en espacio del empleado (basado en el del cliente)

**FECHA CRÍTICA - Temporizador inicia:**
- El sistema guarda fecha/hora cuando admin crea feedback para empleado
- **Regla especial para seguimiento de tiempo:**
  - Si admin sube feedback **antes de las 12:00 PM** → Temporizador inicia **al día siguiente a las 9:00 AM**
  - Si admin sube feedback **después de las 12:00 PM** → Temporizador inicia **el mismo día a la hora actual**
  - **Nota:** El seguimiento de tiempo solo cuenta **días**, no horas/minutos (para ser justo con empleados)
- Tooltip mostrado: *"⏱️ Seguimiento de tiempo inicia: [Mañana 9:00 AM / Hoy a la hora actual]"*

3. **🆕 NUEVO: Si rechaza un archivo entregado (Backend Soportado / UI Pendiente):**
   - Admin puede enlazar este feedback al archivo específico que está rechazando
   - El sistema incrementa el contador de rechazos en ese archivo
   - Empleado ve: "❌ Rechazado - Ver Feedback #123"

4. Empleados reciben notificación y leen feedback en su espacio (solo lectura)
5. El cliente **NO VE** el feedback que admin envía a empleados

**Importante sobre múltiples ciclos de feedback:**
- Si admin crea Feedback 1 → Empleado no envía todavía
- Admin crea Feedback 2 → Empleado no envía todavía
- Admin crea Feedback 3 → Empleado finalmente envía
- **El temporizador cuenta desde Feedback 1 (el primero), no el último**
- El sistema rastrea: *"Iniciado desde primer feedback en [fecha]"*

### FASE 4: Empleado trabaja y entrega

1. Empleado trabaja en los cambios solicitados
2. Empleado sube trabajo a la etapa **"Entregado"** (archivo/enlace/comentario)

**🆕 NUEVO: Gestión de Versiones (Esquema Listo / Lógica Pendiente):**
- Sistema soporta esquema v1, v2, v3
- **Comportamiento Actual:** Nuevas subidas reemplazan archivos anteriores
- **Futuro:** UI permitirá agrupar historial y restaurar versiones

**FECHA CRÍTICA - Temporizador termina:**
- El sistema guarda fecha/hora cuando empleado sube a Entregado

**El sistema calcula automáticamente:**
- **Tiempo** = (Fecha de Entregado) - (Fecha del primer feedback del admin a este empleado)
- **Enlace:** El sistema relaciona esta entrega con el ciclo de feedback específico vía ID
- **🆕 Conteo de rechazos:** Si archivo fue rechazado antes, rastrea cuántas veces

**Importante:**
- Solo el **ÚLTIMO** archivo subido a Entregado por cada empleado muestra botón: *"Aprobar → Aprobado por Admin"*
- Archivos anteriores pueden accederse pero no muestran botón de aprobar
- Si admin prefiere una versión anterior, puede "Ocultar" la versión más reciente, y la anterior se vuelve "más reciente"

### FASE 5: Admin revisa trabajo del empleado

1. Admin ve todos los archivos en **Entregado**
2. **🆕 Puede ver historial de versiones** con notas del empleado explicando cambios
3. Solo el **ÚLTIMO** archivo subido por un empleado tiene opción visible: *"Mover a Aprobado por Admin"*

**Si NO aprueba:**
- Admin crea nuevo feedback para empleado → Regresa a **FASE 3**
- **🆕 Admin enlaza feedback a archivo rechazado**
- **🆕 Sistema incrementa conteo de rechazos**
- Nuevo ciclo de feedback inicia
- Temporizador cuenta desde **PRIMER** feedback (si había anteriores no completados)

**Si aprueba:**
- Admin cambia etapa del archivo de "Entregado" a "Aprobado por Admin"
- **Se guardan TRES fechas:**
  1. **Fecha de carga original** (cuando empleado subió a Entregado)
  2. **Fecha de aprobación del admin** (cuando admin lo movió a Aprobado por Admin) - Admin selecciona esta fecha
  3. **Fecha de aprobación del cliente** (se establecerá después) - Admin también seleccionará esta
- El sistema marca archivo como *"Pendiente de presentación al cliente"*
- **🆕 Sistema registra esta acción en registro de auditoría**

### FASE 6: Cliente revisa trabajo aprobado

1. Admin presenta trabajo al cliente (fuera del sistema)

**Si cliente NO aprueba:**
- Cliente crea nuevo feedback en su espacio → Regresa a **FASE 2**

**Si cliente aprueba:**
- Admin cambia etapa de "Aprobado por Admin" a "Aprobado por Cliente"
- **Las TRES fechas ahora están completas:**
  1. Fecha de carga original
  2. Fecha de aprobación del admin
  3. **Fecha de aprobación del cliente** (cuando admin lo movió a Aprobado por Cliente) - Admin selecciona esta fecha
- El sistema marca automáticamente el archivo como *"Pendiente de pago"* para el empleado que lo subió
- El cliente **NO VE** la etapa "Aprobado por Cliente" (solo admin y empleado)
- **🆕 Sistema registra aprobación en registro de auditoría**

### FASE 7: Pago al empleado

1. Admin va a etapa **"Pagos"** → **"Pago a Empleado"**
2. El sistema muestra pagos pendientes agrupados por empleado
3. **🆕 Muestra qué archivos están pendientes de pago con historial de rechazos**
4. Admin selecciona empleado
5. El sistema muestra lista de archivos *"Pendiente de pago"* para ese empleado
6. Admin selecciona qué archivo(s) está pagando
7. Admin sube:
   - Comprobante de pago (archivo)
   - Monto depositado (entrada numérica)
   - Fecha de pago (calendario/selector de fecha)
8. El sistema enlaza el pago con el/los archivo(s) seleccionado(s) vía ID
9. El sistema remueve marca de *"Pendiente de pago"* de esos archivos
10. **🆕 Sistema registra pago en registro de auditoría**
11. El empleado puede ahora ver este pago en su sección "Pagos" y en "Pagos Pendientes" (mostrará como pagado)

---

## 6. Flujo de Pago Cliente → Admin

### A. 🆕 Admin genera Factura (NUEVO SISTEMA)

1. Admin va a etapa **"Pagos"** → **"Factura"**
2. Admin crea nueva factura:
   - **Número de Factura:** Auto-generado `INV-2024-12-20-001`
     - Formato: `INV-AÑO-MES-DÍA-SECUENCIA`
     - Reinicia secuencia diariamente
   - **Fecha de Emisión:** Seleccionada por admin
   - **Términos de Pago:** Admin elige (Net 15, 30, 60, o días personalizados)
   - **Fecha de Vencimiento:** Auto-calculada basada en términos de pago
   - **Monto:** Subtotal + Impuesto (opcional)
   - **Estado:** Borrador → Enviada → Pagada/Vencida

3. Admin puede guardar como borrador o enviar inmediatamente al cliente
4. **🆕 Sistema rastrea automáticamente:**
   - Días hasta vencimiento
   - Días vencidos (si aplica)
   - Estado de pago
   - Envía notificaciones antes y después de fecha de vencimiento

### B. Cliente paga a Admin

#### Opción 1 - Transferencia Bancaria:
- Cliente sube comprobante de transferencia (captura de pantalla/PDF)
- Cliente ingresa monto pagado
- Cliente selecciona fecha de pago (calendario)
- **🆕 Cliente puede enlazar pago a factura específica**
- El sistema registra el pago con esa fecha inmediatamente

#### Opción 2 - Cheque:
- Cliente ingresa monto del cheque
- Cliente selecciona fecha estimada del cheque
- Cliente **NO** sube archivo
- El registro queda como *"Pendiente de confirmación de cheque"*
- Admin posteriormente:
  - Ingresa ese registro de cheque
  - Sube comprobante de cheque cobrado (foto/escaneo)
  - Admin selecciona/confirma fecha real de pago
- El sistema ahora registra el pago como confirmado con la fecha del admin

**🆕 Cuando se realiza el pago:**
- Si pago >= total de factura → Estado cambia a "Pagada"
- Factura se marca como liquidada
- Sistema registra pago en registro de auditoría
- Tanto admin como cliente reciben confirmación

---

## 7. Vista del Proyecto

### Interfaz Principal con Pestañas de Etapas:

**Navegación:**
```
[Brief] [Feedback] [Referencias] [Entregado] [Aprobado Admin] [Pagos]
 (3)      (5)         (2)          (4)            (8)           (12)
```

**La Pestaña Feedback tiene Sub-pestañas:**
- **Feedback del Cliente** (solo admin y cliente ven)
- **Feedback del Empleado** (solo admin y empleados ven)

### Tabla Principal:

**Columnas:**
- Tipo (archivo/enlace/comentario)
- Nombre/descripción
- **🆕 Versión** (v1, v2, v3)
- Etapa
- Usuario que subió
- Fecha de carga
- **🆕 Conteo de rechazos** (si rechazado)
- **🆕 Metadata del archivo** (tamaño, dimensiones)
- Acciones (según permisos)

**Funcionalidad de cambio de etapa (solo admin):**
- Opción visible solo en **ÚLTIMO** archivo por empleado en "Entregado" → puede cambiar a "Aprobado por Admin"
- Opción visible solo en archivos en "Aprobado por Admin" → puede cambiar a "Aprobado por Cliente"
- Selectores de fecha aparecen al cambiar etapas para que admin elija fechas de aprobación
- **🆕 Acción se registra en registro de auditoría**

**🆕 Vista de Historial de Versiones:**
```
📄 Diseño de Cocina
├── v3 (actual) - Subido 20 Dic 2024 3:45 PM  [Aprobar]
│   └── 💬 Notas: "Versión final con colores aprobados"
│   └── 📏 1920x1080 | 💾 2.3 MB | 📄 image/jpeg
├── v2 - Subido 19 Dic 2024 11:30 AM  [Ver]
│   └── 💬 Notas: "Corregí esquema de color, aún necesita ajustes de espaciado"
│   └── ❌ Rechazado 1 vez
└── v1 - Subido 18 Dic 2024 2:30 PM  [Ver]
    └── 💬 Notas: "Diseño inicial"
    └── ❌ Rechazado 1 vez
```

**Funcionalidad de Ocultar/Eliminar:**
- Archivos pueden marcarse como "Ocultos" (no se muestran en vista principal pero no se eliminan)
- Archivos ocultos pueden restaurarse
- **🆕 Cuando el proyecto se archiva, todos los archivos ocultos se eliminan permanentemente después de 90 días**

---

## 8. Sistema de Análisis (Solo Admin)

### 8.1 Enlazando Feedback → Entregado → Aprobaciones

**Sistema de Relación por ID:**

```
ID_Ciclo_Feedback_123
├─ ID_Primer_Feedback_124 (Admin → Empleado 1) [15 Dic 2025 11:00 AM]
│  └─→ 🆕 ID_Archivo_Rechazado_450 (v1) - Diseño Cocina
├─ ID_Segundo_Feedback_125 (Admin → Empleado 1) [16 Dic 2025 2:00 PM]
│  └─→ 🆕 ID_Archivo_Rechazado_451 (v2) - Diseño Cocina
├─ ID_Tercer_Feedback_126 (Admin → Empleado 1) [17 Dic 2025 10:00 AM]
└─→ ID_Entregado_456 (Empleado 1) [18 Dic 2025 4:26 PM]
    └─→ 🆕 Versión: v3, Conteo de Rechazos: 2
     └─→ ID_Aprobado_Admin_789 [19 Dic 2025 - seleccionado por admin]
          └─→ ID_Aprobado_Cliente_101112 [20 Dic 2025 - seleccionado por admin]
               └─→ ID_Pago_131415 [$3,000] [22 Dic 2025 - seleccionado por admin]
```

**Cálculo de Tiempo:**
- **Inicio:** Fecha ID_Primer_Feedback_124 (con regla de 12:00 PM aplicada)
- **Fin:** Fecha ID_Entregado_456
- **Tiempo:** 3 días (horas no contadas, solo días)
- **🆕 Ciclos de rechazo:** 2 (v1 y v2 rechazadas antes de v3 aprobada)

### 8.2 🆕 Seguimiento mejorado de tiempo por empleado por entrega

Para cada archivo en "Aprobado por Cliente":
- Empleado que lo subió
- ID del ciclo de feedback enlazado (fecha de inicio)
- Fecha de entregado (fecha de fin)
- Tiempo transcurrido (solo días)
- **Número de rechazos antes de aprobación**
- **Total de versiones enviadas** (v1, v2, v3, etc.)
- Pago asociado (ID_Pago, monto, fecha)

**Ejemplo Empleado 1:**

```
Entrega 1: Diseño de Cocina
  - Ciclo: Feedback 1 Dic 2024 10:00 AM → Entregado 6 Dic 2024 4:00 PM
  - Tiempo: 5 días
  - Versiones: 3 (v1, v2 rechazadas; v3 aprobada)
  - Conteo de rechazos: 2
  - Pago: $3,000 [10 Dic 2024]

Entrega 2: Sala de Estar
  - Ciclo: Feedback 8 Dic 2024 2:00 PM → Entregado 11 Dic 2024 9:00 AM
  - Tiempo: 3 días
  - Versiones: 1 (aprobada al primer intento)
  - Conteo de rechazos: 0
  - Pago: $2,000 [15 Dic 2024]

Entrega 3: Recámara
  - Ciclo: Feedback 12 Dic 2024 9:00 AM → Entregado 16 Dic 2024 5:00 PM
  - Tiempo: 4 días
  - Versiones: 2 (v1 rechazada; v2 aprobada)
  - Conteo de rechazos: 1
  - Pago: $2,500 [18 Dic 2024]
------------------------
Total entregas: 3
Tiempo total: 12 días
Total pagado: $7,500
Promedio por día: $625
🆕 Aprobadas al primer intento: 1 (33%)
🆕 Requirieron revisiones: 2 (67%)
🆕 Promedio de rechazos por entrega: 1.0
Pagos pendientes: 0
```

### 8.3 🆕 Seguimiento de pagos del cliente (Mejorado)

Todas las facturas y pagos:

**Seguimiento de Facturas:**
```
Factura #INV-2024-12-15-001
  Fecha de Emisión: 15 Dic 2024
  Fecha de Vencimiento: 14 Ene 2025 (Net 30)
  Monto: $5,000
  Estado: Pagada
  Pagada El: 20 Dic 2024 (5 días antes)

Factura #INV-2024-12-18-001
  Fecha de Emisión: 18 Dic 2024
  Fecha de Vencimiento: 17 Ene 2025 (Net 30)
  Monto: $3,000
  Estado: Pagada
  Pagada El: 22 Dic 2024 (4 días antes)

Factura #INV-2024-12-20-001
  Fecha de Emisión: 20 Dic 2024
  Fecha de Vencimiento: 4 Ene 2025 (Net 15)
  Monto: $8,000
  Estado: Vencida
  Días de Atraso: 3

Factura #INV-2024-12-25-001
  Fecha de Emisión: 25 Dic 2024
  Fecha de Vencimiento: 24 Ene 2025 (Net 30)
  Monto: $4,700
  Estado: Enviada (Pago pendiente)
------------------------
Total facturado: $20,700
Total pagado: $8,000
Total pendiente: $12,700
Monto vencido: $8,000
Confiabilidad de pago: 100% (2/2 pagadas a tiempo antes de vencer)
```

### 8.4 Análisis por empleado

```
EMPLEADO 1:
- Entregas aprobadas: 3
- Tiempo total de trabajo: 12 días
- Total pagado: $7,500
- Promedio por día: $625
- Eficiencia: $625/día
- 🆕 Aprobadas al primer intento: 1 (33%)
- 🆕 Requirieron revisiones: 2 (67%)
- 🆕 Promedio de rechazos por entrega: 1.0
- Pagos pendientes: 0

EMPLEADO 2:
- Entregas aprobadas: 3
- Tiempo total de trabajo: 10 días
- Total pagado: $5,800
- Promedio por día: $580
- Eficiencia: $580/día
- 🆕 Aprobadas al primer intento: 2 (67%)
- 🆕 Requirieron revisiones: 1 (33%)
- 🆕 Promedio de rechazos por entrega: 0.33
- Pagos pendientes: 1 ($1,500)

EMPLEADO 3:
- Entregas aprobadas: 3
- Tiempo total de trabajo: 8 días
- Total pagado: $3,700
- Promedio por día: $462.50
- Eficiencia: $462.50/día
- 🆕 Aprobadas al primer intento: 3 (100%)
- 🆕 Requirieron revisiones: 0 (0%)
- 🆕 Promedio de rechazos por entrega: 0
- Pagos pendientes: 0
```

### 🆕 8.5 Historial y Análisis de Cliente (NUEVO)

**Vista General del Perfil del Cliente:**
```
════════════════════════════════════════
CLIENTE: Familia González
════════════════════════════════════════
Contacto: juan.gonzalez@email.com
Cliente Desde: Ene 2024
Último Proyecto: Dic 2024

Total Proyectos: 3
  • Activos: 1
  • Completados: 2
  • Archivados: 0

Resumen Financiero:
  • Revenue Total: $45,000
  • Total Facturado: $47,500
  • Saldo Pendiente: $2,500
  • Valor Promedio por Proyecto: $15,000

Confiabilidad de Pago:
  • Pagos a tiempo: 19/20 (95%)
  • Pagos atrasados: 1
  • Promedio de días para pagar: 12 días

Historial de Proyectos:
1. Casa Moderna (Activo) - $20,000 - Iniciado Dic 2024
2. Rediseño Apartamento (Completado) - $15,000 - Ene-Mar 2024
3. Logo Oficina (Completado) - $10,000 - Nov 2023
```

### 8.6 Análisis global del proyecto

```
════════════════════════════════════════
INFORMACIÓN DEL PROYECTO
════════════════════════════════════════
Nombre: Casa Moderna - Familia González
Estado: ● ACTIVO
Fecha de inicio: 1 Dic 2024
Fecha límite: 31 Dic 2024
Última entrega aprobada: 28 Dic 2024
Duración real: 27 días

════════════════════════════════════════
EMPLEADOS
════════════════════════════════════════
Total empleados: 3
Total entregas aprobadas: 9
🆕 Aprobaciones al primer intento: 6 (67%)
🆕 Requirieron revisiones: 3 (33%)
Total pagado a empleados: $17,000
Promedio por empleado: $5,666.67

Ranking de eficiencia:
1. Empleado 1: $625/día (33% aprobación primer intento)
2. Empleado 2: $580/día (67% aprobación primer intento)
3. Empleado 3: $462.50/día (100% aprobación primer intento)

🆕 Ranking de calidad (por tasa de aprobación primer intento):
1. Empleado 3: 100% aprobado al primer intento
2. Empleado 2: 67% aprobado al primer intento
3. Empleado 1: 33% aprobado al primer intento

════════════════════════════════════════
CLIENTE
════════════════════════════════════════
Total facturado: $20,700
Total recibido (confirmado): $19,500
Total pendiente confirmación: $1,200
🆕 Facturas vencidas: $0
🆕 Confiabilidad de pago: 95%

════════════════════════════════════════
RESULTADOS FINANCIEROS
════════════════════════════════════════
Ganancia bruta: $2,500 ($19,500 - $17,000)
Margen actual: 12.82%
Ganancia esperada: $3,700 ($20,700 - $17,000)
Margen esperado: 17.86%

Ganancia por día: $92.59 ($2,500 / 27 días)

════════════════════════════════════════
CUMPLIMIENTO
════════════════════════════════════════
¿Cumplió fecha límite?: SÍ
Días adelantado/atrasado: +3 días (entregado 3 días antes)

════════════════════════════════════════
🆕 CHECKLIST DE COMPLETITUD DEL PROYECTO
════════════════════════════════════════
✅ Todos los pagos recibidos del cliente
⚠️  Pagos pendientes a empleados: 1 ($1,500)
✅ Archivos finales entregados
✅ No hay feedback pendiente
❌ NO SE PUEDE ARCHIVAR: 1 pago a empleado pendiente
```

**Fórmulas utilizadas:**
- **Ganancia bruta** = Total recibido del cliente - Total pagado a empleados
- **Margen** = (Ganancia bruta / Total recibido del cliente) × 100
- **Ganancia por día** = Ganancia bruta / Duración real del proyecto
- **Eficiencia por empleado** = Total pagado al empleado / Tiempo que tomó
- **🆕 Tasa de aprobación primer intento** = Archivos aprobados sin rechazo / Total de archivos
- **🆕 Confiabilidad de pago** = Pagos a tiempo / Total de pagos × 100

---

## 9. Restricciones y Validaciones

### Al crear proyecto:
- ✅ Debe tener monto inicial requerido
- ✅ Proyecto inicia INACTIVO (estado: ESPERANDO PAGO)
- ✅ Solo se activa cuando cliente paga 100% del monto inicial
- ✅ Pagos parciales permitidos y se acumulan
- ✅ **🆕 Empleados solo pueden asignarse si NO están trabajando en otro proyecto ACTIVO**

### Al subir contenido:
- ✅ Proyecto debe estar ACTIVO
- ✅ Debe tener mínimo: archivo O enlace O comentario
- ✅ Debe tener etapa (obligatorio)
- ✅ Validar permisos de escritura
- ✅ Validar tamaño (máx 2GB)
- ✅ Enlaces: Empleados en cualquier etapa permitida, Clientes solo en "Referencias"
- ✅ **🆕 Si sube nueva versión, empleado puede agregar notas explicando cambios**
- ✅ **🆕 Sistema captura metadata del archivo automáticamente** (tamaño, dimensiones, formato)

### Al cambiar etapa:
- ✅ Solo admin puede cambiar
- ✅ Solo de "Entregado" → "Aprobado por Admin" (y solo el último archivo por empleado)
- ✅ Solo de "Aprobado por Admin" → "Aprobado por Cliente"
- ✅ Al cambiar, guardar fecha de cambio sin modificar fecha original
- ✅ Admin selecciona fechas de aprobación al cambiar etapas
- ✅ Al cambiar a "Aprobado por Cliente" → marcar como "Pendiente de pago"
- ✅ **🆕 Todos los cambios de etapa registrados en registro de auditoría**

### Al registrar pago a empleado:
- ✅ Debe seleccionar al menos un archivo "Pendiente de pago"
- ✅ Debe subir comprobante
- ✅ Debe ingresar monto
- ✅ Debe seleccionar fecha de pago
- ✅ Enlazar pago con archivo(s) vía ID
- ✅ **🆕 Pago registrado en registro de auditoría**

### Al crear factura:
- ✅ **🆕 Número de factura auto-generado:** `INV-YYYY-MM-DD-XXX`
- ✅ **🆕 Debe establecer términos de pago** (Net 15, 30, 60, o personalizado)
- ✅ **🆕 Fecha de vencimiento calculada automáticamente**
- ✅ **🆕 Sistema rastrea facturas vencidas diariamente**

### Al registrar pago de cliente:
- ✅ Transferencia: archivo + monto + fecha → Confirma inmediatamente
- ✅ Cheque: monto + fecha estimada → Queda pendiente hasta que admin sube comprobante + confirma fecha real
- ✅ **🆕 Puede enlazar pago a factura específica**
- ✅ **🆕 Pago registrado en registro de auditoría**

### Feedback (Revisiones):
- ✅ Espacio de cliente separado del espacio de empleado
- ✅ Cada espacio solo visible según permisos
- ✅ Múltiples feedback en mismo ciclo → Temporizador cuenta desde el PRIMERO
- ✅ **🆕 Admin puede enlazar feedback a archivo rechazado específico**
- ✅ **🆕 Sistema rastrea conteo de rechazos por archivo**

### Brief del Proyecto:
- ✅ Admin debe subir al menos 1 archivo a Brief del Proyecto antes de que empleados puedan empezar a trabajar
- ✅ Mensaje mostrado a empleados si está vacío: "⚠️ Esperando Brief del Proyecto"

### Archivos ocultos:
- ✅ Pueden marcarse como "Ocultos" en lugar de eliminarse permanentemente
- ✅ Archivos ocultos pueden restaurarse
- ✅ **🆕 Cuando proyecto se archiva, todos los archivos ocultos se eliminan permanentemente después de 90 días**
- ✅ **🆕 Admin recibe email de advertencia 7 días antes de eliminación**

### 🆕 Completitud de Proyecto:
- ✅ **Proyecto solo puede archivarse cuando:**
  - Todos los pagos del cliente recibidos
  - Todos los empleados pagados
  - Archivos finales entregados
  - No hay ciclos de feedback pendientes
- ✅ **Sistema muestra checklist de completitud con bloqueadores**

---

## 10. Estructura de Base de Datos - Relaciones Clave

```sql
Proyecto
├── id (PK)
├── nombre
├── descripcion
├── cliente_id (FK → Usuarios)
├── estado (esperando_pago | activo | completado | archivado)
├── monto_inicial_requerido (DECIMAL)
├── monto_pagado (DECIMAL, calculado de pagos)
├── fecha_inicio (DATE)
├── fecha_limite (DATE)
├── creado_en
├── 🆕 archivado_en (DATETIME, nullable)
├── 🆕 limpieza_archivos_programada_en (DATETIME, nullable, +90 días desde archivado_en)
├── 🆕 limpieza_archivos_completada_en (DATETIME, nullable)
└── empleados[] (muchos-a-muchos → Usuarios via proyecto_empleados)

Usuarios
├── id (PK)
├── nombre
├── email
├── rol (admin | cliente | empleado)
├── creado_en

Archivo_Documento
├── id (PK)
├── proyecto_id (FK → Proyecto)
├── subido_por_usuario_id (FK → Usuarios)
├── etapa (brief_proyecto | feedback_cliente | feedback_empleado | referencias | entregado | aprobado_admin | aprobado_cliente)
├── url_archivo (nullable, si es archivo)
├── url_enlace (nullable, si es enlace)
├── texto_comentario (nullable, si es comentario)
├── subido_en (DATETIME, carga original)
├── aprobado_admin_en (DATETIME, nullable, admin selecciona)
├── aprobado_cliente_en (DATETIME, nullable, admin selecciona)
├── id_ciclo_feedback_relacionado (FK → Ciclo_Feedback, nullable)
├── estado (activo | oculto | eliminado)
├── pago_pendiente (BOOLEAN)
├── numero_version (INT, para rastrear múltiples entregas)
├── 🆕 etiqueta_version (STRING, ej. "v1", "v2", "v3")
├── 🆕 id_archivo_padre (FK → Archivo_Documento, nullable, enlaza a versión anterior)
├── 🆕 es_version_actual (BOOLEAN)
├── 🆕 tamaño_archivo_bytes (BIGINT)
├── 🆕 tipo_mime_archivo (STRING, ej. "image/jpeg")
├── 🆕 dimensiones_archivo (STRING, ej. "1920x1080")
├── 🆕 notas_version (TEXT, notas del empleado sobre cambios)
├── 🆕 conteo_rechazos (INT, default 0)
├── 🆕 ultimo_rechazo_en (DATETIME, nullable)
└── 🆕 id_feedback_ultimo_rechazo (FK → Feedback, nullable)

Ciclo_Feedback
├── id (PK)
├── proyecto_id (FK → Proyecto)
├── empleado_id (FK → Usuarios)
├── fecha_inicio (DATETIME, primer feedback en ciclo con regla 12PM aplicada)
├── fecha_fin (DATETIME, nullable, cuando se entrega)
├── estado (abierto | entregado | aprobado | rechazado)
└── creado_en

Feedback
├── id (PK)
├── id_ciclo_feedback (FK → Ciclo_Feedback)
├── proyecto_id (FK → Proyecto)
├── creado_por_usuario_id (FK → Usuarios, admin o cliente)
├── audiencia_objetivo (espacio_cliente | espacio_empleado)
├── id_archivo_documento (FK → Archivo_Documento, el contenido del feedback real)
├── creado_en (DATETIME)
├── id_empleado_relacionado (FK → Usuarios, si es para empleado específico)
├── secuencia_en_ciclo (INT, 1er, 2do, 3er feedback en mismo ciclo)
├── 🆕 id_archivo_rechazado (FK → Archivo_Documento, nullable, si este feedback rechaza un archivo)
└── 🆕 es_feedback_rechazo (BOOLEAN, default false)

🆕 Factura (NUEVA TABLA)
├── id (PK)
├── numero_factura (STRING, único, ej. "INV-2024-12-20-001")
├── proyecto_id (FK → Proyecto)
├── cliente_id (FK → Usuarios)
├── fecha_emision (DATE)
├── fecha_vencimiento (DATE, calculada desde fecha_emision + dias_terminos_pago)
├── dias_terminos_pago (INT, ej. 30 para "Net 30")
├── subtotal (DECIMAL)
├── monto_impuesto (DECIMAL, opcional)
├── monto_total (DECIMAL)
├── monto_pagado (DECIMAL, default 0)
├── estado (borrador | enviada | pagada | vencida | cancelada)
├── url_archivo_factura (TEXT, nullable)
├── notas (TEXT, nullable)
├── enviada_a_cliente_en (DATETIME, nullable)
├── creado_en
└── actualizado_en

Pago
├── id (PK)
├── proyecto_id (FK → Proyecto)
├── tipo (factura | pago_empleado | pago_inicial)
├── de_usuario_id (FK → Usuarios, quien paga)
├── a_usuario_id (FK → Usuarios, quien recibe)
├── monto (DECIMAL)
├── metodo_pago (transferencia | cheque)
├── fecha_pago (DATE, seleccionada por usuario/admin)
├── url_archivo_comprobante (nullable)
├── estado (confirmado | pendiente_confirmacion_cheque)
├── creado_en
├── 🆕 id_factura (FK → Factura, nullable)
└── archivos_relacionados[] (muchos-a-muchos → Archivo_Documento via enlaces_pago_archivo)

Seguimiento_Tiempo
├── id (PK)
├── proyecto_id (FK → Proyecto)
├── empleado_id (FK → Usuarios)
├── id_ciclo_feedback (FK → Ciclo_Feedback)
├── hora_inicio (DATETIME, del primer feedback en ciclo)
├── hora_fin (DATETIME, del archivo entregado)
├── duracion_dias (INT, calculado)
├── id_archivo_aprobado (FK → Archivo_Documento, el archivo aprobado por cliente)
├── pago_id (FK → Pago, nullable hasta que se pague)
├── 🆕 conteo_rechazos (INT, cuántas veces rechazado antes de aprobación)
└── 🆕 conteo_versiones (INT, cuántas versiones enviadas)

🆕 Registro_Auditoria (NUEVA TABLA)
├── id (PK)
├── usuario_id (FK → Usuarios)
├── accion (STRING, ej. "pago_creado", "archivo_aprobado", "proyecto_archivado")
├── tipo_entidad (STRING, ej. "Pago", "Archivo_Documento", "Proyecto")
├── id_entidad (INT)
├── valor_anterior (JSON, nullable)
├── valor_nuevo (JSON, nullable)
├── direccion_ip (STRING, opcional)
├── agente_usuario (TEXT, opcional)
└── creado_en (DATETIME)

🆕 Analitica_Cliente (VISTA - calculada)
├── cliente_id (FK → Usuarios)
├── nombre_cliente
├── email_cliente
├── total_proyectos (INT)
├── proyectos_activos (INT)
├── proyectos_completados (INT)
├── proyectos_archivados (INT)
├── total_pagado (DECIMAL)
├── total_facturado (DECIMAL)
├── saldo_pendiente (DECIMAL)
├── valor_promedio_proyecto (DECIMAL)
├── fecha_primer_proyecto (DATE)
├── fecha_ultimo_proyecto (DATE)
├── pagos_a_tiempo (INT)
├── total_conteo_pagos (INT)
└── puntuacion_confiabilidad_pago (DECIMAL, porcentaje)
```

---

## 11. Mejoras de UI/UX

### Dashboard del Admin:

```
┌─────────────────────────────────────────────┐
│ PROYECTO: Casa Moderna - Familia González   │
│ Estado: ● ACTIVO                             │
│ Progreso: 67% completado                     │
├─────────────────────────────────────────────┤
│ 📊 Estadísticas Rápidas                      │
│ • Facturado: $20,700 / Pagado: $19,500      │
│ • Pagado a empleados: $17,000               │
│ • Pagos pendientes empleados: 1             │
│ • Días hasta fecha límite: 3 días           │
│ • 🆕 Facturas vencidas: $0                  │
├─────────────────────────────────────────────┤
│ ⚡ Acciones Necesarias                       │
│ • 2 archivos en Entregado esperando revisión│
│ • 1 pago con cheque necesita confirmación   │
│ • 🆕 Factura #INV-2024-12-20-001 vence en 5d│
├─────────────────────────────────────────────┤
│ 🆕 📋 Actividad Reciente                     │
│ • Hace 2h - Admin aprobó Diseño Cocina v3   │
│ • Hace 3h - Cliente subió pago ($5,000)     │
│ • Hace 1d - Empleado entregó Sala           │
│                                             │
│ [Ver Registro Completo]                     │
└─────────────────────────────────────────────┘
```

### 🆕 Página de Perfil del Cliente:

```
┌─────────────────────────────────────────────┐
│ CLIENTE: Familia González                   │
│ 📧 juan.gonzalez@email.com                  │
├─────────────────────────────────────────────┤
│ 📊 Resumen                                   │
│ • Total Proyectos: 3 (2 done, 1 activo)    │
│ • Revenue Total: $45,000                    │
│ • Pendiente: $2,500                         │
│ • Confiabilidad Pago: 95% (19/20 a tiempo) │
│ • Cliente Desde: Ene 2024                   │
├─────────────────────────────────────────────┤
│ 📋 Historial de Proyectos                   │
│ 1. Casa Moderna      Activo    $20K         │
│ 2. Apartamento       Listo     $15K         │
│ 3. Logo Oficina      Listo     $10K         │
│                                             │
│ [Ver Detalles]                              │
└─────────────────────────────────────────────┘
```

### Visualización de Flujo de Etapas:

```
[Brief] → [Feedback] → [Entregado] → [Aprobado Admin] → [Aprobado Cliente]
 ✓ (3)     ✓ (5)         ! (2)            ✓ (4)              ✓ (8)
                           ↓
                    [Revisar Ahora]
```

### Vista de Pagos Pendientes del Empleado:

```
┌─────────────────────────────────────────────┐
│ TUS PAGOS PENDIENTES                         │
├─────────────────────────────────────────────┤
│ ✓ Diseño Sala Moderna                       │
│   Aprobado: 20 Dic 2024                     │
│   Estado: Pendiente de pago                 │
│   🆕 Versiones: 1 (aprobado primer intento) │
│                                             │
│ ✓ Diseño Cocina - Versión Final            │
│   Aprobado: 22 Dic 2024                     │
│   Estado: Pendiente de pago                 │
│   🆕 Versiones: 3 (rechazado 2 veces)       │
│                                             │
│ Total pendiente: 2 entregas                 │
└─────────────────────────────────────────────┘
```

### 🆕 Vista de Gestión de Facturas:

```
┌─────────────────────────────────────────────────────────┐
│ FACTURAS - Proyecto Casa Moderna                        │
├─────────────────────────────────────────────────────────┤
│ INV-2024-12-15-001                                      │
│ • Monto: $5,000 | Vence: 14 Ene 2025                   │
│ • Estado: ✅ Pagada (20 Dic) - 5 días antes            │
│                                                         │
│ INV-2024-12-20-001                                      │
│ • Monto: $8,000 | Vence: 4 Ene 2025                    │
│ • Estado: ⚠️ VENCIDA - 3 días de retraso               │
│                                                         │
│ INV-2024-12-25-001                                      │
│ • Monto: $4,700 | Vence: 24 Ene 2025                   │
│ • Estado: 📤 Enviada - Vence en 15 días                │
│                                                         │
│ [Crear Nueva Factura]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Notificaciones/Alertas

### Para Admin:
- 🔔 "Nuevo feedback del cliente"
- 🔔 "Empleado entregó trabajo para revisión"
- 🔔 "Pago recibido del cliente"
- ⚠️ "Fecha límite próxima (quedan 3 días)"
- ⏰ "Pago con cheque pendiente de confirmación"
- 🆕 "Factura #INV-2024-12-20-001 vence en 3 días"
- 🆕 "Factura #INV-2024-12-18-001 está vencida"
- 🆕 "Proyecto listo para archivar (todos los items del checklist completos)"
- 🆕 "Archivos ocultos se eliminarán en 7 días"

### Para Empleado:
- 🔔 "Nuevo feedback asignado a ti"
- ✅ "¡Tu trabajo fue aprobado!"
- 💰 "Pago recibido: $3,000"
- 📋 "Brief del Proyecto subido - puedes empezar a trabajar"
- 🆕 "Tu entrega fue rechazada - Ver Feedback #123"

### Para Cliente:
- ✅ "¡Proyecto activado! El trabajo ha comenzado"
- 🔔 "Nueva actualización lista para revisión"
- ✅ "Trabajo final aprobado y entregado"
- ⏰ "Pago inicial recibido - Proyecto activando..."
- 🆕 "Factura #INV-2024-12-20-001 está lista"
- 🆕 "Factura #INV-2024-12-20-001 vence en 3 días"
- 🆕 "Factura #INV-2024-12-18-001 está vencida"

---

## 13. 🆕 Nuevas Características v2.0

### Resumen de Mejoras Principales:

#### 1. **Reglas de Asignación de Empleados**
- ✅ Empleados solo pueden trabajar en UN proyecto activo a la vez
- ✅ Sistema previene asignar empleados ocupados
- ✅ Indicadores visuales muestran asignación de proyecto actual

#### 2. **Seguimiento de Rechazos y Métricas de Calidad**
- ✅ Admin puede enlazar feedback a archivos rechazados
- ✅ Sistema cuenta cuántas veces cada archivo fue rechazado
- ✅ Empleado ve historial de rechazos en sus entregas
- ✅ Analytics muestran tasas de aprobación al primer intento por empleado
- ✅ Ranking de calidad basado en tasas de rechazo

#### 3. **Historial de Cliente y Gestión de Relaciones**
- ✅ Perfil completo del cliente con todos los proyectos
- ✅ Revenue total por cliente a través de todos los proyectos
- ✅ Puntuación de confiabilidad de pago
- ✅ Seguimiento de saldo pendiente
- ✅ Widget de dashboard de mejores clientes

#### 4. **Sistema de Versionado de Archivos**
- ✅ Numeración automática de versiones (v1, v2, v3)
- ✅ Empleado puede agregar notas explicando cambios
- ✅ Historial completo de versiones con notas
- ✅ Captura de metadata de archivo (tamaño, dimensiones, formato)
- ✅ Comparación fácil entre versiones

#### 5. **Sistema Profesional de Facturas**
- ✅ Números de factura auto-generados: `INV-2024-12-20-001`
- ✅ Términos de pago flexibles (Net 15, 30, 60, personalizado)
- ✅ Cálculo automático de fecha de vencimiento
- ✅ Detección de facturas vencidas y notificaciones
- ✅ Seguimiento de estado de factura (Borrador, Enviada, Pagada, Vencida)
- ✅ Enlace de pago a facturas

#### 6. **Registro de Auditoría y Accountability**
- ✅ Registro completo de todas las acciones críticas
- ✅ Rastrea quién hizo qué y cuándo
- ✅ Registro de creación/modificación de pagos
- ✅ Seguimiento de aprobación de archivos
- ✅ Historial de cambios de estado de proyecto
- ✅ Widget de dashboard de actividad reciente

#### 7. **Gestión de Completitud de Proyecto**
- ✅ Checklist claro antes de archivar
- ✅ Previene archivo con items pendientes
- ✅ Muestra bloqueadores específicos
- ✅ Limpieza automática de archivos después de 90 días
- ✅ Notificaciones de advertencia antes de eliminación

#### 8. **Analytics Mejorado**
- ✅ Tasas de rechazo por empleado
- ✅ Porcentajes de aprobación al primer intento
- ✅ Seguimiento de conteo de versiones
- ✅ Comparación de calidad vs velocidad
- ✅ Métricas de confiabilidad de pago del cliente
- ✅ Seguimiento de facturas vencidas

---

## Cambios de v1.0 a v2.0

| Característica | v1.0 | v2.0 |
|---------------|------|------|
| Asignación de empleados | Puede asignar a múltiples proyectos | ✅ Solo 1 proyecto activo por empleado |
| Seguimiento de rechazos | Sin seguimiento formal | ✅ Enlazado a feedback con conteo |
| Historial de cliente | Sin vista entre proyectos | ✅ Perfil completo del cliente y analytics |
| Versiones de archivos | Seguimiento manual | ✅ Versionado automático con notas |
| Sistema de facturas | Solo carga de archivos | ✅ Facturas estructuradas con auto-numeración |
| Términos de pago | Sin seguimiento | ✅ Términos flexibles con fechas de vencimiento |
| Seguimiento de vencidos | Manual | ✅ Detección automática y notificaciones |
| Registro de auditoría | Ninguno | ✅ Registro completo de acciones |
| Completitud de proyecto | Criterios poco claros | ✅ Checklist con bloqueadores |
| Limpieza de archivos | Manual | ✅ Automatizada después de 90 días |
| Métricas de calidad | No medidas | ✅ Tasas de rechazo y aprobaciones primer intento |
| Notas de versión | No disponibles | ✅ Empleado puede explicar cambios |

---

## Prioridad de Implementación

### Fase 1 - Crítico (Implementar Primero):
1. ✅ Validación de asignación de empleados
2. ✅ Seguimiento de rechazos y enlace con feedback
3. ✅ Dashboard de historial del cliente
4. ✅ Registro de auditoría básico

### Fase 2 - Importante (Siguiente):
5. ✅ Versionado de archivos con notas y metadata
6. ✅ Checklist de completitud de proyecto
7. ✅ Sistema de facturas con auto-numeración
8. ✅ Política de limpieza de archivos (90 días)

---

**Fin del Flujo del Sistema v2.0**

> Para detalles de implementación, ver el schema de Prisma en `apps/backend/prisma/schema.prisma`
