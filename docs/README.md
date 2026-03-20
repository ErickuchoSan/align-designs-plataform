# Align Designs Platform - Documentation

## Quick Start

1. [Instalacion](./getting-started/installation.md) - Configurar entorno local
2. [Variables de Entorno](./references/environment-variables.md) - Configurar .env

## Source of Truth

**Para operaciones y credenciales:** Ver `.claude/PROJECT.md` y `.claude/skills/`

## Estructura de Documentacion

```
docs/
├── getting-started/          # Onboarding para nuevos devs
│   ├── installation.md       # Guia de instalacion
│   └── pnpm-setup.md         # Configuracion de pnpm
├── architecture/             # Diseno del sistema
│   ├── system-flow.md        # Flujo del sistema
│   └── workflow-stages.md    # Etapas del workflow
├── guides/                   # Guias how-to
│   ├── contributing.md       # Como contribuir
│   ├── ci-cd.md              # Pipeline de CI/CD
│   └── security.md           # Seguridad del servidor
├── references/               # Info de referencia
│   ├── environment-variables.md  # Variables de entorno
│   └── payments-privacy-matrix.md # Permisos de pagos
└── changelog/                # Historial de cambios
    └── CHANGELOG.md
```

## Documentos Clave

### Para Empezar
| Documento | Descripcion |
|-----------|-------------|
| [installation.md](./getting-started/installation.md) | Configurar entorno de desarrollo |
| [environment-variables.md](./references/environment-variables.md) | Variables de entorno |
| [contributing.md](./guides/contributing.md) | Guia de contribucion |

### Operaciones
| Documento | Descripcion |
|-----------|-------------|
| [ci-cd.md](./guides/ci-cd.md) | Pipeline de CI/CD completo |
| [security.md](./guides/security.md) | Seguridad del servidor |

### Arquitectura
| Documento | Descripcion |
|-----------|-------------|
| [system-flow.md](./architecture/system-flow.md) | Flujo del sistema (espanol) |
| [workflow-stages.md](./architecture/workflow-stages.md) | Etapas del workflow de proyectos |

### Referencias
| Documento | Descripcion |
|-----------|-------------|
| [payments-privacy-matrix.md](./references/payments-privacy-matrix.md) | Matriz de permisos de pagos |
| [CHANGELOG.md](./changelog/CHANGELOG.md) | Historial de versiones |

## Skills Disponibles

| Skill | Uso |
|-------|-----|
| `/deploy-status` | Estado del servidor |
| `/docker-logs` | Ver logs de contenedores |
| `/prisma-ops` | Operaciones de base de datos |
| `/server-ssh` | Comandos SSH |
| `/documentation` | Guia de documentacion |

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** NestJS, Prisma ORM
- **Database:** PostgreSQL
- **Storage:** MinIO (S3-compatible)
- **CI/CD:** GitHub Actions + SonarCloud
- **Server:** Digital Ocean (45.55.71.127)