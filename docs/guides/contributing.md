# Contributing to Align Designs

Thank you for your interest in contributing to Align Designs! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Commit Guidelines](#commit-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Testing](#testing)
9. [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Any conduct that could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **pnpm**: v10.x or higher (install with `npm install -g pnpm`)
- **PostgreSQL**: v14.x or higher
- **DigitalOcean Spaces**: Account with S3 credentials (for file storage)
- **Git**: Latest version

### First-Time Contributors

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/align-designs-demo.git`
3. Add upstream remote: `git remote add upstream https://github.com/ORIGINAL_OWNER/align-designs-demo.git`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

---

## Development Setup

### 1. Install Dependencies

```bash
# Install all dependencies (from root)
pnpm install

# Or install for specific workspace
pnpm --filter backend install
pnpm --filter frontend install
```

### 2. Environment Configuration

Create `.env` files based on `.env.example`:

**Backend (`apps/backend/.env`):**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/align_designs
JWT_SECRET=your-super-secret-jwt-key-min-64-chars-for-production-security
ALLOWED_ORIGINS=http://localhost:3000

# Storage (DigitalOcean Spaces)
MINIO_ENDPOINT=sfo3.digitaloceanspaces.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-do-spaces-access-key
MINIO_SECRET_KEY=your-do-spaces-secret-key
MINIO_BUCKET=aligndesigns-dev
MINIO_REGION=sfo3
MINIO_SKIP_BUCKET_CHECK=true

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Align Designs <noreply@aligndesigns.com>
```

**Frontend (`apps/frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Database Setup

```bash
# From root directory
# Run Prisma migrations
pnpm --filter backend prisma:migrate

# Seed database with sample data
pnpm --filter backend seed
```

### 4. Start Development Servers

```bash
# From root - start both (recommended)
pnpm dev

# Or start individually
pnpm dev:backend  # Backend only
pnpm dev:frontend # Frontend only
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs

---

## Project Structure

```
align-designs-demo/
├── apps/
│   ├── backend/              # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/         # Authentication module
│   │   │   ├── users/        # Users module
│   │   │   ├── projects/     # Projects module
│   │   │   ├── files/        # File management module
│   │   │   ├── common/       # Shared utilities
│   │   │   │   ├── domain/   # Domain layer (DDD)
│   │   │   │   ├── filters/  # Exception filters
│   │   │   │   ├── guards/   # Auth guards
│   │   │   │   └── middleware/ # Middleware
│   │   │   └── main.ts       # Application entry point
│   │   ├── prisma/           # Database schema and migrations
│   │   └── test/             # E2E tests
│   └── frontend/             # Next.js frontend
│       ├── app/              # Next.js 13+ app directory
│       ├── components/       # React components
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utilities and helpers
│       ├── services/         # API service layer
│       └── types/            # TypeScript types
├── docs/                     # Documentation
├── CHANGELOG.md              # Version history
└── CONTRIBUTING.md           # This file
```

---

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Enable strict mode** in tsconfig.json
- **Avoid `any` type** - use proper types or `unknown`
- **Use interfaces** for object shapes
- **Use enums** for constants with multiple values

### Code Style

- **Formatting**: Use Prettier (runs on commit via husky)
- **Linting**: Use ESLint (configured in project)
- **Naming Conventions**:
  - Files: `kebab-case.ts`
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Interfaces: `IPascalCase` or `PascalCase`

### Backend (NestJS)

- **Controllers**: Handle HTTP requests only
- **Services**: Contain business logic
- **Entities**: Domain logic (DDD pattern)
- **DTOs**: Data validation and transformation
- **Guards**: Authentication and authorization
- **Decorators**: Use Swagger decorators for API docs

**Example Controller:**
```typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Frontend (React/Next.js)

- **Components**: Use functional components with hooks
- **Hooks**: Extract reusable logic
- **Services**: Use service layer for API calls
- **Types**: Import from `@/types`
- **Performance**: Use React.memo, useMemo, useCallback appropriately

**Example Component:**
```typescript
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

export const UserCard = React.memo(({ user, onEdit }: UserCardProps) => {
  const handleEdit = useCallback(() => {
    onEdit(user);
  }, [user, onEdit]);

  return (
    <div onClick={handleEdit}>
      {user.firstName} {user.lastName}
    </div>
  );
});
```

### Domain Layer (DDD)

- **Value Objects**: Immutable, validated values
- **Entities**: Objects with identity and behavior
- **Repositories**: Data access interfaces
- **Services**: Multi-entity business logic

**Example Value Object:**
```typescript
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  static create(email: string): Email {
    const normalized = email.toLowerCase().trim();
    if (!this.isValid(normalized)) {
      throw new BadRequestException('Invalid email');
    }
    return new Email(normalized);
  }

  getValue(): string {
    return this.value;
  }
}
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `security`: Security fixes

### Examples

```bash
feat(auth): add CSRF protection middleware

Implement token-based CSRF protection for all state-changing endpoints.
Tokens are generated per session and validated on POST/PUT/PATCH/DELETE.

Closes #123

---

fix(projects): resolve N+1 query issue

Replace individual file queries with groupBy aggregation to improve
performance when loading project lists.

---

docs(api): add Swagger documentation to projects controller

Add comprehensive API documentation with examples for all endpoints.
```

### Scope Guidelines

- `auth`: Authentication/authorization
- `users`: User management
- `projects`: Project management
- `files`: File uploads/management
- `api`: API changes
- `ui`: UI/UX changes
- `db`: Database changes
- `security`: Security improvements
- `perf`: Performance improvements

---

## Pull Request Process

### 1. Before Creating PR

- [ ] Code follows project coding standards
- [ ] All tests pass (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG updated (if needed)

### 2. PR Title Format

Use conventional commit format:
```
feat(auth): add two-factor authentication
```

### 3. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests pass
```

### 4. Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: At least one maintainer reviews
3. **Testing**: Reviewer tests changes locally
4. **Approval**: Maintainer approves PR
5. **Merge**: Squash and merge to main

### 5. After Merge

- Delete your feature branch
- Pull latest changes: `git pull upstream main`
- Update your fork: `git push origin main`

---

## Testing

### Backend Tests

```bash
# From root
pnpm --filter backend test         # Unit tests
pnpm --filter backend test:e2e     # E2E tests
pnpm --filter backend test:cov     # Test coverage
```

### Frontend Tests

```bash
# From root
pnpm --filter frontend test        # Run tests
pnpm --filter frontend test:watch  # Watch mode
pnpm --filter frontend test:coverage # Coverage
```

### Writing Tests

**Backend Example (Jest):**
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: MockType<IUserRepository>;

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'IUserRepository', useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should find user by id', async () => {
    const user = UserEntity.create({...});
    mockRepository.findById.mockResolvedValue(user);

    const result = await service.findOne('user-id');
    expect(result).toEqual(user);
  });
});
```

---

## Documentation

### API Documentation

- Use Swagger decorators in controllers
- Document all endpoints with `@ApiOperation`
- Include all response codes with `@ApiResponse`
- Document query parameters with `@ApiQuery`
- Document path parameters with `@ApiParam`

### Code Documentation

- Document complex logic with comments
- Use JSDoc for public APIs
- Keep comments up-to-date with code
- Explain "why" not "what"

### Architecture Documentation

- Update README.md for major changes
- Document new patterns in `docs/`
- Add examples for complex features
- Keep architecture diagrams updated

---

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Contact: security@aligndesigns.com

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Sanitize all user inputs
- Validate data at boundaries
- Follow OWASP guidelines
- Keep dependencies updated

---

## Questions?

- **Documentation**: Check `docs/` directory
- **API Docs**: http://localhost:4000/api/docs
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions

---

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Thank you for contributing to Align Designs! 🎉
