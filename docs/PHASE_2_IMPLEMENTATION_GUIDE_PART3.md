# Phase 2 Implementation Guide - Part 3 (Steps 10-12)

**Previous Parts:**
- [Part 1: Steps 1-5](./PHASE_2_IMPLEMENTATION_GUIDE.md) - Docker Setup, Backups
- [Part 2: Steps 6-9](./PHASE_2_IMPLEMENTATION_GUIDE_PART2.md) - Health Checks, CI/CD, DigitalOcean Setup

---

## Step 10: SSL & Domain Configuration 🔒

### Objetivos
- Configurar certificados SSL/TLS con Let's Encrypt
- Implementar NGINX como reverse proxy
- Configurar renovación automática de certificados
- Habilitar HTTPS en producción

---

### 10.1 Instalar NGINX en el Droplet

```bash
# Conectar al droplet
ssh align@your-droplet-ip

# Instalar NGINX
sudo apt update
sudo apt install -y nginx

# Verificar instalación
nginx -v
# Output: nginx version: nginx/1.18.0 (Ubuntu)

# Iniciar y habilitar NGINX
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

### 10.2 Configurar DNS

**En tu proveedor de dominios (ej. Namecheap, GoDaddy, Cloudflare):**

```
# Ejemplo: aligndesigns.com

# Record Type | Name          | Value                  | TTL
A             | @             | your-droplet-ip        | 3600
A             | www           | your-droplet-ip        | 3600
A             | api           | your-droplet-ip        | 3600
CNAME         | minio         | aligndesigns.com       | 3600
```

**Verificar propagación DNS:**

```bash
# En tu máquina local
dig aligndesigns.com +short
# Output: your-droplet-ip

dig www.aligndesigns.com +short
# Output: your-droplet-ip

# Verificar desde el servidor
nslookup aligndesigns.com
```

**Tiempo de propagación:** 5 minutos a 48 horas (usualmente < 2 horas)

---

### 10.3 Configurar NGINX como Reverse Proxy

**Crear configuración para el sitio:**

```bash
sudo nano /etc/nginx/sites-available/aligndesigns
```

```nginx
# /etc/nginx/sites-available/aligndesigns

