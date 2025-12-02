# 🚀 Guía Paso a Paso: De Cero a Producción

**Para:** Desarrolladores que van a implementar Phase 2
**Tiempo estimado:** 1-2 días de trabajo
**Nivel:** Intermedio (con explicaciones)

---

## 📖 Qué Vamos a Hacer

Vamos a transformar tu aplicación de desarrollo local a un ambiente de producción profesional con:
- Docker para empaquetar todo
- GitHub Actions para deployments automáticos
- DigitalOcean para hosting
- SSL gratis con certificados automáticos
- Monitoreo con dashboards bonitos
- Backups automáticos

**No te preocupes:** Vamos paso a paso y te explico todo.

---

## ✋ Antes de Empezar (30 minutos)

### Paso 0.1: Verifica que Tengas Estas Cuentas

#### GitHub
1. ¿Ya tienes cuenta en GitHub?
   - ✅ **SÍ:** Perfecto, continúa
   - ❌ **NO:** Ve a https://github.com/signup y crea una (gratis)

2. ¿Tu código ya está en GitHub?
   - ✅ **SÍ:** Genial
   - ❌ **NO:** Crea un repo y sube tu código:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/align-designs-demo.git
     git push -u origin main
     ```

#### DigitalOcean
1. ¿Tienes cuenta en DigitalOcean?
   - ✅ **SÍ:** Cool
   - ❌ **NO:** Ve a https://www.digitalocean.com/
     - Usa un código de referral para $200 gratis (busca "DigitalOcean promo code")
     - Necesitarás agregar una tarjeta (te cobran $1 para verificar y te lo regresan)

#### Dominio (Opcional pero Recomendado)

**⚠️ IMPORTANTE:** DigitalOcean **NO** te da un dominio. Solo te da una **IP pública** (ej: 167.99.123.45)

**Tus opciones:**

1. **Opción A: Usar solo la IP** (Para empezar/testing)
   - ✅ Gratis, funciona inmediatamente
   - ❌ Difícil de recordar, no profesional
   - ❌ Sin SSL/HTTPS fácilmente
   - **Úsalo para:** Desarrollo, testing, demos internos

2. **Opción B: Comprar un dominio** (Para producción)
   - ✅ Profesional (your_minio_user.com)
   - ✅ SSL/HTTPS gratis con Let's Encrypt
   - ✅ Fácil de recordar y compartir
   - **Costo:** ~$8-12/año (menos de $1/mes)
   - **Úsalo para:** Aplicación en producción con clientes reales

**¿Dónde comprar dominios?**

| Proveedor | Precio/año | Recomendación |
|-----------|------------|---------------|
| **Namecheap** | $8-12 | 🏆 Mejor opción (fácil y barato) |
| **Cloudflare** | $10 | Excelente DNS incluido |
| **Porkbun** | $7-10 | Más barato |
| **Google Domains** | $12 | Si usas Google Workspace |

**💡 Mi recomendación:**
- **Si estás empezando:** Usa la IP por ahora, compra dominio después
- **Si es para producción:** Compra dominio en Namecheap ($10/año)

**¿Ya tienes dominio?** ✅ Anótalo aquí: `_________________.com`

---

### Paso 0.2: Instala las Herramientas que Necesitas

#### En tu Computadora Local:

**1. Docker Desktop**
- **¿Ya lo tienes?** Abre terminal y escribe: `docker --version`
  - ✅ Si ves algo como "Docker version 24.0.6" → Ya lo tienes
  - ❌ Si dice "command not found" → Necesitas instalarlo

- **Para instalarlo:**
  - **Windows/Mac:** https://www.docker.com/products/docker-desktop/
  - **Linux:**
    ```bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    ```

**2. GitHub CLI (opcional pero útil)**
```bash
# Mac
brew install gh

# Windows
winget install GitHub.cli

# Linux
sudo apt install gh
```

Luego autentícate:
```bash
gh auth login
```

**3. Node.js (ya deberías tenerlo)**
Verifica: `node --version` (debe ser v18 o superior)

---

### Paso 0.3: Entiende la Arquitectura (5 min de lectura)

**Antes:** Todo corría en tu computadora
```
Tu laptop → Backend + Frontend + PostgreSQL + Redis
```

**Después:** Todo correrá en contenedores Docker en un servidor
```
                    ┌─────────────────────────────┐
                    │   GitHub (tu código)        │
                    └──────────┬──────────────────┘
                               │ push to main
                               ↓
                    ┌─────────────────────────────┐
                    │   GitHub Actions (CI/CD)    │
                    │   - Ejecuta tests           │
                    │   - Build Docker images     │
                    │   - Deploy automático       │
                    └──────────┬──────────────────┘
                               │ deploy
                               ↓
