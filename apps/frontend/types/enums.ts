/**
 * Centralized Enum Definitions
 *
 * All enums are defined here to prevent duplication and ensure consistency
 * across the frontend application. These should mirror backend enum definitions.
 */

// ============================================================================
// USER & AUTHENTICATION ENUMS
// ============================================================================

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
  EMPLOYEE = 'EMPLOYEE',
}

// ============================================================================
// PROJECT ENUMS
// ============================================================================

export enum ProjectStatus {
  WAITING_PAYMENT = 'WAITING_PAYMENT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
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

// ============================================================================
// INVOICE ENUMS
// ============================================================================

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// PAYMENT ENUMS
// ============================================================================

export enum PaymentType {
  INITIAL_PAYMENT = 'INITIAL_PAYMENT',
  INVOICE = 'INVOICE',
  EMPLOYEE_PAYMENT = 'EMPLOYEE_PAYMENT',
}

export enum PaymentMethod {
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
}

export enum PaymentStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
}

// ============================================================================
// EMPLOYEE PAYMENT ENUMS
// ============================================================================

export enum EmployeePaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// FEEDBACK ENUMS (Previously string literal unions)
// ============================================================================

export enum FeedbackStatus {
  OPEN = 'open',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum FeedbackAudience {
  CLIENT_SPACE = 'client_space',
  EMPLOYEE_SPACE = 'employee_space',
}

// ============================================================================
// ENUM LABEL MAPPINGS
// ============================================================================

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Administrator',
  [Role.CLIENT]: 'Client',
  [Role.EMPLOYEE]: 'Employee',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.WAITING_PAYMENT]: 'Waiting for Payment',
  [ProjectStatus.ACTIVE]: 'Active',
  [ProjectStatus.PAUSED]: 'Paused',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.ARCHIVED]: 'Archived',
};

export const STAGE_LABELS: Record<Stage, string> = {
  [Stage.BRIEF_PROJECT]: 'Project Brief',
  [Stage.FEEDBACK_CLIENT]: 'Design Review',
  [Stage.FEEDBACK_EMPLOYEE]: 'Revision Tracking',
  [Stage.REFERENCES]: 'Concept Design',
  [Stage.SUBMITTED]: 'Construction Plans',
  [Stage.ADMIN_APPROVED]: 'Client Review',
  [Stage.CLIENT_APPROVED]: 'Final Deliverables',
  [Stage.PAYMENTS]: 'Payments',
};

// Client-friendly stage labels (simplified view)
export const CLIENT_STAGE_LABELS: Record<Stage, string> = {
  [Stage.BRIEF_PROJECT]: 'Project Brief',
  [Stage.FEEDBACK_CLIENT]: 'Design Review',
  [Stage.FEEDBACK_EMPLOYEE]: 'Revision Tracking', // Hidden from client
  [Stage.REFERENCES]: 'Concept Design',
  [Stage.SUBMITTED]: 'Construction Plans', // Hidden from client
  [Stage.ADMIN_APPROVED]: 'Plan Set Review',
  [Stage.CLIENT_APPROVED]: 'Final Deliverables',
  [Stage.PAYMENTS]: 'Payments',
};

// Stages visible to clients (simplified portal)
// Project Brief is internal (for employees to understand scope), clients don't see it
export const CLIENT_VISIBLE_STAGES: Stage[] = [
  Stage.FEEDBACK_CLIENT, // Design Review
  Stage.ADMIN_APPROVED, // Plan Set Review
  Stage.CLIENT_APPROVED, // Final Deliverables
  Stage.PAYMENTS,
];

// Stages hidden from clients (internal only)
export const ADMIN_ONLY_STAGES: Stage[] = [
  Stage.BRIEF_PROJECT, // Project Brief - internal scope for employees
  Stage.REFERENCES, // Concept Design - clients see files via Design Review
  Stage.FEEDBACK_EMPLOYEE, // Revision Tracking - internal
  Stage.SUBMITTED, // Construction Plans - employee work area
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'Draft',
  [InvoiceStatus.SENT]: 'Sent',
  [InvoiceStatus.PAID]: 'Paid',
  [InvoiceStatus.OVERDUE]: 'Overdue',
  [InvoiceStatus.CANCELLED]: 'Cancelled',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PaymentType.INITIAL_PAYMENT]: 'Initial Payment',
  [PaymentType.INVOICE]: 'Invoice Payment',
  [PaymentType.EMPLOYEE_PAYMENT]: 'Employee Payment',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CHECK]: 'Check',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING_APPROVAL]: 'Pending Approval',
  [PaymentStatus.CONFIRMED]: 'Confirmed',
  [PaymentStatus.REJECTED]: 'Rejected',
  [PaymentStatus.PENDING_CONFIRMATION]: 'Pending Confirmation',
};

export const EMPLOYEE_PAYMENT_STATUS_LABELS: Record<EmployeePaymentStatus, string> = {
  [EmployeePaymentStatus.PENDING]: 'Pending',
  [EmployeePaymentStatus.APPROVED]: 'Approved',
  [EmployeePaymentStatus.REJECTED]: 'Rejected',
  [EmployeePaymentStatus.CANCELLED]: 'Cancelled',
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  [FeedbackStatus.OPEN]: 'Open',
  [FeedbackStatus.SUBMITTED]: 'Submitted',
  [FeedbackStatus.APPROVED]: 'Approved',
  [FeedbackStatus.REJECTED]: 'Rejected',
};

export const FEEDBACK_AUDIENCE_LABELS: Record<FeedbackAudience, string> = {
  [FeedbackAudience.CLIENT_SPACE]: 'Client Space',
  [FeedbackAudience.EMPLOYEE_SPACE]: 'Employee Space',
};

// ============================================================================
// ENUM COLOR MAPPINGS (for UI components)
// ============================================================================

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.WAITING_PAYMENT]: 'yellow',
  [ProjectStatus.ACTIVE]: 'green',
  [ProjectStatus.PAUSED]: 'orange',
  [ProjectStatus.COMPLETED]: 'blue',
  [ProjectStatus.ARCHIVED]: 'gray',
};

export const STAGE_COLORS: Record<Stage, string> = {
  [Stage.BRIEF_PROJECT]: 'blue',       // Project Brief
  [Stage.REFERENCES]: 'purple',         // Concept Design
  [Stage.FEEDBACK_CLIENT]: 'cyan',      // Design Review
  [Stage.FEEDBACK_EMPLOYEE]: 'orange',  // Revision Tracking (internal)
  [Stage.SUBMITTED]: 'yellow',          // Construction Plans
  [Stage.ADMIN_APPROVED]: 'green',      // Client Review / Plan Set Review
  [Stage.CLIENT_APPROVED]: 'emerald',   // Final Deliverables
  [Stage.PAYMENTS]: 'pink',             // Payments
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: 'gray',
  [InvoiceStatus.SENT]: 'blue',
  [InvoiceStatus.PAID]: 'green',
  [InvoiceStatus.OVERDUE]: 'red',
  [InvoiceStatus.CANCELLED]: 'stone',
};
