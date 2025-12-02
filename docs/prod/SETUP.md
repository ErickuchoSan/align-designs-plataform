# Guía Completa de Instalación y Configuración

Esta guía documenta todo el proceso de creación de la infraestructura para el proyecto Align Designs Demo.

## Tabla de Contenidos

1. [Creación de la Máquina Virtual](#1-creación-de-la-máquina-virtual)
2. [Instalación de Ubuntu Server](#2-instalación-de-ubuntu-server)
3. [Instalación de Docker](#3-instalación-de-docker)
4. [Configuración de Base de Datos](#4-configuración-de-base-de-datos)
5. [Verificación](#5-verificación)

---

## 1. Creación de la Máquina Virtual

### Script Automatizado

El proyecto incluye un script PowerShell que automatiza la creación de la VM en Hyper-V:

**Ubicación:** `align-designs-platform/infra/scripts/hyperv-create-vm.ps1`

### Ejecución

```powershell
powershell -ExecutionPolicy Bypass -File "d:\Desarrollos\Align Designs\align-designs-platform\infra\scripts\hyperv-create-vm.ps1"
```

### Lo que hace el script

1. **Crea directorios:**
   - `D:\VMs\Ebionix-Software-Design\` - Carpeta de la VM
   - `D:\ISOs\` - Carpeta para el ISO de Ubuntu

2. **Descarga Ubuntu Server:**
   - Intenta descargar Ubuntu 24.04.1 LTS Server
   - URLs de respaldo: 24.04.2 y 22.04.5
   - Guarda en: `D:\ISOs\ubuntu-24.04.1-live-server-amd64.iso`
   - Tamaño: ~2 GB

3. **Crea la VM con:**
   - Nombre: `Ebionix-Software-Design`
   - Generación: 2 (UEFI)
   - RAM: 6 GB
   - CPU: 2 vCPUs
   - Disco: 80 GB (dinámico)
   - Red: Conmutador externo o Default Switch

4. **Configura el boot:**
   - Adjunta el ISO como DVD virtual
   - Configura Secure Boot (Microsoft UEFI CA)
   - Establece el DVD como primer dispositivo de arranque

5. **Inicia la VM** automáticamente

### Proceso Manual (si el script falla)

Si necesitas crear la VM manualmente:

1. Abre **Hyper-V Manager**
2. Acción → Nueva → Máquina Virtual
3. Sigue el asistente con estos valores:
   - Generación: **2**
   - Memoria: **6144 MB** (6 GB)
   - Red: Selecciona tu conmutador
   - Disco: **80 GB** (dinámico)
4. Antes de iniciar, configura:
   - Procesador: **2 vCPUs**
   - DVD: Adjunta el ISO de Ubuntu
   - Firmware: Secure Boot ON, orden de arranque DVD primero

---

## 2. Instalación de Ubuntu Server

### Acceso a la consola

```powershell
vmconnect localhost 'Ebionix-Software-Design'
```

### Proceso de Instalación

#### Paso 1: Idioma y Teclado
- **Idioma:** English
- **Teclado:** Spanish (o el que prefieras)

#### Paso 2: Tipo de Instalación
- Selecciona: **Ubuntu Server** (no minimized)
- NO marques "Search for third-party drivers"

#### Paso 3: Configuración de Red
- **Automática (DHCP)** - La VM recibe una IP del conmutador
- IP asignada: `YOUR_SERVER_IP` (puede variar según tu red)
- ✅ Anota la IP que se muestra

#### Paso 4: Proxy y Mirror
- Proxy: Dejar en blanco
- Mirror: Dejar por defecto

#### Paso 5: Almacenamiento
- Selecciona: **Use an entire disk**
- Marca: **Set up this disk as an LVM group**
- NO marques: "Encrypt the LVM group with LUKS"

Configuración resultante:
```
/ (raíz)      38.47 GB  ext4 en LVM
/boot         2.0 GB    ext4
/boot/efi     1.0 GB    fat32 (UEFI)
LVM libre     38.47 GB  (para futuro crecimiento)
```

#### Paso 6: Perfil del Sistema
```
Your name:              Erick
Server name:            Ebionix-Software-Design
Username:               your_username  (minúscula)
Password:               YOUR_VM_PASSWORD
Confirm password:       YOUR_VM_PASSWORD
```

⚠️ **IMPORTANTE:** El username se crea en minúsculas automáticamente

#### Paso 7: Ubuntu Pro
- Selecciona: **Skip for now**

#### Paso 8: SSH Setup
- ✅ Marca: **Install OpenSSH server**
- ✅ Puede marcar: "Allow password authentication over SSH"
- NO importes SSH keys

#### Paso 9: Featured Server Snaps
- **NO selecciones ninguno** - Instalaremos Docker manualmente

#### Paso 10: Instalación
- Confirma y espera 5-10 minutos
- Cuando termine, el instalador te pedirá reiniciar

### Post-Instalación

#### Remover el ISO

Después de la instalación, remueve el ISO para que la VM arranque desde el disco:

```powershell
# Remover DVD
Get-VMDvdDrive -VMName 'Ebionix-Software-Design' | Remove-VMDvdDrive

# Reiniciar VM
Restart-VM -Name 'Ebionix-Software-Design' -Force
```

#### Primer Login

En la consola de la VM:
```
Username: your_username
Password: YOUR_VM_PASSWORD
```

#### Obtener la IP

Una vez dentro:
```bash
ip addr show
# Busca la línea con inet (ejemplo): inet YOUR_SERVER_IP/24
```

---

## 3. Instalación de Docker

### Opción A: Script Automatizado (Recomendado)

Desde tu Windows, ejecuta:

```bash
# Copiar carpeta infra a la VM
scp -r "d:\Desarrollos\Align Designs\align-designs-platform\infra" your_username@YOUR_SERVER_IP:~/

# Conectarse por SSH
ssh your_username@YOUR_SERVER_IP

# En la VM, ejecutar el script
bash ~/infra/scripts/bootstrap-ubuntu.sh
```

### Opción B: Instalación Manual

Si el script automático falla, instala manualmente:

```bash
# 1. Actualizar paquetes
sudo apt update
sudo apt install -y ca-certificates curl gnupg

# 2. Agregar GPG key de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 3. Agregar repositorio de Docker
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 5. Agregar usuario al grupo docker
sudo usermod -aG docker your_username

# 6. Verificar instalación
sudo docker --version
sudo docker compose version
```

### Verificación

```bash
sudo docker run hello-world
```

Deberías ver: "Hello from Docker!"

---

## 4. Configuración de Base de Datos

### Estructura de Archivos

```
infra/
├── .env                          # Variables de entorno (credenciales)
├── compose.yml                   # Docker Compose config
└── db/
    └── postgres/
        ├── Dockerfile            # Build custom de Postgres
        └── init/
            ├── 01-init.sql       # Crea DB, schema y extensiones
            └── 02-user.sql       # Crea usuario your_app_user y permisos
```

### Variables de Entorno

El archivo `infra/.env` contiene:

```env
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
MINIO_USER=your_minio_user
MINIO_PASSWORD=YOUR_MINIO_PASSWORD
DB_APP_USER=your_app_user
DB_APP_PASSWORD=YOUR_APP_PASSWORD
```

### Levantar Contenedores

Desde la VM:

```bash
cd ~/infra

# Construir imágenes
sudo docker compose build

# Levantar contenedores
sudo docker compose up -d

# Verificar que estén corriendo
sudo docker ps
```

Deberías ver:
```
CONTAINER ID   IMAGE                COMMAND                  STATUS          PORTS
...            minio/minio:latest   ...                      Up              0.0.0.0:9000-9001->9000-9001/tcp
...            infra-db             ...                      Up (healthy)    0.0.0.0:5432->5432/tcp
```

### Inicialización de la Base de Datos

Docker Postgres ejecuta automáticamente los scripts en orden:

#### 1. `01-init.sql` - Crea la estructura base

```sql
-- Crea la base de datos
CREATE DATABASE AlignDesignsPlatform;

-- Conecta a la BD
\c AlignDesignsPlatform

-- Crea el esquema
CREATE SCHEMA IF NOT EXISTS your_minio_user;

-- Instala extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA your_minio_user;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA your_minio_user;
```

#### 2. `02-user.sql` - Crea usuario y permisos

```sql
-- Crea usuario your_app_user
CREATE ROLE "your_app_user" LOGIN PASSWORD 'YOUR_APP_PASSWORD'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

-- Otorga permisos
GRANT USAGE ON SCHEMA your_minio_user TO "your_app_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA your_minio_user TO "your_app_user";
ALTER DEFAULT PRIVILEGES IN SCHEMA your_minio_user
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "your_app_user";
```

### Verificación de la Base de Datos

```bash
# Test de conexión con usuario your_app_user
sudo docker exec your_minio_user-postgres psql -U your_app_user -d AlignDesignsPlatform -c "SELECT current_database(), current_user;"
```

Output esperado:
```
 current_database | current_user
------------------+--------------
 AlignDesignsPlatform | your_app_user
```

---

## 5. Verificación

### Checklist de Servicios

✅ **VM Hyper-V**
```powershell
Get-VM -Name 'Ebionix-Software-Design'
# Estado: Running
```

✅ **SSH Funcional**
```bash
ssh your_username@YOUR_SERVER_IP
```

✅ **Docker Instalado**
```bash
ssh your_username@YOUR_SERVER_IP "docker --version"
# Docker version 29.0.1
```

✅ **Contenedores Corriendo**
```bash
ssh your_username@YOUR_SERVER_IP "sudo docker ps"
# 2 contenedores: your_minio_user-postgres y your_minio_user-minio
```

✅ **PostgreSQL Accesible**

Desde Windows (si tienes psql instalado):
```bash
psql -h YOUR_SERVER_IP -U your_app_user -d AlignDesignsPlatform -c "SELECT 1;"
```

O desde pgAdmin:
- Host: `YOUR_SERVER_IP`
- Port: `5432`
- Database: `AlignDesignsPlatform`
- Username: `your_app_user`
- Password: `YOUR_APP_PASSWORD`

✅ **MinIO Accesible**

Abre en navegador: http://YOUR_SERVER_IP:9001
- Usuario: `your_minio_user`
- Contraseña: `YOUR_MINIO_PASSWORD`

---

## Solución de Problemas Comunes

### La VM no arranca desde el disco

```powershell
# Verifica el orden de arranque
Get-VMFirmware -VMName 'Ebionix-Software-Design' | Select-Object -ExpandProperty BootOrder

# Debería mostrar el disco duro primero después de remover el ISO
```

### No puedo conectarme por SSH

1. Verifica que la VM tenga IP:
```bash
# En la consola de la VM
ip addr show eth0
```

2. Verifica que SSH esté corriendo:
```bash
sudo systemctl status ssh
```

3. Prueba conectividad desde Windows:
```powershell
Test-NetConnection -ComputerName YOUR_SERVER_IP -Port 22
```

### Los contenedores no inician

```bash
# Ver logs de Postgres
sudo docker logs your_minio_user-postgres

# Ver logs de MinIO
sudo docker logs your_minio_user-minio

# Recrear desde cero
cd ~/infra
sudo docker compose down -v
sudo docker compose up -d
```

### Error "role your_app_user does not exist"

Esto significa que los scripts de init no se ejecutaron correctamente. Solución:

```bash
# Eliminar volúmenes y recrear
cd ~/infra
sudo docker compose down -v
sudo docker compose build --no-cache
sudo docker compose up -d
```

---

## Siguientes Pasos

Una vez completada la infraestructura:

1. ✅ Verificar conexión con pgAdmin
2. ⏭️ Desarrollar el backend NestJS
3. ⏭️ Desarrollar el frontend Next.js
4. ⏭️ Configurar despliegue

Ver [DEVELOPMENT.md](./DEVELOPMENT.md) para continuar con el desarrollo del backend y frontend.
