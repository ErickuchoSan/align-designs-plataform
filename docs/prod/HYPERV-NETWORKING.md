# Configuración de Red Hyper-V

## Resumen

Este documento detalla la configuración de red de Hyper-V para el proyecto Align Designs Demo, incluyendo el problema encontrado con NAT-Internal y la solución implementada con External Switch.

---

## Problema Original

### Síntoma

El backend NestJS en Windows no podía conectarse a MinIO en la VM de Hyper-V:

```
Error: connect ECONNREFUSED 192.168.100.10:9000
Error: connect ETIMEDOUT 172.24.215.214:9000
```

### Diagnóstico

1. **Ping funcionaba**:
   ```powershell
   ping 192.168.100.10
   # Reply from 192.168.100.10: bytes=32 time<1ms TTL=64
   ```

2. **Puertos TCP bloqueados**:
   ```powershell
   Test-NetConnection -ComputerName 192.168.100.10 -Port 9000
   # TcpTestSucceeded : False
   ```

3. **MinIO respondía dentro de la VM**:
   ```bash
   # Dentro de la VM
   curl http://localhost:9000/minio/health/ready
   # HTTP/1.1 200 OK
   ```

### Causa Raíz

La VM estaba configurada con **"NAT-Internal"** switch en Hyper-V, que:
- ✅ Permite comunicación entre VMs en el mismo switch
- ✅ Permite que la VM acceda a internet a través del host
- ❌ **Bloquea conexiones entrantes desde el host Windows a la VM**
- ❌ No permite acceso a puertos específicos de servicios en la VM

---

## Tipos de Switches en Hyper-V

### 1. External Switch

**Descripción**: Conecta la VM directamente al adaptador de red físico del host.

**Características**:
- ✅ VM obtiene IP de la misma red que el host (DHCP del router)
- ✅ Conectividad bidireccional completa: Host ↔ VM
- ✅ VM accesible desde otros dispositivos en la red local
- ✅ Ideal para desarrollo cuando se necesita acceso desde el host
- ⚠️ La VM está expuesta en la red local

**Ejemplo de IPs**:
```
Host Windows: 192.168.0.92
VM Ubuntu:    YOUR_SERVER_IP
Router:       192.168.0.1
```

**Uso en Align Designs**:
- ✅ **ACTUAL**: Permite al backend en Windows conectar a MinIO en la VM
- ✅ Acceso directo a PostgreSQL desde herramientas como pgAdmin
- ✅ Acceso a consola web de MinIO desde el navegador

### 2. Internal Switch

**Descripción**: Red aislada solo entre VMs y el host.

**Características**:
- ✅ Comunicación entre VMs y el host
- ❌ No acceso a internet (requiere NAT configurado manualmente)
- ✅ Aislado de la red externa
- ✅ Útil para entornos de testing completamente aislados

**Ejemplo de IPs**:
```
Host Windows (vEthernet): 192.168.100.1
VM Ubuntu:                192.168.100.10
```

### 3. NAT Switch (Default Switch / NAT-Internal)

**Descripción**: Red privada con NAT para acceso a internet.

**Características**:
- ✅ VM puede acceder a internet a través del host
- ✅ Aislado de la red local
- ❌ **Host NO puede iniciar conexiones a puertos de la VM**
- ⚠️ Requiere port forwarding para exponer servicios

**Ejemplo de IPs**:
```
Host Windows (NAT gateway): 172.24.208.1
VM Ubuntu:                  172.24.215.214
```

**Problema**: Bloqueaba MinIO y PostgreSQL desde Windows.

### 4. Private Switch

**Descripción**: Red completamente aislada solo entre VMs.

**Características**:
- ✅ Comunicación solo entre VMs
- ❌ Sin acceso al host
- ❌ Sin acceso a internet
- ✅ Máximo aislamiento para entornos de prueba

---

## Solución Implementada: External Switch

### Paso 1: Identificar el Adaptador de Red Físico

```powershell
# Ejecutar en PowerShell como Administrador
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object Name, InterfaceDescription, Status
```

**Salida esperada**:
```
Name                       InterfaceDescription                    Status
----                       --------------------                    ------
vEthernet (Default Switch) Hyper-V Virtual Ethernet Adapter        Up
Ethernet                   Realtek Gaming 2.5GbE Family Controller Up  ← Este
vEthernet (NAT-Internal)   Hyper-V Virtual Ethernet Adapter #4     Up
```

**Usar**: `Ethernet` (el adaptador físico real)

