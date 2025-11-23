/**
 * Centralized cache keys for the application
 * Using constants prevents typos and makes key management easier
 */

export const CACHE_KEYS = {
  /**
   * Project-related cache keys
   */
  PROJECTS: {
    LIST: (page: number, limit: number, userId?: string) =>
      userId
        ? `projects:list:user:${userId}:page:${page}:limit:${limit}`
        : `projects:list:page:${page}:limit:${limit}`,
    DETAIL: (projectId: string) => `projects:detail:${projectId}`,
    FILES: (projectId: string) => `projects:${projectId}:files`,
  },

  /**
   * User-related cache keys
   */
  USERS: {
    LIST: (page: number, limit: number) =>
      `users:list:page:${page}:limit:${limit}`,
    DETAIL: (userId: string) => `users:detail:${userId}`,
    PROFILE: (userId: string) => `users:profile:${userId}`,
  },

  /**
   * File-related cache keys
   */
  FILES: {
    LIST: (projectId: string, page: number, limit: number) =>
      `files:project:${projectId}:page:${page}:limit:${limit}`,
    DETAIL: (fileId: string) => `files:detail:${fileId}`,
  },
} as const;

/**
 * Cache TTL (Time To Live) values in milliseconds
 */
export const CACHE_TTL = {
  /** 1 minute - for frequently changing data */
  ONE_MINUTE: 60 * 1000,

  /** 5 minutes - default for most queries */
  FIVE_MINUTES: 5 * 60 * 1000,

  /** 15 minutes - for relatively stable data */
  FIFTEEN_MINUTES: 15 * 60 * 1000,

  /** 1 hour - for rarely changing data */
  ONE_HOUR: 60 * 60 * 1000,

  /** 1 day - for very stable reference data */
  ONE_DAY: 24 * 60 * 60 * 1000,
} as const;