# Redirect HTTP to HTTPS (se habilitará después de SSL)
server {
    listen 80;
    listen [::]:80;
    server_name aligndesigns.com www.aligndesigns.com;

    # Temporalmente servir para validación de Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Este bloque se descomentará después de obtener SSL
    # location / {
    #     return 301 https://$host$request_uri;
    # }

    # Temporalmente proxy a la app (se eliminará después de SSL)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API (se moverá a HTTPS después)
server {
    listen 80;
    listen [::]:80;
    server_name api.aligndesigns.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (si es necesario)
        add_header 'Access-Control-Allow-Origin' 'https://aligndesigns.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint (público)
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Metrics endpoint (restringir acceso)
    location /metrics {
        allow 127.0.0.1;  # Solo localhost
        deny all;
        proxy_pass http://localhost:3000/metrics;
    }
}

# MinIO Console (opcional, para administración)
server {
    listen 80;
    listen [::]:80;
    server_name minio.aligndesigns.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for MinIO console
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Habilitar el sitio:**

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/aligndesigns /etc/nginx/sites-enabled/

# Remover configuración default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t
# Output: nginx: configuration file /etc/nginx/nginx.conf test is successful

# Recargar NGINX
sudo systemctl reload nginx
```

**Verificar que funciona:**

```bash
curl http://aligndesigns.com
# Debería devolver HTML del frontend

curl http://api.aligndesigns.com/health
# Output: {"status":"ok","info":{...}}
```

---

### 10.4 Instalar Certbot y Obtener Certificado SSL

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado para todos los dominios
sudo certbot --nginx -d aligndesigns.com -d www.aligndesigns.com -d api.aligndesigns.com -d minio.aligndesigns.com

# Certbot te preguntará:
# 1. Email address (para notificaciones): tu-email@example.com
# 2. Agree to Terms: Yes
# 3. Share email: No (opcional)
# 4. Redirect HTTP to HTTPS: 2 (Yes, redirect)
```

**Output esperado:**

```
Congratulations! You have successfully enabled HTTPS!
Certificate files:
  /etc/letsencrypt/live/aligndesigns.com/fullchain.pem
  /etc/letsencrypt/live/aligndesigns.com/privkey.pem
```

**Certbot automáticamente modifica tu configuración de NGINX para:**
- Agregar bloques `server` con `listen 443 ssl`
- Configurar rutas a certificados SSL
- Agregar redirect HTTP → HTTPS

---

### 10.5 Configuración NGINX Completa (Post-SSL)

Después de Certbot, tu configuración se verá así:

```nginx
# /etc/nginx/sites-available/aligndesigns (después de Certbot)

# HTTP → HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name aligndesigns.com www.aligndesigns.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name aligndesigns.com www.aligndesigns.com;

    # SSL Configuration (Certbot lo agrega automáticamente)
    ssl_certificate /etc/letsencrypt/live/aligndesigns.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aligndesigns.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/aligndesigns.access.log;
    error_log /var/log/nginx/aligndesigns.error.log warn;

    # Frontend proxy
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts para Next.js
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js static assets
    location /_next/static {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;

        # Cache agresivo para assets estáticos
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}

# HTTPS Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.aligndesigns.com;

    ssl_certificate /etc/letsencrypt/live/aligndesigns.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aligndesigns.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    access_log /var/log/nginx/api.access.log;
    error_log /var/log/nginx/api.error.log warn;

    # Client max body size (para uploads)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS
        add_header 'Access-Control-Allow-Origin' 'https://aligndesigns.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        # Preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://aligndesigns.com' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
            add_header 'Access-Control-Max-Age' 86400;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    location /metrics {
        allow 127.0.0.1;
        deny all;
        proxy_pass http://localhost:3000/metrics;
    }
}
```

---

### 10.6 Renovación Automática de Certificados

Certbot instala un cron job y un systemd timer automáticamente.

**Verificar timer:**

```bash
sudo systemctl list-timers | grep certbot
# Output: certbot.timer ... (runs twice daily)

sudo systemctl status certbot.timer
```

**Probar renovación manual (dry run):**

```bash
sudo certbot renew --dry-run
# Output: Congratulations, all renewals succeeded.
```

**Cron job de Certbot:**

```bash
cat /etc/cron.d/certbot
# Output:
# 0 */12 * * * root test -x /usr/bin/certbot && perl -e 'sleep int(rand(43200))' && certbot -q renew
```

**Forzar renovación manual (si es necesario):**

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

### 10.7 Actualizar Variables de Entorno

**Actualizar `.env` en el servidor:**

```bash
cd /opt/align-designs

# Editar .env
nano .env
```

```env
# Frontend
NEXT_PUBLIC_API_URL=https://api.aligndesigns.com

# Backend
FRONTEND_URL=https://aligndesigns.com
ALLOWED_ORIGINS=https://aligndesigns.com,https://www.aligndesigns.com

# MinIO (acceso público para URLs de archivos)
MINIO_ENDPOINT=minio.aligndesigns.com
MINIO_USE_SSL=true
MINIO_PUBLIC_URL=https://minio.aligndesigns.com
```

**Reiniciar servicios:**

```bash
docker-compose down
docker-compose up -d
```

---

### 10.8 Verificación de SSL

**Probar HTTPS:**

```bash
# En tu máquina local
curl -I https://aligndesigns.com
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains

curl https://api.aligndesigns.com/health
# {"status":"ok",...}
```

**Verificar grado SSL (SSLLabs):**

```
https://www.ssllabs.com/ssltest/analyze.html?d=aligndesigns.com
```

**Objetivo:** Grade A o A+

**Verificar redirect HTTP → HTTPS:**

```bash
curl -I http://aligndesigns.com
# HTTP/1.1 301 Moved Permanently
# Location: https://aligndesigns.com/
```

---

### 10.9 Configuración Avanzada de NGINX (Opcional)

**Rate Limiting (prevenir abuso):**

```nginx
# /etc/nginx/nginx.conf - agregar en http block

http {
    # ... configuración existente ...

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    # Connection limits
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
}
```

**Aplicar en sitio:**

```nginx
# /etc/nginx/sites-available/aligndesigns - en location de API

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;
    proxy_pass http://localhost:3000;
    # ... resto de la config ...
}

location /auth/ {
    limit_req zone=auth_limit burst=5 nodelay;
    proxy_pass http://localhost:3000;
    # ... resto de la config ...
}
```

**Logging mejorado:**

```nginx
# /etc/nginx/nginx.conf

http {
    # Custom log format con más info
    log_format detailed '$remote_addr - $remote_user [$time_local] '
                        '"$request" $status $body_bytes_sent '
                        '"$http_referer" "$http_user_agent" '
                        'rt=$request_time uct="$upstream_connect_time" '
                        'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log detailed;
}
```

**Failover y Health Checks:**

```nginx
# Si tienes múltiples backends en el futuro

upstream backend_api {
    least_conn;  # Load balancing method
    server localhost:3000 max_fails=3 fail_timeout=30s;
    # server localhost:3002 backup;  # Backup server
}

server {
    location / {
        proxy_pass http://backend_api;
        # ... resto de config ...
    }
}
```

---

### 10.10 Monitoreo de NGINX

**Logs en tiempo real:**

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Logs específicos del sitio
sudo tail -f /var/log/nginx/aligndesigns.access.log
sudo tail -f /var/log/nginx/api.access.log
```

**Estadísticas de NGINX:**

```bash
# Agregar stub_status module
sudo nano /etc/nginx/sites-available/aligndesigns
```

```nginx
# Agregar location para stats (solo localhost)
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

```bash
curl http://localhost/nginx_status
# Output:
# Active connections: 5
# server accepts handled requests
#  1234 1234 5678
# Reading: 0 Writing: 1 Waiting: 4
```

---

### ✅ Checklist Step 10: SSL & Domain

- [ ] NGINX instalado y corriendo
- [ ] DNS configurado (A records para todos los subdominios)
- [ ] DNS propagado (verificado con dig)
- [ ] Configuración NGINX inicial creada
- [ ] Sitio habilitado en sites-enabled
- [ ] HTTP funcionando en puerto 80
- [ ] Certbot instalado
- [ ] Certificados SSL obtenidos para todos los dominios
- [ ] HTTPS funcionando en puerto 443
- [ ] Redirect HTTP → HTTPS funcionando
- [ ] Headers de seguridad configurados
- [ ] Renovación automática verificada (dry run)
- [ ] Variables de entorno actualizadas (HTTPS URLs)
- [ ] SSL Grade A o A+ en SSLLabs
- [ ] Logs de NGINX funcionando

---

## Step 11: Monitoring & Observability 📊

### Objetivos
- Configurar Prometheus para métricas
- Configurar Grafana con dashboards
- Implementar alertas básicas
- Configurar log aggregation (opcional)
- Establecer uptime monitoring

---

### 11.1 Configurar Prometheus

Ya tenemos Prometheus en docker-compose, ahora configuramos scraping.

**Crear directorio de configuración:**

```bash
mkdir -p /opt/align-designs/prometheus
cd /opt/align-designs/prometheus
```

**Crear `prometheus.yml`:**

```yaml
# /opt/align-designs/prometheus/prometheus.yml

global:
  scrape_interval: 15s       # Scrapear cada 15 segundos
  evaluation_interval: 15s   # Evaluar reglas cada 15 segundos
  external_labels:
    cluster: 'production'
    environment: 'prod'

# Alertmanager configuration (opcional)
alerting:
  alertmanagers:
    - static_configs:
        - targets: []
          # - 'alertmanager:9093'  # Si instalas Alertmanager

# Reglas de alertas (se cargan desde archivos)
rule_files:
  - 'alerts/*.yml'

# Scrape configurations
scrape_configs:
  # Backend NestJS
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (métricas del servidor)
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # PostgreSQL Exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis Exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # NGINX Exporter (opcional)
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

---

### 11.2 Agregar Exporters a docker-compose.yml

**Actualizar `docker-compose.yml`:**

```yaml
# /opt/align-designs/docker-compose.yml

services:
  # ... servicios existentes ...

  prometheus:
    image: prom/prometheus:latest
    container_name: align-prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts:/etc/prometheus/alerts:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
    ports:
      - "9090:9090"
    networks:
      - align-network

  grafana:
    image: grafana/grafana:latest
    container_name: align-grafana
    restart: unless-stopped
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=https://grafana.aligndesigns.com
      - GF_INSTALL_PLUGINS=redis-datasource
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
    networks:
      - align-network

  # Node Exporter (métricas del host)
  node-exporter:
    image: prom/node-exporter:latest
    container_name: align-node-exporter
    restart: unless-stopped
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - "9100:9100"
    networks:
      - align-network

  # PostgreSQL Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: align-postgres-exporter
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable"
    ports:
      - "9187:9187"
    depends_on:
      - postgres
    networks:
      - align-network

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: align-redis-exporter
    restart: unless-stopped
    environment:
      REDIS_ADDR: "redis:6379"
      REDIS_PASSWORD: "${REDIS_PASSWORD}"
    ports:
      - "9121:9121"
    depends_on:
      - redis
    networks:
      - align-network

  # NGINX Prometheus Exporter (opcional)
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: align-nginx-exporter
    restart: unless-stopped
    command:
      - '-nginx.scrape-uri=http://host.docker.internal/nginx_status'
    ports:
      - "9113:9113"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - align-network

volumes:
  prometheus_data:
  grafana_data:
  # ... otros volumes ...
```

**Agregar a `.env`:**

```env
# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_grafana_password_here
```

---

### 11.3 Configurar Grafana Datasources

**Crear directorio de provisioning:**

```bash
mkdir -p /opt/align-designs/grafana/provisioning/datasources
mkdir -p /opt/align-designs/grafana/dashboards
```

**Crear datasource de Prometheus:**

```yaml
# /opt/align-designs/grafana/provisioning/datasources/prometheus.yml

apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
    jsonData:
      timeInterval: '15s'
```

**Crear configuración de dashboard provisioning:**

```yaml
# /opt/align-designs/grafana/provisioning/dashboards/default.yml

apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

---

### 11.4 Crear Dashboards de Grafana

**Dashboard: Application Overview**

```json
// /opt/align-designs/grafana/dashboards/application-overview.json

{
  "dashboard": {
    "title": "Align Designs - Application Overview",
    "tags": ["application", "backend", "performance"],
    "timezone": "browser",
    "panels": [
      {
        "title": "HTTP Requests Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method, status_code)",
            "legendFormat": "{{method}} - {{status_code}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "HTTP Request Duration (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))",
            "legendFormat": "{{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "(sum(rate(cache_operations_total{operation=\"hit\"}[5m])) / sum(rate(cache_operations_total{operation=~\"hit|miss\"}[5m]))) * 100",
            "legendFormat": "Hit Rate %"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "Database Query Rate",
        "targets": [
          {
            "expr": "sum(rate(database_queries_total[5m])) by (model, operation)",
            "legendFormat": "{{model}} - {{operation}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "active_users",
            "legendFormat": "Active Users"
          }
        ],
        "type": "stat"
      }
    ],
    "refresh": "10s",
    "time": {
      "from": "now-1h",
      "to": "now"
    }
  }
}
```

**Dashboard: Infrastructure Monitoring**

```json
// /opt/align-designs/grafana/dashboards/infrastructure.json

{
  "dashboard": {
    "title": "Align Designs - Infrastructure",
    "tags": ["infrastructure", "system", "resources"],
    "panels": [
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "100 - (avg by (instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU %"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))",
            "legendFormat": "Memory %"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Disk Usage",
        "targets": [
          {
            "expr": "100 - ((node_filesystem_avail_bytes{mountpoint=\"/\",fstype!=\"rootfs\"} * 100) / node_filesystem_size_bytes{mountpoint=\"/\",fstype!=\"rootfs\"})",
            "legendFormat": "Disk %"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "Network Traffic",
        "targets": [
          {
            "expr": "rate(node_network_receive_bytes_total{device!=\"lo\"}[5m])",
            "legendFormat": "RX - {{device}}"
          },
          {
            "expr": "rate(node_network_transmit_bytes_total{device!=\"lo\"}[5m])",
            "legendFormat": "TX - {{device}}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

**Dashboard: Database & Redis**

```json
// /opt/align-designs/grafana/dashboards/database.json

{
  "dashboard": {
    "title": "Align Designs - Database & Cache",
    "tags": ["database", "redis", "postgresql"],
    "panels": [
      {
        "title": "PostgreSQL Active Connections",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"align_designs\"}",
            "legendFormat": "Connections"
          }
        ],
        "type": "graph"
      },
      {
        "title": "PostgreSQL Query Rate",
        "targets": [
          {
            "expr": "rate(pg_stat_database_xact_commit{datname=\"align_designs\"}[5m])",
            "legendFormat": "Commits/s"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Redis Memory Usage",
        "targets": [
          {
            "expr": "redis_memory_used_bytes / redis_memory_max_bytes * 100",
            "legendFormat": "Memory %"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "Redis Commands/sec",
        "targets": [
          {
            "expr": "rate(redis_commands_processed_total[5m])",
            "legendFormat": "Commands/s"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Redis Hit Rate",
        "targets": [
          {
            "expr": "rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m])) * 100",
            "legendFormat": "Hit Rate %"
          }
        ],
        "type": "gauge"
      }
    ]
  }
}
```

---

### 11.5 Configurar Alertas en Prometheus

**Crear directorio de alertas:**

```bash
mkdir -p /opt/align-designs/prometheus/alerts
```

**Crear reglas de alertas:**

```yaml
# /opt/align-designs/prometheus/alerts/application.yml

groups:
  - name: application_alerts
    interval: 30s
    rules:
      # HTTP Error Rate
      - alert: HighErrorRate
        expr: |
          (sum(rate(http_requests_total{status_code=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m]))) * 100 > 5
        for: 5m
        labels:
          severity: critical
          component: backend
        annotations:
          summary: "High HTTP error rate detected"
          description: "Error rate is {{ $value | humanize }}% (threshold: 5%)"

      # High Response Time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
          ) > 2
        for: 10m
        labels:
          severity: warning
          component: backend
        annotations:
          summary: "High API response time"
          description: "P95 response time is {{ $value | humanize }}s for route {{ $labels.route }}"

      # Cache Hit Rate Low
      - alert: LowCacheHitRate
        expr: |
          (sum(rate(cache_operations_total{operation="hit"}[10m]))
          / sum(rate(cache_operations_total{operation=~"hit|miss"}[10m]))) * 100 < 50
        for: 15m
        labels:
          severity: warning
          component: cache
        annotations:
          summary: "Cache hit rate below threshold"
          description: "Cache hit rate is {{ $value | humanize }}% (threshold: 50%)"

      # High Database Query Rate
      - alert: HighDatabaseLoad
        expr: sum(rate(database_queries_total[5m])) > 100
        for: 10m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "High database query rate"
          description: "Database is handling {{ $value | humanize }} queries/sec"
```

```yaml
# /opt/align-designs/prometheus/alerts/infrastructure.yml

groups:
  - name: infrastructure_alerts
    interval: 30s
    rules:
      # High CPU Usage
      - alert: HighCpuUsage
        expr: |
          100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is {{ $value | humanize }}% on {{ $labels.instance }}"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: |
          100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 85
        for: 10m
        labels:
          severity: warning
          component: system
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanize }}%"

      # Disk Almost Full
      - alert: DiskAlmostFull
        expr: |
          100 - ((node_filesystem_avail_bytes{mountpoint="/",fstype!="rootfs"} * 100)
          / node_filesystem_size_bytes{mountpoint="/",fstype!="rootfs"}) > 85
        for: 5m
        labels:
          severity: critical
          component: system
        annotations:
          summary: "Disk space running low"
          description: "Disk usage is {{ $value | humanize }}%"

      # Service Down
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
          component: system
        annotations:
          summary: "Service is down"
          description: "{{ $labels.job }} on {{ $labels.instance }} has been down for 2 minutes"
```

```yaml
# /opt/align-designs/prometheus/alerts/database.yml

groups:
  - name: database_alerts
    interval: 30s
    rules:
      # PostgreSQL Down
      - alert: PostgresqlDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "PostgreSQL is down"
          description: "PostgreSQL instance {{ $labels.instance }} is not responding"

      # Too Many Connections
      - alert: TooManyConnections
        expr: |
          pg_stat_database_numbackends{datname="align_designs"}
          / pg_settings_max_connections * 100 > 80
        for: 5m
        labels:
          severity: warning
          component: database
        annotations:
          summary: "PostgreSQL connection pool almost full"
          description: "Using {{ $value | humanize }}% of available connections"

      # Redis Down
      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
          component: cache
        annotations:
          summary: "Redis is down"
          description: "Redis instance {{ $labels.instance }} is not responding"

      # Redis Memory High
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90
        for: 5m
        labels:
          severity: warning
          component: cache
        annotations:
          summary: "Redis memory usage high"
          description: "Redis is using {{ $value | humanize }}% of allocated memory"
```

---

### 11.6 Reiniciar Servicios con Monitoreo

```bash
cd /opt/align-designs

# Detener servicios
docker-compose down

# Iniciar con nuevas configuraciones
docker-compose up -d

# Verificar que todos los exporters están corriendo
docker-compose ps

# Verificar logs
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

---

### 11.7 Acceder a Grafana

**Agregar Grafana a NGINX:**

```nginx
# /etc/nginx/sites-available/aligndesigns

# Agregar server block para Grafana
server {
    listen 80;
    listen [::]:80;
    server_name grafana.aligndesigns.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name grafana.aligndesigns.com;

    ssl_certificate /etc/letsencrypt/live/aligndesigns.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aligndesigns.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Obtener certificado SSL para Grafana:**

```bash
sudo certbot --nginx -d grafana.aligndesigns.com
sudo systemctl reload nginx
```

**Acceder:**

```
URL: https://grafana.aligndesigns.com
User: admin
Password: (valor de GRAFANA_ADMIN_PASSWORD en .env)
```

**Primera vez en Grafana:**

1. Login con admin/password
2. Cambiar password inmediatamente
3. Verificar datasource Prometheus (Configuration → Data Sources)
4. Importar dashboards (Dashboards → Browse)
5. Configurar notificaciones (opcional)

---

### 11.8 Configurar Notificaciones (Opcional)

**Slack Notifications:**

1. En Grafana: Alerting → Contact Points → New contact point
2. Name: Slack Notifications
3. Integration: Slack
4. Webhook URL: (obtener de Slack Incoming Webhooks)
5. Test → Save

**Email Notifications:**

Configurar en `docker-compose.yml`:

```yaml
grafana:
  environment:
    - GF_SMTP_ENABLED=true
    - GF_SMTP_HOST=smtp.gmail.com:587
    - GF_SMTP_USER=${SMTP_USER}
    - GF_SMTP_PASSWORD=${SMTP_PASSWORD}
    - GF_SMTP_FROM_ADDRESS=${SMTP_USER}
    - GF_SMTP_FROM_NAME=Align Designs Alerts
```

---

### 11.9 Uptime Monitoring Externo (Opcional)

**Opciones gratuitas:**

1. **UptimeRobot** (https://uptimerobot.com)
   - Monitor hasta 50 URLs gratis
   - Check interval: 5 minutos
   - Email/SMS/Slack notifications

2. **Pingdom Free** (https://pingdom.com)
   - 1 sitio gratis
   - Check interval: 1 minuto

3. **Better Uptime** (https://betteruptime.com)
   - 10 monitors gratis
   - Status page incluido

**Configuración UptimeRobot:**

```
Monitor Type: HTTPS
URL: https://aligndesigns.com
Monitoring Interval: 5 minutes
Alert Contacts: tu-email@example.com

Monitor Type: HTTPS
URL: https://api.aligndesigns.com/health
Keyword: "ok"
Monitoring Interval: 5 minutes
```

---

### 11.10 Log Aggregation (Opcional - Loki)

Si quieres logs centralizados, puedes agregar Grafana Loki:

```yaml
# docker-compose.yml - agregar servicio

  loki:
    image: grafana/loki:latest
    container_name: align-loki
    restart: unless-stopped
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki_data:/loki
    networks:
      - align-network

  promtail:
    image: grafana/promtail:latest
    container_name: align-promtail
    restart: unless-stopped
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail/promtail-config.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - align-network

volumes:
  loki_data:
```

**Promtail config:**

```yaml
# /opt/align-designs/promtail/promtail-config.yml

server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*.log
```

Luego en Grafana, agregar Loki como datasource y crear dashboards de logs.

---

### ✅ Checklist Step 11: Monitoring

- [ ] Prometheus configurado con scrape targets
- [ ] Node Exporter instalado y corriendo
- [ ] PostgreSQL Exporter instalado
- [ ] Redis Exporter instalado
- [ ] Grafana instalado y accesible
- [ ] Datasource Prometheus agregado en Grafana
- [ ] Dashboard "Application Overview" importado
- [ ] Dashboard "Infrastructure" importado
- [ ] Dashboard "Database & Cache" importado
- [ ] Alertas configuradas en Prometheus
- [ ] Alertas de aplicación creadas
- [ ] Alertas de infraestructura creadas
- [ ] Alertas de base de datos creadas
- [ ] Grafana accesible por HTTPS (grafana.aligndesigns.com)
- [ ] Notificaciones configuradas (Slack/Email)
- [ ] Uptime monitoring externo configurado
- [ ] Logs agregados (opcional - Loki)
- [ ] Password de Grafana cambiado
- [ ] Todos los servicios de monitoreo corriendo

---

## Step 12: Documentation & Final Setup 📝

### Objetivos
- Crear runbook de deployment
- Documentar procedimientos operacionales
- Crear guía de troubleshooting
- Documentar procedimientos de emergencia
- Consolidar toda la documentación

---

### 12.1 Deployment Runbook

```markdown
# /opt/align-designs/docs/DEPLOYMENT_RUNBOOK.md

# Align Designs - Deployment Runbook

## Pre-Deployment Checklist

### Antes de cada deployment:

- [ ] Revisar CHANGELOG o commits desde último deploy
- [ ] Verificar que CI pipeline pasó exitosamente
- [ ] Verificar que no hay migraciones de DB peligrosas (DROP, ALTER destructivo)
- [ ] Notificar al equipo del deployment (si aplica)
- [ ] Crear backup manual de DB si deployment es riesgoso
- [ ] Verificar que hay espacio en disco suficiente

```bash
# Verificar espacio
df -h
# Verificar memoria
free -h
# Verificar servicios corriendo
docker-compose ps
```

---

## Standard Deployment (Automated via GitHub Actions)

### 1. Crear PR y esperar aprobación

```bash
git checkout -b feature/nueva-funcionalidad
# ... hacer cambios ...
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### 2. GitHub Actions ejecuta CI automáticamente

- Lint (backend + frontend)
- Tests (backend + frontend)
- Type check
- Build

### 3. Merge a main después de aprobación

```bash
gh pr create --title "feat: nueva funcionalidad" --body "Descripción..."
# Esperar review y CI pass
gh pr merge --squash
```

### 4. GitHub Actions ejecuta CD automáticamente

- Build Docker images
- Push to ghcr.io
- SSH to server
- Pull new images
- Rolling restart con health checks

### 5. Verificar deployment

```bash
# Desde tu máquina local
curl https://aligndesigns.com/
curl https://api.aligndesigns.com/health

# Verificar logs en el servidor
ssh align@your-droplet-ip
docker-compose logs -f --tail=100 backend
docker-compose logs -f --tail=100 frontend
```

---

## Manual Deployment (Fallback)

Si GitHub Actions falla o necesitas deploy manual urgente:

### 1. Conectar al servidor

```bash
ssh align@your-droplet-ip
cd /opt/align-designs
```

### 2. Actualizar código

```bash
git fetch origin
git checkout main
git pull origin main
```

### 3. Rebuild y restart servicios

```bash
# Opción A: Solo restart (si no hay cambios en Dockerfile)
docker-compose pull backend frontend
docker-compose up -d backend frontend

# Opción B: Full rebuild (si hay cambios en Dockerfile)
docker-compose build backend frontend
docker-compose up -d backend frontend

# Verificar que iniciaron correctamente
docker-compose ps
```

### 4. Ejecutar migraciones (si aplica)

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 5. Verificar health

```bash
curl http://localhost:3000/health
curl http://localhost:3001/api/health
```

---

## Database Migrations

### Pre-Migration Checklist

- [ ] Crear backup de DB antes de migración
- [ ] Revisar SQL generado por Prisma
- [ ] Verificar que no hay DROP o ALTER destructivo sin justificación
- [ ] Planear rollback si es necesario

### Ejecutar Migración

```bash
# Crear backup primero
bash /opt/align-designs/scripts/backup-postgres.sh

# Ver SQL que se ejecutará
docker-compose exec backend npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script

# Ejecutar migración
docker-compose exec backend npx prisma migrate deploy

# Verificar que aplicó correctamente
docker-compose exec backend npx prisma migrate status
```

### Rollback de Migración

```bash
# Si la migración falló, restaurar DB
bash /opt/align-designs/scripts/restore-postgres.sh /backups/postgres/db_20250123_020000.sql.gz

# Reiniciar backend
docker-compose restart backend
```

---

## Rollback Deployment

### Rollback vía Docker images

```bash
cd /opt/align-designs

# Ver tags disponibles
docker images | grep backend

# Rollback a imagen anterior
docker-compose stop backend frontend

docker tag ghcr.io/your-org/align-designs/backend:previous ghcr.io/your-org/align-designs/backend:latest
docker tag ghcr.io/your-org/align-designs/frontend:previous ghcr.io/your-org/align-designs/frontend:latest

docker-compose up -d backend frontend

# Verificar
docker-compose logs -f backend
```

### Rollback vía Git

```bash
cd /opt/align-designs

# Encontrar commit anterior estable
git log --oneline -n 10

# Rollback
git checkout <commit-hash-anterior>

# Rebuild
docker-compose build backend frontend
docker-compose up -d backend frontend
```

---

## Post-Deployment Verification

### Checklist de verificación:

- [ ] Frontend accesible (https://aligndesigns.com)
- [ ] Backend API accesible (https://api.aligndesigns.com/health)
- [ ] Login funciona correctamente
- [ ] Crear un proyecto de prueba funciona
- [ ] Subir archivo funciona
- [ ] Métricas reportando en Grafana
- [ ] No hay errores críticos en logs
- [ ] Response time < 500ms (P95)
- [ ] Error rate < 1%

```bash
# Test suite automatizado
curl -f https://aligndesigns.com/ || echo "Frontend DOWN"
curl -f https://api.aligndesigns.com/health || echo "Backend DOWN"

# Ver logs en tiempo real
docker-compose logs -f --tail=50 backend frontend

# Ver métricas en Grafana
open https://grafana.aligndesigns.com
```

---

## Monitoring Post-Deployment

### Durante 1 hora después del deploy, monitorear:

1. **Grafana Dashboard** (Application Overview)
   - HTTP error rate (debe estar < 1%)
   - Response time P95 (debe estar < 1s)
   - Cache hit rate (debe estar > 50%)

2. **Logs**
   ```bash
   docker-compose logs -f backend | grep ERROR
   docker-compose logs -f backend | grep WARN
   ```

3. **Resource Usage**
   ```bash
   docker stats
   ```

4. **Database Connections**
   ```bash
   docker-compose exec postgres psql -U postgres -d align_designs -c "SELECT count(*) FROM pg_stat_activity;"
   ```

---

## Emergency Procedures

### Backend completamente DOWN

```bash
# 1. Verificar logs
docker-compose logs backend --tail=100

# 2. Reiniciar
docker-compose restart backend

# 3. Si no funciona, rollback
git checkout <commit-anterior-estable>
docker-compose build backend
docker-compose up -d backend

# 4. Notificar al equipo
```

### Database corruption

```bash
# 1. Detener backend para evitar más daño
docker-compose stop backend

# 2. Verificar integridad de DB
docker-compose exec postgres psql -U postgres -c "SELECT pg_database_size('align_designs');"

# 3. Restaurar desde backup más reciente
bash /opt/align-designs/scripts/restore-postgres.sh /backups/postgres/db_latest.sql.gz

# 4. Reiniciar servicios
docker-compose up -d backend
```

### Disk Full

```bash
# 1. Verificar uso de disco
df -h
du -sh /var/lib/docker/*
du -sh /opt/align-designs/*

# 2. Limpiar Docker
docker system prune -a -f
docker volume prune -f

# 3. Limpiar logs viejos
find /var/log -type f -name "*.log" -mtime +7 -delete
find /backups -type f -mtime +7 -delete

# 4. Si es urgente, limpiar caches
docker-compose exec redis redis-cli FLUSHALL
```

### SSL Certificate Expired

```bash
# 1. Renovar manualmente
sudo certbot renew --force-renewal

# 2. Recargar NGINX
sudo systemctl reload nginx

# 3. Verificar
curl -I https://aligndesigns.com
```

---

## Contact Information

**DevOps Lead:** Tu Nombre
**Email:** tu-email@example.com
**Slack:** #devops-alerts

**Infrastructure Provider:** DigitalOcean
**Support:** https://cloud.digitalocean.com/support

---
```

---

### 12.2 Operations Manual

```markdown
# /opt/align-designs/docs/OPERATIONS_MANUAL.md

# Align Designs - Operations Manual

## Daily Operations

### Morning Checklist (10 min)

1. **Verificar Uptime**
   - Revisar UptimeRobot dashboard
   - Verificar que no hubo downtime nocturno

2. **Revisar Grafana**
   - Abrir: https://grafana.aligndesigns.com
   - Dashboard: Application Overview (últimas 24h)
   - Verificar métricas clave:
     - Error rate < 1%
     - Response time P95 < 1s
     - Cache hit rate > 50%

3. **Revisar Alertas**
   - Verificar emails/Slack de alertas
   - Resolver alertas pendientes

4. **Verificar Backups**
   ```bash
   ssh align@your-droplet-ip
   ls -lh /backups/postgres/ | tail -n 5
   ls -lh /backups/redis/ | tail -n 5
   ls -lh /backups/minio/ | tail -n 3
   ```

---

## Weekly Operations

### Monday (30 min)

1. **Revisar métricas semanales**
   - Grafana: Application Overview (últimos 7 días)
   - Identificar tendencias (crecimiento de usuarios, requests, etc.)

2. **Dependency updates**
   - Revisar GitHub Dependabot alerts
   - Planear updates de dependencias críticas

3. **Capacity planning**
   - Revisar uso de recursos (CPU, RAM, Disk)
   - Proyectar si necesitas upgrade en 1-2 meses

### Wednesday (20 min)

1. **Security updates**
   ```bash
   ssh align@your-droplet-ip
   sudo apt update
   sudo apt list --upgradable
   # Aplicar updates críticos (con cuidado)
   ```

2. **SSL Certificate check**
   ```bash
   echo | openssl s_client -servername aligndesigns.com -connect aligndesigns.com:443 2>/dev/null | openssl x509 -noout -dates
   ```

### Friday (15 min)

1. **Test backups**
   - Elegir un backup random de la semana
   - Restaurar en ambiente local/test
   - Verificar integridad

2. **Documentación**
   - Actualizar CHANGELOG si hubo deploys
   - Documentar cualquier incidente de la semana

---

## Monthly Operations

### First Monday of Month (1-2 hours)

1. **Full backup verification**
   - Restaurar backup completo en server de test
   - Verificar que aplicación funciona correctamente

2. **Disaster recovery drill**
   - Simular falla de servidor
   - Practicar restore completo

3. **Security audit**
   - Revisar usuarios con acceso SSH
   - Revisar logs de acceso inusuales
   - Actualizar passwords de servicios
   - Rotar secrets si es necesario

4. **Cost review**
   - Revisar billing de DigitalOcean
   - Identificar oportunidades de optimización

5. **Performance review**
   - Revisar métricas del mes (Grafana)
   - Identificar bottlenecks
   - Planear optimizaciones

---

## Routine Maintenance Tasks

### Log Rotation (Automated)

Ya configurado en `/etc/logrotate.d/`, pero verificar:

```bash
cat /etc/logrotate.d/nginx
# Debería rotar logs cada día, mantener 14 días
```

### Docker Cleanup (Weekly)

```bash
# Agregar a crontab
0 2 * * 0 docker system prune -a -f --volumes --filter "until=168h"
```

### Database Vacuum (Monthly)

```bash
# Agregar a crontab
0 3 1 * * docker-compose exec -T postgres vacuumdb -U postgres -d align_designs -z -v
```

### Redis AOF Rewrite (Weekly)

```bash
# Agregar a crontab
0 3 * * 0 docker-compose exec -T redis redis-cli BGREWRITEAOF
```

---

## Access Management

### SSH Access

**Usuarios con acceso:**
- `align` (usuario principal)
- Tu usuario personal (si aplica)

**Agregar nuevo usuario:**

```bash
sudo adduser newuser
sudo usermod -aG docker newuser
sudo mkdir /home/newuser/.ssh
sudo cp /home/align/.ssh/authorized_keys /home/newuser/.ssh/
sudo chown -R newuser:newuser /home/newuser/.ssh
```

**Remover usuario:**

```bash
sudo deluser --remove-home username
```

### GitHub Access

**Repositorios:**
- `align-designs-demo` - Código principal

**Secrets necesarios en GitHub:**
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD` o `GITHUB_TOKEN`
- `DROPLET_IP`
- `DROPLET_SSH_KEY`
- `DATABASE_URL` (producción)
- `REDIS_PASSWORD`
- Etc. (ver `.env.example`)

---

## Service Management

### Reiniciar Servicios Individuales

```bash
# Backend
docker-compose restart backend

# Frontend
docker-compose restart frontend

# PostgreSQL (cuidado - causa downtime)
docker-compose restart postgres

# Redis (cuidado - pierde cache in-memory)
docker-compose restart redis

# NGINX (en host, no Docker)
sudo systemctl restart nginx
```

### Ver Logs

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend

# Con timestamps
docker-compose logs -f --timestamps backend

# Últimas 100 líneas
docker-compose logs --tail=100 backend

# Logs de NGINX (en host)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Entrar a Container

```bash
# Backend (para debugging)
docker-compose exec backend sh

# PostgreSQL (para queries manuales)
docker-compose exec postgres psql -U postgres -d align_designs

# Redis (para ver cache)
docker-compose exec redis redis-cli
```

---

## Performance Tuning

### Si Backend es lento:

1. **Verificar cache hit rate**
   ```bash
   curl http://localhost:9090/api/v1/query?query=cache_hit_rate
   ```
   - Si < 50%, revisar qué endpoints no están cacheados

2. **Verificar query performance**
   - Ver logs de queries lentas en PostgreSQL
   - Considerar índices adicionales

3. **Verificar resource usage**
   ```bash
   docker stats backend
   ```
   - Si CPU > 80%, considerar upgrade de Droplet
   - Si Memory > 80%, revisar memory leaks

### Si Database es lento:

1. **Verificar conexiones activas**
   ```bash
   docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Ver queries lentas**
   ```bash
   docker-compose exec postgres psql -U postgres -d align_designs -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';"
   ```

3. **Ejecutar VACUUM**
   ```bash
   docker-compose exec postgres vacuumdb -U postgres -d align_designs -z -v
   ```

---

## Cost Optimization

### Current Infrastructure Cost

- **DigitalOcean Droplet** (2 vCPU, 2GB RAM): $12/month
- **Total**: ~$12-15/month

### Optimization Tips

1. **Use DigitalOcean Spaces for files** (cuando crezca)
   - $5/month por 250GB (más escalable que MinIO)

2. **CDN para static assets**
   - DigitalOcean CDN gratis con Spaces

3. **Managed Redis** (solo si necesitas cluster)
   - $15/month (no recomendado aún)

4. **Managed PostgreSQL** (solo si necesitas HA)
   - $15/month (no recomendado aún)

---

## Compliance & Security

### Data Protection

- **Backups**: Automáticos diarios (7 días retention)
- **Encryption at rest**: PostgreSQL, Redis, MinIO (considerar en futuro)
- **Encryption in transit**: SSL/TLS obligatorio (HTTPS)

### Access Logs

```bash
# Ver accesos SSH
sudo journalctl -u ssh -n 100

# Ver Fail2ban bans
sudo fail2ban-client status sshd

# Ver intentos de login fallidos
sudo lastb | head -n 20
```

### Security Updates

```bash
# Verificar actualizaciones de seguridad
sudo apt update
sudo apt list --upgradable | grep -i security

# Aplicar solo updates de seguridad
sudo unattended-upgrades -d
```

---

## Contact & Escalation

### Internal Team

- **Developer Team Lead:** [Nombre]
- **DevOps Lead:** [Nombre]
- **Product Owner:** [Nombre]

### External Vendors

- **DigitalOcean Support:** https://cloud.digitalocean.com/support
- **Domain Registrar:** [Proveedor]
- **Email Provider:** [Proveedor]

### Escalation Path

1. **Level 1**: Developer on-call (resolver en 1 hora)
2. **Level 2**: DevOps Lead (si Level 1 no puede resolver)
3. **Level 3**: Vendor support (DigitalOcean, etc.)

---
```

---

### 12.3 Troubleshooting Guide

```markdown
# /opt/align-designs/docs/TROUBLESHOOTING.md

# Align Designs - Troubleshooting Guide

## Common Issues & Solutions

---

### Issue: "Cannot connect to backend API"

**Symptoms:**
- Frontend muestra error "Network Error"
- `curl https://api.aligndesigns.com/health` falla

**Possible Causes:**

1. **Backend container down**
   ```bash
   docker-compose ps backend
   # Si no está "Up", verificar logs
   docker-compose logs backend --tail=50
   ```
   **Fix:**
   ```bash
   docker-compose restart backend
   ```

2. **NGINX misconfigured**
   ```bash
   sudo nginx -t
   ```
   **Fix:**
   ```bash
   sudo nano /etc/nginx/sites-available/aligndesigns
   # Corregir configuración
   sudo systemctl reload nginx
   ```

3. **PostgreSQL connection issues**
   ```bash
   docker-compose exec backend npx prisma db execute --stdin <<< "SELECT 1;"
   ```
   **Fix:**
   ```bash
   # Verificar DATABASE_URL en .env
   docker-compose restart postgres
   docker-compose restart backend
   ```

---

### Issue: "Frontend shows blank page"

**Symptoms:**
- `https://aligndesigns.com` muestra página en blanco
- Console errors en browser

**Possible Causes:**

1. **Frontend container down**
   ```bash
   docker-compose logs frontend --tail=50
   ```

2. **Build error en Next.js**
   ```bash
   docker-compose exec frontend ls -la .next/
   # Debería existir carpeta .next/standalone
   ```
   **Fix:**
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

3. **Environment variables incorrectas**
   ```bash
   docker-compose exec frontend env | grep NEXT_PUBLIC
   ```
   **Fix:**
   ```bash
   nano .env
   # Corregir NEXT_PUBLIC_API_URL
   docker-compose up -d frontend
   ```

---

### Issue: "High Response Time"

**Symptoms:**
- Grafana muestra P95 > 2s
- Aplicación se siente lenta

**Diagnosis:**

1. **Check cache hit rate**
   ```bash
   curl -s http://localhost:9090/api/v1/query?query=cache_hit_rate | jq
   ```
   - Si < 50%, cache no está funcionando bien

2. **Check database load**
   ```bash
   docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
   ```

3. **Check resource usage**
   ```bash
   docker stats
   ```

**Fixes:**

- **Low cache hit rate:**
  ```bash
  # Verificar que Redis está corriendo
  docker-compose ps redis

  # Verificar REDIS_ENABLED=true en .env
  grep REDIS_ENABLED .env
  ```

- **High database load:**
  ```bash
  # Ver queries lentas
  docker-compose logs backend | grep "Query took"

  # Agregar índices si es necesario
  ```

- **High CPU/Memory:**
  ```bash
  # Upgrade Droplet si es necesario
  doctl compute droplet list
  doctl compute droplet-action resize <droplet-id> --size s-2vcpu-4gb
  ```

---

### Issue: "502 Bad Gateway"

**Symptoms:**
- NGINX devuelve 502 error
- `curl https://api.aligndesigns.com` muestra "502 Bad Gateway"

**Possible Causes:**

1. **Backend no está escuchando en puerto correcto**
   ```bash
   docker-compose exec backend netstat -tuln | grep 3000
   ```

2. **NGINX no puede conectar al backend**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   # Buscar "upstream" errors
   ```

**Fix:**

```bash
# Reiniciar backend
docker-compose restart backend

# Esperar a que inicie (verificar health)
sleep 10
curl http://localhost:3000/health

# Si sigue fallando, revisar logs
docker-compose logs backend
```

---

### Issue: "SSL Certificate Error"

**Symptoms:**
- Browser muestra "Your connection is not private"
- SSL Labs muestra grado F

**Diagnosis:**

```bash
# Verificar certificado
echo | openssl s_client -servername aligndesigns.com -connect aligndesigns.com:443 2>/dev/null | openssl x509 -noout -dates

# Verificar Certbot
sudo certbot certificates
```

**Fixes:**

1. **Certificado expirado:**
   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload nginx
   ```

2. **Certificado no encontrado:**
   ```bash
   sudo certbot --nginx -d aligndesigns.com -d www.aligndesigns.com -d api.aligndesigns.com
   ```

3. **NGINX no está usando certificado correcto:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Issue: "Database Connection Pool Exhausted"

**Symptoms:**
- Logs muestran "Connection pool timeout"
- Backend responde muy lento o falla

**Diagnosis:**

```bash
docker-compose exec postgres psql -U postgres -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

**Fixes:**

1. **Aumentar pool size:**
   ```typescript
   // apps/backend/prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
     relationMode = "prisma"

     // Agregar:
     pool_size = 20  // Default: 10
   }
   ```

2. **Matar conexiones idle:**
   ```bash
   docker-compose exec postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '10 minutes';"
   ```

---

### Issue: "Out of Memory (OOM)"

**Symptoms:**
- Container se reinicia solo
- `docker-compose logs` muestra "Killed"
- `dmesg` muestra OOM killer

**Diagnosis:**

```bash
# Ver uso de memoria
docker stats

# Ver logs del sistema
sudo dmesg | grep -i "out of memory"
```

**Fixes:**

1. **Short-term: Agregar swap**
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Long-term: Upgrade Droplet**
   ```bash
   # Resize a 4GB RAM
   doctl compute droplet-action resize <droplet-id> --size s-2vcpu-4gb
   ```

3. **Optimize containers:**
   ```yaml
   # docker-compose.yml - agregar memory limits
   services:
     backend:
       mem_limit: 512m
       mem_reservation: 256m
   ```

---

### Issue: "Disk Full"

**Symptoms:**
- `df -h` muestra 100% usage
- Docker falla al crear containers
- Logs muestran "no space left on device"

**Diagnosis:**

```bash
df -h
du -sh /var/lib/docker/*
du -sh /opt/align-designs/*
du -sh /backups/*
```

**Fixes:**

1. **Clean Docker:**
   ```bash
   docker system prune -a -f
   docker volume prune -f
   ```

2. **Clean old backups:**
   ```bash
   find /backups -type f -mtime +7 -delete
   ```

3. **Clean logs:**
   ```bash
   sudo journalctl --vacuum-time=7d
   find /var/log -type f -name "*.log" -mtime +7 -delete
   ```

4. **If urgent, resize disk:**
   ```bash
   # En DigitalOcean dashboard, resize el Droplet
   # Luego extender filesystem
   sudo resize2fs /dev/vda1
   ```

---

### Issue: "High Cache Miss Rate"

**Symptoms:**
- Grafana muestra cache hit rate < 30%
- Backend hace muchas queries a DB

**Diagnosis:**

```bash
# Ver métricas de cache
curl -s http://localhost:9090/api/v1/query?query=cache_operations_total | jq

# Ver logs de cache misses
docker-compose logs backend | grep "Cache miss"
```

**Possible Causes:**

1. **Redis no está conectado:**
   ```bash
   docker-compose ps redis
   docker-compose logs redis
   ```

2. **Cache keys cambian frecuentemente:**
   ```bash
   # Ver logs de invalidaciones
   docker-compose logs backend | grep "Cache invalidated"
   ```

3. **TTL muy corto:**
   ```typescript
   // Revisar apps/backend/src/cache/constants/cache-keys.ts
   // Aumentar TTL si es necesario
   ```

**Fixes:**

- Verificar REDIS_ENABLED=true
- Reiniciar Redis si hay problemas
- Ajustar TTL de cache
- Implementar cache warming (pre-cargar cache)

---

### Issue: "Prometheus Not Scraping Metrics"

**Symptoms:**
- Grafana dashboards vacíos
- Prometheus targets muestran "DOWN"

**Diagnosis:**

```bash
# Verificar Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Ver logs de Prometheus
docker-compose logs prometheus
```

**Fixes:**

1. **Backend no expone /metrics:**
   ```bash
   curl http://localhost:3000/metrics
   # Debería devolver texto plano con métricas
   ```

2. **Prometheus no puede conectar:**
   ```bash
   # Verificar networking en docker-compose
   docker network inspect align-designs_align-network
   ```

3. **Configuración incorrecta:**
   ```bash
   nano /opt/align-designs/prometheus/prometheus.yml
   # Verificar scrape_configs
   docker-compose restart prometheus
   ```

---

### Issue: "Cannot SSH to Server"

**Symptoms:**
- `ssh align@your-droplet-ip` falla
- Connection refused o timeout

**Diagnosis:**

```bash
# Verificar que droplet está corriendo
doctl compute droplet list

# Verificar que SSH está escuchando (desde DigitalOcean console)
sudo systemctl status sshd
sudo netstat -tuln | grep :22
```

**Fixes:**

1. **SSH service down:**
   ```bash
   # Desde DigitalOcean console
   sudo systemctl start sshd
   ```

2. **Firewall bloqueando:**
   ```bash
   sudo ufw status
   sudo ufw allow 22/tcp
   ```

3. **Fail2ban bloqueó tu IP:**
   ```bash
   sudo fail2ban-client status sshd
   sudo fail2ban-client set sshd unbanip YOUR_IP
   ```

---

### Issue: "GitHub Actions Deployment Fails"

**Symptoms:**
- CD pipeline falla en GitHub Actions
- Deploy no se ejecuta

**Diagnosis:**

1. Ver logs en GitHub Actions UI

2. **Errores comunes:**
   - SSH key incorrecto
   - Server no accesible
   - Docker commands fallan

**Fixes:**

1. **SSH key issue:**
   ```bash
   # Regenerar y actualizar secret
   ssh-keygen -t ed25519 -C "github-actions"
   # Copiar a GitHub Secrets: DROPLET_SSH_KEY
   ```

2. **Server not accessible:**
   ```bash
   # Verificar que droplet está corriendo
   # Verificar que SSH acepta key authentication
   ```

3. **Docker permission issue:**
   ```bash
   # En el servidor
   sudo usermod -aG docker align
   # Logout y login again
   ```

---

## Debug Commands Reference

### Quick Health Check

```bash
# All-in-one health check
curl -f https://aligndesigns.com/ && \
curl -f https://api.aligndesigns.com/health && \
docker-compose ps && \
docker stats --no-stream && \
df -h

echo "✅ All systems operational"
```

### Performance Profiling

```bash
# Backend response time
time curl https://api.aligndesigns.com/api/projects

# Database query time
docker-compose exec postgres psql -U postgres -d align_designs -c "\timing on" -c "SELECT count(*) FROM \"Project\";"

# Cache latency
docker-compose exec redis redis-cli --latency
```

### Log Search

```bash
# Find errors in last hour
docker-compose logs --since 1h backend | grep -i error

# Find specific endpoint logs
docker-compose logs backend | grep "GET /api/projects"

# NGINX access logs with specific status code
sudo grep "HTTP/1.1\" 500" /var/log/nginx/access.log
```

---

## When All Else Fails

### Nuclear Option: Full Restart

```bash
cd /opt/align-designs

# Stop everything
docker-compose down

# Clean up
docker system prune -f

# Start fresh
docker-compose up -d

# Wait and verify
sleep 30
curl http://localhost:3000/health
curl http://localhost:3001/
```

### Emergency Rollback

```bash
# Rollback to last stable version
cd /opt/align-designs
git log --oneline -n 10
git checkout <last-stable-commit>
docker-compose down
docker-compose build
docker-compose up -d
```

### Contact Support

If issue persists:
1. Gather logs: `docker-compose logs > logs.txt`
2. Gather system info: `docker stats > stats.txt` and `df -h > disk.txt`
3. Contact DevOps team or create issue in GitHub

---
```

---

### 12.4 Update Main README

Finalmente, actualizar el README principal del proyecto:

```bash
nano /opt/align-designs/README.md
```

Agregar sección de enlaces a documentación:

```markdown
## 📚 Documentation

### Phase 1: Performance Optimization
- [Phase 1 Integration Review](./PHASE_1_INTEGRATION_REVIEW.md)

### Phase 2: DevOps & Infrastructure
- [Phase 2 DevOps Plan](./PHASE_2_DEVOPS_PLAN.md)
- [Scaling Guide](./docs/SCALING_GUIDE.md)
- **Implementation Guides:**
  - [Part 1: Docker Setup & Backups](./docs/PHASE_2_IMPLEMENTATION_GUIDE.md) (Steps 1-5)
  - [Part 2: CI/CD & DigitalOcean](./docs/PHASE_2_IMPLEMENTATION_GUIDE_PART2.md) (Steps 6-9)
  - [Part 3: SSL, Monitoring & Operations](./docs/PHASE_2_IMPLEMENTATION_GUIDE_PART3.md) (Steps 10-12)

### Operations
- [Deployment Runbook](./docs/DEPLOYMENT_RUNBOOK.md)
- [Operations Manual](./docs/OPERATIONS_MANUAL.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

## 🚀 Quick Start

### Development (Local)

```bash
# With Docker
docker-compose up -d

# Without Docker
npm install
npm run dev
```

### Production Deployment

See [Deployment Runbook](./docs/DEPLOYMENT_RUNBOOK.md)

## 🔧 Configuration

See `.env.example` for all available environment variables.

## 📊 Monitoring

- **Grafana:** https://grafana.aligndesigns.com
- **Prometheus:** http://localhost:9090 (server only)
- **Metrics Endpoint:** https://api.aligndesigns.com/metrics

## 🐛 Troubleshooting

See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

## 📞 Support

- **Issues:** https://github.com/your-org/align-designs-demo/issues
- **Email:** devops@aligndesigns.com
```

---

### ✅ Checklist Step 12: Documentation

- [ ] DEPLOYMENT_RUNBOOK.md creado
  - [ ] Pre-deployment checklist
  - [ ] Standard deployment procedure
  - [ ] Manual deployment fallback
  - [ ] Database migrations guide
  - [ ] Rollback procedures
  - [ ] Post-deployment verification
  - [ ] Emergency procedures

- [ ] OPERATIONS_MANUAL.md creado
  - [ ] Daily operations checklist
  - [ ] Weekly maintenance tasks
  - [ ] Monthly audit procedures
  - [ ] Routine maintenance automation
  - [ ] Access management procedures
  - [ ] Service management commands
  - [ ] Performance tuning guide
  - [ ] Cost optimization tips
  - [ ] Contact & escalation info

- [ ] TROUBLESHOOTING.md creado
  - [ ] Common issues cataloged
  - [ ] Step-by-step diagnosis procedures
  - [ ] Proven fixes documented
  - [ ] Debug commands reference
  - [ ] Emergency procedures
  - [ ] Escalation path

- [ ] Main README.md updated
  - [ ] Links to all documentation
  - [ ] Quick start guide
  - [ ] Configuration overview
  - [ ] Monitoring links
  - [ ] Support contacts

---

## Phase 2 Complete! 🎉

Congratulations! You now have:

✅ **Comprehensive Documentation:**
- 3-part implementation guide (Steps 1-12)
- Scaling guide for future growth
- Operations manual for day-to-day management
- Deployment runbook for safe deployments
- Troubleshooting guide for common issues

✅ **Production-Ready Infrastructure Plan:**
- Docker containerization
- CI/CD with GitHub Actions
- SSL/HTTPS with Let's Encrypt
- Monitoring with Prometheus + Grafana
- Automated backups
- Security hardening

---

## Next Actions

### Immediate:
1. **Review all documentation** with your team
2. **Approve plan** and confirm any adjustments needed

### When Ready to Implement:
1. Start with **Part 1**: Docker setup (2-3 hours)
2. Then **Part 2**: CI/CD (2-3 hours)
3. Finally **Part 3**: SSL & Monitoring (2-3 hours)
4. **Total time**: 6-9 hours for full Phase 2 implementation

### Future (Phase 3):
- Fix 76 failing tests
- Increase test coverage to 70-80%
- Add E2E tests with Playwright

---

**¿Listo para comenzar la implementación?** 🚀
