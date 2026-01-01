# Accesos e Infraestructura

>  **NOTA DE SEGURIDAD:** Este archivo contiene información de referencia para producción. NUNCA guardes contraseñas reales aquí. Usa un gestor de secretos (AWS Secrets Manager, Azure Key Vault).

## Infraestructura
- **Servidor:** [SERVER_IP_OR_DOMAIN]
- **OS:** Ubuntu Server 22.04 LTS
- **Recursos:** [CPU / RAM / DISK]

## Credenciales Producción (Referencia)

### Base de Datos
- **Host:** [DB_HOST]
- **Puerto:** 5432
- **Base de Datos:** AlignDesignsPlatform
- **Schema:** aligndesigns
- **Usuario:** [DB_USER]
- **Contraseña:** [DB_PASSWORD] (Ver gestor de contraseñas)

### Aplicación
- **Backend:** https://api.aligndesigns.com
- **Frontend:** https://app.aligndesigns.com
- **Admin User:** [ADMIN_EMAIL] (Ver gestor de contraseñas)

## Recomendaciones de Seguridad
- Rota las contraseñas cada 90 días
- Usa contraseñas de al menos 16 caracteres
- Habilita 2FA donde sea posible
- Restringe el acceso SSH por IP
