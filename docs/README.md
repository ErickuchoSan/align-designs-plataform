# Align Designs Platform - Documentation

## Source of Truth

**For operations and credentials:** See `.claude/PROJECT.md` and `.claude/skills/`

The `.claude/` folder contains:
- Server credentials and connection info
- SSH commands and deployment procedures
- Skills for common operations (`/deploy-status`, `/docker-logs`, `/prisma-ops`, etc.)

## Documentation Structure

```
docs/
├── architecture/     # System design and workflow
├── changelog/        # Version history
├── development/      # Contributing guidelines
├── references/       # Technical references (payment privacy matrix)
└── setup/            # PNPM migration guide
```

## Key Documents

| Document | Description |
|----------|-------------|
| [architecture/system_workflow_v2.md](./architecture/system_workflow_v2.md) | Complete system workflow |
| [architecture/flujo_sistema_v2.md](./architecture/flujo_sistema_v2.md) | Flujo del sistema (español) |
| [changelog/CHANGELOG.md](./changelog/CHANGELOG.md) | Version history |
| [development/CONTRIBUTING.md](./development/CONTRIBUTING.md) | Contributing guidelines |
| [references/payments-privacy-matrix.md](./references/payments-privacy-matrix.md) | Payment permissions reference |
| [setup/PNPM_MIGRATION.md](./setup/PNPM_MIGRATION.md) | PNPM setup guide |

## Quick Commands

See `.claude/PROJECT.md` for SSH commands, or use skills:
- `/deploy-status` - Check server health
- `/docker-logs` - View container logs
- `/prisma-ops` - Database operations

---

**Tech Stack:** Next.js 15 + NestJS + PostgreSQL + Prisma + pnpm
**Deployment:** Digital Ocean (45.55.71.127)
**CI/CD:** GitHub Actions → SonarCloud → Auto-deploy