┌────────────────────────────────────────────────────────────┐
│  DigitalOcean Droplet (tu servidor en la nube)            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Backend  │  │ Frontend │  │PostgreSQL│  │  Redis   │ │
│  │ :3000    │  │ :3001    │  │ :5432    │  │ :6379    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  MinIO   │  │Prometheus│  │ Grafana  │                │
│  │ :9000    │  │ :9090    │  │ :3002    │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│                                                             │
│  Todo esto orquestado por Docker Compose                   │
└────────────────────────────────────────────────────────────┘
                               ↓
                    ┌─────────────────────────────┐
                    │   NGINX (Reverse Proxy)     │
                    │   - Maneja SSL/HTTPS        │
                    │   - Rutea tráfico           │
                    └──────────┬──────────────────┘
                               ↓
                        TU DOMINIO.COM
                    (o IP del servidor)
```

**¿Por qué Docker?**
- Todo corre igual en tu laptop, en el servidor, y en cualquier lado
- Si funciona en tu máquina, funcionará en producción (de verdad)
- Fácil de actualizar: solo cambias la versión del contenedor

**¿Por qué DigitalOcean?**
- Barato ($12/mes para empezar)
- Fácil de usar
- Buenos tutoriales
- Puedes escalar cuando crezcas

---

## 📦 FASE 1: Dockerizar la Aplicación (2-3 horas)

### Paso 1.1: Crea el Dockerfile del Backend

**¿Qué es un Dockerfile?**
Es como una receta que le dice a Docker cómo empaquetar tu aplicación.

**Crea este archivo:** `apps/backend/Dockerfile`

```dockerfile
# Etapa 1: Construir la app
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# Limpiar dependencias de desarrollo
RUN npm prune --production

# Etapa 2: Imagen de producción (más liviana)
FROM node:18-alpine AS production

# Crear usuario no-root (seguridad)
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copiar solo lo necesario desde builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package*.json ./

USER nestjs
EXPOSE 3000

# Health check (Docker verifica que esté vivo)
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
```

**💡 ¿Qué hace esto?**
- **Etapa 1 (builder):** Instala todo, compila tu código TypeScript
- **Etapa 2 (production):** Solo copia lo compilado (más rápido y seguro)
- **Usuario nestjs:** No corre como root (mejor seguridad)
- **Health check:** Docker puede verificar si tu app está funcionando

---

### Paso 1.2: Crea el Dockerfile del Frontend

**Crea este archivo:** `apps/frontend/Dockerfile`

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js necesita esto
ENV NEXT_TELEMETRY_DISABLED 1

# Build optimizado
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js 14+ tiene modo standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3001

CMD ["node", "server.js"]
```

**💡 ¿Qué hace esto?**
- Compila tu app de Next.js en modo standalone (más eficiente)
- Elimina todo lo que no se necesita en producción
- Corre con usuario no-privilegiado

---

### Paso 1.3: Configura Next.js para Standalone

**Edita:** `apps/frontend/next.config.js`

Agrega esta línea:

```javascript
module.exports = {
  // ... tu config existente ...
  output: 'standalone', // ← Agrega esta línea
}
```

**💡 ¿Por qué?**
Next.js generará una versión super optimizada que incluye solo lo necesario.

---

### Paso 1.4: Crea el .dockerignore

Esto le dice a Docker qué **NO** copiar (hace el build más rápido).

**Backend:** `apps/backend/.dockerignore`
```
node_modules
dist
.git
.env
.env.*
npm-debug.log
coverage
.vscode
```

**Frontend:** `apps/frontend/.dockerignore`
```
node_modules
.next
.git
.env
.env.*
npm-debug.log
.vscode
```

---

### Paso 1.5: Prueba los Dockerfiles Localmente

```bash
# Backend
cd apps/backend
docker build -t align-backend:test .

# Si funciona, verás: "Successfully tagged align-backend:test"

# Frontend
cd apps/frontend
docker build -t align-frontend:test .

# Si funciona, verás: "Successfully tagged align-frontend:test"
```