### Paso 2: Crear External Switch

```powershell
# Crear switch conectado al adaptador físico
New-VMSwitch -Name "External-Switch" -NetAdapterName "Ethernet" -AllowManagementOS $true
```

**Parámetros**:
- `-Name`: Nombre del switch (puede ser cualquiera)
- `-NetAdapterName`: Nombre del adaptador físico (de `Get-NetAdapter`)
- `-AllowManagementOS $true`: Permite que Windows también use este adaptador

**⚠️ Advertencia**: La conexión de red puede interrumpirse por unos segundos durante la creación.

**Salida esperada**:
```
Name            SwitchType NetAdapterInterfaceDescription
----            ---------- ------------------------------
External-Switch External   Realtek Gaming 2.5GbE Family Controller
```

### Paso 3: Asignar External Switch a la VM

```powershell
# Conectar VM al nuevo switch
Get-VMNetworkAdapter -VMName 'Ebionix-Software-Design' | Connect-VMNetworkAdapter -SwitchName 'External-Switch'
```

**Verificar**:
```powershell
Get-VMNetworkAdapter -VMName 'Ebionix-Software-Design' | Select-Object VMName, SwitchName, Status

# VMName                  SwitchName       Status
# ------                  ----------       ------
# Ebionix-Software-Design External-Switch  Ok
```

### Paso 4: Obtener Nueva IP en la VM

**Opción 1: Reiniciar interfaz de red** (dentro de la VM):
```bash
sudo dhclient -r eth0
sudo dhclient eth0
```

**Opción 2: Reiniciar la VM** (desde Windows):
```powershell
Restart-VM -Name 'Ebionix-Software-Design'
```

**Verificar nueva IP** (dentro de la VM):
```bash
ip addr show eth0

# Salida esperada:
# 2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
#     inet YOUR_SERVER_IP/24 brd 192.168.0.255 scope global dynamic eth0
```

### Paso 5: Verificar Conectividad

**Desde Windows**:

```powershell
# 1. Ping
ping YOUR_SERVER_IP

# 2. Test de puerto MinIO
Test-NetConnection -ComputerName YOUR_SERVER_IP -Port 9000

# Resultado esperado:
# TcpTestSucceeded : True  ← ¡Éxito!

# 3. Health check de MinIO
curl http://YOUR_SERVER_IP:9000/minio/health/ready

# Resultado esperado:
# HTTP/1.1 200 OK
# Server: MinIO
```

**Desde la VM**:

```bash
# Test de conectividad a internet
ping 8.8.8.8

# Test de DNS
ping google.com
```

### Paso 6: Actualizar Configuración del Backend

**Archivo**: `backend/.env`

```bash
# Cambiar de:
MINIO_ENDPOINT=localhost  # o 172.24.215.214 o 192.168.100.10

# A:
MINIO_ENDPOINT=YOUR_SERVER_IP

# Verificar también:
MINIO_PORT=9000
MINIO_USE_SSL=false
```

**Reiniciar backend**:
```bash
# Si está corriendo, detener con Ctrl+C y:
ppnpm start:dev
```

**Verificar logs**:
```
[StorageService] MinIO client initialized - Endpoint: YOUR_SERVER_IP:9000
[StorageService] Bucket "align-designs" created successfully
```

---

## Alternativas Intentadas (No Funcionaron)

### 1. Port Forwarding con netsh

**Intento**:
```powershell
netsh interface portproxy add v4tov4 `
  listenport=9000 `
  listenaddress=0.0.0.0 `
  connectport=9000 `
  connectaddress=192.168.100.10
```

**Resultado**: Regla creada, pero conexiones fallaban con `ECONNRESET`.

**Razón del fallo**: NAT-Internal bloquea tráfico entrante a nivel del switch virtual, antes de que netsh pueda interceptarlo.

### 2. Hyper-V NAT Static Mapping

**Intento**:
```powershell
Add-NetNatStaticMapping -NatName "NAT-Internal" `
  -Protocol TCP `
  -ExternalIPAddress 0.0.0.0 `
  -ExternalPort 9000 `
  -InternalIPAddress 192.168.100.10 `
  -InternalPort 9000
