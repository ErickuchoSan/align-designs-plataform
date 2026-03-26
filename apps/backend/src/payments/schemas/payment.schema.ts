import { z } from 'zod';
import { PaymentMethod, PaymentType } from '@prisma/client';
import {
  uuidSchema,
  uuidArraySchema,
  moneyFromStringSchema,
  dateStringSchema,
  optionalStringSchema,
} from '../../common/schemas';

/**
 * Record payment schema (admin)
 */
export const RecordPaymentSchema = z.object({
  projectId: uuidSchema,
  type: z.nativeEnum(PaymentType),
  amount: moneyFromStringSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentDate: dateStringSchema,
  notes: optionalStringSchema,
  fromUserId: uuidSchema.optional(),
  toUserId: uuidSchema.optional(),
  relatedFileIds: uuidArraySchema.optional(),
  invoiceId: uuidSchema.optional(),
});

export type RecordPaymentDto = z.infer<typeof RecordPaymentSchema>;

/**
 * Approve payment schema
 */
export const ApprovePaymentSchema = z.object({
  correctedAmount: z
    .number()
    .min(0.01, 'Corrected amount must be at least 0.01')
    .optional(),
});

export type ApprovePaymentDto = z.infer<typeof ApprovePaymentSchema>;

/**
 * Reject payment schema
 */
export const RejectPaymentSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters')
    .trim(),
});

export type RejectPaymentDto = z.infer<typeof RejectPaymentSchema>;

/**
 * Client payment upload schema
 */
export const ClientPaymentUploadSchema = z.object({
  projectId: uuidSchema.optional(),
  invoiceId: uuidSchema.optional(),
  amount: moneyFromStringSchema,
  paymentDate: dateStringSchema,
  paymentMethod: z.string().trim(),
  type: z.nativeEnum(PaymentType).optional(),
  notes: optionalStringSchema,
});

export type ClientPaymentUploadDto = z.infer<typeof ClientPaymentUploadSchema>;
