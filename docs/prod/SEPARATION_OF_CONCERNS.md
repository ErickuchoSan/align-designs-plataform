# Separation of Concerns - Business Logic vs Infrastructure

## Overview

This document explains how the codebase separates business logic from infrastructure concerns,
following Clean Architecture and Hexagonal Architecture principles adapted for NestJS.

## Current Implementation

### ✅ Good Example: FilesService

The `FilesService` demonstrates proper separation:

```typescript
// apps/backend/src/files/files.service.ts
@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,      // Data persistence
    private readonly storageService: StorageService, // File storage
  ) {}

  async uploadFile(projectId: string, file: Express.Multer.File, ...) {
    // 1. Business logic: Validate project exists
    const project = await this.prisma.project.findFirst({...});
    if (!project) throw new NotFoundException('Project not found');

    // 2. Business logic: Check permissions
    PermissionUtils.verifyProjectAccess(...);

    // 3. Business logic: Generate metadata
    const filename = `${Date.now()}-${file.originalname}`;
    const storagePath = `projects/${projectId}/${filename}`;

    // 4. Infrastructure: Database operation
    const fileRecord = await this.prisma.file.create({...});

    try {
      // 5. Infrastructure: Storage operation (delegated to StorageService)
      await this.storageService.uploadFile(file, projectId);

      // 6. Business logic: Update record after successful upload
      return await this.prisma.file.update({...});
    } catch (error) {
      // 7. Business logic: Cleanup on failure
      await this.prisma.file.delete({...});
      throw error;
    }
  }
}
```

**Why this is good:**
- Business logic (validation, permissions, metadata) is clear
- Infrastructure calls are delegated to specialized services
- Transaction management is handled appropriately
- Cleanup logic is part of business requirements

### Infrastructure Services

#### StorageService
Handles all file storage operations (MinIO/S3):
```typescript
@Injectable()
export class StorageService {
  async uploadFile(file: Express.Multer.File, projectId: string): Promise<void>
  async getDownloadUrl(storagePath: string): Promise<string>
  async deleteFile(storagePath: string): Promise<void>
}
```

#### EmailService
Handles all email operations (SMTP):
```typescript
@Injectable()
export class EmailService {
  async sendOtpEmail(to: string, token: string, name: string): Promise<void>
  async sendPasswordRecoveryOtpEmail(...): Promise<void>
  async sendNewUserOtpEmail(...): Promise<void>
}
```

#### PrismaService
Handles database connections and transactions:
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy
```

## Layered Architecture

```
┌──────────────────────────────────────────────┐
│            Presentation Layer                │
│         (Controllers, Guards, DTOs)          │
│  - HTTP handling                             │
│  - Request/Response transformation           │
│  - Authentication & Authorization            │
└───────────────────┬──────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│           Business Logic Layer               │
│              (Services)                      │
│  - Domain logic                              │
│  - Business rules                            │
│  - Use case orchestration                    │
│  - Validation                                │
└───────────────────┬──────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│         Infrastructure Layer                 │
│  (Database, Storage, Email, External APIs)   │
│  - Data persistence                          │
│  - File storage                              │
│  - Email sending                             │
│  - Third-party integrations                  │
└──────────────────────────────────────────────┘
```

## Separation Principles

### 1. Business Logic Should NOT Contain

❌ **Direct infrastructure details**
```typescript
// Bad: Business logic knows about MinIO bucket structure
async uploadFile(file: File) {
  const bucketName = 'align-designs'; // Infrastructure detail
  const objectName = `uploads/${Date.now()}`; // Infrastructure detail
  await this.minioClient.putObject(bucketName, objectName, file.buffer);
}