```

**Resultado**: Regla creada exitosamente, pero `Test-NetConnection` aún fallaba.

**Razón del fallo**: Similar a netsh, el switch NAT-Internal bloquea conexiones entrantes desde el host.

### 3. Túnel SSH

**Intento**:
```bash
ssh -L 9000:localhost:9000 -L 9001:localhost:9001 your_username@192.168.100.10
```

**Resultado**: SSH rechazaba la contraseña desde Windows (aunque funcionaba en consola de Hyper-V).

**Razón del fallo**: Configuración de SSH o posible bloqueo por intentos fallidos previos.

### 4. IP Estática en eth0

**Intento**:
```bash
sudo ip addr add 192.168.100.10/24 dev eth0
```

**Resultado**: Ping funcionaba, pero puertos TCP seguían bloqueados.

**Razón del fallo**: El problema no era la IP, sino el tipo de switch (NAT-Internal).

---

## Configuración Actual

### Red del Host (Windows)

```
Adaptador: Ethernet (Realtek Gaming 2.5GbE)
IP: 192.168.0.92
Máscara: 255.255.255.0
Gateway: 192.168.0.1 (Router)
DNS: Automático (del router)
```

### Red de la VM (Ubuntu)

```
Adaptador: eth0
Switch: External-Switch
IP: YOUR_SERVER_IP (DHCP)
Máscara: 255.255.255.0
Gateway: 192.168.0.1
DNS: 8.8.8.8, 8.8.4.4 (configurado en /etc/netplan/)
```

### Puertos Accesibles desde Windows

| Servicio      | Puerto | URL/Comando                              |
|---------------|--------|------------------------------------------|
| SSH           | 22     | `ssh your_username@YOUR_SERVER_IP`                |
| PostgreSQL    | 5432   | `psql -h YOUR_SERVER_IP -U your_app_user`       |
| MinIO API     | 9000   | `http://YOUR_SERVER_IP:9000`              |
| MinIO Console | 9001   | `http://YOUR_SERVER_IP:9001`              |

---

## Troubleshooting

### Problema: IP de la VM cambió después de reinicio

**Causa**: DHCP asignó una IP diferente.

**Solución 1 - IP Estática en la VM**:

Editar `/etc/netplan/00-installer-config.yaml`:

```yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - YOUR_SERVER_IP/24
      gateway4: 192.168.0.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

Aplicar:
```bash
sudo netplan apply
```

**Solución 2 - Reserva DHCP en el Router**:

1. Acceder a configuración del router (ejemplo: http://192.168.0.1)
2. Buscar sección "DHCP Reservation" o "Static Lease"
3. Asignar IP YOUR_SERVER_IP a la MAC de la VM
4. Guardar y reiniciar router si es necesario

Para obtener la MAC:
```bash
ip link show eth0
# link/ether 00:15:5d:xx:xx:xx
```

### Problema: No puedo hacer ping a la VM

**Verificaciones**:

1. **VM encendida**:
   ```powershell
   Get-VM -Name 'Ebionix-Software-Design' | Select-Object State
   # State debe ser "Running"
   ```

2. **Switch correcto**:
   ```powershell
   Get-VMNetworkAdapter -VMName 'Ebionix-Software-Design' | Select-Object SwitchName
   # SwitchName debe ser "External-Switch"
   ```

3. **IP de la VM**:
   Conectar vía consola de Hyper-V y ejecutar:
   ```bash
   ip addr show eth0 | grep "inet "
   ```

4. **Firewall de Windows**:
   ```powershell
   # Verificar si el firewall está bloqueando ICMP
   Test-NetConnection -ComputerName YOUR_SERVER_IP -InformationLevel Detailed
   ```

### Problema: Puerto 9000 no responde

**Verificaciones**:

1. **Contenedor MinIO corriendo**:
   ```bash
   sudo docker ps | grep minio
   # Debe mostrar "Up"
   ```

2. **Puerto expuesto en Docker**:
   ```bash
   sudo docker port your_minio_user-minio
   # 9000/tcp -> 0.0.0.0:9000
   # 9001/tcp -> 0.0.0.0:9001
   ```

3. **MinIO escuchando**:
   ```bash
   sudo ss -tlnp | grep 9000
   # LISTEN 0 4096 *:9000 *:*
   ```

4. **Logs de MinIO**:
   ```bash
   sudo docker logs your_minio_user-minio --tail 50
   ```

5. **Comando correcto en compose.yml**:
   ```yaml
   command: server /data --address ":9000" --console-address ":9001"
   #                      ^^^^^^^^^^^^^^^^^^  ← Importante
   ```

### Problema: Backend dice ECONNREFUSED

1. **Verificar MINIO_ENDPOINT en backend/.env**:
   ```bash
   MINIO_ENDPOINT=YOUR_SERVER_IP  # IP correcta de la VM
   ```

2. **Reiniciar backend** después de cambiar .env:
   ```bash
   # Detener (Ctrl+C) y reiniciar:
   ppnpm start:dev
   ```

3. **Verificar logs del backend**:
   ```
   [StorageService] MinIO client initialized - Endpoint: YOUR_SERVER_IP:9000
   ```

---

## Comandos Útiles

### Hyper-V (PowerShell como Admin)

```powershell
# Listar VMs
Get-VM

