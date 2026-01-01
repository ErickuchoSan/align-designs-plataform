# MinIO - Almacenamiento de Archivos

## Descripción General

MinIO es un servidor de almacenamiento de objetos compatible con Amazon S3, utilizado en el proyecto Align Designs Demo para almacenar archivos subidos por administradores y clientes.

## ¿Por qué MinIO?

### Ventajas sobre Almacenamiento Local

1. **Escalabilidad**: Fácil de escalar horizontalmente cuando el proyecto crezca
2. **API Estándar S3**: Compatible con el ecosistema AWS, facilitando migración futura
3. **Separación de Responsabilidades**: El almacenamiento está desacoplado del backend
4. **Desarrollo/Producción**: Misma API en desarrollo y producción (a diferencia del sistema de archivos local)
5. **Gestión de URLs**: Generación automática de URLs firmadas temporales para descargas seguras
6. **Metadatos**: Almacena información adicional sobre archivos (tipo MIME, tamaño, etc.)
7. **Replicación y Backup**: Políticas de replicación y backup integradas

### Casos de Uso en Align Designs

- Almacenamiento de archivos de proyectos (.zip, .pdf, .docx, imágenes, etc.)
- Generación de URLs temporales de descarga (15 minutos de validez)
- Organización por proyecto con prefijos jerárquicos
- Eliminación controlada de archivos con verificación de permisos

---

## Arquitectura

```
┌────────────────────────────────────────────────────────────────┐
│                      Windows Host (Tu PC)                       │
│                                                                 │
│  ┌─────────────┐         ┌─────────────────┐                  │
│  │  Backend    │         │    Browser       │                  │
│  │  NestJS     │         │  (Frontend)      │                  │
│  │  :4000      │         │  :3000           │                  │
│  └──────┬──────┘         └────────┬─────────┘                  │
│         │                         │                            │
│         │ HTTP requests           │ Upload/Download            │
│         │ (MinIO Client)          │ files via API              │
└─────────┼─────────────────────────┼────────────────────────────┘
          │                         │
          │                         │
          ▼                         ▼
    ┌─────────────────────────────────────────────────────┐
    │              Hyper-V VM (YOUR_SERVER_IP)             │
    │                                                     │
    │  ┌──────────────────────────────────────────────┐  │
    │  │         Docker Container: MinIO              │  │
    │  │                                              │  │
    │  │  Port 9000 (S3 API) ◄─────── Backend        │  │
    │  │  Port 9001 (Web Console) ◄── Browser        │  │
    │  │                                              │  │
    │  │  ┌────────────────────────────────────────┐ │  │
    │  │  │  Bucket: align-designs                 │ │  │
    │  │  │                                        │ │  │
    │  │  │  /projects/{projectId}/                │ │  │
    │  │  │    ├── {uuid}.zip                      │ │  │
    │  │  │    ├── {uuid}.pdf                      │ │  │
    │  │  │    └── {uuid}.jpg                      │ │  │
    │  │  │                                        │ │  │
    │  │  └────────────────────────────────────────┘ │  │
    │  │                                              │  │
    │  │  Volume: minio_data (/data)                 │  │
    │  └──────────────────────────────────────────────┘  │
    │                                                     │
    └─────────────────────────────────────────────────────┘
```

---

## Configuración

### Docker Compose

**Archivo**: `infra/compose.yml`

```yaml
storage:
  image: minio/minio:latest
  container_name: your_minio_user-minio
  command: server /data --address ":9000" --console-address ":9001"
  environment:
    MINIO_ROOT_USER: ${MINIO_USER}
    MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
  ports:
    - "9000:9000"   # API S3
    - "9001:9001"   # Consola Web
  volumes:
    - minio_data:/data
```

### Variables de Entorno

**Archivo**: `infra/.env` (en la VM)

```bash
MINIO_USER=your_minio_user
MINIO_PASSWORD=YOUR_MINIO_PASSWORD
```

**Archivo**: `backend/.env` (en Windows)

```bash
# MinIO Configuration
MINIO_ENDPOINT=YOUR_SERVER_IP
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_minio_user
MINIO_SECRET_KEY=YOUR_MINIO_PASSWORD
MINIO_USE_SSL=false
MINIO_BUCKET=align-designs
```

---

## Configuración de Red Hyper-V

### Problema Inicial

