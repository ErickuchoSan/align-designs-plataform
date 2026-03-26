import { z } from 'zod';
import {
  uuidSchema,
  nonNegativeMoneySchema,
  dateStringSchema,
  optionalStringSchema,
} from '../../common/schemas';

/**
 * Create employee payment schema
 */
export const CreateEmployeePaymentSchema = z.object({
  projectId: uuidSchema,
  employeeId: uuidSchema,
  amount: nonNegativeMoneySchema,
  description: optionalStringSchema,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentDate: dateStringSchema,
  receiptFileId: optionalStringSchema,
});

export type CreateEmployeePaymentDto = z.infer<typeof CreateEmployeePaymentSchema>;

/**
 * Update employee payment schema (all fields optional)
 */
export const UpdateEmployeePaymentSchema = CreateEmployeePaymentSchema.partial();

export type UpdateEmployeePaymentDto = z.infer<typeof UpdateEmployeePaymentSchema>;
