// ============================================================================
// PHASE 1: WORKFLOW SYSTEM TYPES
// ============================================================================

// Re-export enums from centralized enums file
import {
  Role,
  ProjectStatus,
  Stage,
  FeedbackStatus,
  FeedbackAudience,
  ROLE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  STAGE_LABELS,
  STAGE_COLORS,
} from './enums';

export {
  Role,
  ProjectStatus,
  Stage,
  FeedbackStatus,
  FeedbackAudience,
  ROLE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  STAGE_LABELS,
  STAGE_COLORS,
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  hasPassword?: boolean; // Whether user has set their password
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Phase 1: Workflow fields
  status: ProjectStatus;
  initialAmountRequired?: number;
  amountPaid: number;
  startDate?: string;
  deadlineDate?: string;
  initialPaymentDeadline?: string;
  archivedAt?: string;
  briefApprovedAt?: string; // When client approved the project brief

  // Relations
  client?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  creator?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  employees?: ProjectEmployee[];
  _count?: {
    files: number;
    comments: number;
    employees: number;
  };
}

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  projectId: string;
  uploadedBy: string;
  uploadedAt: string;

  // Phase 1: Workflow fields
  stage?: Stage;
  comment?: string;
  versionNumber?: number;
  versionLabel?: string;
  isCurrentVersion?: boolean;
  parentFileId?: string;
  rejectionCount?: number;
  feedbackCycleId?: string;
  approvedAdminAt?: string;
  approvedClientAt?: string;
  pendingPayment?: boolean;

  // Relations
  uploader?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
  feedbackCycle?: FeedbackCycle;
  downloadUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPRequest {
  email: string;
}

export interface OTPVerify {
  email: string;
  token: string;
}

export interface AuthResponse {
  user: User;
  // NOTE: access_token is NOT in response body - it's sent via httpOnly cookie only
}

export interface CreateClientDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CreateUserDto extends CreateClientDto {
  role: Role.CLIENT | Role.EMPLOYEE;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isDeleted: boolean;
  versionNumber?: number;
  versionLabel?: string;
  isCurrentVersion?: boolean;
  parentFileId?: string;
  rejectionCount?: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  clientId: string;
  // Phase 1: Workflow fields
  initialAmountRequired?: number;
  startDate?: string;
  deadlineDate?: string;
  initialPaymentDeadline?: string;
  employeeIds?: string[]; // IDs de empleados a asignar
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  // Phase 1: Workflow fields
  status?: ProjectStatus;
  initialAmountRequired?: number;
  startDate?: string;
  deadlineDate?: string;
  initialPaymentDeadline?: string;
}

export interface PaginatedProjects {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// PHASE 1: NEW INTERFACES
// ============================================================================

export interface ProjectEmployee {
  projectId: string;
  employeeId: string;
  assignedAt: string;
  employee?: User;
  project?: Project;
}

export interface FeedbackCycle {
  id: string;
  projectId: string;
  employeeId: string;
  startDate: string;
  endDate?: string;
  status: FeedbackStatus;
  createdAt: string;
  project?: Project;
  employee?: User;
  files?: File[];
  feedback?: Feedback[];
}

export interface Feedback {
  id: string;
  feedbackCycleId: string;
  projectId: string;
  createdBy: string;
  targetAudience: FeedbackAudience;
  fileDocumentId?: string;
  content?: string;
  sequenceInCycle: number;
  createdAt: string;
  cycle?: FeedbackCycle;
  project?: Project;
  creator?: User;
}

// Note: STAGE_LABELS, PROJECT_STATUS_LABELS, STAGE_COLORS, and PROJECT_STATUS_COLORS
// are now exported from ./enums.ts (see re-exports at top of file)

export interface FileFilters {
  page: number;
  limit: number;
  name?: string;
  type?: string;
}

