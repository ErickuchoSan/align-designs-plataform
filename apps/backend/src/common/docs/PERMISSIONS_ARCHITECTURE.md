# Permissions Architecture

## Overview

This document explains the intentional hybrid approach to permission handling in the application.

## Three Permission Strategies

The codebase uses THREE different permission strategies, each optimized for its specific use case:

### 1. PermissionContext Class (Strategy Pattern)
**Location:** `projects.service.ts`
**Use Case:** Simple, stateless permission checks

```typescript
const permissionContext = new PermissionContext(userRole);
permissionContext.verifyProjectAccess(
  userId,
  project.clientId,
  'You do not have permission to view this project'
);
```

**Advantages:**
- ✅ Lightweight - no dependency injection needed
- ✅ Stateless - pure functions
- ✅ Reusable across different contexts
- ✅ Easy to test in isolation

**Best for:** Simple role-based checks without complex business logic

---

### 2. FilePermissionsService (Dedicated Service)
**Location:** `files/services/file-permissions.service.ts`
**Use Case:** Complex permission logic with database queries

```typescript
await this.permissions.verifyProjectAccess(projectId, userId, userRole);
const file = await this.permissions.verifyFileModifyPermission(fileId, userId, userRole);
```

**Advantages:**
- ✅ Testable - can be mocked in service tests
- ✅ Reusable - injected across file-related services
- ✅ Database access - can query ownership
- ✅ Separation of Concerns - permission logic isolated

**Best for:** Complex permission checks requiring database queries

---

### 3. Inline Validation (Direct Implementation)
**Location:** `users.service.ts`
**Use Case:** Context-specific, one-time permission checks

```typescript
if (requestingUserRole === Role.CLIENT && id !== requestingUserId) {
  throw new ForbiddenException('You do not have permission to view this user');
}
```

**Advantages:**
- ✅ Simple and explicit
- ✅ No abstraction overhead
- ✅ Easy to understand for simple cases
- ✅ No external dependencies

**Best for:** Simple, context-specific checks that won't be reused

---

## Decision Matrix

| Scenario | Use Strategy | Reason |
|----------|--------------|--------|
| Simple role check (Admin vs Client) | PermissionContext | Lightweight, stateless |
| Ownership verification (needs DB query) | Dedicated Service | Testable, reusable |
| One-time contextual check | Inline | Simple, explicit |
| Cross-cutting concern | Dedicated Service | Centralized logic |
| Performance critical | PermissionContext | No DI overhead |

---

## Examples by Module

### Projects Module
**Strategy:** PermissionContext
**Reason:** Simple role-based access (Admin sees all, Client sees own)

```typescript
const permissionContext = new PermissionContext(userRole);
permissionContext.verifyProjectAccess(userId, project.clientId, message);
```

### Files Module
**Strategy:** FilePermissionsService
**Reason:** Complex checks (ownership, project access, uploader verification)

```typescript
await this.permissions.verifyProjectAccess(projectId, userId, userRole);
const file = await this.permissions.verifyFileDeletePermission(fileId, userId, userRole);
```

### Users Module
**Strategy:** Inline validation
**Reason:** Simple, context-specific (users can only modify their own data)

```typescript
if (requestingUserRole === Role.CLIENT && id !== requestingUserId) {
  throw new ForbiddenException('You do not have permission');
}
```

---

## Guidelines

### When to create a new PermissionService:
- [ ] Permission logic is used in 3+ places
- [ ] Requires database queries
- [ ] Complex business rules
- [ ] Needs to be mocked in tests

### When to use PermissionContext:
- [ ] Simple role-based checks
- [ ] Stateless validation
- [ ] No database access needed
- [ ] Performance-critical path

### When to use Inline validation:
- [ ] One-time, context-specific check
- [ ] Simple conditional logic
- [ ] Won't be reused elsewhere
- [ ] Keeps code explicit and readable

---

## Migration Path (If Needed)

If we decide to standardize in the future, the recommended approach would be:

**Option A: FilePermissionsService pattern (Most flexible)**
- Move all permission logic to dedicated services
- Pros: Testable, centralized
- Cons: More boilerplate, DI overhead

**Option B: Guard-based approach (NestJS standard)**
- Use custom Guards for all permission checks
- Pros: Declarative, follows framework patterns
- Cons: Less flexible for complex logic

**Option C: Keep hybrid (Current - Recommended)**
- Use the right tool for each job
- Pros: Pragmatic, optimized per use case
- Cons: Requires documentation (this file)

---

## Status

✅ **Current State:** Hybrid approach (intentional)
📝 **Recommendation:** Keep current approach
🔄 **Review Date:** Consider standardization if it becomes a pain point

**Reason for keeping hybrid:**
The current approach optimizes for each use case rather than forcing a one-size-fits-all solution. This pragmatic approach balances clean architecture with practical development needs.
