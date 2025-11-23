/**
 * Base Repository Interface
 * Defines common CRUD operations for all repositories
 * Follows Repository Pattern and Dependency Inversion Principle
 */
export interface IRepository<T, CreateDto, UpdateDto> {
  /**
   * Find an entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities with optional filtering
   * Filter structure varies by model (Prisma-specific)
   */
  findAll(filter?: Record<string, unknown>): Promise<T[]>;

  /**
   * Create a new entity
   */
  create(data: CreateDto): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: string, data: UpdateDto): Promise<T>;

  /**
   * Delete an entity
   */
  delete(id: string): Promise<T>;

  /**
   * Check if an entity exists by ID
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
