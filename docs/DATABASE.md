# Documentación de Base de Datos

## Información General

- **Motor:** PostgreSQL 16.11 (Debian)
- **Nombre de la BD:** AlignDesignsDemo
- **Esquema Principal:** aligndesigns
- **Encoding:** UTF8
- **Locale:** en_US.utf8
- **Timezone:** UTC

## Conexión

### Credenciales

#### Usuario de Aplicación (Recomendado)
```
Host:     192.168.0.139
Port:     5432
Database: AlignDesignsDemo
Username: Alfonso
Password: NoloseBaseDeDatos12345@
Schema:   aligndesigns
```

#### Usuario Administrativo (Solo para tareas admin)
```
Host:     192.168.0.139
Port:     5432
Database: AlignDesignsDemo
Username: postgres
Password: NolosePostgres12345!
Schema:   public, aligndesigns
```

### Cadenas de Conexión

#### psql (CLI)
```bash
# Usuario Alfonso
psql -h 192.168.0.139 -U Alfonso -d AlignDesignsDemo

# Usuario postgres
psql -h 192.168.0.139 -U postgres -d AlignDesignsDemo
```

#### Connection String (para aplicaciones)
```
# PostgreSQL URL
postgresql://Alfonso:NoloseBaseDeDatos12345%40@192.168.0.139:5432/AlignDesignsDemo?schema=aligndesigns

# Prisma DATABASE_URL
DATABASE_URL="postgresql://Alfonso:NoloseBaseDeDatos12345%40@192.168.0.139:5432/AlignDesignsDemo?schema=aligndesigns"
```

⚠️ **Nota:** El símbolo `@` en la contraseña debe ser URL-encoded como `%40`

## Estructura del Esquema

### Esquema: aligndesigns

```sql
-- Ver esquema actual
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'aligndesigns';

-- Ver extensiones instaladas
SELECT * FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

### Extensiones Instaladas

#### 1. uuid-ossp
Generación de UUIDs (Universally Unique Identifiers)

```sql
-- Ejemplo de uso
SELECT aligndesigns.uuid_generate_v4();
-- Resultado: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

#### 2. pgcrypto
Funciones criptográficas para hashing de contraseñas

```sql
-- Ejemplo: Hash de contraseña
SELECT aligndesigns.crypt('mi_contraseña', aligndesigns.gen_salt('bf'));

-- Ejemplo: Verificar contraseña
SELECT aligndesigns.crypt('mi_contraseña', stored_hash) = stored_hash;
```

## Modelo de Datos (Futuro - Prisma)

### Tablas Principales

#### users
Almacena usuarios del sistema (Admins y Clientes)

```sql
CREATE TABLE aligndesigns.users (
  id UUID PRIMARY KEY DEFAULT aligndesigns.uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT,  -- Solo para Admins
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CLIENT')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON aligndesigns.users(email);
CREATE INDEX idx_users_role ON aligndesigns.users(role);
```

#### projects
Proyectos creados por Admins

```sql
CREATE TABLE aligndesigns.projects (
  id UUID PRIMARY KEY DEFAULT aligndesigns.uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES aligndesigns.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES aligndesigns.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_client_id ON aligndesigns.projects(client_id);
CREATE INDEX idx_projects_created_by ON aligndesigns.projects(created_by);
```

#### files
Archivos subidos a proyectos

```sql
CREATE TABLE aligndesigns.files (
  id UUID PRIMARY KEY DEFAULT aligndesigns.uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES aligndesigns.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES aligndesigns.users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,  -- Ruta en MinIO
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_files_project_id ON aligndesigns.files(project_id);
CREATE INDEX idx_files_uploaded_by ON aligndesigns.files(uploaded_by);
```

#### otp_tokens
Tokens de un solo uso para login de Clientes

```sql
CREATE TABLE aligndesigns.otp_tokens (
  id UUID PRIMARY KEY DEFAULT aligndesigns.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES aligndesigns.users(id) ON DELETE CASCADE,
  token VARCHAR(8) NOT NULL,  -- 8 dígitos para mayor seguridad
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_user_id ON aligndesigns.otp_tokens(user_id);
CREATE INDEX idx_otp_token ON aligndesigns.otp_tokens(token) WHERE NOT used;
CREATE INDEX idx_otp_expires ON aligndesigns.otp_tokens(expires_at) WHERE NOT used;
```

