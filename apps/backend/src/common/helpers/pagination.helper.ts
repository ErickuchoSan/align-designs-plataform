import type { PaginationDto, PaginatedResult } from '../schemas';

/**
 * Centralized pagination helper to avoid code duplication
 * Implements DRY principle for pagination logic across all services
 */
export class PaginationHelper {
  /**
   * Calculate skip value for database queries
   */
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Calculate total pages
   */
  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  /**
   * Build pagination metadata
   */
  static buildPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<unknown>['meta'] {
    const totalPages = this.calculateTotalPages(total, limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Build complete paginated result
   */
  static buildPaginatedResult<T>(
    data: T[],
    total: number,
    paginationDto: PaginationDto,
  ): PaginatedResult<T> {
    const { page = 1, limit = 10 } = paginationDto;

    return {
      data,
      meta: this.buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * Extract pagination parameters with defaults
   */
  static extractPaginationParams(paginationDto: PaginationDto): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = this.calculateSkip(page, limit);

    return { page, limit, skip };
  }
}
