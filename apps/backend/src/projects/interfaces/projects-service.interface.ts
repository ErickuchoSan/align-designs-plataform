import { Role } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination.dto';

export interface CreateProjectData {
  name: string;
  description?: string;
  clientId: string;
  createdBy: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  clientId?: string;
}

export interface ProjectWithRelations {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  client?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    files: number;
    comments: number;
  };
}

export interface UserContext {
  userId: string;
  role: Role;
}

export interface IProjectsService {
  /**
   * Create a new project
   */
  create(data: CreateProjectData): Promise<ProjectWithRelations>;

  /**
   * Find all projects with pagination
   */
  findAll(
    page: number,
    limit: number,
    userContext: UserContext,
  ): Promise<PaginatedResult<ProjectWithRelations>>;

  /**
   * Find project by ID
   */
  findOne(
    id: string,
    userContext: UserContext,
  ): Promise<ProjectWithRelations | null>;

  /**
   * Update project
   */
  update(
    id: string,
    data: UpdateProjectData,
    userContext: UserContext,
  ): Promise<ProjectWithRelations>;

  /**
   * Soft delete project
   */
  remove(id: string, userContext: UserContext): Promise<void>;
}
