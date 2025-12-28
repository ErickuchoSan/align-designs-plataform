# Flujo Completo del Sistema - Plataforma Align Designs

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

---

## 1. Usuarios del Sistema

- **Admin** (Poncho)
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

### PASO 2: Proyecto en estado "INACTIVO"

**Estado del Proyecto:** `ESPERANDO PAGO`

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

#### Opción A - Transferencia Bancaria:
- Subir comprobante (captura de pantalla/PDF)
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

### 7 Etapas Fijas:

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
| **Feedback (Empleado)** | Leer + Escribir | SIN acceso | Solo lectura | Admin crea feedback para empleados. Empleados solo pueden leer. Espacio separado del feedback de cliente. |
| **Referencias** | Leer + Escribir | Leer + Escribir | SIN acceso | Cliente puede subir enlaces (Google, referencias visuales). |
| **Entregado** | Leer + Escribir | SIN acceso | Leer + Escribir | Empleados envían trabajo aquí. |
| **Aprobado por Admin** | Leer + Escribir | SIN acceso | SIN acceso | Solo admin. Archivos aprobados por admin. |
| **Aprobado por Cliente** | Leer + Escribir | SIN acceso | SIN acceso | Solo admin (puede escribir). El cliente NO ve esta etapa. |
| **Pagos** | Leer + Escribir | Leer + Escribir (solo facturas/pagos) | Leer (solo sus pagos) | Separado por tipo de pago. |

### Sub-etapas de Pagos:

#### Facturas (Admin → Cliente):
- Admin sube facturas
- Cliente sube comprobantes de pago (transferencia con archivo + monto + fecha, o cheque con monto + fecha)
- Si es cheque, admin sube comprobante después + confirma fecha
- **Visible para:** Solo Admin y Cliente

#### Pagos a Empleados (Admin → Empleado):
- Admin sube comprobante de transferencia + monto + fecha
- Admin selecciona qué archivo(s) "Pendiente de pago" está pagando
- **Visible para:** Admin y empleado específico que recibe el pago

#### Pagos Pendientes (Vista del Empleado):
- El empleado ve lista de archivos aprobados por cliente que no tienen pago asociado todavía
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

### Información Automática al Subir:
- Fecha y hora de carga
- Usuario que subió (el sistema identifica si es cliente o empleado)
- Etapa asignada

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

3. Empleados reciben notificación y leen feedback en su espacio (solo lectura)
4. El cliente **NO VE** el feedback que admin envía a empleados

**Importante sobre múltiples ciclos de feedback:**
- Si admin crea Feedback 1 → Empleado no envía todavía
- Admin crea Feedback 2 → Empleado no envía todavía
- Admin crea Feedback 3 → Empleado finalmente envía
- **El temporizador cuenta desde Feedback 1 (el primero), no el último**
- El sistema rastrea: *"Iniciado desde primer feedback en [fecha]"*

### FASE 4: Empleado trabaja y entrega

1. Empleado trabaja en los cambios solicitados
2. Empleado sube trabajo a la etapa **"Entregado"** (archivo/enlace/comentario)

**FECHA CRÍTICA - Temporizador termina:**
- El sistema guarda fecha/hora cuando empleado sube a Entregado

**El sistema calcula automáticamente:**
- **Tiempo** = (Fecha de Entregado) - (Fecha del primer feedback del admin a este empleado)
- **Enlace:** El sistema relaciona esta entrega con el ciclo de feedback específico vía ID

**Importante:**
- Solo el **ÚLTIMO** archivo subido a Entregado por cada empleado muestra botón: *"Aprobar → Aprobado por Admin"*
- Archivos anteriores pueden accederse pero no muestran botón de aprobar
- Si admin prefiere una versión anterior, puede "Ocultar" la versión más reciente, y la anterior se vuelve "más reciente"

### FASE 5: Admin revisa trabajo del empleado

1. Admin ve todos los archivos en **Entregado**
2. Solo el **ÚLTIMO** archivo subido por un empleado tiene opción visible: *"Mover a Aprobado por Admin"*

**Si NO aprueba:**
- Admin crea nuevo feedback para empleado → Regresa a **FASE 3**
- Nuevo ciclo de feedback inicia
- Temporizador cuenta desde **PRIMER** feedback (si había anteriores no completados)

