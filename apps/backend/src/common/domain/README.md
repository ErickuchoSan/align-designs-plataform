# Domain Layer

## Overview

This directory contains the **Domain Layer** implementation following **Domain-Driven Design (DDD)** principles. The domain layer encapsulates business logic and rules, keeping them separate from infrastructure concerns.

## Architecture

```
domain/
├── entities/          # Domain entities with business logic
├── value-objects/     # Immutable value objects
├── repositories/      # Repository interfaces (contracts)
└── events/           # Domain events (future implementation)
```

## Components

### Value Objects

Value objects are **immutable** objects that represent concepts in your domain without identity. They encapsulate validation logic and behavior.

**Example: Email Value Object**
```typescript
const email = Email.create('user@example.com');
console.log(email.getValue());    // 'user@example.com'
console.log(email.getDomain());   // 'example.com'
```

**Example: Password Value Object**
```typescript
// Create from plain password (validates and hashes)
const password = await Password.createFromPlain('SecurePass123!');

// Verify password
const isValid = await password.verify('SecurePass123!'); // true
```

### Domain Entities

Entities are objects with **identity** and **lifecycle**. They encapsulate business rules and behavior.

**Example: User Entity**
```typescript
// Create new user
const user = UserEntity.create({
  id: uuid(),
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: Role.CLIENT,
});

// Business logic methods
await user.setPassword(password);
user.activate();
user.verifyEmail();
user.updateProfile({ firstName: 'Jane' });

// Check permissions
if (user.canAccess(resourceId)) {
  // Access granted
}
```

**Example: Project Entity**
```typescript
// Create new project
const project = ProjectEntity.create({
  id: uuid(),
  name: 'My Project',
  description: 'Project description',
  clientId: 'client-uuid',
  createdBy: 'admin-uuid',
});

// Business logic with permission checks
project.update(
  { name: 'Updated Name' },
  userId,
  userRole
);

// Check access
if (project.canBeAccessedBy(userId, userRole)) {
  // Access granted
}
```

### Repository Interfaces

Repositories define **contracts** for persistence without specifying implementation details. This follows the **Dependency Inversion Principle**.

**Example: User Repository Interface**
```typescript
interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}
```

## Benefits

### 1. **Business Logic Centralization**
- All business rules live in domain entities
- No business logic scattered in controllers or services
- Easy to find and modify business rules

### 2. **Testability**
- Domain entities are pure TypeScript classes
- Easy to test without database or external dependencies
- Mock repositories for unit testing

### 3. **Validation**
- Value objects ensure data is always valid
- Cannot create invalid email or password
- Fail-fast approach

### 4. **Immutability**
- Value objects are immutable
- Reduces bugs from unexpected state changes
- Thread-safe

### 5. **Type Safety**
- Strong typing with TypeScript
- Compile-time checks
- IDE autocomplete support

### 6. **Separation of Concerns**
- Domain logic separated from infrastructure
- Database changes don't affect business rules
- Can switch ORMs without touching domain

## Usage in Services

Services orchestrate domain entities and repositories:

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    // Create domain entity
    const user = UserEntity.create({
      id: uuid(),
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
    });

    // Set password if provided
    if (dto.password) {
      const password = await Password.createFromPlain(dto.password);
      await user.setPassword(password);
    }

    // Persist using repository
    return this.userRepository.save(user);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Load domain entity
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Business logic in domain entity
    const password = await Password.createFromPlain(newPassword);
    await user.changePassword(currentPassword, password);

    // Persist changes
    await this.userRepository.save(user);
  }
}
```

## Best Practices

### 1. **Always Use Factory Methods**
```typescript
// ✅ Good
const user = UserEntity.create({ ... });

// ❌ Bad
const user = new UserEntity({ ... });
```

### 2. **Keep Business Logic in Entities**
```typescript
// ✅ Good - Business logic in entity
user.activate();

// ❌ Bad - Business logic in service
user.isActive = true; // Bypasses validation
```

### 3. **Use Value Objects for Validation**
```typescript
// ✅ Good - Validation in value object
const email = Email.create(rawEmail);

// ❌ Bad - Validation scattered
if (!rawEmail.includes('@')) { ... }
```

### 4. **Repository Returns Entities**
```typescript
// ✅ Good - Repository returns domain entities
const user: UserEntity = await repository.findById(id);

// ❌ Bad - Repository returns plain objects
const user: UserDto = await repository.findById(id);
```

### 5. **Reconstitute from Database**
```typescript
// When loading from database
const user = UserEntity.reconstitute({
  id: dbUser.id,
  email: dbUser.email,
  // ... other fields
});
```

## Migration Path

Existing services can gradually adopt domain entities:

1. **Phase 1**: Create domain entities
2. **Phase 2**: Move business logic from services to entities
3. **Phase 3**: Implement repository interfaces
4. **Phase 4**: Create repository implementations
5. **Phase 5**: Replace Prisma calls with repository calls

This allows incremental adoption without breaking existing code.

## Future Enhancements

- **Domain Events**: Decouple modules with events
- **Aggregates**: Group related entities
- **Specifications**: Complex query logic
- **Domain Services**: Multi-entity business logic
