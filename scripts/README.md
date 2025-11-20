# 🚀 Scripts de Gestión del Monorepo

Scripts para gestionar el inicio, detención y reinicio del monorepo Align Designs.

## 📋 Scripts Disponibles

### PowerShell (Recomendado para Windows)

| Script | Descripción | Uso |
|--------|-------------|-----|
| `start-dev.ps1` | Inicia el monorepo completo | `.\scripts\start-dev.ps1` |
| `stop-dev.ps1` | Detiene todos los servicios al 100% | `.\scripts\stop-dev.ps1` |
| `restart-dev.ps1` | Reinicia el monorepo limpiamente | `.\scripts\restart-dev.ps1` |

### CMD/Batch (Alternativa)

| Script | Descripción | Uso |
|--------|-------------|-----|
| `start-dev.bat` | Inicia el monorepo completo | `scripts\start-dev.bat` |
| `stop-dev.bat` | Detiene todos los servicios | `scripts\stop-dev.bat` |
| `restart-dev.bat` | Reinicia el monorepo | `scripts\restart-dev.bat` |

## 🎯 Uso Rápido

### Con PowerShell:

```powershell
# Desde la raíz del proyecto:

# Iniciar
.\scripts\start-dev.ps1

# Detener
.\scripts\stop-dev.ps1

# Reiniciar
.\scripts\restart-dev.ps1
```

### Con CMD:

```cmd
# Desde la raíz del proyecto:

# Iniciar
scripts\start-dev.bat

# Detener
scripts\stop-dev.bat

# Reiniciar
scripts\restart-dev.bat
```

## 📝 Características

### ✨ start-dev

- ✅ Verifica instalación de dependencias
- ✅ Limpia lockfiles de Next.js
- ✅ Verifica disponibilidad de puertos
- ✅ Inicia backend (puerto 4000) y frontend (puerto 3000)
- ✅ Usa puerto alternativo si 3000 está ocupado

### 🛑 stop-dev

- ✅ Detiene procesos en puertos 3000, 3001, 4000
- ✅ Busca y detiene procesos Node relacionados
- ✅ Limpia archivos temporales de Next.js
- ✅ Verifica que todos los procesos se detengan

### 🔄 restart-dev

- ✅ Ejecuta stop-dev completo
- ✅ Espera 3 segundos para limpieza
- ✅ Ejecuta start-dev fresco

## 🔧 Resolución de Problemas

### Error: "Execution Policy"

Si PowerShell no permite ejecutar scripts:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Puerto en uso

Los scripts detectan automáticamente puertos ocupados:
- **Backend (4000):** Se detiene el proceso anterior
- **Frontend (3000):** Se usa puerto 3001 automáticamente

### Proceso bloqueado

Si un proceso no se detiene:

```powershell
# Ver procesos en puerto específico
Get-NetTCPConnection -LocalPort 3000

# Detener manualmente
Stop-Process -Id [PID] -Force
```

## 📍 URLs de Servicio

Después de iniciar:

- **Backend API:** http://localhost:4000
- **Frontend:** http://localhost:3000 (o 3001 si está ocupado)
- **Swagger Docs:** http://localhost:4000/api

## 🎨 Output Visual

Los scripts usan colores para mejor visibilidad:
- 🔵 **Cyan:** Información general
- 🟢 **Verde:** Éxito
- 🟡 **Amarillo:** Advertencias
- 🔴 **Rojo:** Errores/Detención

## 💡 Recomendaciones

1. **Usar PowerShell:** Más robusto y con mejor manejo de errores
2. **Verificar puertos:** Antes de iniciar, asegúrate de que no hay servicios conflictivos
3. **Reinicio limpio:** Siempre usa `restart-dev.ps1` en lugar de Ctrl+C + start

## 🔗 Enlaces Útiles

- [Documentación del Proyecto](../docs/README.md)
- [Setup Guide](../docs/SETUP.md)
- [Troubleshooting](../docs/INFRASTRUCTURE.md)
