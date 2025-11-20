import { ProjectEntity } from '../entities/project.entity';

/**
 * Project Repository Interface
 * Defines contract for project persistence
 * Separates domain logic from infrastructure (database)
 */
export interface IProjectRepository {
  /**
   * Find project by ID
   */
  findById(id: string): Promise<ProjectEntity | null>;

  /**
   * Find all projects
   */
  findAll(params: {
    page: number;
    limit: number;
    clientId?: string;
    includeDeleted?: boolean;
  }): Promise<{
    projects: ProjectEntity[];
    total: number;
  }>;

  /**
   * Find projects by client
   */
  findByClientId(clientId: string): Promise<ProjectEntity[]>;

  /**
   * Find projects by creator
   */
  findByCreatorId(creatorId: string): Promise<ProjectEntity[]>;

  /**
   * Save project (create or update)
   */
  save(project: ProjectEntity): Promise<ProjectEntity>;

  /**
   * Delete project (hard delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if project exists
   */
  existsById(id: string): Promise<boolean>;
}
