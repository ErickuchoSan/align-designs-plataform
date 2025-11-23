# Guía de Escalamiento - Align Designs Platform

**Versión:** 1.0
**Última actualización:** 2025-01-23
**Estado:** Producción Inicial → Escalamiento Progresivo

---

## 📊 Tabla de Contenidos

1. [Arquitectura Actual](#arquitectura-actual)
2. [Etapas de Escalamiento](#etapas-de-escalamiento)
3. [PostgreSQL: Opciones de Escalamiento](#postgresql-opciones-de-escalamiento)
4. [Redis: Opciones de Escalamiento](#redis-opciones-de-escalamiento)
5. [Storage: MinIO vs S3-Compatible](#storage-minio-vs-s3-compatible)
6. [Aplicación: Horizontal Scaling](#aplicación-horizontal-scaling)
7. [Load Balancing](#load-balancing)
8. [Monitoring & Observability](#monitoring--observability)
9. [CDN & Edge Computing](#cdn--edge-computing)
10. [Estimación de Costos por Etapa](#estimación-de-costos-por-etapa)
11. [Decisiones de Escalamiento](#decisiones-de-escalamiento)
12. [Roadmap de Migración](#roadmap-de-migración)

---

## 🏗️ Arquitectura Actual

### Setup Inicial (Etapa 0 - Actual)

```
┌─────────────────────────────────────────────────────┐
│         DigitalOcean Droplet (Single Server)        │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Backend  │  │ Frontend │  │PostgreSQL│          │
│  │  (NestJS)│  │(Next.js) │  │  Docker  │          │
│  │  Docker  │  │  Docker  │  └──────────┘          │
│  └──────────┘  └──────────┘                         │
│                                                       │
│  ┌──────────┐  ┌──────────┐                         │
│  │  Redis   │  │  MinIO   │                         │
│  │  Docker  │  │  Docker  │                         │
│  └──────────┘  └──────────┘                         │
│                                                       │
└─────────────────────────────────────────────────────┘
         │
         │ HTTPS
         ▼
    [Internet Users]
```

**Características:**
- ✅ Todo en un servidor
- ✅ Fácil de mantener
- ✅ Costo mínimo ($12-24/mes)
- ⚠️ Single Point of Failure (SPOF)
- ⚠️ Recursos compartidos entre servicios
- ⚠️ Escalamiento vertical limitado

**Capacidad estimada:**
- **Usuarios concurrentes:** 50-200
- **Requests/segundo:** 10-50
- **Storage:** Limitado por disco del Droplet

---

## 📈 Etapas de Escalamiento

### Etapa 1: Separación de Servicios (1,000+ usuarios)

**Cuándo:** 200+ usuarios concurrentes, latencia >500ms, CPU >80%

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  App Droplet   │    │   DB Droplet   │    │Storage Droplet │
│                │    │                │    │                │
│  ┌──────────┐  │    │  PostgreSQL    │    │     MinIO      │
│  │ Backend  │  │───▶│   (Managed)    │    │  (Dedicated)   │
│  └──────────┘  │    └────────────────┘    └────────────────┘
│  ┌──────────┐  │
│  │ Frontend │  │    ┌────────────────┐
│  └──────────┘  │    │  Redis Droplet │
│                │───▶│   (Managed)    │
└────────────────┘    └────────────────┘
```

**Cambios:**
- ✅ PostgreSQL → DigitalOcean Managed Database
- ✅ Redis → DigitalOcean Managed Redis
- ✅ MinIO → Droplet dedicado o DO Spaces
- ✅ Aplicación en Droplet separado

**Costo:** ~$60-100/mes

---

### Etapa 2: Horizontal Scaling (5,000+ usuarios)

**Cuándo:** 1,000+ usuarios concurrentes, necesitas redundancia

```
                      ┌─────────────────┐
                      │  Load Balancer  │
                      │   (DO LB)       │
                      └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌──────────┐     ┌──────────┐
        │ Backend  │     │ Backend  │     │ Backend  │
        │Instance 1│     │Instance 2│     │Instance 3│
        └────┬─────┘     └────┬─────┘     └────┬─────┘
             │                │                │
             └────────────────┼────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              ┌─────▼──────┐    ┌──────▼─────┐
              │ PostgreSQL │    │   Redis    │
              │  Cluster   │    │  Cluster   │
              └────────────┘    └────────────┘

        ┌──────────────────────────────┐
        │   CDN (Cloudflare/DO)        │
        │   ┌──────────┐               │
        │   │ Frontend │ (Static)      │
        │   └──────────┘               │
        └──────────────────────────────┘
```

**Cambios:**
- ✅ Load Balancer para múltiples instancias backend
- ✅ Frontend → CDN (Vercel, Cloudflare, DO CDN)
- ✅ PostgreSQL → Cluster con réplicas de lectura
- ✅ Redis → Cluster mode
- ✅ Auto-scaling según carga

**Costo:** ~$200-400/mes

---

### Etapa 3: Microservicios & Kubernetes (10,000+ usuarios)

**Cuándo:** Necesitas desacoplar servicios, deployment independiente

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │    (Kong/Nginx) │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
    │  Auth     │     │ Projects  │     │  Files    │
    │ Service   │     │ Service   │     │ Service   │
    └───────────┘     └───────────┘     └───────────┘

    ┌───────────────────────────────────────────────┐
    │      Kubernetes Cluster (DO K8s)              │
    │                                               │
    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
    │  │ Pod  │ │ Pod  │ │ Pod  │ │ Pod  │        │
    │  └──────┘ └──────┘ └──────┘ └──────┘        │
    └───────────────────────────────────────────────┘

    ┌───────────┐  ┌────────────┐  ┌─────────────┐
    │PostgreSQL │  │   Redis    │  │  S3 Spaces  │
    │  Cluster  │  │  Cluster   │  │   (CDN)     │
    └───────────┘  └────────────┘  └─────────────┘
```

**Cambios:**
- ✅ Kubernetes para orquestación
- ✅ Microservicios independientes
- ✅ Service Mesh (Istio/Linkerd)
- ✅ Event-driven architecture (Redis Streams/RabbitMQ)

**Costo:** ~$500-1,500/mes

---

## 🗄️ PostgreSQL: Opciones de Escalamiento

### Opción A: PostgreSQL en Docker (Actual)

**Uso:** 0-1,000 usuarios, <50 requests/seg

```yaml
# docker-compose.yml
postgres:
  image: postgres:14-alpine
  volumes:
    - postgres_data:/var/lib/postgresql/data
  environment:
    POSTGRES_DB: align_designs
  shm_size: 256mb
```

**Pros:**
- ✅ Gratis (solo el Droplet)
- ✅ Control total
- ✅ Fácil de configurar

**Cons:**
- ❌ Sin backups automáticos
- ❌ Sin réplicas
- ❌ Sin alta disponibilidad
- ❌ Requiere mantenimiento manual

**Tuning básico:**
```sql
-- postgresql.conf
max_connections = 100
shared_buffers = 256MB  -- 25% de RAM
effective_cache_size = 1GB  -- 75% de RAM
work_mem = 4MB
maintenance_work_mem = 64MB
```

---

### Opción B: DigitalOcean Managed PostgreSQL

**Uso:** 1,000-10,000 usuarios, 50-500 requests/seg

**Planes disponibles:**

| Plan | RAM | vCPUs | Storage | Conexiones | Precio/mes |
|------|-----|-------|---------|------------|------------|
| Basic | 1GB | 1 | 10GB | 25 | $15 |
| Basic | 2GB | 1 | 25GB | 50 | $30 |
| Professional | 4GB | 2 | 61GB | 97 | $60 |
| Professional | 8GB | 2 | 115GB | 197 | $120 |

**Características incluidas:**
- ✅ Backups automáticos diarios (7 días retention)
- ✅ Point-in-time recovery (hasta 7 días)
- ✅ Automatic failover (Professional+)
- ✅ Read replicas (Professional+)
- ✅ SSL automático
- ✅ Monitoring integrado
- ✅ Scaling sin downtime

**Configuración:**
```typescript
// apps/backend/.env
DATABASE_URL=postgresql://doadmin:password@db-postgresql-nyc3-12345.db.ondigitalocean.com:25060/align_designs?sslmode=require

// Connection pool (recomendado)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

**Read Replicas (Professional+):**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}

// .env
DATABASE_URL=postgresql://primary-host:25060/align_designs
SHADOW_DATABASE_URL=postgresql://replica-host:25060/align_designs
```

**Cuándo migrar:**
- ✅ CPU del DB >70% consistentemente
- ✅ Queries lentas (>100ms promedio)
- ✅ Necesitas alta disponibilidad
- ✅ Backups críticos para el negocio

---

### Opción C: PostgreSQL Cluster (Avanzado)

**Uso:** 10,000+ usuarios, alta disponibilidad crítica

**Tecnologías:**
- **Patroni + HAProxy:** Automatic failover, leader election
- **pgBouncer:** Connection pooling eficiente
- **Citus:** Sharding para data distribuida

**Arquitectura:**
```
       ┌─────────────┐
       │   HAProxy   │  (Load Balancer)
       └──────┬──────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼───┐ ┌──▼────┐ ┌──▼────┐
│Primary│ │Standby│ │Standby│
│(Write)│ │(Read) │ │(Read) │
└───────┘ └───────┘ └───────┘
    │         │         │
    └─────────┴─────────┘
       (Streaming Replication)
```

**Costo:** Self-hosted en múltiples Droplets: ~$150-300/mes

**Cuándo usar:**
- ✅ >10,000 usuarios concurrentes
- ✅ Necesitas 99.99% uptime
- ✅ Tienes equipo DevOps dedicado

---

## ⚡ Redis: Opciones de Escalamiento

### Opción A: Redis en Docker (Actual)

**Uso:** 0-1,000 usuarios, cache básico

```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
  volumes:
    - redis_data:/data
  ports:
    - "127.0.0.1:6379:6379"
```

**Configuración de persistencia:**
```conf
# redis.conf
appendonly yes
appendfsync everysec  # Backup cada segundo
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1    # Snapshot después de 15min si 1+ keys cambiaron
save 300 10   # Snapshot después de 5min si 10+ keys cambiaron
save 60 10000 # Snapshot después de 1min si 10000+ keys cambiaron
```

**Pros:**
- ✅ Gratis
- ✅ Performance excelente
- ✅ Control total

**Cons:**
- ❌ Sin réplicas
- ❌ Sin clustering
- ❌ SPOF

---

### Opción B: DigitalOcean Managed Redis

**Uso:** 1,000-10,000 usuarios, cache crítico

**Planes:**

| Plan | RAM | Conexiones | Eviction Policy | Precio/mes |
|------|-----|------------|-----------------|------------|
| Basic | 1GB | 10,000 | LRU | $15 |
| Basic | 2GB | 10,000 | LRU | $30 |
| Professional | 4GB | 10,000 | LRU + Replication | $60 |
| Professional | 8GB | 10,000 | LRU + Replication | $120 |

**Características:**
- ✅ Backups automáticos (Professional)
- ✅ Automatic failover (Professional)
- ✅ Monitoring integrado
- ✅ SSL/TLS automático
- ✅ Read replicas (Professional)

**Configuración:**
```typescript
// .env
REDIS_ENABLED=true
REDIS_URL=rediss://default:password@redis-cluster.db.ondigitalocean.com:25061

// Backend (ya configurado en Fase 1)
// apps/backend/src/cache/cache.module.ts
// ¡Ya está listo! Solo cambias la URL
```

**Cuándo migrar:**
- ✅ Cache hit rate <70%
- ✅ Necesitas réplicas para lectura
- ✅ Redis usando >80% RAM
- ✅ Cache es crítico (pérdida afecta UX)

---

### Opción C: Redis Cluster (Alta Escalabilidad)

**Uso:** 10,000+ usuarios, múltiples GB de cache

**Arquitectura:**
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Master 1  │  │  Master 2  │  │  Master 3  │
│  (Slots    │  │  (Slots    │  │  (Slots    │
│   0-5460)  │  │ 5461-10922)│  │10923-16383)│
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │
┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
│  Replica 1 │  │  Replica 2 │  │  Replica 3 │
└────────────┘  └────────────┘  └────────────┘
```

**Configuración:**
```typescript
// IoRedis Cluster (para NestJS)
import Redis from 'ioredis';

const cluster = new Redis.Cluster([
  { host: 'redis1.example.com', port: 6379 },
  { host: 'redis2.example.com', port: 6379 },
  { host: 'redis3.example.com', port: 6379 },
]);
```

**Costo:** Self-hosted: ~$100-200/mes, Managed (AWS/Azure): ~$200-500/mes

---

## 💾 Storage: MinIO vs S3-Compatible

### Opción A: MinIO Self-hosted (Actual)

**Uso:** 0-1TB, <10,000 archivos/día

```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data
  environment:
    MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
    MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
```

**Pros:**
- ✅ Gratis (solo storage del Droplet)
- ✅ 100% S3-compatible
- ✅ Control total
- ✅ Sin costos de transferencia

**Cons:**
- ❌ Limitado por disco del Droplet
- ❌ Sin CDN
- ❌ Sin redundancia geográfica
- ❌ Backups manuales

**Tuning:**
```bash
# Aumentar límites de archivos
ulimit -n 65536

# MinIO con múltiples discos (RAID)
minio server /data1 /data2 /data3 /data4
```

**Cuándo es suficiente:**
- ✅ Storage <500GB
- ✅ Usuarios en una región
- ✅ Backups manuales aceptables

---

### Opción B: DigitalOcean Spaces

**Uso:** 1TB+ storage, distribución global

**Características:**
- ✅ **S3-compatible** (mismo código, solo cambias URL)
- ✅ **CDN incluido** (151 PoPs globales)
- ✅ **Escalabilidad ilimitada**
- ✅ **Backups automáticos**
- ✅ **No requiere mantenimiento**

**Pricing:**
- **Base:** $5/mes por 250GB storage + 1TB bandwidth
- **Storage adicional:** $0.02/GB/mes
- **Bandwidth adicional:** $0.01/GB (después de 1TB)

**Ejemplo de costos:**
| Storage | Bandwidth | Costo/mes |
|---------|-----------|-----------|
| 100GB | 500GB | $5 |
| 500GB | 2TB | $10 |
| 1TB | 5TB | $20 |
| 5TB | 10TB | $90 |

**Migración (sin cambiar código):**
```typescript
// .env - Solo cambias estas variables
MINIO_ENDPOINT=https://nyc3.digitaloceanspaces.com
MINIO_BUCKET_NAME=align-designs-prod
MINIO_ACCESS_KEY=DO_SPACES_KEY
MINIO_SECRET_KEY=DO_SPACES_SECRET

// El código NO cambia (ya es S3-compatible)
// apps/backend/src/storage/storage.service.ts
// ¡Funciona igual!
```

**CDN Configuration:**
```typescript
// Spaces + CDN = URLs optimizadas
// https://your-space.nyc3.digitaloceanspaces.com/file.jpg
// → https://your-space.nyc3.cdn.digitaloceanspaces.com/file.jpg
//   (Cached en 151 locations globalmente)
```

**Cuándo migrar:**
- ✅ Storage >500GB
- ✅ Usuarios globales (latencia importa)
- ✅ Muchas descargas (>1TB/mes bandwidth)
- ✅ Necesitas CDN

---

### Opción C: AWS S3 + CloudFront

**Uso:** Escala masiva, enterprise

**Características:**
- ✅ **Escalabilidad infinita**
- ✅ **99.999999999% durability**
- ✅ **Inteligent-Tiering** (ahorro automático)
- ✅ **CloudFront CDN** (225+ PoPs)
- ✅ **S3 Transfer Acceleration**

**Pricing (S3 Standard):**
- **First 50TB:** $0.023/GB/mes
- **Next 450TB:** $0.022/GB/mes
- **Requests:** $0.0004 per 1,000 GET, $0.005 per 1,000 PUT

**CloudFront:**
- **First 10TB:** $0.085/GB
- **Next 40TB:** $0.080/GB

**Ejemplo:**
| Storage | Requests | Bandwidth | Costo/mes |
|---------|----------|-----------|-----------|
| 1TB | 1M GET | 5TB | ~$75 |
| 5TB | 5M GET | 20TB | ~$350 |

**Cuándo usar:**
- ✅ Storage >10TB
- ✅ Distribución global crítica
- ✅ Necesitas lifecycle policies
- ✅ Compliance requirements (HIPAA, etc.)

---

## 🚀 Aplicación: Horizontal Scaling

### Etapa 1: Single Instance (Actual)

```
┌─────────────────────┐
│     Droplet         │
│  ┌───────────────┐  │
│  │   Backend     │  │
│  │   (1 process) │  │
│  └───────────────┘  │
└─────────────────────┘
```

**Limitaciones:**
- Single process Node.js
- Limited by single CPU core
- No redundancy

---

### Etapa 2: Cluster Mode (PM2)

```
┌─────────────────────────────────┐
│          Droplet                │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ P1  │ │ P2  │ │ P3  │ ...   │
│  └─────┘ └─────┘ └─────┘       │
│     (PM2 Cluster Mode)          │
└─────────────────────────────────┘
```

**Implementación:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'backend',
    script: './dist/main.js',
    instances: 'max',  // Usa todos los CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};

// Start
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Pros:**
- ✅ Usa todos los CPU cores
- ✅ Auto-restart en crashes
- ✅ Zero-downtime reloads
- ✅ Mismo Droplet (no costo extra)

**Cuándo:** CPU >70%, pero un Droplet es suficiente

---

### Etapa 3: Múltiples Droplets + Load Balancer

```
          ┌─────────────────┐
          │  Load Balancer  │
          │   (DO LB $10)   │
          └────────┬────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
  ┌────▼───┐  ┌───▼────┐  ┌───▼────┐
  │Droplet1│  │Droplet2│  │Droplet3│
  │Backend │  │Backend │  │Backend │
  └────────┘  └────────┘  └────────┘
```

**Configuración Load Balancer:**
```yaml
# DigitalOcean Load Balancer
Type: Round Robin
Health Check:
  Protocol: HTTP
  Path: /health
  Interval: 10s
  Timeout: 5s
  Unhealthy Threshold: 3
Sticky Sessions: Enabled (cookie-based)
SSL Termination: Enabled
```

**Pros:**
- ✅ Alta disponibilidad
- ✅ Scale horizontally
- ✅ SSL termination en LB
- ✅ Health checks automáticos

**Costo:** $10/mes LB + $12/mes por Droplet

**Cuándo:** Necesitas redundancia, >1,000 usuarios concurrentes

---

### Etapa 4: Kubernetes (Avanzado)

```
┌──────────────────────────────────────┐
│      Kubernetes Cluster (DO K8s)     │
│                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │  Pod1  │ │  Pod2  │ │  Pod3  │   │
│  │Backend │ │Backend │ │Backend │   │
│  └────────┘ └────────┘ └────────┘   │
│                                      │
│  Auto-scaling: 2-10 pods             │
│  Rolling updates                     │
│  Self-healing                        │
└──────────────────────────────────────┘
```

**Deployment YAML:**
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/user/backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: LoadBalancer
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3000
```

**Auto-scaling:**
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Costo:** DO Kubernetes ~$12/mes por node + Load Balancer

**Cuándo:** >5,000 usuarios, deployment complejo, microservicios

---

## ⚖️ Load Balancing

### Opción A: NGINX Reverse Proxy (Gratis)

```nginx
# /etc/nginx/nginx.conf
upstream backend {
    least_conn;  # O ip_hash para sticky sessions
    server 10.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 10.0.0.2:3000 max_fails=3 fail_timeout=30s;
    server 10.0.0.3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.aligndesigns.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Health check
        proxy_next_upstream error timeout http_502 http_503 http_504;
    }
}
```

**Health checks (NGINX Plus o script externo):**
```bash
#!/bin/bash
# health-check.sh
for server in 10.0.0.1 10.0.0.2 10.0.0.3; do
    if ! curl -sf http://$server:3000/health > /dev/null; then
        # Remove from upstream
        echo "Server $server is down"
    fi
done
```

---

### Opción B: DigitalOcean Load Balancer ($10/mes)

**Ventajas:**
- ✅ Managed (no mantienes NGINX)
- ✅ SSL termination incluido
- ✅ Health checks automáticos
- ✅ DDoS protection básico
- ✅ Sticky sessions
- ✅ Monitoring integrado

**Configuración (Terraform):**
```hcl
resource "digitalocean_loadbalancer" "backend" {
  name   = "backend-lb"
  region = "nyc3"

  forwarding_rule {
    entry_port     = 443
    entry_protocol = "https"
    target_port     = 3000
    target_protocol = "http"
    certificate_name = "aligndesigns-cert"
  }

  healthcheck {
    port     = 3000
    protocol = "http"
    path     = "/health"
  }

  droplet_ids = [
    digitalocean_droplet.backend1.id,
    digitalocean_droplet.backend2.id,
  ]

  sticky_sessions {
    type               = "cookies"
    cookie_name        = "lb"
    cookie_ttl_seconds = 3600
  }
}
```

---

### Opción C: Cloudflare Load Balancing ($5/mes + $0.50/500K requests)

**Ventajas:**
- ✅ Global load balancing
- ✅ DDoS protection enterprise
- ✅ Geo-steering (envía usuarios al servidor más cercano)
- ✅ Health checks desde múltiples regiones
- ✅ Failover automático

**Configuración:**
```javascript
// Cloudflare Workers (edge logic)
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const country = request.cf.country

  // Geo-steering
  if (country === 'MX' || country === 'US') {
    return fetch('https://us-backend.aligndesigns.com', request)
  } else {
    return fetch('https://eu-backend.aligndesigns.com', request)
  }
}
```

---

## 📊 Monitoring & Observability

### Nivel 1: Basics (Gratis)

**1. Prometheus + Grafana (ya implementado en Fase 1)**
```yaml
# docker-compose.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

**2. Uptime monitoring:**
- **UptimeRobot** (gratis, 50 monitors)
- **StatusCake** (gratis, 10 URLs)
- **Pingdom** (gratis tier)

---

### Nivel 2: Intermediate

**1. Loki para logs (como Elasticsearch pero gratis)**
```yaml
loki:
  image: grafana/loki
  command: -config.file=/etc/loki/local-config.yaml

promtail:
  image: grafana/promtail
  volumes:
    - /var/log:/var/log
```

**2. APM (Application Performance Monitoring):**
- **New Relic** (100GB/mes gratis)
- **Datadog** (gratis hasta 5 hosts)
- **Sentry** (5K errors/mes gratis) - para error tracking

**Integración Sentry:**
```typescript
// apps/backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

### Nivel 3: Enterprise

**1. Datadog (Full Observability)**
- Metrics, Logs, APM, RUM
- $15/host/mes + $10/100K indexed logs

**2. New Relic (Full Stack)**
- APM, Infrastructure, Logs, Browser
- $99/user/mes

**3. Elastic Stack (Self-hosted)**
- Elasticsearch + Logstash + Kibana
- Gratis pero requiere infraestructura

---

## 🌍 CDN & Edge Computing

### Opción A: Cloudflare (Gratis - $20/mes)

**Free Plan:**
- ✅ CDN global (300+ PoPs)
- ✅ SSL gratis
- ✅ DDoS protection
- ✅ Caching automático
- ✅ 100K requests/día gratis

**Pro ($20/mes):**
- ✅ Todo lo anterior
- ✅ WAF básico
- ✅ Image optimization
- ✅ Polish (compresión de imágenes)

**Setup:**
```dns
# Cambiar nameservers a Cloudflare
NS: amber.ns.cloudflare.com
NS: chad.ns.cloudflare.com

# DNS Records
A   aligndesigns.com     → IP_DROPLET    (Proxied ☁️)
A   api.aligndesigns.com → IP_DROPLET    (Proxied ☁️)
```

**Page Rules (cachear assets):**
```
https://aligndesigns.com/assets/*
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

https://api.aligndesigns.com/*
  - Cache Level: Bypass
```

---

### Opción B: DigitalOcean Spaces CDN (incluido)

```typescript
// .env
MINIO_ENDPOINT=https://nyc3.digitaloceanspaces.com
CDN_ENDPOINT=https://your-space.nyc3.cdn.digitaloceanspaces.com

// Frontend
<Image
  src={`${CDN_ENDPOINT}/uploads/image.jpg`}
  alt="Cached via CDN"
/>
```

**Ventajas:**
- ✅ Incluido con Spaces ($5/mes)
- ✅ 151 PoPs
- ✅ SSL automático
- ✅ Cache headers configurables

---

### Opción C: Vercel Edge Network (para Frontend)

**Características:**
- ✅ Edge runtime (código en el edge)
- ✅ ISR (Incremental Static Regeneration)
- ✅ Edge middleware
- ✅ Image optimization automático

**Deploy Next.js a Vercel:**
```bash
# Solo el frontend
cd apps/frontend
vercel deploy --prod

# Vercel se encarga de:
# - Build optimizado
# - CDN global
# - SSL automático
# - Preview deployments
```

**Costo:**
- Free: $0/mes (hobby)
- Pro: $20/mes (production)

---

## 💰 Estimación de Costos por Etapa

### Etapa 0: Startup (Actual)

```
Droplet (2GB, 1 vCPU)         $12/mes
- Backend + Frontend + DB + Redis + MinIO

GitHub Container Registry      $0/mes
Domain (.com)                  $12/año = $1/mes
SSL (Let's Encrypt)            $0/mes

TOTAL:                         ~$13/mes
```

**Capacidad:** 50-200 usuarios concurrentes

---

### Etapa 1: Growth (1,000 usuarios)

```
Droplet (4GB, 2 vCPU)         $24/mes
PostgreSQL Managed (1GB)       $15/mes
Redis Docker (en Droplet)      $0/mes
MinIO (en Droplet)             $0/mes
Cloudflare Free                $0/mes

TOTAL:                         ~$39/mes
```

**Capacidad:** 200-1,000 usuarios concurrentes

---

### Etapa 2: Scale (5,000 usuarios)

```
Application Droplets (x2)      $48/mes  (2 x $24)
Load Balancer                  $10/mes
PostgreSQL Managed (2GB)       $30/mes
Redis Managed (1GB)            $15/mes
DO Spaces (500GB)              $10/mes
Cloudflare Pro                 $20/mes

TOTAL:                         ~$133/mes
```

**Capacidad:** 1,000-5,000 usuarios concurrentes

---

### Etapa 3: Enterprise (10,000+ usuarios)

```
Kubernetes Cluster (3 nodes)   $72/mes   (3 x $24)
Load Balancer (K8s)            $10/mes
PostgreSQL Managed (8GB)       $120/mes
Redis Managed (4GB)            $60/mes
DO Spaces (2TB)                $40/mes
Cloudflare Business            $200/mes
Monitoring (Datadog)           $75/mes

TOTAL:                         ~$577/mes
```

**Capacidad:** 10,000+ usuarios concurrentes

---

## 🎯 Decisiones de Escalamiento

### ¿Cuándo escalar cada componente?

| Métrica | Acción | Componente |
|---------|--------|------------|
| CPU >80% (sustained) | Scale Up Droplet o Scale Out (más instances) | App |
| Memory >85% | Scale Up Droplet | App |
| DB CPU >70% | Migrar a Managed PostgreSQL | Database |
| DB Queries >100ms avg | Add Read Replicas | Database |
| Redis Memory >80% | Scale Up Redis | Cache |
| Cache Hit Rate <70% | Tune TTLs, Review invalidation | Cache |
| Storage >500GB | Migrar a DO Spaces | Storage |
| Latency >200ms | Add CDN, múltiples regiones | Network |
| Error Rate >1% | Add more instances, investigate | App |

---

### Señales de alerta por componente:

**PostgreSQL:**
```sql
-- Queries lentas
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- ms
ORDER BY mean_exec_time DESC;

-- Conexiones
SELECT count(*) FROM pg_stat_activity;
-- Si cercano a max_connections, necesitas connection pooling o más RAM
```

**Redis:**
```bash
# Memory usage
redis-cli INFO memory | grep used_memory_human
# Si >80%, aumenta maxmemory o scale up

# Hit rate
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses
# Hit rate = hits / (hits + misses)
# Si <70%, revisa cache strategy
```

**Aplicación:**
```bash
# PM2 monitoring
pm2 monit

# CPU por proceso
top -p $(pgrep -d',' node)

# Memory leaks
node --expose-gc --inspect app.js
# Usar Chrome DevTools Memory Profiler
```

---

## 🗺️ Roadmap de Migración

### Mes 1-3: Fundaciones (Ya completo con Fase 1 + 2)
- ✅ Docker setup
- ✅ CI/CD básico
- ✅ Monitoring (Prometheus + Grafana)
- ✅ Backups manuales

### Mes 4-6: Primeros 1,000 usuarios
- [ ] PostgreSQL Managed (cuando DB CPU >70%)
- [ ] Cloudflare CDN (gratis, hazlo ahora)
- [ ] Sentry para error tracking
- [ ] Backups automáticos (cron mejorado)

### Mes 7-12: Scaling a 5,000 usuarios
- [ ] Redis Managed (cuando Redis memory >80%)
- [ ] Load Balancer + múltiples Droplets
- [ ] DO Spaces (cuando storage >500GB)
- [ ] APM (Datadog/New Relic)

### Año 2: Enterprise (10,000+ usuarios)
- [ ] Kubernetes cluster
- [ ] PostgreSQL Read Replicas
- [ ] Redis Cluster
- [ ] Multi-region deployment
- [ ] Microservices architecture (si es necesario)

---

## 📚 Recursos Adicionales

### Documentation:
- [DigitalOcean Docs](https://docs.digitalocean.com/)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/topics/admin)
- [NestJS Scaling](https://docs.nestjs.com/faq/scalability)

### Calculadoras:
- [DigitalOcean Pricing Calculator](https://www.digitalocean.com/pricing/calculator)
- [AWS Pricing Calculator](https://calculator.aws/)

### Monitoring:
- [Prometheus Queries](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

---

## 🎓 Conclusiones

### Principios de Escalamiento:

1. **"Scale when you need to, not before"**
   - No gastes en infraestructura prematuramente
   - Monitorea métricas reales

2. **"Vertical first, horizontal second"**
   - Más fácil scale up (más RAM/CPU)
   - Scale out (más servers) solo si vertical no es suficiente

3. **"Managed services for peace of mind"**
   - PostgreSQL Managed vale la pena ($15/mes)
   - Redis Managed solo si cache es crítico
   - Storage managed (Spaces) cuando >500GB

4. **"Automate early"**
   - Backups automáticos desde día 1
   - CI/CD desde día 1
   - Monitoring desde día 1

5. **"Monitor, measure, optimize"**
   - No adivines, usa métricas
   - Prometheus + Grafana son gratis y poderosos
   - APM cuando el negocio lo justifique

---

**Documento creado:** 2025-01-23
**Mantener actualizado:** Revisar cada 3 meses
**Owner:** DevOps Team

---

Este documento debe evolucionar conforme el proyecto crece. Mantén métricas actualizadas y toma decisiones basadas en datos reales, no en proyecciones optimistas. 🚀