Originalmente, la VM estaba configurada con **NAT-Internal** switch, lo que bloqueaba el acceso desde el host Windows a los puertos de MinIO.

### Solución: External Switch

Se configuró un **External Switch** en Hyper-V para permitir conectividad completa:

**PowerShell (como Administrador)**:

```powershell
# 1. Ver adaptadores de red disponibles
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object Name, InterfaceDescription, Status

# 2. Crear External Switch
New-VMSwitch -Name "External-Switch" -NetAdapterName "Ethernet" -AllowManagementOS $true

# 3. Asignar a la VM
Get-VMNetworkAdapter -VMName 'Ebionix-Software-Design' | Connect-VMNetworkAdapter -SwitchName 'External-Switch'
```

**Resultado**:
- VM obtiene IP del mismo segmento que el host (ejemplo: YOUR_SERVER_IP)
- Puertos 9000 y 9001 accesibles directamente desde Windows
- Ping y conexiones TCP funcionan sin port forwarding

### Verificación de Conectividad

```powershell
# Test de puerto
Test-NetConnection -ComputerName YOUR_SERVER_IP -Port 9000

# Health check con curl
curl http://YOUR_SERVER_IP:9000/minio/health/ready
```

Respuesta esperada:
```
HTTP/1.1 200 OK
Server: MinIO
```

---

## Uso en el Backend

### Inicialización del Cliente MinIO

**Archivo**: `backend/src/storage/storage.service.ts`

```typescript
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET');

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT'),
      port: parseInt(this.configService.get<string>('MINIO_PORT')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });
  }

  async onModuleInit() {
    // Verificar si el bucket existe
    const exists = await this.minioClient.bucketExists(this.bucketName);

    if (!exists) {
      // Crear bucket si no existe
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      this.logger.log(`Bucket "${this.bucketName}" created successfully`);
    }
  }
}
```

### Subida de Archivos

```typescript
async uploadFile(
  file: Express.Multer.File,
  projectId: string,
): Promise<{ filename: string; storagePath: string }> {
  const fileExtension = file.originalname.split('.').pop();
  const filename = `${uuidv4()}.${fileExtension}`;
  const storagePath = `projects/${projectId}/${filename}`;

  const metaData = {
    'Content-Type': file.mimetype,
    'Original-Name': file.originalname,
  };

  await this.minioClient.putObject(
    this.bucketName,
    storagePath,
    file.buffer,
    file.size,
    metaData,
  );

  return { filename, storagePath };
}
```

**Estructura de Almacenamiento**:

```
align-designs/
└── projects/
    ├── {projectId-1}/
    │   ├── 90e3f534-e774-4d33-9218-a78a44675342.zip
    │   ├── 12abc456-d789-01ef-2345-67890abcdef1.pdf
    │   └── 98765432-abcd-1234-efgh-567890ijklmn.jpg
    └── {projectId-2}/
        └── ...
```

### Generación de URLs de Descarga

```typescript
async getDownloadUrl(storagePath: string): Promise<string> {
  const url = await this.minioClient.presignedGetObject(
    this.bucketName,
    storagePath,
    15 * 60, // 15 minutos
  );
  return url;
}
```

Las URLs generadas tienen el formato:
```
http://YOUR_SERVER_IP:9000/align-designs/projects/{projectId}/{uuid}.zip?
  X-Amz-Algorithm=AWS4-HMAC-SHA256&
  X-Amz-Credential=...&
  X-Amz-Date=...&
  X-Amz-Expires=900&
  X-Amz-SignedHeaders=host&
  X-Amz-Signature=...
```

### Eliminación de Archivos

```typescript
async deleteFile(storagePath: string): Promise<void> {
  await this.minioClient.removeObject(this.bucketName, storagePath);
  this.logger.log(`File deleted successfully: ${storagePath}`);
}
```

---

## API Endpoints

### Subir Archivo

**POST** `/files/:projectId/upload`

**Headers**:
```
Authorization: Bearer {jwt-token}
Content-Type: multipart/form-data
```

**Body** (FormData):
```
file: [archivo binario]
```

