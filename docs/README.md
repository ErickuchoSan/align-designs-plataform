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
├── changelog/        # Version history (CHANGELOG.md)
├── development/      # CONTRIBUTING.md
├── implementation/   # Current implementation status
├── improvements/     # Performance and security improvements
├── references/       # Technical reference materials
├── setup/            # PNPM migration guide
├── dev/              # (gitignored) Local development notes
└── archive/          # Historical docs from completed phases
```

## Key Documents

| Document | Description |
|----------|-------------|
| [architecture/system_workflow_v2.md](./architecture/system_workflow_v2.md) | Complete system workflow |
| [changelog/CHANGELOG.md](./changelog/CHANGELOG.md) | Version history |
| [implementation/IMPLEMENTATION_STATUS.md](./implementation/IMPLEMENTATION_STATUS.md) | Current status |
| [development/CONTRIBUTING.md](./development/CONTRIBUTING.md) | Contributing guidelines |

## Quick Commands

See `.claude/PROJECT.md` for SSH commands, or use skills:
- `/deploy-status` - Check server health
- `/docker-logs` - View container logs
- `/prisma-ops` - Database operations

---

**Tech Stack:** Next.js 15 + NestJS + PostgreSQL + Prisma + pnpm
**Deployment:** Digital Ocean (45.55.71.127)
**CI/CD:** GitHub Actions → SonarCloud → Auto-deploy
