# 🚀 Scripts de Gestión del Monorepo

Scripts organizados para gestionar el inicio, detención y servicios del monorepo Align Designs.

## 📁 Estructura de Carpetas

```
scripts/
├── README.md                           # Este archivo
├── manual/                             # Desarrollo manual (start/stop)
│   ├── start.ps1
│   └── stop.ps1
├── services/                           # Instalación de servicios de Windows
│   ├── install-all-services.ps1
│   ├── install-nginx-service.ps1
│   ├── install-monorepo-service.ps1
│   ├── restart-monorepo-service.ps1
│   ├── uninstall-all-services.ps1
│   └── update-monorepo-service-to-pnpm.ps1
└── utils/                              # Utilidades organizadas por categoría
    ├── nginx/                          # Nginx configuration and management
    │   ├── configure-nginx.bat
    │   ├── force-restart-nginx.bat
    │   ├── restart-for-ngrok.bat
    │   └── apply-ngrok-config.bat
    ├── ngrok/                          # Remote access tunneling
    │   ├── share-with-ngrok.bat
    │   ├── share-with-ngrok-test.bat
    │   ├── stop-ngrok.bat
    │   ├── get-ngrok-url.ps1
    │   └── test-ngrok.ps1
    ├── logs/                           # Log viewing utilities
    │   ├── view-logs.bat
    │   └── view-backend-logs.bat
    └── maintenance/                    # System maintenance
        ├── restart-services.bat
        ├── kill-locks.bat
        ├── restart-and-debug.bat
        └── check-services.ps1
```

---

## 🎯 Inicio Rápido

### Opción 1: Desarrollo Manual (Recomendado para desarrollo diario)
```powershell
.\scripts\manual\start.ps1    # Inicia sistema (logs en consola)
.\scripts\manual\stop.ps1     # Detiene sistema
```

### Opción 2: Auto-Start en Windows Boot (Recomendado para demo/testing)
```powershell
# Ejecutar PowerShell como Administrador
.\scripts\services\install-all-services.ps1      # Instala servicios de Windows
.\scripts\services\uninstall-all-services.ps1    # Desinstala servicios
```

### Opción 3: Utilidades Rápidas
```batch
# Nginx
.\scripts\utils\nginx\configure-nginx.bat        # Configurar Nginx en PC nueva
.\scripts\utils\nginx\force-restart-nginx.bat    # Reinicio forzado de Nginx

# Logs
.\scripts\utils\logs\view-logs.bat               # Ver logs en tiempo real
.\scripts\utils\logs\view-backend-logs.bat       # Ver solo logs del backend

# Mantenimiento
.\scripts\utils\maintenance\restart-services.bat # Reinicia servicios
.\scripts\utils\maintenance\kill-locks.bat       # Elimina locks de Next.js

# Ngrok (Acceso Remoto)
.\scripts\utils\ngrok\share-with-ngrok.bat       # Compartir app remotamente
.\scripts\utils\ngrok\stop-ngrok.bat             # Detener tunnel
```

---

## 📋 Scripts por Categoría

### 📂 manual/ - Desarrollo Manual

| Script | Descripción | Uso |
|--------|-------------|-----|
| `start.ps1` | Inicia Nginx + Monorepo manualmente | `.\scripts\manual\start.ps1` |
| `stop.ps1` | Detiene Nginx + Monorepo | `.\scripts\manual\stop.ps1` |

**Características**:
- ✅ Limpia puertos 3000 y 4000 automáticamente
- ✅ Inicia Nginx en background
- ✅ Inicia Frontend (Next.js) y Backend (NestJS) en foreground
- ✅ Health check automático
- ✅ Logs visibles en consola
- ✅ Hot-reload de Next.js y NestJS funciona perfectamente

---

### 📂 services/ - Servicios de Windows

| Script | Descripción | Admin | Uso |
|--------|-------------|-------|-----|
| `install-all-services.ps1` | Instala TODO como servicios de Windows | ✅ | `.\scripts\services\install-all-services.ps1` |
| `install-nginx-service.ps1` | Instala solo Nginx como servicio | ✅ | `.\scripts\services\install-nginx-service.ps1` |
| `install-monorepo-service.ps1` | Instala solo Monorepo como servicio | ✅ | `.\scripts\services\install-monorepo-service.ps1` |
| `uninstall-all-services.ps1` | Desinstala todos los servicios | ✅ | `.\scripts\services\uninstall-all-services.ps1` |

**Características**:
- ✅ Auto-start al encender Windows
- ✅ Nginx y Monorepo como servicios de Windows
- ✅ Logs en archivos (.\logs\monorepo-service.log)
- ✅ Gestión con comandos de Windows (Get-Service, Start-Service, etc.)
- ✅ Hot-reload sigue funcionando
- ✅ Dependencias configuradas (Monorepo espera a Nginx)

---

### 📂 utils/ - Utilidades Organizadas

#### utils/nginx/ - Configuración de Nginx

| Script | Descripción | Uso |
|--------|-------------|-----|
| `configure-nginx.bat` | Configura Nginx en PC nueva | `.\scripts\utils\nginx\configure-nginx.bat` |
| `force-restart-nginx.bat` | Reinicia Nginx forzadamente | `.\scripts\utils\nginx\force-restart-nginx.bat` |
| `restart-for-ngrok.bat` | Reinicia Nginx con config para ngrok | `.\scripts\utils\nginx\restart-for-ngrok.bat` |
| `apply-ngrok-config.bat` | Aplica configuración de ngrok | `.\scripts\utils\nginx\apply-ngrok-config.bat` |

