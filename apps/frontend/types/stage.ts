/**
 * Stage types and permissions for project file management
 */

// Import and re-export Stage from centralized enums file
import { Stage, ProjectStatus, Role } from './enums';
export { Stage, STAGE_LABELS, STAGE_COLORS } from './enums';

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
  projectStatus: ProjectStatus;
  userRole: Role;
  stages: StageInfo[];
}
