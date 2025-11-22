# JSDoc Documentation Standards

## Overview

This document establishes clear standards for JSDoc documentation across the codebase. Consistent documentation improves code maintainability, onboarding, and collaboration.

## When to Document

### ✅ Always Document

1. **Exported Functions and Methods**
   - All public APIs
   - Service methods
   - Utility functions
   - React hooks
   - React components

2. **Complex Business Logic**
   - Functions with non-obvious behavior
   - Functions with side effects
   - Functions that throw errors
   - Functions with complex parameters

3. **Interfaces and Types (TypeScript)**
   - Complex type definitions
   - Domain models
   - API response/request types

### ❌ Skip Documentation For

1. **Self-Explanatory Code**
   - Simple getters/setters
   - Obvious utility functions
   - Private helper methods with clear names

2. **Test Files**
   - Test cases are self-documenting through their describe/it structure

## JSDoc Format Standards

### Basic Function Documentation

```typescript
/**
 * Brief description of what the function does (one line)
 *
 * Optional: More detailed explanation if needed. Explain:
 * - Why this function exists
 * - Any important side effects
 * - Business rules it implements
 *
 * @param paramName - Description of the parameter
 * @param optionalParam - Description (optional)
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = myFunction('value', 123);
 * ```
 */
export function myFunction(paramName: string, optionalParam?: number): ReturnType {
  // Implementation
}
```

### Async Function Documentation

```typescript
/**
 * Uploads a file to storage and creates a database record
 *
 * This function performs a two-phase operation:
 * 1. Creates a database record
 * 2. Uploads to storage
 * If upload fails, the database record is rolled back
 *
 * @param file - The file to upload
 * @param projectId - ID of the project to associate the file with
 * @returns Promise resolving to the created file record
 * @throws {NotFoundException} If project doesn't exist
 * @throws {ForbiddenException} If user lacks permission
 * @throws {Error} If storage upload fails
 */
export async function uploadFile(
  file: Express.Multer.File,
  projectId: string,
): Promise<FileRecord> {
  // Implementation
}
```

### React Hook Documentation

```typescript
/**
 * Custom hook for managing project state with pagination
 *
 * Handles fetching, pagination, and error states for project lists.
 * Automatically refetches when page or pageSize changes.
 *
 * @param isAuthenticated - Whether user is authenticated
 * @returns Object containing projects, loading state, and pagination controls
 *
 * @example
 * ```tsx
 * function ProjectList() {
 *   const { projects, loading, currentPage, setCurrentPage } = useProjects(true);
 *
 *   if (loading) return <Loader />;
 *   return <div>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>;
 * }
 * ```
 */
export function useProjects(isAuthenticated: boolean) {
  // Implementation
}
```

### React Component Documentation

```typescript
/**
 * Modal dialog for creating/editing projects
 *
 * @param show - Whether the modal is visible
 * @param onClose - Callback when modal is closed
 * @param project - Project to edit (undefined for create mode)
 * @param onSave - Callback when project is saved
 *
 * @example
 * ```tsx
 * <ProjectModal
 *   show={showModal}
 *   onClose={() => setShowModal(false)}
 *   project={editingProject}
 *   onSave={handleSave}
 * />
 * ```
 */
export function ProjectModal({ show, onClose, project, onSave }: ProjectModalProps) {
  // Implementation
}
```

### Class/Service Documentation

```typescript
/**
 * Service for managing file uploads and storage operations
 *
 * Handles:
 * - File uploads to MinIO/S3
 * - Database record creation
 * - Permission validation
 * - File deletion and cleanup
 *
 * @remarks
 * This service uses a two-phase commit pattern for uploads:
 * 1. Create DB record (can be rolled back)
 * 2. Upload to storage
 * 3. Update DB record on success, or delete on failure
 */
@Injectable()
export class FilesService {
  /**
   * Uploads a file for a project
   *
   * @param projectId - ID of the project
   * @param file - File to upload
   * @param userId - ID of user uploading
   * @param comment - Optional comment for the file
   * @returns The created file record
   * @throws {NotFoundException} If project doesn't exist
   * @throws {ForbiddenException} If user lacks permission
   */
  async uploadFile(
    projectId: string,
    file: Express.Multer.File,
    userId: string,
    comment?: string,
  ): Promise<File> {
    // Implementation
  }
}
```

### Interface/Type Documentation

```typescript
/**
 * User entity from the database
 *
 * Represents a user in the system with authentication and profile data.
 * Used across the application for authentication and authorization.
 */
export interface User {
  /** Unique identifier (UUID v4) */
  id: string;

  /** User's email address (unique, used for login) */
  email: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** User role: ADMIN or CLIENT */
  role: 'ADMIN' | 'CLIENT';

  /** Whether the account is active */
  isActive: boolean;

  /** When the account was created */
  createdAt: Date;

  /** Last time the account was updated */
  updatedAt: Date;
}
```

## Documentation Tags Reference

### Common Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@param` | Document parameters | `@param userId - ID of the user` |
| `@returns` | Document return value | `@returns The created user` |
| `@throws` | Document thrown errors | `@throws {NotFoundException} If not found` |
| `@example` | Provide usage example | See examples above |
| `@remarks` | Additional context | `@remarks Uses two-phase commit` |
| `@deprecated` | Mark as deprecated | `@deprecated Use newFunction instead` |
| `@see` | Reference related items | `@see {@link OtherFunction}` |
| `@internal` | Mark as internal API | `@internal Not for external use` |