#### utils/ngrok/ - Acceso Remoto

| Script | Descripción | Uso |
|--------|-------------|-----|
| `share-with-ngrok.bat` | Comparte app vía tunnel público | `.\scripts\utils\ngrok\share-with-ngrok.bat` |
| `share-with-ngrok-test.bat` | Test de configuración ngrok | `.\scripts\utils\ngrok\share-with-ngrok-test.bat` |
| `stop-ngrok.bat` | Detiene el tunnel de ngrok | `.\scripts\utils\ngrok\stop-ngrok.bat` |
| `get-ngrok-url.ps1` | Obtiene URL de ngrok activo | `.\scripts\utils\ngrok\get-ngrok-url.ps1` |
| `test-ngrok.ps1` | Test completo de ngrok | `.\scripts\utils\ngrok\test-ngrok.ps1` |

**Ngrok - Acceso Remoto**: Ver [documentación completa](../docs/dev/NGROK.md) para setup y troubleshooting

#### utils/logs/ - Visualización de Logs

| Script | Descripción | Uso |
|--------|-------------|-----|
| `view-logs.bat` | Ver logs de todos los servicios | `.\scripts\utils\logs\view-logs.bat` |
| `view-backend-logs.bat` | Ver solo logs del backend | `.\scripts\utils\logs\view-backend-logs.bat` |

#### utils/maintenance/ - Mantenimiento del Sistema

| Script | Descripción | Uso |
|--------|-------------|-----|
| `restart-services.bat` | Reinicia todos los servicios | `.\scripts\utils\maintenance\restart-services.bat` |
| `kill-locks.bat` | Elimina locks de Next.js | `.\scripts\utils\maintenance\kill-locks.bat` |
| `restart-and-debug.bat` | Reinicia con modo debug | `.\scripts\utils\maintenance\restart-and-debug.bat` |
| `check-services.ps1` | Verifica estado de servicios | `.\scripts\utils\maintenance\check-services.ps1` |

---

## 🌐 Acceso Remoto con Ngrok

### Configuración Inicial (una sola vez)

1. **Obtener cuenta de ngrok**
   - Registrarse en https://ngrok.com
   - Copiar tu authtoken desde https://dashboard.ngrok.com/get-started/your-authtoken

2. **Configurar authtoken**
   ```powershell
   ngrok config add-authtoken TU_AUTHTOKEN_AQUI
   ```

3. **Configurar variables de entorno**
   - Backend: En `apps/backend/.env` agregar:
     ```env
     ALLOW_NGROK=true
     ```
   - Frontend: En `apps/frontend/.env.local` verificar:
     ```env
     NEXT_PUBLIC_API_URL=/api/v1
     ```

4. **Reiniciar servicios**
   ```powershell
   .\scripts\utils\restart-services.bat
   ```

### Uso

```batch
# Compartir app remotamente
.\scripts\utils\ngrok\share-with-ngrok.bat

# Obtener URL (si ya está corriendo)
.\scripts\utils\ngrok\get-ngrok-url.ps1

# Detener acceso remoto
.\scripts\utils\ngrok\stop-ngrok.bat
```

### Cómo Funciona

1. El script crea un túnel HTTPS desde tu localhost al dominio público de ngrok
2. Nginx está configurado para manejar las cabeceras de proxy correctamente
3. Las cookies de autenticación funcionan con `SameSite=None; Secure`
4. Frontend usa URLs relativas para funcionar tanto local como remotamente

**Documentación completa**: [docs/dev/NGROK.md](../docs/dev/NGROK.md)

---

## 🎯 Casos de Uso

### PC Nueva o Reinstalación

**Pasos para configurar en PC nueva:**

1. **Instalar Nginx**
   - Descarga desde http://nginx.org/en/download.html
   - Extrae en `C:\nginx`

2. **Configurar Nginx**
   ```batch
   .\scripts\utils\nginx\configure-nginx.bat
   ```

3. **Configurar hosts file** (como Administrador)
   - Abre: `C:\Windows\System32\drivers\etc\hosts`
   - Agrega: `127.0.0.1       aligndesigns-platform.local`

4. **Instalar servicios** (opcional)
   ```powershell
   .\scripts\services\install-all-services.ps1
   ```

5. **O iniciar manualmente**
   ```powershell
   .\scripts\manual\start.ps1
   ```

---

## 📍 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Acceso directo Next.js |
| Backend | http://localhost:4000 | Acceso directo NestJS |
| Backend Health | http://localhost:4000/api/v1/health | Health check endpoint |
| **Domain (Nginx)** | **http://aligndesigns-platform.local** | **Acceso unificado** ⭐ |

---

## 💡 Notas Importantes

1. **Hot Reload**: Funciona en AMBOS (Frontend + Backend) tanto en modo manual como servicios.

2. **Logs**:
   - Con servicios → logs van a archivos (`.\logs\monorepo-service.log`)
   - Con manual → logs van a consola
   - Usa `.\scripts\utils\logs\view-logs.bat` para ver en tiempo real

3. **Orden de Inicio**: El servicio Monorepo espera a que Nginx inicie primero.

4. **Organización**: Los scripts en `utils/` están organizados por categoría (nginx/, ngrok/, logs/, maintenance/) para facilitar su búsqueda.

---

## 🤝 Soporte

Si tienes problemas:
1. Verifica los requisitos están instalados
2. Usa `.\scripts\utils\view-logs.bat` para ver logs
3. Asegúrate de ejecutar como Administrador cuando sea necesario
