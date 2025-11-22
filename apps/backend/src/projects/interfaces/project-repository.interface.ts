import { Project, Prisma } from '@prisma/client';
import {
  IRepository,
  PaginatedResult,
} from '../../common/interfaces/repository.interface';

/**
 * Project Repository Interface
 * Defines all project-related database operations
 * Services depend on this interface, not on Prisma implementation
 */
export interface IProjectRepository
  extends IRepository<
    Project,
    Prisma.ProjectCreateInput,
    Prisma.ProjectUpdateInput
  > {
  /**
   * Find projects with pagination
   */
  findPaginated(
    page: number,
    limit: number,
    filter?: any,
  ): Promise<PaginatedResult<Project>>;

  /**
   * Find projects by client ID
   */
  findByClientId(clientId: string): Promise<Project[]>;

  /**
   * Find projects created by a specific user
   */
  findByCreatorId(creatorId: string): Promise<Project[]>;

  /**
   * Find project with client and creator relations
   */
  findByIdWithRelations(id: string): Promise<Project | null>;

  /**
   * Find projects with file and comment counts
   */
  findByIdWithCounts(id: string): Promise<Project | null>;

  /**
   * Check if user can change project client
   * Returns true if project has no files or comments
   */
  canChangeClient(projectId: string): Promise<boolean>;

  /**
   * Count total projects
   */
  count(filter?: any): Promise<number>;

  /**
   * Find all projects with relations (client, creator, counts)
   */
  findAllWithRelations(filter?: any): Promise<Project[]>;
}
