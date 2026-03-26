import { z } from 'zod';
import { uuidSchema } from '../../common/schemas';

/**
 * Target audience enum
 */
const targetAudienceSchema = z.enum(['client_space', 'employee_space'], {
  message: 'Target audience must be either client_space or employee_space',
});

/**
 * Create feedback schema
 * At least one of content or fileDocumentId must be provided
 */
export const CreateFeedbackSchema = z
  .object({
    projectId: uuidSchema,
    employeeId: uuidSchema,
    targetAudience: targetAudienceSchema,
    content: z
      .string()
      .max(5000, 'Feedback content cannot exceed 5000 characters')
      .trim()
      .optional(),
    fileDocumentId: uuidSchema.optional(),
  })
  .refine((data) => data.content || data.fileDocumentId, {
    message: 'Either content or fileDocumentId must be provided',
    path: ['content'],
  });

export type CreateFeedbackDto = z.infer<typeof CreateFeedbackSchema>;

/**
 * Submit cycle schema
 */
export const SubmitCycleSchema = z.object({
  cycleId: uuidSchema,
  submittedFileId: uuidSchema,
});

export type SubmitCycleDto = z.infer<typeof SubmitCycleSchema>;

/**
 * Cycle action schema (approve/reject)
 */
export const CycleActionSchema = z.object({
  cycleId: uuidSchema,
});

export type CycleActionDto = z.infer<typeof CycleActionSchema>;
