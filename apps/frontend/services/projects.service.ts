import { api } from '@/lib/api';
import { Project, PaginatedProjects, User, ProjectStatus } from '@/types';
import { ProjectStagesResponse } from '@/types/stage';

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  versionNumber?: number;
}

export interface ProjectCompletionStatus {
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
}

export interface ProjectDeletionCheck {
  projectId: string;
  projectName: string;
  hasData: boolean;
  details: {
    files: boolean;
    employees: boolean;
    invoices: boolean;
    payments: boolean;
  };
  counts: {
    files: number;
    employees: number;
    invoices: number;
    payments: number;
  };
  warnings: string[];
  client: {
    id: string;
    name: string;
  } | null;
}

export interface ProjectStatusSummary {
  id: string;
  name: string;
  status: ProjectStatus;
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
}

/**
 * Projects Service
 * Encapsulates all project-related API calls
 * Reduces coupling between UI components and API endpoints
 */
export class ProjectsService {
  private static readonly BASE_URL = '/projects';

  /**
   * Fetch all projects with pagination
   */
  static async getAll(
    filtersOrPage: { page?: number; limit?: number; clientId?: string } | number = 1,
    limitParam: number = 10
  ): Promise<PaginatedProjects> {
    let params: Record<string, string | number | undefined> = {};

    if (typeof filtersOrPage === 'number') {
      params = { page: filtersOrPage, limit: limitParam };
    } else {
      params = { ...filtersOrPage };
      if (!params.limit) params.limit = 10;
      if (!params.page) params.page = 1;
    }

    const response = await api.get<{ data: Project[]; meta: any }>(this.BASE_URL, {
      params,
    });
    
    return {
      projects: response.data.data,
      total: response.data.meta.total,
      page: response.data.meta.page,
      limit: response.data.meta.limit,
      totalPages: response.data.meta.totalPages
    };
  }

  /**
   * Fetch a single project by ID
   */
  static async getById(id: string): Promise<Project> {
    const response = await api.get<Project>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Upload a new version of a file
   */
  static async uploadFileVersion(parentFileId: string, file: File, notes?: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) {
      formData.append('comment', notes); // Reusing comment field in DTO
    }
    const response = await api.post<FileUploadResponse>(`/files/${parentFileId}/version`, formData, {
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
    initialPaymentDeadline?: string;
  }): Promise<Project> {
    const response = await api.post<Project>(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Update an existing project
   * Phase 1: Added workflow fields
   */
  static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      clientId?: string;
      employeeIds?: string[];
      initialAmountRequired?: number;
      deadlineDate?: string;
      initialPaymentDeadline?: string;
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
  static async getEmployees(projectId: string): Promise<User[]> {
    const response = await api.get<User[]>(`${this.BASE_URL}/${projectId}/employees`);
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
  static async getStatus(projectId: string): Promise<ProjectStatusSummary> {
    const response = await api.get<ProjectStatusSummary>(`${this.BASE_URL}/${projectId}/status`);
    return response.data;
  }

  /**
   * Get project completion status checklist
   */
  static async getCompletionStatus(projectId: string): Promise<ProjectCompletionStatus> {
    const response = await api.get<ProjectCompletionStatus>(`${this.BASE_URL}/${projectId}/completion-status`);
    return response.data;
  }

  /**
   * Get accessible stages for the current user in a project
   * Returns stages filtered by role-based permissions with file counts
   */
  static async getStages(projectId: string): Promise<ProjectStagesResponse> {
    const response = await api.get<ProjectStagesResponse>(`${this.BASE_URL}/${projectId}/stages`);
    return response.data;
  }

  /**
   * Check if project has data before deletion
   * Returns warnings about files, payments, invoices, and employees
   */
  static async checkDeletionSafety(projectId: string): Promise<ProjectDeletionCheck> {
    const response = await api.get<ProjectDeletionCheck>(`${this.BASE_URL}/${projectId}/deletion-check`);
    return response.data;
  }

  /**
   * Approve project brief
   * Client action to confirm the project scope
   */
  static async approveBrief(projectId: string): Promise<{
    message: string;
    project: Project;
    approvedAt: string;
  }> {
    const response = await api.post(`${this.BASE_URL}/${projectId}/approve-brief`);
    return response.data;
  }
}