**❌ ¿Errores comunes?**
- "Cannot find module 'prisma'": Asegúrate de correr `npx prisma generate` antes
- "npm ci failed": Verifica que `package-lock.json` exista
- "Permission denied": Estás en Windows? Asegúrate que Docker Desktop esté corriendo

---

### Paso 1.6: Crea el docker-compose.yml

Este archivo orquesta TODOS tus servicios.

**Crea:** `docker-compose.yml` (en la raíz del proyecto)

```yaml
version: '3.9'

services:
  # Base de datos
  postgres:
    image: postgres:14-alpine
    container_name: align-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-align_designs}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - align-network

  # Cache
  redis:
    image: redis:7-alpine
    container_name: align-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis123}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - align-network

  # Storage (S3-compatible)
  minio:
    image: minio/minio:latest
    container_name: align-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin123}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - align-network

  # Tu Backend
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    container_name: align-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-align_designs}
      REDIS_ENABLED: "true"
      REDIS_URL: redis://default:${REDIS_PASSWORD:-redis123}@redis:6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_USE_SSL: "false"
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD:-minioadmin123}
      JWT_SECRET: ${JWT_SECRET}
      CSRF_SECRET: ${CSRF_SECRET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    networks:
      - align-network

  # Tu Frontend
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    container_name: align-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3000}
    ports:
      - "3001:3001"
    depends_on:
      - backend
    networks:
      - align-network

  # Métricas
  prometheus:
    image: prom/prometheus:latest
    container_name: align-prometheus
    restart: unless-stopped
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - align-network

  # Dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: align-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD:-admin}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3002:3000"
    depends_on:
      - prometheus
    networks:
      - align-network

volumes:
  postgres_data:
  redis_data:
  minio_data:
  prometheus_data:
  grafana_data:

networks:
  align-network:
    driver: bridge
```

**💡 ¿Qué hace esto?**
- Define todos tus servicios (backend, frontend, DB, etc.)
- Los conecta en una red privada
- Crea volúmenes para persistir datos
- Configura health checks para saber cuándo están listos

---

### Paso 1.7: Crea el Archivo de Variables de Entorno

**Crea:** `.env` (en la raíz del proyecto)

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=cambiar_en_produccion_123
POSTGRES_DB=align_designs

# Redis
REDIS_PASSWORD=cambiar_en_produccion_456

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=cambiar_en_produccion_789

# Backend
JWT_SECRET=tu-secret-super-seguro-minimo-32-caracteres
CSRF_SECRET=otro-secret-diferente-tambien-32-chars

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Grafana
GRAFANA_ADMIN_PASSWORD=cambiar_en_produccion_grafana
```

**💡 Importante:**
- Estos passwords son de ejemplo, **CÁMBIALOS** antes de producción
- Nunca subas este archivo a Git (ya está en `.gitignore`)

---

### Paso 1.8: Prueba Todo Junto

```bash
# Levanta todo
docker-compose up -d

# Espera 30 segundos a que todo arranque
sleep 30

# Verifica que estén corriendo
docker-compose ps
```

**Deberías ver algo así:**
```
NAME                IMAGE                    STATUS
align-backend       align-designs-backend    Up
align-frontend      align-designs-frontend   Up
align-postgres      postgres:14-alpine       Up (healthy)
align-redis         redis:7-alpine           Up (healthy)
align-minio         minio/minio:latest       Up (healthy)
align-prometheus    prom/prometheus:latest   Up
align-grafana       grafana/grafana:latest   Up
```

---

### Paso 1.9: Verifica que Funcione

Abre tu navegador:

1. **Frontend:** http://localhost:3001
   - ✅ Deberías ver tu aplicación

2. **Backend Health:** http://localhost:3000/health
   - ✅ Deberías ver: `{"status":"ok"...}`

3. **MinIO Console:** http://localhost:9001
   - Login: minioadmin / minioadmin123
   - ✅ Deberías ver el dashboard de MinIO

4. **Grafana:** http://localhost:3002
   - Login: admin / admin
   - ✅ Deberías ver Grafana

**❌ ¿No funciona?**
```bash
# Ver logs de un servicio específico
docker-compose logs backend

# Ver logs de todos
docker-compose logs

