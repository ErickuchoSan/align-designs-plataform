# Align Designs Platform - Documentation

## Quick Links

| Need to... | Go to... |
|------------|----------|
| Set up locally | [setup/PNPM_MIGRATION.md](./setup/PNPM_MIGRATION.md) |
| Understand the system | [architecture/system_workflow_v2.md](./architecture/system_workflow_v2.md) |
| Check implementation status | [implementation/IMPLEMENTATION_STATUS.md](./implementation/IMPLEMENTATION_STATUS.md) |
| Contribute code | [development/CONTRIBUTING.md](./development/CONTRIBUTING.md) |
| See changelog | [changelog/CHANGELOG.md](./changelog/CHANGELOG.md) |

## Folder Structure

```
docs/
├── architecture/     # System design and workflow
├── changelog/        # Version history
├── development/      # Contributing guidelines
├── implementation/   # Current implementation status
├── improvements/     # Performance and security improvements
├── references/       # Technical reference materials
├── setup/            # Installation and setup guides
├── dev/              # Private docs with credentials (gitignored)
├── prod/             # Sanitized templates for sharing
└── archive/          # Historical docs from completed phases
```

## Current Status

**Platform Status:** Production Ready
- All core features implemented (authentication, projects, files, payments, invoices)
- CI/CD pipeline active with GitHub Actions
- Deployed to Digital Ocean

## Key Documentation

### Architecture
- [system_workflow_v2.md](./architecture/system_workflow_v2.md) - Complete system workflow
- [flujo_sistema_v2.md](./architecture/flujo_sistema_v2.md) - Flujo del sistema (Spanish)
- [final_requirements.md](./architecture/final_requirements.md) - Project requirements
- [priority_features.md](./architecture/priority_features.md) - Feature priorities

### Setup
- [PNPM_MIGRATION.md](./setup/PNPM_MIGRATION.md) - Package manager setup
- [AUTO-START-GUIDE.md](./setup/AUTO-START-GUIDE.md) - Windows auto-start

### Improvements
- [PERFORMANCE_OPTIMIZATIONS.md](./improvements/PERFORMANCE_OPTIMIZATIONS.md) - 31 optimizations
- [SECURITY_IMPROVEMENTS.md](./improvements/SECURITY_IMPROVEMENTS.md) - Security enhancements
- [DEPENDENCIES_UPDATE.md](./improvements/DEPENDENCIES_UPDATE.md) - Dependency updates

### References
- [payments-privacy-matrix.md](./references/payments-privacy-matrix.md) - Payment data privacy rules

## Private vs Public Docs

### docs/dev/ (Gitignored)
Contains sensitive data for local development:
- Server IPs and credentials
- Database connection strings
- Local configuration

### docs/prod/
Sanitized templates safe for sharing:
- Placeholder credentials
- Deployment guides
- Configuration templates

## Archive

Historical documentation from completed phases is in [archive/](./archive/). These are kept for reference but are no longer actively maintained.

---

**Tech Stack:** Next.js 15 + NestJS + PostgreSQL + Prisma + pnpm
**Last Updated:** March 2026
