/**
 * Base repository interface
 * Defines common CRUD operations for all repositories
 *
 * This follows the Repository pattern to abstract data access logic
 * and comply with Dependency Inversion Principle (DIP)
 */
export interface IBaseRepository<T, CreateDto, UpdateDto> {
  /**
   * Find entity by ID (excluding soft-deleted)
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities (excluding soft-deleted)
   */
  findAll(options?: FindAllOptions): Promise<T[]>;

  /**
   * Create new entity
   */
  create(data: CreateDto): Promise<T>;

  /**
   * Update existing entity
   */
  update(id: string, data: UpdateDto): Promise<T>;

  /**
   * Soft delete entity
   */
  softDelete(id: string): Promise<T>;

  /**
   * Count entities (excluding soft-deleted)
   */
  count(where?: any): Promise<number>;
}

export interface FindAllOptions {
  skip?: number;
  take?: number;
  where?: any;
  orderBy?: any;
  include?: any;
}
