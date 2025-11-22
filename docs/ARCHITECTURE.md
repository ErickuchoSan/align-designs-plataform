# Architecture Documentation

## Dependency Injection in NestJS

### Current Implementation

The project uses NestJS's built-in Dependency Injection (DI) system, which follows Inversion of Control (IoC) principles.

### Why Concrete Classes in Constructors is Correct

In NestJS, injecting concrete classes is the standard and recommended approach:

```typescript
// ✅ Correct NestJS pattern
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
}
```

**Why this is not a DIP violation in NestJS:**

1. **NestJS Module System**: The IoC container manages dependencies
2. **Mockability**: NestJS testing utilities allow easy mocking
3. **Type Safety**: TypeScript provides compile-time type checking
4. **Provider Swapping**: Can swap implementations via custom providers
5. **Runtime Resolution**: Dependencies resolved at runtime by DI container

### Testing with NestJS DI

NestJS provides `Test.createTestingModule()` for easy mocking:

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService, // Easy mocking
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });
});
```

### When to Use Interfaces/Abstract Classes

Use interfaces or abstract classes when:

1. **Multiple Implementations Exist**
   ```typescript
   // If you have both S3Storage and MinIOStorage
   abstract class StorageProvider {
     abstract uploadFile(file: File): Promise<string>;
   }

   @Injectable()
   export class FilesService {
     constructor(
       @Inject('STORAGE_PROVIDER')
       private storage: StorageProvider
     ) {}
   }
   ```

2. **Third-party Integrations**
   ```typescript
   // When integrating multiple payment providers
   interface PaymentProvider {
     processPayment(amount: number): Promise<PaymentResult>;
   }
   ```

3. **Strategy Pattern**
   ```typescript
   // Different authentication strategies
   interface AuthStrategy {
     authenticate(credentials: any): Promise<User>;
   }
   ```

### Current Architecture Benefits

1. **Simplicity**: Less boilerplate, clearer code
2. **Type Safety**: Full TypeScript support
3. **Testability**: Easy mocking with NestJS utilities
4. **Maintainability**: Changes to services don't require interface updates
5. **Performance**: No runtime overhead from abstractions

### Example: Proper Use of Interfaces

Our permission system uses the Strategy Pattern correctly:

```typescript
// apps/backend/src/common/strategies/permission.strategy.ts
export interface PermissionStrategy {
  verifyProjectAccess(...): void;
  verifyUserAccess(...): void;
}

export class AdminPermissionStrategy implements PermissionStrategy {
  // Implementation for admins
}

export class ClientPermissionStrategy implements PermissionStrategy {
  // Implementation for clients
}
```

This is appropriate because:
- Multiple concrete implementations exist
- Behavior varies by role
- New roles can be added without modifying existing code (OCP)

### Anti-patterns to Avoid

❌ **Don't create interfaces just for testing**
```typescript
// Bad: Unnecessary abstraction
interface IPrismaService {
  user: {
    findFirst(...): Promise<User>;
    create(...): Promise<User>;
  }
}

// Better: Use NestJS mocking
const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  }
};
```

❌ **Don't create one-to-one interfaces**
```typescript
// Bad: IUserService mirrors UserService exactly
interface IUserService {
  createUser(...): Promise<User>;
  findUser(...): Promise<User>;
}

class UserService implements IUserService {
  // Exact same methods
}
```

### Layered Architecture

```
┌─────────────────────────────────────┐
│         Controllers                 │  HTTP/REST Layer
│  (Handle requests, validation)      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│          Services                   │  Business Logic Layer
│  (Domain logic, orchestration)      │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│    Infrastructure Services          │  Infrastructure Layer
│  (Database, Storage, Email, etc.)   │
└─────────────────────────────────────┘
```

**Current Project Structure:**
- **Controllers**: Handle HTTP, delegate to services
- **Services**: Contain business logic, orchestrate operations
- **Infrastructure**: PrismaService, StorageService, EmailService
- **Common**: Shared utilities, strategies, guards

### Dependency Flow

```
AuthController
    ↓
AuthService (depends on)
    ├── PrismaService
    ├── JwtService
    ├── OtpService
    ├── EmailService
    ├── AccountLockoutService
    └── PasswordService
```

All dependencies are injected by NestJS IoC container.

### Best Practices

1. **Use constructor injection** (not property injection)
2. **Mark dependencies as `readonly`** to prevent reassignment
3. **Keep services focused** (Single Responsibility Principle)
4. **Use custom providers** when you need flexibility
5. **Mock at the module level** in tests

### References

- [NestJS Dependency Injection](https://docs.nestjs.com/fundamentals/custom-providers)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [SOLID Principles in NestJS](https://docs.nestjs.com/fundamentals/custom-providers#standard-providers)
