# Scripts Manuales de Utilidad

Esta carpeta contiene scripts de utilidad que se ejecutan manualmente según necesidad.

---

## 📝 Scripts Disponibles

### 1. debug-files.ts
**Propósito**: Script de depuración para consultar archivos en la base de datos

**Uso**:
```bash
cd apps/backend
npx ts-node ../scripts/manual/debug-files.ts
```

**Descripción**: Útil para debugging de issues con archivos en MinIO y BD

---

### 2. update-admin-email.ts
**Propósito**: Actualizar el email del usuario admin en la base de datos

**Uso**:
```bash
cd apps/backend
npx ts-node ../scripts/manual/update-admin-email.ts
```

**Descripción**:
- Cambia el email del admin principal
- Actualizar el email dentro del script antes de ejecutar
- Solo ejecutar cuando sea necesario cambiar credenciales de admin

---

### 3. update-admin-email.js
**Propósito**: Versión compilada de update-admin-email.ts

**Uso**:
```bash
cd apps/backend
node ../scripts/manual/update-admin-email.js
```

---

## ⚠️ IMPORTANTE

- Estos scripts NO se ejecutan automáticamente
- Ejecutar solo cuando sea necesario
- Hacer backup de la BD antes de ejecutar scripts que modifican datos
- Los scripts pueden requerir actualización según cambios en el schema

---

**Última actualización**: Diciembre 31, 2024
