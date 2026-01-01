# 🚀 Guía de Auto-Start - Align Designs Platform

Esta guía te ayudará a configurar el sistema para que **inicie automáticamente al encender Windows**.

---

## 📋 ¿Qué es esto?

Después de seguir esta guía, **ya no necesitarás** ejecutar `.\scripts\start.ps1` manualmente cada vez que quieras usar el sistema.

El sistema completo (Nginx + Frontend + Backend) se iniciará automáticamente cuando enciendas tu PC.

---

## ⚡ Instalación Rápida

### Paso 1: Abrir PowerShell como Administrador

1. Busca "PowerShell" en el menú de Windows
2. **Haz clic derecho** en "Windows PowerShell"
3. Selecciona **"Ejecutar como administrador"**

### Paso 2: Navegar al directorio del proyecto

```powershell
cd "d:\Desarrollos\Align Designs\align-designs-plataform"
```

### Paso 3: Ejecutar el instalador

```powershell
.\scripts\install-all-services.ps1
```

### Paso 4: Esperar a que termine

El script hará lo siguiente automáticamente:
- ✅ Instalar NSSM (si no está instalado)
- ✅ Instalar Nginx como servicio de Windows
- ✅ Instalar el Monorepo como servicio de Windows
- ✅ Configurar auto-start en boot
- ✅ Iniciar los servicios
- ✅ Verificar que todo funcione

**Tiempo estimado**: 2-3 minutos

---

## ✅ Verificación

Después de la instalación, verifica que todo funcione:

### 1. Ver estado de los servicios
```powershell
Get-Service AlignDesigns*
```

Deberías ver:
```
Status   Name                 DisplayName
------   ----                 -----------
Running  AlignDesignsMonorepo Align Designs Monorepo
Running  AlignDesignsNginx    Align Designs Nginx
```

### 2. Probar el acceso

Abre tu navegador y ve a:
- http://aligndesigns-platform.local ← **Debería funcionar** ✅

### 3. Reiniciar Windows (Opcional pero recomendado)

Para verificar que el auto-start funciona:
1. Reinicia tu PC
2. Espera 2-3 minutos después de iniciar Windows
3. Abre el navegador y ve a http://aligndesigns-platform.local
4. Debería funcionar sin haber ejecutado ningún script ✅

---

## 🎮 Uso Diario

### Acceder al sistema
Simplemente abre tu navegador:
- http://aligndesigns-platform.local

**Ya no necesitas ejecutar `start.ps1`** 🎉

### Ver logs en tiempo real
```powershell
Get-Content "d:\Desarrollos\Align Designs\align-designs-plataform\logs\monorepo-service.log" -Tail 50 -Wait
```

Presiona `Ctrl+C` para salir.

### Detener el sistema temporalmente
```powershell
Stop-Service AlignDesignsMonorepo, AlignDesignsNginx
```

### Iniciar el sistema manualmente
```powershell
Start-Service AlignDesignsNginx, AlignDesignsMonorepo
```

### Reiniciar el sistema
```powershell
Restart-Service AlignDesignsMonorepo
```

---

## 🔄 Desinstalación

Si quieres volver al modelo manual (ejecutar `start.ps1` cada vez):

### Paso 1: Abrir PowerShell como Administrador

### Paso 2: Ejecutar el desinstalador

```powershell
cd "d:\Desarrollos\Align Designs\align-designs-plataform"
.\scripts\uninstall-all-services.ps1
```

Esto eliminará los servicios de Windows y volverás a usar `start.ps1` manualmente.

---

## 🤔 Preguntas Frecuentes

### ¿Hot-reload sigue funcionando?

**Sí.** Los servicios ejecutan `pnpm dev`, por lo que:
- Next.js hace hot-reload de cambios en el frontend
- NestJS hace hot-reload de cambios en el backend

### ¿Puedo ver los logs?

**Sí.** Los logs se guardan en archivos:
```powershell
# Ver logs del sistema
Get-Content .\logs\monorepo-service.log -Tail 50 -Wait

# Ver logs de errores
Get-Content .\logs\monorepo-service-error.log -Tail 50 -Wait
```