// ✅ Good: Delegate to infrastructure service
async uploadFile(file: File, projectId: string) {
  const filename = this.generateFilename(file); // Business logic
  await this.storageService.uploadFile(file, projectId); // Infrastructure
}
```

❌ **Hard-coded infrastructure configuration**
```typescript
// Bad
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  // ...
};
```

❌ **Direct database query construction**
```typescript
// Bad: Raw SQL in business logic
await this.prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// ✅ Good: Use Prisma ORM
await this.prisma.user.findFirst({ where: { email } });
```

### 2. Infrastructure Services Should NOT Contain

❌ **Business rules**
```typescript
// Bad: Business logic in infrastructure service
@Injectable()
export class StorageService {
  async uploadFile(file: File, projectId: string) {
    // ❌ Permission check doesn't belong here
    if (!this.canUpload(user, project)) {
      throw new ForbiddenException('Cannot upload');
    }
    await this.minioClient.putObject(...);
  }
}
```

❌ **Domain validations**
```typescript
// Bad: Domain validation in email service
@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string) {
    // ❌ This is business logic
    if (!this.isValidBusinessEmail(to)) {
      throw new BadRequestException('Invalid email');
    }
    await this.mailer.sendMail({...});
  }
}
```

### 3. Where Things Belong

| Concern | Layer | Example |
|---------|-------|---------|
| Validation | Business | User input validation, business rules |
| Authorization | Business | Permission checks, role validation |
| Formatting | Business | Filename generation, data transformation |
| Database queries | Infrastructure | Prisma operations |
| File storage | Infrastructure | MinIO/S3 operations |
| Email sending | Infrastructure | SMTP operations |
| External APIs | Infrastructure | Third-party service calls |
| Logging | Both | Business events (info), infrastructure errors |

## Benefits of Current Architecture

### 1. Testability
```typescript
// Easy to mock infrastructure in tests
const mockStorageService = {
  uploadFile: jest.fn().mockResolvedValue(undefined),
  getDownloadUrl: jest.fn().mockResolvedValue('http://...'),
};

const module = await Test.createTestingModule({
  providers: [
    FilesService,
    { provide: StorageService, useValue: mockStorageService },
  ],
}).compile();
```

### 2. Flexibility
Switching from MinIO to S3 only requires changing `StorageService`:
```typescript
// Only this file changes - business logic unaffected
@Injectable()
export class StorageService {
  constructor(
    // private readonly minioClient: Client,
    private readonly s3Client: S3Client, // Switched to S3
  ) {}
  // Implementation changes, interface stays same
}
```

### 3. Maintainability
- Business rules are centralized in service layer
- Infrastructure changes don't affect business logic
- Clear separation makes code easier to understand

### 4. Reusability
Infrastructure services can be used by multiple business services:
```typescript
// EmailService used by:
- AuthService (OTP emails)
- UsersService (Welcome emails)
- ProjectsService (Notification emails)
```

## Examples in Our Codebase

### ✅ Good: Extracted Services

**AccountLockoutService**
- Handles account locking logic (business)
- Uses PrismaService for persistence (infrastructure)

**PasswordService**
- Handles password hashing/validation (business + crypto)
- Uses bcrypt (infrastructure library)
- Uses PrismaService for password history (infrastructure)

**PermissionStrategy**
- Implements permission logic (business)
- No infrastructure dependencies

### ⚠️ Areas for Improvement

While the current architecture is good, future enhancements could include:

1. **Repository Pattern** (optional)
   ```typescript
   interface UserRepository {
     findByEmail(email: string): Promise<User | null>;
     create(data: CreateUserDto): Promise<User>;
   }
   ```

2. **Domain Events** (optional)
   ```typescript
   // Decouple business logic from side effects
   this.eventEmitter.emit('user.created', { user });
   ```

3. **Value Objects** (optional)
   ```typescript
   class Email {
     constructor(private readonly value: string) {
       this.validate();
     }
   }
   ```

However, these patterns add complexity and should only be introduced when the benefits outweigh the costs.

## Best Practices

1. ✅ **Keep business logic in service classes**
2. ✅ **Delegate infrastructure to specialized services**
3. ✅ **Use dependency injection for all dependencies**
4. ✅ **Test business logic without real infrastructure**
5. ✅ **Configuration through environment variables**
6. ✅ **Avoid business rules in controllers**
7. ✅ **Avoid business rules in infrastructure services**

## Anti-patterns to Avoid

❌ **God Service**: Service that does everything
❌ **Anemic Domain Model**: Models with no behavior
❌ **Leaky Abstraction**: Infrastructure details leak to business logic
❌ **Tight Coupling**: Business logic depends on specific infrastructure
❌ **Business Logic in Controllers**: Controllers should be thin
❌ **Business Logic in Database Queries**: Keep queries simple

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [NestJS Architecture Best Practices](https://docs.nestjs.com/techniques/database)