**Si aprueba:**
- Admin cambia etapa del archivo de "Entregado" a "Aprobado por Admin"
- **Se guardan TRES fechas:**
  1. **Fecha de carga original** (cuando empleado subió a Entregado)
  2. **Fecha de aprobación del admin** (cuando admin lo movió a Aprobado por Admin) - Admin selecciona esta fecha
  3. **Fecha de aprobación del cliente** (se establecerá después) - Admin también seleccionará esta
- El sistema marca archivo como *"Pendiente de presentación al cliente"*

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

### FASE 7: Pago al empleado

1. Admin va a etapa **"Pagos"** → **"Pago a Empleado"**
2. El sistema muestra pagos pendientes agrupados por empleado
3. Admin selecciona empleado
4. El sistema muestra lista de archivos *"Pendiente de pago"* para ese empleado
5. Admin selecciona qué archivo(s) está pagando
6. Admin sube:
   - Comprobante de pago (archivo)
   - Monto depositado (entrada numérica)
   - Fecha de pago (calendario/selector de fecha)
7. El sistema enlaza el pago con el/los archivo(s) seleccionado(s) vía ID
8. El sistema remueve marca de *"Pendiente de pago"* de esos archivos
9. El empleado puede ahora ver este pago en su sección "Pagos" y en "Pagos Pendientes" (mostrará como pagado)

---

## 6. Flujo de Pago Cliente → Admin

### A. Admin genera Factura

1. Admin va a etapa **"Pagos"** → **"Factura"**
2. Admin sube factura con plantilla del total a cobrar
3. Solo admin y cliente ven esta información

### B. Cliente paga a Admin

#### Opción 1 - Transferencia Bancaria:
- Cliente sube comprobante de transferencia (captura de pantalla/PDF)
- Cliente ingresa monto pagado
- Cliente selecciona fecha de pago (calendario)
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
- Etapa
- Usuario que subió
- Fecha de carga
- Acciones (según permisos)

**Funcionalidad de cambio de etapa (solo admin):**
- Opción visible solo en **ÚLTIMO** archivo por empleado en "Entregado" → puede cambiar a "Aprobado por Admin"
- Opción visible solo en archivos en "Aprobado por Admin" → puede cambiar a "Aprobado por Cliente"
- Selectores de fecha aparecen al cambiar etapas para que admin elija fechas de aprobación

**Funcionalidad de Ocultar/Eliminar:**
- Archivos pueden marcarse como "Ocultos" (no se muestran en vista principal pero no se eliminan)
- Archivos ocultos pueden restaurarse
- Cuando el proyecto se completa/archiva, todos los archivos ocultos se eliminan permanentemente

---

## 8. Sistema de Análisis (Solo Admin)

### 8.1 Enlazando Feedback → Entregado → Aprobaciones

**Sistema de Relación por ID:**

```
ID_Ciclo_Feedback_123
├─ ID_Primer_Feedback_124 (Admin → Empleado 1) [15 Dic 2025 11:00 AM]
├─ ID_Segundo_Feedback_125 (Admin → Empleado 1) [16 Dic 2025 2:00 PM]
├─ ID_Tercer_Feedback_126 (Admin → Empleado 1) [17 Dic 2025 10:00 AM]
└─→ ID_Entregado_456 (Empleado 1) [18 Dic 2025 4:26 PM]
     └─→ ID_Aprobado_Admin_789 [19 Dic 2025 - seleccionado por admin]
          └─→ ID_Aprobado_Cliente_101112 [20 Dic 2025 - seleccionado por admin]
               └─→ ID_Pago_131415 [$3,000] [22 Dic 2025 - seleccionado por admin]
```

**Cálculo de Tiempo:**
- **Inicio:** Fecha ID_Primer_Feedback_124 (con regla de 12:00 PM aplicada)
- **Fin:** Fecha ID_Entregado_456
- **Tiempo:** 3 días (horas no contadas, solo días)

### 8.2 Seguimiento de tiempo por empleado por entrega

Para cada archivo en "Aprobado por Cliente":
- Empleado que lo subió
- ID del ciclo de feedback enlazado (fecha de inicio)
- Fecha de entregado (fecha de fin)
- Tiempo transcurrido (solo días)
- Pago asociado (ID_Pago, monto, fecha)

**Ejemplo Empleado 1:**

