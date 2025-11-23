import { File, Prisma } from '@prisma/client';
import { IRepository } from '../../common/interfaces/repository.interface';

/**
 * File Repository Interface
 * Defines all file-related database operations
 * Services depend on this interface, not on Prisma implementation
 */
export interface IFileRepository
  extends IRepository<File, Prisma.FileCreateInput, Prisma.FileUpdateInput> {
  /**
   * Find files by project ID
   */
  findByProjectId(projectId: string): Promise<File[]>;

  /**
   * Find files uploaded by a specific user
   */
  findByUploaderId(uploaderId: string): Promise<File[]>;

  /**
   * Find file by ID with uploader relation
   */
  findByIdWithUploader(id: string): Promise<File | null>;

  /**
   * Find files by project with uploader relations
   */
  findByProjectIdWithUploader(projectId: string): Promise<File[]>;

  /**
   * Count files in a project
   */
  countByProjectId(projectId: string): Promise<number>;

  /**
   * Delete all files from a project
   */
  deleteByProjectId(projectId: string): Promise<number>;

  /**
   * Check if file belongs to project
   */
  belongsToProject(fileId: string, projectId: string): Promise<boolean>;
}
