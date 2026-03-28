import { z } from 'zod';
import { ProjectStatus, ServiceType } from '@prisma/client';
import {
  uuidSchema,
  uuidArraySchema,
  moneySchema,
  optionalMoneySchema,
  optionalDateStringSchema,
  optionalStringSchema,
} from '../../common/schemas';
import {
  PROJECT_NAME_CONSTRAINTS,
  PROJECT_DESCRIPTION_CONSTRAINTS,
} from '../../common/constants/validation.constants';

/**
 * Create project schema
 */
export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name cannot be empty')
    .max(
      PROJECT_NAME_CONSTRAINTS.MAX_LENGTH,
      `Project name cannot exceed ${PROJECT_NAME_CONSTRAINTS.MAX_LENGTH} characters`,
    )
    .trim(),
  description: z
    .string()
    .max(
      PROJECT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH,
      `Project description cannot exceed ${PROJECT_DESCRIPTION_CONSTRAINTS.MAX_LENGTH} characters`,
    )
    .trim()
    .optional(),
  clientId: uuidSchema,
  serviceType: z.nativeEnum(ServiceType).optional(),
  employeeIds: uuidArraySchema.optional(),
  initialAmountRequired: optionalMoneySchema,
  deadlineDate: optionalDateStringSchema,
  initialPaymentDeadline: optionalDateStringSchema,
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

/**
 * Update project schema (all fields optional)
 */
export const UpdateProjectSchema = CreateProjectSchema.partial();

export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

/**
 * Assign employees schema
 */
export const AssignEmployeesSchema = z.object({
  employeeIds: uuidArraySchema.min(1, 'At least one employee must be assigned'),
});

export type AssignEmployeesDto = z.infer<typeof AssignEmployeesSchema>;

/**
 * Update project status schema
 */
export const UpdateProjectStatusSchema = z.object({
  status: z.nativeEnum(ProjectStatus, {
    message:
      'Status must be one of: WAITING_PAYMENT, ACTIVE, COMPLETED, ARCHIVED',
  }),
});

export type UpdateProjectStatusDto = z.infer<typeof UpdateProjectStatusSchema>;

/**
 * Record payment schema (for projects module)
 */
export const ProjectRecordPaymentSchema = z.object({
  amount: moneySchema,
  notes: optionalStringSchema,
});

export type ProjectRecordPaymentDto = z.infer<
  typeof ProjectRecordPaymentSchema
>;