# Reiniciar todo
docker-compose down
docker-compose up -d
```

---

### 🎉 Checkpoint 1: ¿Todo Funciona Localmente?

- [ ] Docker Desktop está instalado y corriendo
- [ ] `docker-compose up -d` levanta todo sin errores
- [ ] Frontend muestra tu aplicación
- [ ] Backend responde en /health
- [ ] Puedes hacer login y probar funcionalidades básicas

**✅ Si todo funciona, ¡felicidades!** Has dockerizado tu aplicación.
**❌ Si algo falla, revisa los logs:** `docker-compose logs [servicio]`

---

## 🔧 FASE 2: Configurar GitHub Actions (1-2 horas)

### Paso 2.1: Entiende Qué Vamos a Automatizar

**Workflow actual (manual):**
```
Tú → Editas código
Tú → Corres tests
Tú → Haces build
Tú → Subes al servidor
Tú → Reinicias servicios
```

**Workflow automatizado (GitHub Actions):**
```
Tú → Push to GitHub
     ↓
GitHub Actions → Corre tests automáticamente
                → Build automático
                → Deploy automático al servidor
                → Te notifica si algo falla
```

**¿Por qué?**
- No más "olvidé correr los tests"
- No más "funciona en mi máquina"
- Deploy en 5 minutos en vez de 30

---

### Paso 2.2: Crea el Workflow de CI (Continuous Integration)

**Crea:** `.github/workflows/ci.yml`

```yaml
name: CI - Tests y Build

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  # Test del backend
  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Descargar código
        uses: actions/checkout@v4

      - name: Instalar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: apps/backend/package-lock.json

      - name: Instalar dependencias
        working-directory: apps/backend
        run: npm ci

      - name: Generar Prisma
        working-directory: apps/backend
        run: npx prisma generate

      - name: Correr tests
        working-directory: apps/backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        run: npm test

  # Build del backend
  build-backend:
    name: Build Backend
    runs-on: ubuntu-latest
    needs: test-backend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Build
        working-directory: apps/backend
        run: |
          npm ci
          npx prisma generate
          npm run build

      - name: Verificar que build existe
        working-directory: apps/backend
        run: |
          if [ ! -f "dist/main.js" ]; then
            echo "❌ Build falló"
            exit 1
          fi
          echo "✅ Build exitoso"

  # Build del frontend
  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Build
        working-directory: apps/frontend
        run: |
          npm ci
          npm run build
```

**💡 ¿Qué hace esto?**
- Cada vez que haces push, GitHub corre automáticamente:
  1. Instala dependencias
  2. Corre tests del backend
  3. Hace build del backend y frontend
  4. Te avisa si algo falla

---

### Paso 2.3: Prueba el CI

```bash
# Haz un pequeño cambio
echo "# Test CI" >> README.md

# Commit y push
git add .
git commit -m "test: probar GitHub Actions CI"
git push origin main
```

**Ahora ve a GitHub:**
1. Ve a tu repositorio en GitHub
2. Click en la tab "Actions"
3. Deberías ver tu workflow corriendo

**Espera 2-5 minutos...**
- ✅ Si todo está verde: ¡Funciona!
- ❌ Si algo está rojo: Click para ver el error

---

### 🎉 Checkpoint 2: ¿CI Funciona?

- [ ] Workflow aparece en GitHub Actions
- [ ] Tests pasan (verde)
- [ ] Build funciona (verde)
- [ ] No hay errores rojos

**✅ Continúa a la siguiente fase**

---

## 🌐 FASE 3: Configurar el Servidor (2-3 horas)

### Paso 3.1: Crear el Droplet en DigitalOcean

**Opción A: Por la Web (Más fácil)**

1. Ve a https://cloud.digitalocean.com/
2. Click en "Create" → "Droplets"
3. Configuración:
   ```
   Image: Ubuntu 22.04 LTS
   Plan: Basic
   CPU: Regular (Disk type: SSD)
   Size: $24/month (2 GB, 2 vCPUs, 60 GB SSD) ← Este está bien
   Datacenter: Elige el más cercano a tus usuarios
     - Si estás en México/USA: NYC3 o SFO3
     - Si estás en Europa: AMS3 o FRA1

   Authentication: SSH Key (recomendado)
     ↓ Si no tienes SSH key:
       1. En tu terminal: ssh-keygen -t ed25519
       2. Copia el contenido de: cat ~/.ssh/id_ed25519.pub
       3. Pégalo en DigitalOcean

   Hostname: align-designs-prod
   ```

4. Click "Create Droplet"
5. **Espera 1-2 minutos**
6. Copia la IP de tu droplet (ejemplo: 167.99.123.45)

---

### Paso 3.2: Conéctate al Servidor

```bash
# Reemplaza con TU IP
ssh root@167.99.123.45

