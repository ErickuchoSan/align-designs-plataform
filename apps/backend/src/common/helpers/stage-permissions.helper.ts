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
   * Initial project scope, consultation notes, client questionnaire, inspiration images
   */
  BRIEF_PROJECT: {
    canView: [Role.ADMIN, Role.EMPLOYEE, Role.CLIENT],
    canWrite: [Role.ADMIN, Role.CLIENT],
    canDelete: [Role.ADMIN],
    description: 'Initial project scope, consultation notes, and client requirements.',
  },

  /**
   * CONCEPT DESIGN (was REFERENCES)
   * Preliminary floor plan, conceptual sketches, initial layout
   * Internal stage - clients see these files via Design Review (FEEDBACK_CLIENT)
   */
  REFERENCES: {
    canView: [Role.ADMIN, Role.EMPLOYEE],
    canWrite: [Role.ADMIN],
    canDelete: [Role.ADMIN],
    description: 'Preliminary designs, conceptual sketches, and initial layout proposals.',
  },

  /**
   * DESIGN REVIEW (was FEEDBACK_CLIENT)
   * Client reviews the design and provides feedback
   * Private space for client-admin communication
   */
  FEEDBACK_CLIENT: {
    canView: [Role.ADMIN, Role.CLIENT],
    canWrite: [Role.ADMIN, Role.CLIENT],
    canDelete: [Role.ADMIN],
    description: 'Client reviews designs and provides feedback. Admin responds.',
  },

  /**
   * REVISION TRACKING (was FEEDBACK_EMPLOYEE)
   * Internal revision control - hidden from clients
   * Tracks revision rounds: client comments, changes made, updated files
   */
  FEEDBACK_EMPLOYEE: {
    canView: [Role.ADMIN, Role.EMPLOYEE],
    canWrite: [Role.ADMIN],
    canDelete: [Role.ADMIN],
    description: 'Internal revision tracking. Employees read only. Hidden from clients.',
  },

  /**
   * CONSTRUCTION PLANS (was SUBMITTED)
   * Full plan set: floor plan, elevations, electrical, foundation, roof
   * Employees submit their work here
   */
  SUBMITTED: {
    canView: [Role.ADMIN, Role.EMPLOYEE],
    canWrite: [Role.EMPLOYEE],
    canDelete: [],
    description: 'Construction plans submitted by employees. States: Drafting, Under Review, Submitted.',
  },

  /**
   * CLIENT REVIEW (was ADMIN_APPROVED)
   * Client reviews the complete plan set
   * Can leave comments and approve the project
   */
  ADMIN_APPROVED: {
    canView: [Role.ADMIN, Role.CLIENT],
    canWrite: [Role.ADMIN, Role.CLIENT],
    canDelete: [Role.ADMIN],
    description: 'Client reviews complete plan set, leaves comments, and approves.',
  },

  /**
   * FINAL DELIVERABLES (was CLIENT_APPROVED)
   * Final PDF set, CAD files, renders
   * Ready for client download
   */
  CLIENT_APPROVED: {
    canView: [Role.ADMIN, Role.CLIENT],
    canWrite: [Role.ADMIN],
    canDelete: [Role.ADMIN],
    description: 'Final deliverables: PDF plans, CAD files, renders for download.',
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
 * Updated to reflect the new workflow structure:
 * Project Brief → Concept Design → Design Review → Revision Tracking →
 * Construction Plans → Client Review → Final Deliverables → Payments
 */
export function getStageName(stage: Stage): string {
  const names: Record<Stage, string> = {
    BRIEF_PROJECT: 'Project Brief',
    REFERENCES: 'Concept Design',
    FEEDBACK_CLIENT: 'Design Review',
    FEEDBACK_EMPLOYEE: 'Revision Tracking',
    SUBMITTED: 'Construction Plans',
    ADMIN_APPROVED: 'Client Review',
    CLIENT_APPROVED: 'Final Deliverables',
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
    REFERENCES: '🎨',       // Concept Design
    FEEDBACK_CLIENT: '💬',  // Design Review
    FEEDBACK_EMPLOYEE: '📝', // Revision Tracking
    SUBMITTED: '📐',        // Construction Plans
    ADMIN_APPROVED: '👁️',   // Client Review
    CLIENT_APPROVED: '📦',  // Final Deliverables
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
