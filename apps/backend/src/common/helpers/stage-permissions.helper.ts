import { Role, Stage } from '@prisma/client';

/**
 * Stage Permissions System
 *
 * Defines who can view, write, and delete files in each project stage.
 * Based on the workflow documented in system_workflow_v2.md
 */

export interface StagePermissions {
  canView: Role[];
  canWrite: Role[];
  canDelete: Role[];
  description: string;
}

/**
 * Complete permission matrix for all project stages
 */
export const STAGE_PERMISSIONS: Record<Stage, StagePermissions> = {
  /**
   * PROJECT BRIEF
   * Admin uploads initial project specifications
   * Employees can read to understand requirements
   */
  BRIEF_PROJECT: {
    canView: [Role.ADMIN, Role.EMPLOYEE],
    canWrite: [Role.ADMIN],
    canDelete: [Role.ADMIN],
    description: 'Admin uploads initial specs. Required before employees can work.',
  },

  /**
   * FEEDBACK - CLIENT SPACE
   * Private space for client-admin communication
   * Employees cannot see this feedback
   */
  FEEDBACK_CLIENT: {
    canView: [Role.ADMIN, Role.CLIENT],
    canWrite: [Role.ADMIN, Role.CLIENT],
    canDelete: [Role.ADMIN],
    description: 'Client creates feedback. Admin responds. Separate from employee feedback.',
  },

  /**
   * FEEDBACK - EMPLOYEE SPACE
   * Admin creates feedback for employees
   * Employees can only read, cannot respond here
   * Can be linked to rejected files
   */
  FEEDBACK_EMPLOYEE: {
    canView: [Role.ADMIN, Role.EMPLOYEE],
    canWrite: [Role.ADMIN],
    canDelete: [Role.ADMIN],
    description: 'Admin creates feedback for employees. Employees read only.',
  },

  /**
   * REFERENCES
   * Client can upload visual references, links, inspiration
   * Admin can also add references
   */
  REFERENCES: {
    canView: [Role.ADMIN, Role.CLIENT],
    canWrite: [Role.ADMIN, Role.CLIENT],
    canDelete: [Role.ADMIN],
    description: 'Client uploads links (Google, visual references).',
  },

  /**
   * SUBMITTED
   * Employees submit their work here
   * Supports versioning with notes
   */
  SUBMITTED: {
    canView: [Role.ADMIN, Role.EMPLOYEE],
    canWrite: [Role.ADMIN, Role.EMPLOYEE],
    canDelete: [Role.ADMIN],
    description: 'Employees submit work. Supports versioning with notes.',
  },

  /**
   * ADMIN APPROVED
   * Files that admin has approved
   * Waiting for client presentation
   */
  ADMIN_APPROVED: {
    canView: [Role.ADMIN],
    canWrite: [Role.ADMIN],
    canDelete: [Role.ADMIN],
    description: 'Admin only. Files approved by admin.',
  },

  /**
   * CLIENT APPROVED
   * Files that client has approved
   * Client does NOT see this stage (only admin and employee)
   */
  CLIENT_APPROVED: {
    canView: [Role.ADMIN],
    canWrite: [Role.ADMIN],
    canDelete: [Role.ADMIN],
    description: 'Admin only. Client does NOT see this stage.',
  },

  /**
   * PAYMENTS
   * Special stage with 3 subsections and strict privacy filtering:
   *
   * 1. INVOICES (Admin → Client):
   *    - Admin: sees ALL invoices to ALL clients
   *    - Client: sees ONLY their own invoices
   *    - Employee: NO access
   *
   * 2. CLIENT PAYMENTS (Client → Admin):
   *    - Admin: sees ALL payments from ALL clients
   *    - Client: sees ONLY their own payments
   *    - Employee: NO access
   *
   * 3. EMPLOYEE PAYMENTS (Admin → Employee):
   *    - Admin: sees ALL payments to ALL employees
   *    - Client: NO access
   *    - Employee: sees ONLY their own payments
   *
   * NOTE: Requires additional filtering in service layer by:
   * - Payment type (invoice/client_payment/employee_payment)
   * - User ID (fromUserId/toUserId based on role)
   */
  PAYMENTS: {
    canView: [Role.ADMIN, Role.CLIENT, Role.EMPLOYEE],
    canWrite: [Role.ADMIN, Role.CLIENT],
    canDelete: [Role.ADMIN],
    description: 'Invoices and payments. Strict privacy filtering by user and type.',
  },
};

/**
 * Check if a user role can view files in a specific stage
 */
export function canViewStage(role: Role, stage: Stage): boolean {
  return STAGE_PERMISSIONS[stage].canView.includes(role);
}

/**
 * Check if a user role can write/upload files to a specific stage
 */
export function canWriteToStage(role: Role, stage: Stage): boolean {
  return STAGE_PERMISSIONS[stage].canWrite.includes(role);
}

/**
 * Check if a user role can delete files from a specific stage
 */
export function canDeleteFromStage(role: Role, stage: Stage): boolean {
  return STAGE_PERMISSIONS[stage].canDelete.includes(role);
}

/**
 * Get all stages that a user role can view
 * Used for filtering the stage list in UI
 */
export function getAccessibleStages(role: Role): Stage[] {
  return Object.entries(STAGE_PERMISSIONS)
    .filter(([_, perms]) => perms.canView.includes(role))
    .map(([stage]) => stage as Stage);
}

/**
 * Get all stages that a user role can write to
 * Used for showing upload buttons
 */
export function getWritableStages(role: Role): Stage[] {
  return Object.entries(STAGE_PERMISSIONS)
    .filter(([_, perms]) => perms.canWrite.includes(role))
    .map(([stage]) => stage as Stage);
}

/**
 * Get permission details for a specific stage
 */
export function getStagePermissions(stage: Stage): StagePermissions {
  return STAGE_PERMISSIONS[stage];
}

/**
 * Get user-friendly stage name
 */
export function getStageName(stage: Stage): string {
  const names: Record<Stage, string> = {
    BRIEF_PROJECT: 'Project Brief',
    FEEDBACK_CLIENT: 'Client Feedback',
    FEEDBACK_EMPLOYEE: 'Employee Feedback',
    REFERENCES: 'References',
    SUBMITTED: 'Submitted',
    ADMIN_APPROVED: 'Admin Approved',
    CLIENT_APPROVED: 'Client Approved',
    PAYMENTS: 'Payments',
  };
  return names[stage];
}

/**
 * Get stage icon/emoji
 */
export function getStageIcon(stage: Stage): string {
  const icons: Record<Stage, string> = {
    BRIEF_PROJECT: '📋',
    FEEDBACK_CLIENT: '💬',
    FEEDBACK_EMPLOYEE: '📝',
    REFERENCES: '🔗',
    SUBMITTED: '📤',
    ADMIN_APPROVED: '✅',
    CLIENT_APPROVED: '⭐',
    PAYMENTS: '💰',
  };
  return icons[stage];
}

/**
 * Validate if user has permission for an action on a stage
 * Throws error if not permitted
 */
export function validateStagePermission(
  role: Role,
  stage: Stage,
  action: 'view' | 'write' | 'delete',
): void {
  let hasPermission = false;

  switch (action) {
    case 'view':
      hasPermission = canViewStage(role, stage);
      break;
    case 'write':
      hasPermission = canWriteToStage(role, stage);
      break;
    case 'delete':
      hasPermission = canDeleteFromStage(role, stage);
      break;
  }

  if (!hasPermission) {
    throw new Error(
      `Permission denied: ${role} cannot ${action} in stage ${getStageName(stage)}`,
    );
  }
}