# Primera vez te preguntará:
# "Are you sure you want to continue connecting?"
# Escribe: yes
```

**Ahora estás DENTRO de tu servidor en la nube** 🎉

---

### Paso 3.3: Configura el Servidor (15 min)

Copia y pega estos comandos (uno por uno):

```bash
# 1. Actualizar sistema
apt update && apt upgrade -y

# 2. Instalar herramientas básicas
apt install -y curl wget git vim ufw fail2ban

# 3. Configurar firewall
ufw allow 22     # SSH
ufw allow 80     # HTTP
ufw allow 443    # HTTPS
ufw --force enable

# 4. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 5. Instalar Docker Compose
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# 6. Verificar instalaciones
docker --version          # Debe mostrar: Docker version...
docker compose version    # Debe mostrar: Docker Compose version...

# 7. Crear directorio para la app
mkdir -p /opt/align-designs
cd /opt/align-designs
```

**✅ Si todo funciona, continúa**

---

### Paso 3.4: Configurar Usuario Deploy (Mejor Seguridad)

```bash
# Crear usuario (no uses root en producción)
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Configurar SSH para deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Cambiar ownership del directorio de la app
chown -R deploy:deploy /opt/align-designs
```

**Prueba que funciona:**
```bash
# Sal del servidor
exit

# Conéctate como deploy
ssh deploy@167.99.123.45

# Deberías estar dentro como usuario 'deploy'
whoami  # Debe mostrar: deploy
```

---

### Paso 3.5: Configura Variables de Entorno en el Servidor

```bash
cd /opt/align-designs

# Crea el archivo .env
nano .env
```

Pega esto (PERO CAMBIA LOS PASSWORDS):

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=TU_PASSWORD_SEGURO_AQUI_123
POSTGRES_DB=align_designs

# Redis
REDIS_PASSWORD=TU_PASSWORD_REDIS_456

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=TU_PASSWORD_MINIO_789

# Backend
JWT_SECRET=genera-un-secret-random-de-32-caracteres-minimo
CSRF_SECRET=otro-secret-diferente-tambien-de-32-chars

# Frontend
NEXT_PUBLIC_API_URL=https://api.tudominio.com

# Grafana
GRAFANA_ADMIN_PASSWORD=password-grafana-seguro
```

**Para generar passwords seguros:**
```bash
# En tu terminal (no en el servidor)
openssl rand -base64 32
# Copia el resultado y úsalo como password
```

Guarda el archivo: `Ctrl + X`, luego `Y`, luego `Enter`

---

### 🎉 Checkpoint 3: ¿Servidor Listo?

- [ ] Puedes conectarte por SSH
- [ ] Docker está instalado
- [ ] Docker Compose está instalado
- [ ] Usuario 'deploy' creado
- [ ] Archivo `.env` configurado en el servidor

**✅ Continúa a configurar el deployment automático**

---

## 🚀 FASE 4: Deployment Automático (1-2 horas)

### Paso 4.1: Configura Secrets en GitHub

Ve a tu repositorio en GitHub:
1. Click en "Settings"
2. Click en "Secrets and variables" → "Actions"
3. Click en "New repository secret"

**Agrega estos secrets:**

| Name | Value | ¿Dónde lo obtengo? |
|------|-------|-------------------|
| `DROPLET_IP` | 167.99.123.45 | Tu IP de DigitalOcean |
| `DROPLET_USER` | deploy | El usuario que creaste |
| `SSH_PRIVATE_KEY` | -----BEGIN OPENSSH... | Ver abajo ⬇️ |

**Para obtener tu SSH_PRIVATE_KEY:**

```bash
# En tu terminal (tu computadora)
cat ~/.ssh/id_ed25519

# Copia TODO desde -----BEGIN hasta -----END
```

Pega todo el contenido (incluye los BEGIN/END) en el secret.

---

### Paso 4.2: Crea el Workflow de CD (Deployment)

