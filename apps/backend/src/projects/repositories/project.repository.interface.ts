import { Project } from '@prisma/client';
import { IBaseRepository, FindAllOptions } from '../../common/repositories/base.repository';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';

/**
 * Project repository interface
 * Abstracts data access for Project entities
 */
export interface IProjectRepository
  extends IBaseRepository<Project, CreateProjectDto, UpdateProjectDto> {
  /**
   * Find project by ID with related data
   */
  findByIdWithRelations(id: string): Promise<Project | null>;

  /**
   * Find all projects for a specific client
   */
  findByClientId(clientId: string, options?: FindAllOptions): Promise<Project[]>;

  /**
   * Find projects with pagination and relations
   */
  findAllWithRelations(options: FindAllOptions): Promise<{
    data: Project[];
    total: number;
  }>;

  /**
   * Check if project has uploaded files
   */
  hasUploadedFiles(projectId: string): Promise<boolean>;

  /**
   * Soft delete project and related files
   */
  softDeleteWithFiles(projectId: string): Promise<void>;
}