**Response 201**:
```json
{
  "id": "file-uuid",
  "filename": "90e3f534-e774-4d33-9218-a78a44675342.zip",
  "originalName": "proyecto-entregable.zip",
  "storagePath": "projects/{projectId}/90e3f534-e774-4d33-9218-a78a44675342.zip",
  "mimeType": "application/zip",
  "sizeBytes": 1048576,
  "uploadedBy": "user-uuid",
  "uploadedAt": "2025-11-16T19:18:43.000Z",
  "uploader": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

### Listar Archivos de un Proyecto

**GET** `/files/project/:projectId`

**Response 200**:
```json
[
  {
    "id": "file-uuid",
    "filename": "90e3f534-e774-4d33-9218-a78a44675342.zip",
    "originalName": "proyecto-entregable.zip",
    "mimeType": "application/zip",
    "sizeBytes": 1048576,
    "uploadedAt": "2025-11-16T19:18:43.000Z",
    "uploader": {
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
]
```

### Obtener URL de Descarga

**GET** `/files/:id/download`

**Response 200**:
```json
{
  "id": "file-uuid",
  "filename": "90e3f534-e774-4d33-9218-a78a44675342.zip",
  "originalName": "proyecto-entregable.zip",
  "downloadUrl": "http://YOUR_SERVER_IP:9000/align-designs/projects/...?X-Amz-..."
}
```

El frontend puede usar esta URL para descargar el archivo directamente desde MinIO.

### Eliminar Archivo

**DELETE** `/files/:id`

**Response 200**:
```json
{
  "message": "Archivo eliminado exitosamente"
}
```

**Permisos**:
- **Admin**: Puede eliminar cualquier archivo
- **Cliente**: Solo puede eliminar archivos que él mismo subió

---

## Consola Web MinIO

### Acceso

**URL**: http://YOUR_SERVER_IP:9001

**Credenciales**:
- Usuario: `your_minio_user`
- Contraseña: `YOUR_MINIO_PASSWORD`

### Funciones Disponibles

1. **Buckets**: Ver, crear, eliminar buckets
2. **Object Browser**: Navegar por archivos almacenados
3. **Metrics**: Estadísticas de uso (espacio, operaciones, bandwidth)
4. **Identity**: Gestión de usuarios y access keys
5. **Settings**: Configuración del servidor

### Explorar Archivos

1. Iniciar sesión en http://YOUR_SERVER_IP:9001
2. Click en **Object Browser**
3. Seleccionar bucket `align-designs`
4. Navegar a `projects/{projectId}/`
5. Ver/descargar archivos directamente

---

## Troubleshooting

### Error: Connection Refused

**Síntoma**:
```bash
curl http://YOUR_SERVER_IP:9000
# curl: (7) Failed to connect to YOUR_SERVER_IP port 9000: Connection refused
```

**Verificaciones**:

1. **Contenedor corriendo**:
```bash
sudo docker ps | grep minio
# Debe mostrar: your_minio_user-minio ... Up ... 0.0.0.0:9000->9000/tcp
```

2. **Comando correcto en compose.yml**:
```yaml
command: server /data --address ":9000" --console-address ":9001"
```

**⚠️ ERROR COMÚN**: Si el comando tiene typo como `--console-adress` (falta una 'd'), MinIO no arranca correctamente.

3. **Puerto escuchando en la VM**:
```bash
sudo ss -tlnp | grep 9000
# Debe mostrar: LISTEN 0 4096 *:9000 *:* users:(("minio",pid=...))
```

4. **Verificar logs**:
```bash
sudo docker logs your_minio_user-minio --tail 50
```

### Error: ECONNREFUSED desde el Backend

**Síntoma**:
```
Error: connect ECONNREFUSED YOUR_SERVER_IP:9000
```

**Soluciones**:

1. **Verificar MINIO_ENDPOINT en backend/.env**:
```bash
MINIO_ENDPOINT=YOUR_SERVER_IP  # IP de la VM
MINIO_PORT=9000
```

2. **Test de conectividad desde Windows**:
```powershell
Test-NetConnection -ComputerName YOUR_SERVER_IP -Port 9000
# TcpTestSucceeded debe ser True
```

3. **Verificar External Switch en Hyper-V**:
```powershell
Get-VMNetworkAdapter -VMName 'Ebionix-Software-Design' | Select-Object SwitchName
# SwitchName debe ser "External-Switch" o un switch externo
```

### Error: BigInt Serialization ✅ RESUELTO

**Síntoma**:
```
TypeError: Do not know how to serialize a BigInt
```

**Causa**: Prisma usa `BigInt` para el campo `sizeBytes`, pero JSON.stringify no puede serializar BigInt.

**Solución Aplicada** (16/11/2025):

Convertir BigInt a Number en todos los servicios que retornan archivos o proyectos con archivos:

```typescript
// ✅ En files.service.ts (uploadFile, findAllByProject, getFileUrl)
return {
  ...fileRecord,
  sizeBytes: Number(fileRecord.sizeBytes),
};

// ✅ En files.service.ts (findAllByProject)
return files.map(file => ({
  ...file,
  sizeBytes: Number(file.sizeBytes),
}));

// ✅ En projects.service.ts (create, update, findOne)
return {
  ...project,
  files: project.files.map(file => ({
    ...file,
    sizeBytes: Number(file.sizeBytes),
  })),
};
```

### Error: Bucket Does Not Exist

**Síntoma**:
```
Error: The specified bucket does not exist
```

**Solución**: El backend crea automáticamente el bucket `align-designs` al iniciar si no existe. Verificar logs:

```bash
# En el backend
ppnpm start:dev

# Buscar:
[StorageService] Bucket "align-designs" created successfully
```

Si falla, crear manualmente:

```bash
# Opción 1: Via consola web (http://YOUR_SERVER_IP:9001)
# Buckets → Create Bucket → Nombre: align-designs

# Opción 2: Via mc client (MinIO Client)
mc alias set local http://YOUR_SERVER_IP:9000 your_minio_user YOUR_MINIO_PASSWORD
mc mb local/align-designs
```

---

## Gestión de Datos

### Backup

**Opción 1: Backup del Volumen Docker**

```bash
# Detener MinIO temporalmente
cd ~/infra
sudo docker compose stop storage

# Crear backup
sudo docker run --rm \
  -v infra_minio_data:/data \
  -v ~/backups:/backup \
  alpine tar czf /backup/minio-$(date +%Y%m%d-%H%M%S).tar.gz /data

# Reiniciar MinIO
sudo docker compose start storage
```

**Opción 2: Sync con MinIO Client**

```bash
# Instalar mc (MinIO Client)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configurar alias
mc alias set vm http://YOUR_SERVER_IP:9000 your_minio_user YOUR_MINIO_PASSWORD

# Backup a disco local
mc mirror vm/align-designs ~/minio-backup/align-designs

# O backup a otro MinIO/S3
mc mirror vm/align-designs s3/my-backup-bucket/align-designs
```

### Restauración

**Desde Backup de Volumen**:

```bash
# Detener MinIO
sudo docker compose stop storage

# Extraer backup
sudo docker run --rm \
  -v infra_minio_data:/data \
  -v ~/backups:/backup \
  alpine sh -c "cd / && tar xzf /backup/minio-20251116-132000.tar.gz"

# Reiniciar
sudo docker compose start storage
```

**Desde Mirror**:

```bash
# Restaurar desde backup local
mc mirror ~/minio-backup/align-designs vm/align-designs

# O desde S3
mc mirror s3/my-backup-bucket/align-designs vm/align-designs
```

### Limpieza de Archivos Huérfanos

Archivos en MinIO sin registro en la base de datos:

```typescript
// Script de limpieza (ejemplo)
async cleanOrphanFiles() {
  const stream = this.minioClient.listObjects(this.bucketName, 'projects/', true);

  for await (const obj of stream) {
    const storagePath = obj.name;

    // Verificar si existe en BD
    const fileInDb = await this.prisma.file.findFirst({
      where: { storagePath }
    });

    if (!fileInDb) {
      await this.minioClient.removeObject(this.bucketName, storagePath);
      console.log(`Deleted orphan file: ${storagePath}`);
    }
  }
}
```

---

## Seguridad

### Access Keys

**Nunca exponer las credenciales en el código**:

❌ Incorrecto:
```typescript
const client = new Minio.Client({
  accessKey: 'your_minio_user',
  secretKey: 'YOUR_MINIO_PASSWORD',
});
```

✅ Correcto:
```typescript
const client = new Minio.Client({
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
```

### Políticas de Bucket

Por defecto, el bucket `align-designs` es **privado**. Los archivos solo son accesibles mediante URLs firmadas.

Para permitir acceso público a ciertos archivos (no recomendado en producción):

```bash
mc anonymous set download vm/align-designs/public/
```

### URLs Firmadas

Las URLs de descarga expiran en **15 minutos**. Para cambiar:

```typescript
// 1 hora
await this.minioClient.presignedGetObject(bucket, path, 60 * 60);

// 1 día
await this.minioClient.presignedGetObject(bucket, path, 24 * 60 * 60);

// Máximo: 7 días (604800 segundos)
```

### HTTPS/SSL

**Desarrollo**: `useSSL: false` (HTTP)

**Producción**: Configurar certificado SSL:

1. Generar certificado (Let's Encrypt, etc.)
2. Colocar en `/root/.minio/certs/`:
   ```bash
   /root/.minio/certs/
   ├── public.crt
   └── private.key
   ```
3. Reiniciar MinIO
4. Actualizar backend:
   ```bash
   MINIO_USE_SSL=true
   MINIO_PORT=443
   ```

---

## Monitoreo

### Métricas

**Via Consola Web**:
- http://YOUR_SERVER_IP:9001 → Monitoring → Metrics

**Via Prometheus** (configuración avanzada):

```yaml
# docker-compose.yml
storage:
  environment:
    MINIO_PROMETHEUS_AUTH_TYPE: "public"
  # MinIO expone métricas en /minio/v2/metrics/cluster
```

### Logs

```bash
# Ver logs en tiempo real
sudo docker logs -f your_minio_user-minio

# Logs con timestamps
sudo docker logs -t your_minio_user-minio

# Últimas 100 líneas
sudo docker logs --tail 100 your_minio_user-minio
```

**Ejemplo de log exitoso**:
```
API: SYSTEM()
Time: 19:17:06 UTC 11/16/2025
DeploymentID: 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d
RequestID: 187892BCBEB3E54C
RemoteHost: 192.168.0.92
UserAgent: MinIO (linux; amd64) minio-go/v7.0.66
GET /minio/health/ready
200 OK
```

---

## Desarrollo vs Producción

### Desarrollo (Actual)

```bash
# Backend .env
MINIO_ENDPOINT=YOUR_SERVER_IP  # IP de la VM en red local
MINIO_PORT=9000
MINIO_USE_SSL=false
```

**Características**:
- Acceso directo a la VM desde Windows
- HTTP sin cifrado
- Credenciales en archivo `.env`
- Single instance (no replicación)

### Producción (Recomendado)

```bash
# Backend .env
MINIO_ENDPOINT=storage.your_minio_user.com  # Dominio con DNS
MINIO_PORT=443
MINIO_USE_SSL=true
```

**Mejoras necesarias**:

1. **Alta Disponibilidad**: Cluster de MinIO con múltiples nodos
2. **SSL/TLS**: Certificados HTTPS
3. **Backup Automatizado**: Cron job para backups diarios
4. **Monitoreo**: Integración con Prometheus + Grafana
5. **Secrets Management**: Usar AWS Secrets Manager o HashiCorp Vault
6. **CDN**: CloudFront o CloudFlare para distribución de archivos
7. **Políticas de Retención**: Lifecycle rules para archivos antiguos

---

## Referencias

### Documentación Oficial

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO JavaScript Client SDK](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [MinIO Docker Installation](https://min.io/docs/minio/container/index.html)

### Comandos Útiles

```bash
# Estado del servicio
sudo docker compose ps storage

# Restart
sudo docker compose restart storage

# Rebuild
sudo docker compose up -d --build storage

# Ver configuración
sudo docker inspect your_minio_user-minio

# Uso de disco
sudo docker exec your_minio_user-minio df -h /data

# Listar objetos
mc ls vm/align-designs/projects/
```

---

## Resumen de Configuración Actual

| Componente | Valor |
|------------|-------|
| **Imagen Docker** | `minio/minio:latest` |
| **Puertos** | 9000 (API), 9001 (Console) |
| **Bucket** | `align-designs` |
| **IP VM** | `YOUR_SERVER_IP` |
| **Switch Hyper-V** | `External-Switch` |
| **Credenciales** | `your_minio_user` / `YOUR_MINIO_PASSWORD` |
| **SSL** | Deshabilitado (HTTP) |
| **Expiración URLs** | 15 minutos |
| **Estructura** | `projects/{projectId}/{uuid}.ext` |

✅ **Estado**: Operativo y funcional para desarrollo.
