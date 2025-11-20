import { api } from '@/lib/api';
import { Project, PaginatedProjects } from '@/types';

/**
 * Projects Service
 * Encapsulates all project-related API calls
 * Reduces coupling between UI components and API endpoints
 */
export class ProjectsService {
  private static readonly BASE_URL = '/api/v1/projects';

  /**
   * Fetch all projects with pagination
   */
  static async getAll(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedProjects> {
    const response = await api.get<PaginatedProjects>(this.BASE_URL, {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Fetch a single project by ID
   */
  static async getById(id: string): Promise<Project> {
    const response = await api.get<Project>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Create a new project
   */
  static async create(data: {
    name: string;
    description?: string;
    clientId: string;
  }): Promise<Project> {
    const response = await api.post<Project>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Update an existing project
   */
  static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      clientId?: string;
    }
  ): Promise<Project> {
    const response = await api.patch<Project>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a project
   */
  static async delete(id: string): Promise<void> {
    await api.delete(`${this.BASE_URL}/${id}`);
  }
}