### Relaciones

```
users (1) ──< projects (N)
  │ client_id
  │
  └──< files (N)
      uploaded_by

users (1) ──< otp_tokens (N)
  user_id

projects (1) ──< files (N)
  project_id
```

## Permisos del Usuario Alfonso

### Permisos Otorgados

```sql
-- Ver permisos del usuario
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'Alfonso';

-- Ver permisos del esquema
SELECT
  grantee,
  privilege_type
FROM information_schema.usage_privileges
WHERE grantee = 'Alfonso'
  AND object_schema = 'aligndesigns';
```

### Lo que Alfonso PUEDE hacer:

✅ Conectarse a la base de datos AlignDesignsDemo
✅ Usar el esquema aligndesigns
✅ SELECT, INSERT, UPDATE, DELETE en todas las tablas existentes
✅ SELECT, INSERT, UPDATE, DELETE en nuevas tablas creadas en aligndesigns
✅ Ejecutar funciones en el esquema aligndesigns

### Lo que Alfonso NO PUEDE hacer:

❌ Crear nuevas bases de datos (NOCREATEDB)
❌ Crear nuevos roles/usuarios (NOCREATEROLE)
❌ Acceder a otros esquemas (pg_catalog, information_schema en modo lectura)
❌ Modificar la estructura del esquema (CREATE TABLE, ALTER TABLE, DROP TABLE)
❌ Crear extensiones
❌ Ejecutar VACUUM, ANALYZE (tareas de mantenimiento)

## Tareas de Mantenimiento

### Backup

#### Desde la VM (Recomendado)

```bash
# Backup de toda la base de datos
sudo docker exec aligndesigns-postgres pg_dump -U postgres AlignDesignsDemo > backup_$(date +%Y%m%d).sql

# Backup solo del esquema aligndesigns
sudo docker exec aligndesigns-postgres pg_dump -U postgres -n aligndesigns AlignDesignsDemo > backup_schema_$(date +%Y%m%d).sql

# Backup comprimido
sudo docker exec aligndesigns-postgres pg_dump -U postgres AlignDesignsDemo | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### Desde Windows (con pg_dump instalado)

```bash
pg_dump -h 192.168.0.139 -U postgres AlignDesignsDemo > backup.sql
```

### Restore

```bash
# Desde la VM
sudo docker exec -i aligndesigns-postgres psql -U postgres AlignDesignsDemo < backup.sql

# Desde Windows
psql -h 192.168.0.139 -U postgres AlignDesignsDemo < backup.sql
```

### Vacuum y Analyze

```sql
-- Conectado como postgres
VACUUM ANALYZE aligndesigns.users;
VACUUM ANALYZE aligndesigns.projects;
VACUUM ANALYZE aligndesigns.files;
VACUUM ANALYZE aligndesigns.otp_tokens;

-- O todo el esquema
VACUUM ANALYZE;
```

### Ver tamaño de la base de datos

```sql
-- Tamaño total de la BD
SELECT pg_size_pretty(pg_database_size('AlignDesignsDemo'));

-- Tamaño por esquema
SELECT
  schemaname,
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))::bigint) AS size
FROM pg_tables
WHERE schemaname = 'aligndesigns'
GROUP BY schemaname;