**Crea:** `.github/workflows/cd-production.yml`

```yaml
name: CD - Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:  # Permite deploy manual

jobs:
  deploy:
    name: Deploy to DigitalOcean
    runs-on: ubuntu-latest

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add server to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.DROPLET_IP }} >> ~/.ssh/known_hosts

      - name: Deploy al servidor
        env:
          DROPLET_IP: ${{ secrets.DROPLET_IP }}
          DROPLET_USER: ${{ secrets.DROPLET_USER }}
        run: |
          ssh $DROPLET_USER@$DROPLET_IP << 'EOF'
            cd /opt/align-designs

            # Actualizar código
            git pull origin main || git clone https://github.com/${{ github.repository }}.git .

            # Rebuild y restart
            docker compose down
            docker compose build
            docker compose up -d

            # Limpiar imágenes viejas
            docker image prune -af

            echo "✅ Deploy completado!"
          EOF

      - name: Health check
        run: |
          echo "Esperando a que servicios inicien..."
          sleep 30

          curl -f http://${{ secrets.DROPLET_IP }}:3000/health || exit 1
          echo "✅ Backend está funcionando!"
```

---

### Paso 4.3: Prepara el Servidor para Recibir Deployments

Conéctate al servidor y clona tu repo:

```bash
ssh deploy@TU_DROPLET_IP

cd /opt/align-designs

# Clona tu repositorio
git clone https://github.com/TU_USUARIO/align-designs-demo.git .

# Verifica que el .env existe
ls -la .env

# Si no existe, créalo (ver Paso 3.5)
```

---

### Paso 4.4: Primer Deployment Manual

Antes de automatizar, hagamos un deploy manual:

```bash
# En el servidor
cd /opt/align-designs

# Primera vez: build todo
docker compose build

# Levantar servicios
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Para salir de los logs: Ctrl + C
```

**Espera 2-3 minutos...**

```bash
# Verifica que todo esté corriendo
docker compose ps

# Prueba el backend
curl http://localhost:3000/health
# Debe devolver: {"status":"ok"...}
```

**✅ Si funciona, ya tienes tu app corriendo en producción!**

---

### Paso 4.5: Prueba el Deployment Automático

Ahora probemos que GitHub pueda deployar automáticamente:

```bash
# En tu computadora (no en el servidor)
cd tu-proyecto

# Haz un cambio pequeño
echo "# Test auto-deploy" >> README.md

# Commit y push
git add .
git commit -m "test: auto-deploy"
git push origin main
```

**Ve a GitHub Actions:**
1. Deberías ver el workflow "CD - Deploy to Production" corriendo
2. Espera 3-5 minutos
3. Si todo es verde ✅ = ¡Funcionó!

---

### 🎉 Checkpoint 4: ¿Deployment Automático Funciona?

- [ ] Secrets configurados en GitHub
- [ ] Workflow CD creado
- [ ] Deploy manual funcionó
- [ ] Push a main triggerea deploy automático
- [ ] Backend responde en tu servidor

**✅ ¡Ya tienes CI/CD funcionando!**

---

## 🔒 FASE 5: Configurar SSL y Dominio (30 min - 1 hora)

**⚠️ Recordatorio:** Tienes 2 opciones aquí:
- **Opción A:** Solo usar la IP (más rápido, para testing)
- **Opción B:** Configurar dominio + SSL (profesional, para producción)

---

### Paso 5.0: Comprar Dominio (Si Decidiste Comprarlo)

**¿Ya tienes dominio?** → Salta al Paso 5.1

**¿Necesitas comprar uno?** Sigue estos pasos:

1. **Ve a Namecheap:** https://www.namecheap.com
2. **Busca tu dominio:** Escribe "your_minio_user" (o el nombre que quieras)
3. **Verifica disponibilidad:**
   - ✅ `.com` disponible → Cómpralo ($10-12/año)
   - ❌ `.com` tomado → Prueba `.io`, `.app`, `.dev` (~$15-20/año)
4. **Agregar al carrito** y pagar
5. **Espera 5 minutos** → Recibirás email de confirmación
6. **Ve a tu panel:** Dashboard → Domain List

**💡 Tip:** NO compres servicios extra (hosting, email, etc.). Solo necesitas el dominio.

---

### Paso 5.1: Configura tu Dominio

