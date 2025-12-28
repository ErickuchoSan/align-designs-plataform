# Nginx Configuration - Align Designs Platform

Esta configuración permite acceder a toda la aplicación mediante un solo dominio local: **`http://aligndesigns-platform.local`**

## 🎯 Ventajas de usar Nginx

- ✅ Un solo dominio para todo (no más `localhost:3000`, `localhost:4000`)
- ✅ Simula el entorno de producción
- ✅ Evita problemas de CORS
- ✅ Manejo profesional de uploads grandes (hasta 2GB)
- ✅ Soporte para WebSockets y Hot Module Replacement

## 📁 Archivos incluidos

- `aligndesigns-platform.conf` - Configuración de Nginx
- `setup-hosts.bat` - Script para configurar el archivo hosts (requiere Admin)
- `README.md` - Este archivo

## 🚀 Instalación y Configuración

### Paso 1: Configurar el archivo hosts

**Opción A - Automática (Recomendada):**

1. Haz clic derecho en `setup-hosts.bat`
2. Selecciona "Ejecutar como administrador"
3. Confirma la acción

**Opción B - Manual:**

1. Abre el archivo `C:\Windows\System32\drivers\etc\hosts` como administrador
2. Agrega estas líneas al final:

```
127.0.0.1       aligndesigns-platform.local
::1             aligndesigns-platform.local
```

3. Guarda el archivo

### Paso 2: Configurar Nginx

1. **Localiza tu instalación de Nginx**
   - Ejemplo: `C:\nginx\conf\`
   - O: `C:\Program Files\nginx\conf\`

2. **Copia el archivo de configuración**
   - Copia `aligndesigns-platform.conf`
   - Pégalo en la carpeta `conf` de Nginx

3. **Incluye la configuración en nginx.conf**

   Abre `nginx.conf` y dentro del bloque `http { }`, agrega:

   ```nginx
   http {
       # ... otras configuraciones ...

       # Incluir configuraciones de sitios
       include aligndesigns-platform.conf;
   }
   ```

4. **Verifica la configuración**

   ```bash
   nginx -t
   ```

5. **Reinicia Nginx**

   ```bash
   nginx -s reload
   ```

   O si no está corriendo:

   ```bash
   start nginx
   ```

### Paso 3: Actualizar variables de entorno

Los archivos `.env` ya fueron actualizados automáticamente con:

**Backend** (`apps/backend/.env`):
```env
FRONTEND_URL=http://aligndesigns-platform.local
ALLOWED_ORIGINS=http://aligndesigns-platform.local
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://aligndesigns-platform.local/api
```

### Paso 4: Iniciar los servicios

```bash
# Desde la raíz del proyecto
scripts\start-dev.bat
```

### Paso 5: Acceder a la aplicación

Abre tu navegador y ve a: **http://aligndesigns-platform.local**

## 🌐 Rutas configuradas

| Ruta | Destino | Descripción |
|------|---------|-------------|
| `http://aligndesigns-platform.local/` | Frontend (Next.js) | Aplicación principal |
| `http://aligndesigns-platform.local/api/*` | Backend (NestJS) | API REST |
| `http://aligndesigns-platform.local/health` | Backend | Health check |
| `http://aligndesigns-platform.local/metrics` | Backend | Métricas de Prometheus |

## 🔧 Comandos útiles de Nginx

### Windows:

```bash
# Iniciar Nginx
start nginx

# Detener Nginx
nginx -s stop

# Recargar configuración
nginx -s reload

# Verificar configuración
nginx -t

# Ver procesos de Nginx
tasklist /fi "imagename eq nginx.exe"
```

## 🐛 Troubleshooting

### Error: "nginx: [emerg] bind() to 0.0.0.0:80 failed"

**Problema:** El puerto 80 ya está en uso

**Solución:**
1. Verifica qué proceso usa el puerto 80:
   ```bash
   netstat -ano | findstr :80
   ```
2. Detén el proceso o cambia el puerto en la configuración

### Error: "upstream timed out"

**Problema:** Backend o Frontend no están corriendo

**Solución:**
1. Verifica que los servicios estén corriendo:
   ```bash
   netstat -ano | findstr ":3000 :4000"
   ```
2. Inicia los servicios:
   ```bash
   scripts\start-dev.bat
   ```

### No puedo acceder al dominio

**Problema:** DNS no resuelve el dominio local

**Solución:**
1. Verifica que el archivo hosts tiene la entrada:
   ```bash
   type C:\Windows\System32\drivers\etc\hosts | findstr aligndesigns
   ```
2. Limpia el cache de DNS:
   ```bash
   ipconfig /flushdns
   ```

### Hot Module Replacement no funciona

**Problema:** Los cambios no se reflejan automáticamente

**Solución:**
- Verifica que la configuración de WebSocket esté habilitada en Nginx (ya incluida)
- Reinicia el frontend:
  ```bash
  scripts\stop-dev.bat
  scripts\start-dev.bat
  ```

## 📝 Notas importantes

- El dominio solo funciona en tu máquina local
- Si necesitas acceder desde otra máquina en la red, usa tu IP local en lugar de `127.0.0.1`
- En producción, configurarás un dominio real con HTTPS
- Los logs de Nginx se guardan en `nginx/logs/`

## 🔄 Actualizar configuración

Si modificas `aligndesigns-platform.conf`:

1. Guarda los cambios
2. Verifica: `nginx -t`
3. Recarga: `nginx -s reload`

## 🗑️ Desinstalar

Para remover la configuración:

1. Elimina la línea del archivo hosts
2. Elimina `aligndesigns-platform.conf` de la carpeta conf de Nginx
3. Recarga Nginx: `nginx -s reload`
