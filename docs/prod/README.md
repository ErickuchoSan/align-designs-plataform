# Documentación de Producción (Pública)

✅ **ESTA CARPETA ES SEGURA PARA COMPARTIR Y SUBIR A GIT**

## ¿Qué contiene esta carpeta?

Esta carpeta contiene la documentación **sanitizada** del proyecto sin credenciales reales.

## Diferencia con docs/dev/

| Aspecto | docs/prod/ (aquí) | docs/dev/ (privado) |
|---------|-------------------|---------------------|
| **Credenciales** | Placeholders genéricos | Passwords reales |
| **IPs** | YOUR_SERVER_IP | IPs reales |
| **Emails** | admin@yourcompany.com | Emails reales |
| **En Git** | ✅ SÍ | ❌ NO (gitignored) |
| **Compartir** | ✅ Seguro | ❌ Privado |

## Uso

Al clonar este repositorio:

1. Lee la documentación de esta carpeta (docs/prod/)
2. Copia docs/prod/ a docs/dev/: cp -r docs/prod docs/dev
3. Edita los archivos en docs/dev/ con TUS datos reales
4. docs/dev/ está gitignored, no se subirá

## Archivos principales

### Configuración
- **ACCESS.md** - Accesos e infraestructura (con placeholders)
- **DATABASE.md** - Documentación de PostgreSQL
- **MINIO.md** - Almacenamiento de archivos S3
- **SETUP.md** - Guía completa de instalación

### Arquitectura
- **ARCHITECTURE.md** - Arquitectura del sistema
- **FLOW.md** - Flujos de la aplicación

### Guías
- **GUIA_PASO_A_PASO.md** - Tutorial paso a paso
- **SCALING_GUIDE.md** - Guía de escalabilidad

## Contribuir

Al agregar nueva documentación:
- ✅ SÍ agregar aquí archivos sin datos sensibles
- ❌ NO incluir passwords, IPs, emails reales
- ✅ Usa placeholders: YOUR_PASSWORD, YOUR_SERVER_IP
