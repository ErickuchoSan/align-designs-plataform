// ============================================================================
// PHASE 1: WORKFLOW SYSTEM TYPES
// ============================================================================

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  EMPLOYEE = 'EMPLOYEE', // Phase 1: Added employee role
}

export enum ProjectStatus {
  WAITING_PAYMENT = 'WAITING_PAYMENT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum Stage {
  BRIEF_PROJECT = 'BRIEF_PROJECT',
  FEEDBACK_CLIENT = 'FEEDBACK_CLIENT',
  FEEDBACK_EMPLOYEE = 'FEEDBACK_EMPLOYEE',
  REFERENCES = 'REFERENCES',
  SUBMITTED = 'SUBMITTED',
  ADMIN_APPROVED = 'ADMIN_APPROVED',
  CLIENT_APPROVED = 'CLIENT_APPROVED',
  PAYMENTS = 'PAYMENTS',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
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
  archivedAt?: string;

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
  feedbackCycleId?: string;
  approvedAdminAt?: string;
  approvedClientAt?: string;
  pendingPayment: boolean;

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
  role: 'CLIENT' | 'EMPLOYEE';
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
  status: 'open' | 'submitted' | 'approved' | 'rejected';
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
  targetAudience: 'client_space' | 'employee_space';
  fileDocumentId?: string;
  content?: string;
  sequenceInCycle: number;
  createdAt: string;
  cycle?: FeedbackCycle;
  project?: Project;
  creator?: User;
}

// Phase 1: Helper types for stage labels and colors
export const STAGE_LABELS: Record<Stage, string> = {
  [Stage.BRIEF_PROJECT]: 'Brief del Proyecto',
  [Stage.FEEDBACK_CLIENT]: 'Feedback (Cliente)',
  [Stage.FEEDBACK_EMPLOYEE]: 'Feedback (Empleado)',
  [Stage.REFERENCES]: 'Referencias',
  [Stage.SUBMITTED]: 'Entregado',
  [Stage.ADMIN_APPROVED]: 'Aprobado por Admin',
  [Stage.CLIENT_APPROVED]: 'Aprobado por Cliente',
  [Stage.PAYMENTS]: 'Pagos',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.WAITING_PAYMENT]: 'Esperando Pago',
  [ProjectStatus.ACTIVE]: 'Activo',
  [ProjectStatus.COMPLETED]: 'Completado',
  [ProjectStatus.ARCHIVED]: 'Archivado',
};

export const STAGE_COLORS: Record<Stage, string> = {
  [Stage.BRIEF_PROJECT]: 'blue',
  [Stage.FEEDBACK_CLIENT]: 'purple',
  [Stage.FEEDBACK_EMPLOYEE]: 'orange',
  [Stage.REFERENCES]: 'cyan',
  [Stage.SUBMITTED]: 'yellow',
  [Stage.ADMIN_APPROVED]: 'green',
  [Stage.CLIENT_APPROVED]: 'emerald',
  [Stage.PAYMENTS]: 'pink',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.WAITING_PAYMENT]: 'yellow',
  [ProjectStatus.ACTIVE]: 'green',
  [ProjectStatus.COMPLETED]: 'blue',
  [ProjectStatus.ARCHIVED]: 'gray',
};
