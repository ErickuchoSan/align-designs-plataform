import { z } from 'zod';

/**
 * Pagination schema for query parameters
 * Uses coerce to convert string query params to numbers
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

/**
 * Pagination with sorting schema
 */
export const paginationWithSortSchema = paginationSchema.extend({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationWithSortDto = z.infer<typeof paginationWithSortSchema>;

/**
 * Generic paginated result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