### Parameter Modifiers

```typescript
/**
 * @param requiredParam - A required parameter
 * @param optionalParam - An optional parameter (optional)
 * @param defaultParam - Parameter with default value (default: 10)
 */
```

### Return Types

```typescript
/**
 * @returns Promise resolving to user object
 * @returns `true` if successful, `false` otherwise
 * @returns Object with `{ success: boolean, data: User }`
 */
```

## Examples from Our Codebase

### ✅ Good: Well-Documented Hook

```typescript
/**
 * Custom hook to automatically reset a message after a specified duration
 *
 * @param message - The current message to display
 * @param setMessage - Function to update the message
 * @param duration - Duration in milliseconds before resetting (default: MESSAGE_DURATION.SUCCESS)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [success, setSuccess] = useState('');
 *   useAutoResetMessage(success, setSuccess);
 *
 *   const handleAction = () => {
 *     setSuccess('Operation successful!');
 *     // Message will auto-clear after MESSAGE_DURATION.SUCCESS
 *   };
 * }
 * ```
 */
export function useAutoResetMessage(
  message: string,
  setMessage: (message: string) => void,
  duration: number = MESSAGE_DURATION.SUCCESS,
): void {
  // Implementation
}
```

### ❌ Bad: Missing Documentation

```typescript
// ❌ No documentation - unclear what this does
export function processData(input: any, options: any) {
  // Complex logic
}
```

### ✅ Good: Service Method

```typescript
/**
 * Verifies an OTP token for a user
 *
 * Validates the token, updates verification status, and invalidates the token.
 * If the token is invalid or expired, throws an error.
 *
 * @param email - User's email address
 * @param token - OTP token to verify
 * @returns The verified user object
 * @throws {UnauthorizedException} If token is invalid or expired
 * @throws {NotFoundException} If user doesn't exist
 */
async verifyOtp(email: string, token: string): Promise<User> {
  // Implementation
}
```

## Best Practices

### 1. Be Concise

```typescript
// ❌ Too verbose
/**
 * This function takes a user ID as input and then queries the database
 * to find the user with that ID and returns it to the caller
 */

// ✅ Concise
/**
 * Finds a user by ID
 *
 * @param userId - User identifier
 * @returns The user or null if not found
 */
```

### 2. Focus on "Why", Not "What"

```typescript
// ❌ Explains what the code does (obvious from code)
/**
 * Sets isActive to false and saves to database
 */
async deactivateUser(userId: string) { }

// ✅ Explains why and important context
/**
 * Deactivates a user account
 *
 * Prevents login while preserving all user data and relationships.
 * Used for temporary account suspension.
 *
 * @param userId - ID of user to deactivate
 */
async deactivateUser(userId: string) { }
```

### 3. Document Side Effects

```typescript
/**
 * Deletes a project and all associated files
 *
 * ⚠️ WARNING: This operation:
 * - Deletes all files from storage
 * - Removes all associated comments
 * - Cannot be undone
 *
 * @param projectId - ID of project to delete
 * @throws {NotFoundException} If project doesn't exist
 * @throws {ForbiddenException} If user lacks permission
 */
async deleteProject(projectId: string): Promise<void> {
  // Implementation
}
```

### 4. Provide Examples for Complex APIs

```typescript
/**
 * Searches projects with advanced filtering
 *
 * @param filters - Search criteria
 * @param filters.name - Filter by project name (case-insensitive)
 * @param filters.clientId - Filter by client ID
 * @param filters.dateFrom - Filter projects created after this date
 * @param filters.dateTo - Filter projects created before this date
 * @param pagination - Pagination options
 * @returns Paginated list of projects
 *
 * @example
 * ```typescript
 * // Search by client and date range
 * const results = await searchProjects(
 *   {
 *     clientId: 'abc-123',
 *     dateFrom: new Date('2024-01-01'),
 *   },
 *   { page: 1, limit: 10 }
 * );
 * ```
 */
```

### 5. Document Enum Values

```typescript
/**
 * User roles in the system
 */
export enum UserRole {
  /** Administrator with full system access */
  ADMIN = 'ADMIN',

  /** Client with limited access to their own projects */
  CLIENT = 'CLIENT',
}
```

## Migration Strategy

### Phase 1: New Code
- All new functions, classes, and hooks MUST be documented
- PR reviewers should check for JSDoc compliance

### Phase 2: High-Impact Areas
- Document service classes first (highest impact on maintainability)
- Document custom React hooks
- Document complex business logic

### Phase 3: Gradual Coverage
- Add documentation when modifying existing code
- No need to document everything immediately
- Prioritize based on complexity and frequency of changes

## Tools and Validation

### VSCode Settings
```json
{
  "typescript.suggest.completeJSDocs": true,
  "javascript.suggest.completeJSDocs": true
}
```

### ESLint Rules (Optional)
```json
{
  "rules": {
    "jsdoc/require-description": "warn",
    "jsdoc/require-param-description": "warn",
    "jsdoc/require-returns-description": "warn"
  }
}
```

## References

- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [JSDoc Official Documentation](https://jsdoc.app/)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html#jsdoc)
