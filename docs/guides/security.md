# Seguridad del Servidor

> Configuracion de seguridad del servidor de desarrollo de Align Designs.

## Resumen de Capas de Seguridad

| Capa | Componente | Configuracion |
|------|------------|---------------|
| Red | UFW Firewall | Solo puertos 29, 80, 443 |
| SSH | Puerto personalizado | Puerto 29 (no el 22 default) |
| SSH | Autenticacion | Solo llaves SSH, sin passwords |
| SSH | Fail2ban | Bloqueo 24h tras 3 intentos fallidos |
| Web | Nginx | Headers de seguridad, rate limiting |

## Firewall (UFW)

### Puertos Abiertos

| Puerto | Servicio | Descripcion |
|--------|----------|-------------|
| 29/tcp | SSH | Administracion del servidor |
| 80/tcp | HTTP | Trafico web |
| 443/tcp | HTTPS | Trafico web seguro (futuro) |

### Politica por Defecto

- **Incoming:** DENY (todo bloqueado excepto los puertos listados)
- **Outgoing:** ALLOW (servidor puede conectar a internet)

## SSH Hardening

### Configuracion

| Setting | Valor | Razon |
|---------|-------|-------|
| Port | 29 | Evita escaneos automaticos al puerto 22 |
| PermitRootLogin | prohibit-password | Solo con llave SSH |
| PasswordAuthentication | no | Sin contraseñas, solo llaves |
| PubkeyAuthentication | yes | Autenticacion por llave publica |

### Conexion

```bash
# Conectar al servidor
ssh -p 29 root@[IP_SERVIDOR]

# Con llave especifica
ssh -p 29 -i ~/.ssh/mi_llave root@[IP_SERVIDOR]
```

## Fail2ban

### Configuracion Actual

| Jail | MaxRetry | BanTime | FindTime |
|------|----------|---------|----------|
| sshd | 3 | 24 horas | 10 min |
| recidive | 2 | 24 horas | 1 semana |

### Importante sobre IPs Dinamicas

> **No usar bloqueos permanentes** porque ISPs como Infinitum/Telmex asignan IPs dinamicas que cambian cada ~15 dias. Una IP baneada permanentemente podria ser asignada a un usuario legitimo despues.

### Que Protege Fail2ban

| Servicio | Protegido |
|----------|-----------|
| SSH (puerto 29) | ✅ Si |
| Web (puerto 80) | ❌ No - Los usuarios web nunca son bloqueados |
| API (puerto 80) | ❌ No - Rate limiting por Nginx |

### Comandos Utiles

```bash
# Ver status de fail2ban
fail2ban-client status sshd

# Ver IPs baneadas
fail2ban-client status sshd | grep "Banned IP"

# Desbanear una IP
fail2ban-client set sshd unbanip [IP]

# Ver intentos fallidos recientes
lastb | head -20
```

## Nginx Security Headers

Headers configurados en Nginx:

| Header | Valor | Proposito |
|--------|-------|-----------|
| X-Frame-Options | SAMEORIGIN | Previene clickjacking |
| X-Content-Type-Options | nosniff | Previene MIME sniffing |
| X-XSS-Protection | 1; mode=block | Proteccion XSS basica |
| Referrer-Policy | strict-origin-when-cross-origin | Control de referrer |
| server_tokens | off | Oculta version de Nginx |

## Rate Limiting (Nginx)

| Zona | Limite | Aplicado a |
|------|--------|------------|
| auth | 5 req/s | /api/v1/auth/* |
| api | 10 req/s | /api/* |
| general | 20 req/s | Todo lo demas |

## Buenas Practicas

### DO (Hacer)

- Usar llaves SSH de 4096 bits
- Rotar llaves SSH periodicamente
- Mantener el servidor actualizado (`apt update && apt upgrade`)
- Revisar logs regularmente

### DON'T (No hacer)

- Usar bloqueos permanentes de IPs
- Abrir puertos innecesarios
- Compartir llaves SSH entre usuarios
- Ignorar alertas de fail2ban

## Monitoreo

### Comandos de Verificacion

```bash
# Estado del firewall
ufw status verbose

# Status de fail2ban
fail2ban-client status

# Conexiones activas
ss -tlnp

# Ultimos logins exitosos
last | head -10

# Intentos fallidos
lastb | head -10
```

## Contacto de Emergencia

Si detectas actividad sospechosa o un ataque:
1. Revisar logs de fail2ban
2. Verificar conexiones activas
3. Contactar al administrador

## Ver Tambien

- [/server-security skill](./../.claude/skills/server-security/) - Comandos rapidos
- [/server-ssh skill](./../.claude/skills/server-ssh/) - Ejecutar comandos SSH