-- Tamaño por tabla
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('aligndesigns.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'aligndesigns'
ORDER BY pg_total_relation_size('aligndesigns.'||tablename) DESC;
```

## Queries Útiles

### Ver conexiones activas

```sql
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  LEFT(query, 50) AS query
FROM pg_stat_activity
WHERE datname = 'AlignDesignsDemo'
ORDER BY query_start DESC;
```

### Ver queries lentas

```sql
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;
```

### Ver índices y su uso

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'aligndesigns'
ORDER BY idx_scan ASC;
```

### Ver locks

```sql
SELECT
  locktype,
  relation::regclass,
  mode,
  granted,
  pid,
  pg_blocking_pids(pid) AS blocked_by
FROM pg_locks
WHERE NOT granted;
```

## Configuración de PostgreSQL

### Parámetros Actuales

```sql
-- Ver configuración
SELECT name, setting, unit, context
FROM pg_settings
WHERE name IN (
  'max_connections',
  'shared_buffers',
  'effective_cache_size',
  'work_mem',
  'maintenance_work_mem'
);
```

### Valores por Defecto (Postgres 16)

```
max_connections          = 100
shared_buffers           = 128MB
effective_cache_size     = 4GB
work_mem                 = 4MB
maintenance_work_mem     = 64MB
```

### Modificar Configuración (Reinicio Requerido)

```bash
# Editar postgresql.conf dentro del contenedor
sudo docker exec -it aligndesigns-postgres bash
nano /var/lib/postgresql/data/postgresql.conf

# O usando docker exec
sudo docker exec aligndesigns-postgres bash -c "echo 'max_connections = 200' >> /var/lib/postgresql/data/postgresql.conf"

# Reiniciar contenedor
sudo docker restart aligndesigns-postgres
```

## Health Checks

### Desde la aplicación

```sql
-- Query simple para health check
SELECT 1;

-- Con información adicional
SELECT
  current_database(),
  current_user,
  version(),
  pg_postmaster_start_time() AS uptime;
```

### Desde Docker

```bash
# Health check definido en docker-compose
sudo docker exec aligndesigns-postgres pg_isready -U postgres

# Ver estado de health
sudo docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Seguridad

### pg_hba.conf

Configuración de autenticación (dentro del contenedor):

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             0.0.0.0/0               scram-sha-256
host    all             all             ::0/0                   scram-sha-256
```

### SSL/TLS

Actualmente **deshabilitado**. Para habilitar en producción:

```bash
# Generar certificados
openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key

# Copiar al contenedor
sudo docker cp server.crt aligndesigns-postgres:/var/lib/postgresql/data/
sudo docker cp server.key aligndesigns-postgres:/var/lib/postgresql/data/

# Modificar postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

### Rotación de Contraseñas

```sql
-- Cambiar contraseña de Alfonso
ALTER USER "Alfonso" WITH PASSWORD 'nueva_contraseña_segura';

-- Cambiar contraseña de postgres
ALTER USER postgres WITH PASSWORD 'nueva_contraseña_admin';
```

No olvides actualizar:
- `infra/.env`
- Variables de entorno del backend
- Conexiones de pgAdmin

## Troubleshooting

### No puedo conectarme a la BD

1. Verificar que el contenedor esté corriendo:
```bash
sudo docker ps | grep postgres
```

2. Ver logs:
```bash
sudo docker logs aligndesigns-postgres
```

3. Verificar puerto:
```bash
sudo netstat -tlnp | grep 5432
```

4. Test de conexión:
```bash
sudo docker exec aligndesigns-postgres psql -U postgres -c "SELECT 1"
```

### Error "role does not exist"

El usuario Alfonso debe estar creado. Verificar:

```sql
-- Conectado como postgres
SELECT rolname FROM pg_roles WHERE rolname = 'Alfonso';
```

Si no existe, recrear desde los scripts de init.

### Error "database does not exist"

Verificar que AlignDesignsDemo existe:

```sql
SELECT datname FROM pg_database WHERE datname = 'AlignDesignsDemo';
```

### Lentitud en queries

1. Ver queries activas:
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

2. Analizar plan de ejecución:
```sql
EXPLAIN ANALYZE SELECT * FROM aligndesigns.users WHERE email = 'test@example.com';
```

3. Verificar índices:
```sql
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'aligndesigns';
```

## Próximos Pasos con Prisma

```bash
# Inicializar Prisma en el backend
npx prisma init

# Definir schema en prisma/schema.prisma
# Generar migración
npx prisma migrate dev --name init

# Generar Prisma Client
npx prisma generate

# Seed data
npx prisma db seed
```

Ver [BACKEND.md](./BACKEND.md) para más detalles.