### ¿Cómo detengo el sistema si quiero hacer cambios profundos?

```powershell
Stop-Service AlignDesignsMonorepo, AlignDesignsNginx
```

Cuando termines, inícialo de nuevo:
```powershell
Start-Service AlignDesignsNginx, AlignDesignsMonorepo
```

### ¿Puedo seguir usando start.ps1 para desarrollo?

**Sí, pero no al mismo tiempo.**

Si prefieres ver los logs en consola mientras desarrollas:
1. Detén los servicios: `Stop-Service AlignDesignsMonorepo, AlignDesignsNginx`
2. Usa `.\scripts\start.ps1` como siempre
3. Cuando termines, usa `.\scripts\stop.ps1`
4. Vuelve a iniciar los servicios si quieres: `Start-Service AlignDesignsNginx, AlignDesignsMonorepo`

### ¿Los servicios consumen recursos cuando no uso el sistema?

**Sí.** Los servicios estarán corriendo siempre.

**Recomendación**:
- Si usas el sistema diariamente → deja los servicios activos
- Si solo lo usas ocasionalmente → mejor usa `start.ps1` manualmente

### ¿Qué pasa si cambio el código mientras los servicios están corriendo?

**Hot-reload funciona normalmente.** Los cambios se reflejarán automáticamente.

### ¿Puedo desinstalar Chocolatey después de la instalación?

**Sí.** Chocolatey solo se usa para instalar NSSM. Después de eso, puedes desinstalarlo si quieres.

---

## 🆘 Problemas Comunes

### El servicio no inicia

**Verificar logs**:
```powershell
Get-Content .\logs\monorepo-service-error.log -Tail 100
```

**Verificar que Nginx esté corriendo primero**:
```powershell
Get-Service AlignDesignsNginx
```

Si no está corriendo:
```powershell
Start-Service AlignDesignsNginx
Start-Service AlignDesignsMonorepo
```

### "No puedo ejecutar el script (Execution Policy)"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### El dominio no funciona

**Verificar hosts file**:
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

Debe contener:
```
127.0.0.1       aligndesigns-platform.local
```

**Verificar que Nginx esté corriendo**:
```powershell
Get-Service AlignDesignsNginx
```

### Después de reiniciar Windows, el sistema no está disponible

**Espera 2-3 minutos** después de que Windows termine de iniciar. Los servicios tardan un poco en arrancar.

**Verificar estado**:
```powershell
Get-Service AlignDesigns*
```

Si alguno no está en "Running":
```powershell
Start-Service AlignDesignsNginx, AlignDesignsMonorepo
```

---

## 📊 Comparación: Manual vs Auto-Start

| Aspecto | Manual (start.ps1) | Auto-Start (Servicios) |
|---------|-------------------|------------------------|
| Inicio | Manual cada vez | Automático en boot |
| Logs | Consola | Archivos (.\logs\) |
| Hot-reload | ✅ Sí | ✅ Sí |
| Ventana PowerShell | Debe estar abierta | No necesaria |
| Uso de recursos | Solo cuando lo usas | Siempre activo |
| Mejor para | Desarrollo activo diario | Testing/Demo permanente |
| Control | Control directo visible | Gestión con comandos |

---

## 🎯 Recomendación

### Usa Auto-Start si:
- Usas el sistema todos los días
- No quieres estar abriendo consolas
- Reiniciar Windows frecuentemente
- Necesitas que esté siempre disponible
- Varios usuarios acceden al sistema

### Usa Manual (start.ps1) si:
- Solo desarrollas ocasionalmente
- Prefieres ver logs en consola
- Quieres controlar exactamente cuándo corre
- Te importa ahorrar recursos cuando no lo usas

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas con la instalación, revisa:
1. La sección de **Problemas Comunes** arriba
2. El archivo [scripts/README.md](scripts/README.md) para más detalles técnicos
3. Los logs del sistema en `.\logs\`

---

¡Disfruta de tu sistema Align Designs Platform con auto-start! 🚀