#### Opción A: Si compraste en Namecheap

1. **Login en Namecheap:** https://ap.www.namecheap.com/
2. **Domain List** → Click en "Manage" en tu dominio
3. **Advanced DNS** tab
4. **Elimina** todos los records existentes
5. **Agrega estos records:**

```
Type: A Record
Host: @
Value: TU_DROPLET_IP (ej: 167.99.123.45)
TTL: Automatic

Type: A Record
Host: www
Value: TU_DROPLET_IP
TTL: Automatic

Type: A Record
Host: api
Value: TU_DROPLET_IP
TTL: Automatic
```

6. **Guarda cambios** (botón verde)

#### Opción B: Si compraste en otro proveedor

El proceso es similar, busca "DNS Management" o "DNS Settings" en tu panel.

---

### Paso 5.1b: Verifica que DNS Funcione

**Espera 10-30 minutos** (toma un café ☕)

```bash
# En tu computadora, prueba:
dig tudominio.com +short
# Debe mostrar tu IP: 167.99.123.45

dig www.tudominio.com +short
# Debe mostrar tu IP: 167.99.123.45

dig api.tudominio.com +short
# Debe mostrar tu IP: 167.99.123.45
```

**❌ ¿No funciona?**
- Espera más tiempo (puede tardar hasta 2 horas)
- Verifica que pusiste la IP correcta
- Verifica que guardaste los cambios

**✅ ¿Funciona?** ¡Continúa al siguiente paso!

---

### Paso 5.1c: (Alternativa) Si NO Tienes Dominio

Si decidiste usar solo la IP por ahora:

**Tu aplicación estará en:**
```
Frontend: http://TU_DROPLET_IP:3001
Backend:  http://TU_DROPLET_IP:3000
```

**Limitaciones:**
- ❌ No podrás usar SSL fácilmente (no HTTPS)
- ❌ Tendrás que recordar la IP
- ❌ No es profesional para mostrar a clientes

**Para usar solo IP, salta directamente al Paso 5.2**

---

### Paso 5.2: Instala NGINX en el Servidor

```bash
ssh deploy@TU_DROPLET_IP

# Instalar NGINX
sudo apt update
sudo apt install -y nginx

# Verificar
sudo systemctl status nginx
# Debe estar "active (running)"
```

Ahora si vas a `http://TU_DROPLET_IP` deberías ver la página de bienvenida de NGINX.

---

### Paso 5.3: Configura NGINX como Reverse Proxy

```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/your_minio_user
```

Pega esto (CAMBIA `tudominio.com` por tu dominio real):

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Guarda:** `Ctrl + X`, `Y`, `Enter`

**Activa la configuración:**
```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/your_minio_user /etc/nginx/sites-enabled/

# Remover config default
sudo rm /etc/nginx/sites-enabled/default

# Verificar sintaxis
sudo nginx -t

# Recargar NGINX
sudo systemctl reload nginx
```

**Prueba:**
- Ve a `http://tudominio.com` → Deberías ver tu frontend
- Ve a `http://api.tudominio.com/health` → Deberías ver el JSON de health

---

### Paso 5.4: Instala Certificados SSL (GRATIS con Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificados (CAMBIA tudominio.com)
sudo certbot --nginx -d tudominio.com -d www.tudominio.com -d api.tudominio.com

# Te preguntará:
# 1. Email: tu-email@example.com
# 2. Accept Terms: Yes
# 3. Redirect HTTP to HTTPS: 2 (Yes)
```

**Espera 30 segundos...**

Si todo funciona verás:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/tudominio.com/fullchain.pem
```

---

### Paso 5.5: Verifica HTTPS

Ve a tu dominio:
- `https://tudominio.com` → Debe funcionar y mostrar 🔒
- `https://api.tudominio.com/health` → Debe funcionar

**Verifica el grado SSL:**
- Ve a: https://www.ssllabs.com/ssltest/analyze.html?d=tudominio.com
- Deberías tener grado **A** o **A+**

---

### 🎉 Checkpoint 5: ¿SSL Configurado?

- [ ] Dominio apunta a tu servidor
- [ ] NGINX instalado y configurado
- [ ] Certbot instaló certificados SSL
- [ ] HTTPS funciona (muestra el candado 🔒)
- [ ] HTTP redirect a HTTPS automáticamente

**✅ ¡Tu aplicación ahora es segura!**

