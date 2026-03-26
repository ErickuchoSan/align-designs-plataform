/**
 * Prisma query helper utilities
 * Centralized helpers to avoid code duplication across services
 */

/**
 * Get where clause for filtering out soft-deleted records
 * Use this instead of manually adding `deletedAt: null` to every query
 *
 * @example
 * // Instead of:
 * await prisma.user.findMany({ where: { deletedAt: null } })
 *
 * // Use:
 * await prisma.user.findMany({ where: getActiveRecordsWhere() })
 *
 * // Can be combined with other conditions:
 * await prisma.user.findMany({
 *   where: { ...getActiveRecordsWhere(), email: 'user@example.com' }
 * })
 */
export function getActiveRecordsWhere() {
  return { deletedAt: null };
}

/**
 * Merge active records filter with additional where conditions
 * Convenience helper for combining soft-delete filter with other conditions
 *
 * @param additionalWhere - Additional where conditions to merge
 * @returns Combined where clause with deletedAt: null
 *
 * @example
 * await prisma.user.findMany({
 *   where: getActiveRecordsWhereWith({ role: 'ADMIN' })
 * })
 */
export function getActiveRecordsWhereWith<T extends Record<string, unknown>>(
  additionalWhere: T,
): T & { deletedAt: null } {
  return {
    ...additionalWhere,
    deletedAt: null,
  };
}
