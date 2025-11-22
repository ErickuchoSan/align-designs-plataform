/**
 * Dependency Injection Tokens
 * Used to inject repository interfaces instead of concrete implementations
 * Follows Dependency Inversion Principle (DIP)
 */

export const INJECTION_TOKENS = {
  // User Repository
  USER_REPOSITORY: Symbol('IUserRepository'),

  // Project Repository
  PROJECT_REPOSITORY: Symbol('IProjectRepository'),

  // File Repository
  FILE_REPOSITORY: Symbol('IFileRepository'),
} as const;
