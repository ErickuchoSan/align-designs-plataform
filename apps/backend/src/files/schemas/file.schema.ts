import { z } from 'zod';
import { Stage } from '@prisma/client';
import {
  uuidSchema,
  paginationSchema,
  optionalStringSchema,
} from '../../common/schemas';
import { COMMENT_CONSTRAINTS } from '../../common/constants/validation.constants';

/**
 * Comment schema with length validation
 */
const commentSchema = z
  .string()
  .max(
    COMMENT_CONSTRAINTS.MAX_LENGTH,
    `Comment cannot exceed ${COMMENT_CONSTRAINTS.MAX_LENGTH} characters`,
  )
  .trim();

/**
 * Stage enum schema
 */
const stageSchema = z.nativeEnum(Stage, {
  message:
    'Stage must be one of: BRIEF_PROJECT, FEEDBACK_CLIENT, FEEDBACK_EMPLOYEE, REFERENCES, SUBMITTED, ADMIN_APPROVED, CLIENT_APPROVED, PAYMENTS',
});

/**
 * Upload file schema
 */
export const UploadFileSchema = z.object({
  comment: commentSchema.optional(),
  stage: stageSchema.optional(),
  relatedFileId: optionalStringSchema,
});

export type UploadFileDto = z.infer<typeof UploadFileSchema>;

/**
 * Update file schema
 */
export const UpdateFileSchema = z.object({
  comment: z
    .union([
      commentSchema.min(1, 'Comment cannot be empty'),
      z.null(),
    ])
    .optional(),
});

export type UpdateFileDto = z.infer<typeof UpdateFileSchema>;

/**
 * Approve file schema
 */
export const ApproveFileSchema = z.object({
  fileId: uuidSchema,
});

export type ApproveFileDto = z.infer<typeof ApproveFileSchema>;

/**
 * Create comment schema
 */
export const CreateCommentSchema = z.object({
  comment: commentSchema.min(1, 'Comment cannot be empty'),
  stage: stageSchema.optional(),
  relatedFileId: optionalStringSchema,
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;

/**
 * File filters schema (pagination + filters)
 */
export const FileFiltersSchema = paginationSchema.extend({
  name: optionalStringSchema,
  type: optionalStringSchema,
});

export type FileFiltersDto = z.infer<typeof FileFiltersSchema>;
