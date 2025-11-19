/**
 * Soft delete utilities
 * Helper functions for implementing soft delete pattern
 */

/**
 * Utility functions for soft delete operations
 */
export const SoftDeleteUtils = {
  /**
   * Include soft-deleted records in query
   * Use when you need to see all records including deleted ones
   */
  withDeleted: () => ({
    deletedAt: undefined,
  }),

  /**
   * Only get soft-deleted records
   * Use for "trash" or "recycle bin" views
   */
  onlyDeleted: () => ({
    deletedAt: { not: null },
  }),

  /**
   * Get only active (non-deleted) records
   * This is the default behavior, but can be useful for explicit filtering
   */
  onlyActive: () => ({
    deletedAt: null,
  }),

  /**
   * Soft delete a record
   * Marks a record as deleted without removing it from the database
   */
  softDelete: (userId?: string) => ({
    deletedAt: new Date(),
    ...(userId && { deletedBy: userId }),
  }),

  /**
   * Restore a soft-deleted record
   * Removes the deletion marker
   */
  restore: () => ({
    deletedAt: null,
    deletedBy: null,
  }),
};

/**
 * Helper type for models with soft delete
 */
export type WithSoftDelete<T> = T & {
  deletedAt: Date | null;
  deletedBy: string | null;
};