# Ver estado de red de una VM
Get-VMNetworkAdapter -VMName 'Ebionix-Software-Design' | Format-List

# Listar switches virtuales
Get-VMSwitch | Select-Object Name, SwitchType, NetAdapterInterfaceDescription

# Cambiar switch de una VM
Connect-VMNetworkAdapter -VMName 'Ebionix-Software-Design' -SwitchName 'External-Switch'

# Ver IP asignada a adaptadores virtuales
Get-NetIPAddress | Where-Object {$_.InterfaceAlias -like "vEthernet*"} | Select-Object InterfaceAlias, IPAddress

# Eliminar un switch (¡CUIDADO! - desconecta VMs)
Remove-VMSwitch -Name "NAT-Internal"
```

### Networking (Windows)

```powershell
# Test de ping
ping YOUR_SERVER_IP

# Test de puerto TCP
Test-NetConnection -ComputerName YOUR_SERVER_IP -Port 9000

# Ver ruta a la VM
tracert YOUR_SERVER_IP

# Ver tabla ARP (MAC addresses)
arp -a | findstr "YOUR_SERVER_IP"

# Limpiar caché DNS
ipconfig /flushdns
```

### Networking (VM - Ubuntu)

```bash
# Ver configuración de red
ip addr show

# Ver ruta por defecto
ip route show

# Test de conectividad
ping 192.168.0.92  # Host Windows
ping 8.8.8.8       # Internet

# Ver puertos escuchando
sudo ss -tlnp

# Ver conexiones activas
sudo ss -tnp

# Reiniciar red
sudo systemctl restart networking
```

---

## Mejores Prácticas

### 1. Documentar la IP de la VM

Mantener actualizado `docs/ACCESS.md` y `backend/.env` cuando la IP cambie.

### 2. Usar IP Reservada en DHCP

Configurar reserva DHCP en el router para evitar que la IP cambie.

### 3. Nombrar Switches Descriptivamente

- ✅ `External-Switch` (claro)
- ❌ `Switch1` (confuso)

### 4. Verificar Conectividad Antes de Desarrollar

```bash
# Script de verificación
curl -f http://YOUR_SERVER_IP:9000/minio/health/ready && echo "✅ MinIO OK" || echo "❌ MinIO Failed"
psql -h YOUR_SERVER_IP -U your_app_user -d AlignDesignsPlatform -c "SELECT 1;" && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL Failed"
```

### 5. Snapshot Antes de Cambios de Red

```powershell
Checkpoint-VM -Name 'Ebionix-Software-Design' -SnapshotName "Pre-Network-Change-$(Get-Date -Format 'yyyyMMdd-HHmm')"
```

### 6. Firewall en la VM (Producción)

En desarrollo, el firewall (ufw) está deshabilitado para facilitar testing. En producción:

```bash
# Habilitar firewall
sudo ufw enable

# Permitir solo puertos necesarios
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 5432/tcp   # PostgreSQL
sudo ufw allow 9000:9001/tcp # MinIO

# Ver reglas
sudo ufw status verbose
```

---

## Referencias

- [Hyper-V Networking Documentation](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/plan/plan-hyper-v-networking-in-windows-server)
- [Hyper-V Virtual Switch](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/create-a-virtual-switch-for-hyper-v-virtual-machines)
- [NAT Network in Hyper-V](https://learn.microsoft.com/en-us/virtualization/hyper-v-on-windows/user-guide/setup-nat-network)

---

## Historial de Cambios

| Fecha | Cambio | Razón |
|-------|--------|-------|
| 2025-11-16 | Migración de NAT-Internal a External-Switch | Resolver ECONNREFUSED en conexiones Windows → VM |
| 2025-11-16 | IP actualizada: 172.24.215.214 → YOUR_SERVER_IP | Nueva asignación DHCP con External Switch |
| 2025-11-16 | Actualizado backend/.env con nueva IP | Conectividad de NestJS a MinIO |

---

✅ **Estado Actual**: Configuración estable y funcional para desarrollo.
