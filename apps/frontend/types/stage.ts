/**
 * Stage types and permissions for project file management
 */

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

export interface StagePermissions {
  canView: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export interface StageInfo {
  stage: Stage;
  name: string;
  icon: string;
  fileCount: number;
  permissions: StagePermissions;
  description: string;
}

export interface ProjectStagesResponse {
  projectId: string;
  projectName: string;
  projectStatus: string;
  userRole: string;
  stages: StageInfo[];
}