```
Entrega 1:
  - Ciclo: Feedback 1 Dic 2024 10:00 AM → Entregado 6 Dic 2024 4:00 PM
  - Tiempo: 5 días
  - Pago: $3,000 [10 Dic 2024]

Entrega 2:
  - Ciclo: Feedback 8 Dic 2024 2:00 PM → Entregado 11 Dic 2024 9:00 AM
  - Tiempo: 3 días
  - Pago: $2,000 [15 Dic 2024]

Entrega 3:
  - Ciclo: Feedback 12 Dic 2024 9:00 AM → Entregado 16 Dic 2024 5:00 PM
  - Tiempo: 4 días
  - Pago: $2,500 [18 Dic 2024]
------------------------
Total entregas: 3
Tiempo total: 12 días
Total pagado: $7,500
Promedio por día: $625
Pagos pendientes: 0
```

### 8.3 Seguimiento de pagos del cliente

Todos los pagos en **Pagos → Facturas:**
- Fecha de pago (seleccionada por cliente o admin dependiendo de transferencia/cheque confirmado)
- Monto
- Tipo (transferencia/cheque)
- Estado (confirmado/pendiente confirmación de cheque)

**Ejemplo:**

```
Pago 1: 15 Dic 2024 - $3,000 (Transferencia) [Confirmado]
Pago 2: 18 Dic 2024 - $2,500 (Transferencia) [Confirmado]
Pago 3: 20 Dic 2024 - $6,000 (Cheque) [Confirmado - Admin subió comprobante]
Pago 4: 22 Dic 2024 - $8,000 (Transferencia) [Confirmado]
Pago 5: 25 Dic 2024 - $1,200 (Cheque) [Pendiente - Cliente indicó monto, admin no ha confirmado]
------------------------
Total confirmado: $19,500
Total pendiente: $1,200
Total esperado: $20,700
```

### 8.4 Análisis por empleado

```
EMPLEADO 1:
- Entregas aprobadas: 3
- Tiempo total de trabajo: 12 días
- Total pagado: $7,500
- Promedio por día: $625
- Eficiencia: $625/día
- Pagos pendientes: 0

EMPLEADO 2:
- Entregas aprobadas: 3
- Tiempo total de trabajo: 10 días
- Total pagado: $5,800
- Promedio por día: $580
- Eficiencia: $580/día
- Pagos pendientes: 1 ($1,500)

EMPLEADO 3:
- Entregas aprobadas: 3
- Tiempo total de trabajo: 8 días
- Total pagado: $3,700
- Promedio por día: $462.50
- Eficiencia: $462.50/día
- Pagos pendientes: 0
```

### 8.5 Análisis global del proyecto

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
Total pagado a empleados: $17,000
Promedio por empleado: $5,666.67

Ranking de eficiencia:
1. Empleado 1: $625/día
2. Empleado 2: $580/día
3. Empleado 3: $462.50/día