---

## 📊 FASE 6: Configurar Monitoreo (Opcional pero Recomendado)

### Paso 6.1: Accede a Grafana

Ve a: `http://TU_DROPLET_IP:3002`

**Login:**
- Usuario: admin
- Password: (el que pusiste en `.env` como `GRAFANA_ADMIN_PASSWORD`)

**Cámbiale el password inmediatamente**

---

### Paso 6.2: Agrega Prometheus como Data Source

1. Click en ⚙️ (Settings) → "Data sources"
2. Click "Add data source"
3. Selecciona "Prometheus"
4. URL: `http://prometheus:9090`
5. Click "Save & test"
6. Debe decir "Data source is working"

---

### Paso 6.3: Ve las Métricas de tu App

1. Click en el dashboard icon (4 cuadrados)
2. Click "New" → "Import"
3. Pega este número: `1860` (Node Exporter Full)
4. Click "Load"
5. Select Prometheus data source
6. Click "Import"

**Ahora verás:**
- CPU usage
- Memory usage
- Disk usage
- Network traffic

¡Todo en tiempo real! 📈

---

## 🎯 ¡LO LOGRASTE!

### ¿Qué Acabas de Hacer?

✅ Dockerizaste tu aplicación completa
✅ Configuraste CI/CD automático
✅ Desplegaste a un servidor en la nube
✅ Configuraste SSL (HTTPS) gratis
✅ Agregaste monitoreo profesional

### Tu Workflow Ahora Es:

```
1. Editas código en tu laptop
2. git push origin main
3. GitHub corre tests automáticamente
4. Si pasan, hace deploy automático
5. Tu app actualizada está en producción en 5 minutos
6. Recibes notificación de éxito/error
```

---

## 📝 Comandos Útiles que Necesitarás

### En el Servidor:

```bash
# Ver todos los contenedores
docker compose ps

# Ver logs de un servicio
docker compose logs backend
docker compose logs -f backend  # En tiempo real

# Reiniciar un servicio
docker compose restart backend

# Reiniciar todo
docker compose down
docker compose up -d

# Ver uso de recursos
docker stats

# Limpiar imágenes viejas
docker image prune -af
```

### Localmente:

```bash
# Probar cambios localmente
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down

# Rebuild después de cambios
docker-compose build
docker-compose up -d
```

---

## 🆘 Troubleshooting Rápido

### "No puedo conectarme al servidor"
```bash
# Verifica que el droplet esté corriendo
# En DigitalOcean dashboard debe decir "Active"

# Verifica firewall
ssh root@TU_IP
ufw status
# Debe mostrar: 22, 80, 443 ALLOW
```

### "GitHub Actions falla al deployar"
```bash
# Verifica secrets en GitHub
# Settings → Secrets → Actions
# Debe tener: DROPLET_IP, DROPLET_USER, SSH_PRIVATE_KEY

# Prueba SSH manual
ssh deploy@TU_IP
# Si falla, revisa tu SSH key
```

### "502 Bad Gateway"
```bash
# Backend no está corriendo
ssh deploy@TU_IP
docker compose ps
docker compose logs backend

# Reiniciar backend
docker compose restart backend
```

### "Base de datos no conecta"
```bash
# Verificar que Postgres esté corriendo
docker compose ps postgres

# Ver logs
docker compose logs postgres

# Verificar DATABASE_URL en .env
cat /opt/align-designs/.env | grep DATABASE_URL
```

---

## 📚 Próximos Pasos

Ahora que tienes todo funcionando, puedes:

1. **Configurar backups automáticos** (ver `docs/PHASE_2_IMPLEMENTATION_GUIDE.md` Step 5)
2. **Agregar más dashboards** en Grafana
3. **Configurar alertas** cuando algo falle
4. **Escalar** cuando tengas más usuarios (ver `docs/SCALING_GUIDE.md`)

---

## 🤝 ¿Necesitas Ayuda?

Si algo no funciona:
1. Lee los logs: `docker compose logs [servicio]`
2. Revisa la documentación técnica completa
3. Busca el error específico en Google
4. Revisa la guía de troubleshooting: `docs/PHASE_2_IMPLEMENTATION_GUIDE_PART3.md` (Step 12.3)

---

**¡Felicidades! Ahora tienes una aplicación en producción de nivel profesional** 🎉🚀
