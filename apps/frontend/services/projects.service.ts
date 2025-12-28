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
    filtersOrPage: { page?: number; limit?: number; clientId?: string } | number = 1,
    limitParam: number = 10
  ): Promise<PaginatedProjects> {
    let params: any = {};

    if (typeof filtersOrPage === 'number') {
      params = { page: filtersOrPage, limit: limitParam };
    } else {
      params = { ...filtersOrPage };
      if (!params.limit) params.limit = 10;
      if (!params.page) params.page = 1;
    }

    const response = await api.get<PaginatedProjects>(this.BASE_URL, {
      params,
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
   * Fetch a single project by ID
   */
  static async uploadFileVersion(parentFileId: string, file: File, notes?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) {
      formData.append('comment', notes); // Reusing comment field in DTO
    }
    const response = await api.post(`/files/${parentFileId}/version`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  static async getFileUrl(fileId: string): Promise<{ url: string }> {
    const response = await api.get<{ url: string }>(`${this.BASE_URL}/${fileId}/download`);
    return response.data;
  }

  /**
   * Create a new project
   * Phase 1: Added workflow fields
   */
  static async create(data: {
    name: string;
    description?: string;
    clientId: string;
    employeeIds?: string[];
    initialAmountRequired?: number;
    deadlineDate?: string;
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

  // ===== Phase 1: Workflow Endpoints =====

  /**
   * Assign employees to a project
   */
  static async assignEmployees(
    projectId: string,
    employeeIds: string[]
  ): Promise<{ message: string; projectId: string; employeeCount: number }> {
    const response = await api.post(`${this.BASE_URL}/${projectId}/employees`, {
      employeeIds,
    });
    return response.data;
  }

  /**
   * Remove employee from project
   */
  static async removeEmployee(
    projectId: string,
    employeeId: string
  ): Promise<{ message: string; projectId: string; employeeId: string }> {
    const response = await api.delete(
      `${this.BASE_URL}/${projectId}/employees/${employeeId}`
    );
    return response.data;
  }

  /**
   * Get project employees
   */
  static async getEmployees(projectId: string): Promise<any[]> {
    const response = await api.get(`${this.BASE_URL}/${projectId}/employees`);
    return response.data;
  }

  /**
   * Record payment for project
   */
  static async recordPayment(
    projectId: string,
    amount: number,
    notes?: string
  ): Promise<{
    message: string;
    project: Project;
    activated: boolean;
  }> {
    const response = await api.post(`${this.BASE_URL}/${projectId}/payments`, {
      amount,
      notes,
    });
    return response.data;
  }

  /**
   * Activate project manually
   */
  static async activate(
    projectId: string
  ): Promise<{ message: string; project: Project }> {
    const response = await api.post(`${this.BASE_URL}/${projectId}/activate`);
    return response.data;
  }

  /**
   * Complete project
   */
  static async complete(
    projectId: string
  ): Promise<{ message: string; project: Project }> {
    const response = await api.post(`${this.BASE_URL}/${projectId}/complete`);
    return response.data;
  }

  /**
   * Archive project
   */
  static async archive(
    projectId: string
  ): Promise<{ message: string; project: Project }> {
    const response = await api.post(`${this.BASE_URL}/${projectId}/archive`);
    return response.data;
  }

  /**
   * Get project status summary
   */
  static async getStatus(projectId: string): Promise<{
    id: string;
    name: string;
    status: string;
    startDate?: string;
    deadlineDate?: string;
    archivedAt?: string;
    paymentProgress?: {
      required: number;
      paid: number;
      remaining: number;
      percentage: number;
    };
    employeeCount: number;
    fileCount: number;
    feedbackCycleCount: number;
    canActivate: boolean;
  }> {
    const response = await api.get(`${this.BASE_URL}/${projectId}/status`);
    return response.data;
  }

  /**
   * Get project completion status checklist
   */
  static async getCompletionStatus(projectId: string): Promise<{
    isReady: boolean;
    checklist: {
      allClientPaymentsReceived: boolean;
      allEmployeesPaid: boolean;
      noOpenFeedback: boolean;
      finalFilesDelivered: boolean;
    };
    counts: {
      pendingInvoices: number;
      pendingEmployeePayments: number;
      openFeedback: number;
    }
  }> {
    const response = await api.get(`${this.BASE_URL}/${projectId}/completion-status`);
    return response.data;
  }
}