════════════════════════════════════════
CLIENTE
════════════════════════════════════════
Total recibido (confirmado): $19,500
Total pendiente confirmación: $1,200
Total esperado: $20,700

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
EFICIENCIA POR EMPLEADO
════════════════════════════════════════
[Tabla detallada de la sección 8.4]
```

**Fórmulas utilizadas:**
- **Ganancia bruta** = Total recibido del cliente - Total pagado a empleados
- **Margen** = (Ganancia bruta / Total recibido del cliente) × 100
- **Ganancia por día** = Ganancia bruta / Duración real del proyecto
- **Eficiencia por empleado** = Total pagado al empleado / Tiempo que tomó
- **Empleado más rentable** = Menor costo por día trabajado

---

## 9. Restricciones y Validaciones

### Al crear proyecto:
- ✅ Debe tener monto inicial requerido
- ✅ Proyecto inicia INACTIVO (estado: ESPERANDO PAGO)
- ✅ Solo se activa cuando cliente paga 100% del monto inicial
- ✅ Pagos parciales permitidos y se acumulan

### Al subir contenido:
- ✅ Proyecto debe estar ACTIVO
- ✅ Debe tener mínimo: archivo O enlace O comentario
- ✅ Debe tener etapa (obligatorio)
- ✅ Validar permisos de escritura
- ✅ Validar tamaño (máx 2GB)
- ✅ Enlaces: Empleados en cualquier etapa permitida, Clientes solo en "Referencias"

### Al cambiar etapa:
- ✅ Solo admin puede cambiar
- ✅ Solo de "Entregado" → "Aprobado por Admin" (y solo el último archivo por empleado)
- ✅ Solo de "Aprobado por Admin" → "Aprobado por Cliente"
- ✅ Al cambiar, guardar fecha de cambio sin modificar fecha original
- ✅ Admin selecciona fechas de aprobación al cambiar etapas
- ✅ Al cambiar a "Aprobado por Cliente" → marcar como "Pendiente de pago"

### Al registrar pago a empleado:
- ✅ Debe seleccionar al menos un archivo "Pendiente de pago"
- ✅ Debe subir comprobante
- ✅ Debe ingresar monto
- ✅ Debe seleccionar fecha de pago
- ✅ Enlazar pago con archivo(s) vía ID

### Al registrar pago de cliente:
- ✅ Transferencia: archivo + monto + fecha → Confirma inmediatamente
- ✅ Cheque: monto + fecha estimada → Queda pendiente hasta que admin sube comprobante + confirma fecha real

### Feedback (Revisiones):
- ✅ Espacio de cliente separado del espacio de empleado
- ✅ Cada espacio solo visible según permisos
- ✅ Múltiples feedback en mismo ciclo → Temporizador cuenta desde el PRIMERO

### Brief del Proyecto:
- ✅ Admin debe subir al menos 1 archivo a Brief del Proyecto antes de que empleados puedan empezar a trabajar
- ✅ Mensaje mostrado a empleados si está vacío: "⚠️ Esperando Brief del Proyecto"

### Archivos ocultos:
- ✅ Pueden marcarse como "Ocultos" en lugar de eliminarse permanentemente
- ✅ Archivos ocultos pueden restaurarse
- ✅ Cuando proyecto se completa/archiva, todos los archivos ocultos se eliminan permanentemente

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
└── numero_version (INT, para rastrear múltiples entregas)

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
└── secuencia_en_ciclo (INT, 1er, 2do, 3er feedback en mismo ciclo)

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
└── pago_id (FK → Pago, nullable hasta que se pague)
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
│ • Pagado por cliente: $19,500 / $20,700     │
│ • Pagado a empleados: $17,000               │
│ • Pagos pendientes empleados: 1             │
│ • Días hasta fecha límite: 3 días           │
├─────────────────────────────────────────────┤
│ ⚡ Acciones Necesarias                       │
│ • 2 archivos en Entregado esperando revisión│
│ • 1 pago con cheque necesita confirmación   │
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
│                                             │
│ ✓ Diseño Cocina - Versión Final            │
│   Aprobado: 22 Dic 2024                     │
│   Estado: Pendiente de pago                 │
│                                             │
│ Total pendiente: 2 entregas                 │
└─────────────────────────────────────────────┘
```

---

## 12. Notificaciones/Alertas

### Para Admin:
- 🔔 "Nuevo feedback del cliente"
- 🔔 "Empleado entregó trabajo para revisión"
- 🔔 "Pago recibido del cliente"
- ⚠️ "Fecha límite próxima (quedan 3 días)"
- ⏰ "Pago con cheque pendiente de confirmación"

### Para Empleado:
- 🔔 "Nuevo feedback asignado a ti"
- ✅ "¡Tu trabajo fue aprobado!"
- 💰 "Pago recibido: $3,000"
- 📋 "Brief del Proyecto subido - puedes empezar a trabajar"

### Para Cliente:
- ✅ "¡Proyecto activado! El trabajo ha comenzado"
- 🔔 "Nueva actualización lista para revisión"
- ✅ "Trabajo final aprobado y entregado"
- ⏰ "Pago inicial recibido - Proyecto activando..."

---

## Resumen de Cambios Clave de la Versión en Inglés

- ✅ "Categorías" → "Etapas" (más intuitivo para flujo de trabajo)
- ✅ "Redlines" → "Feedback" (término más universal)
- ✅ "Inspiration" → "Referencias" (propósito más claro)
- ✅ "Revised" → "Entregado" (más preciso, "revised" suena ya revisado)
- ✅ "Aproved for Admin/Client" → "Aprobado por Admin/Cliente" (inglés natural)
- ✅ Cliente NO ve la etapa "Aprobado por Cliente" (solo admin y empleado la ven)
- ✅ Seguimiento de tiempo solo cuenta días (no horas/minutos) para ser justo
- ✅ Temporizador inicia desde PRIMER feedback en ciclo, no el último
- ✅ Solo último archivo por empleado puede aprobarse (otros pueden ocultarse)
- ✅ Todas las fechas de aprobación seleccionadas por admin (no timestamps automáticos)
- ✅ Pagos parciales permitidos para monto inicial
- ✅ Brief del Proyecto requerido antes de que empleados puedan empezar
- ✅ Empleado puede ver sección "Pagos Pendientes" para transparencia
- ✅ Archivos ocultos eliminados permanentemente cuando proyecto se completa
