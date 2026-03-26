import { z } from 'zod';
import {
  uuidSchema,
  nonNegativeMoneySchema,
  dateStringSchema,
  optionalStringSchema,
} from '../../common/schemas';

/**
 * Create invoice schema
 */
export const CreateInvoiceSchema = z.object({
  projectId: uuidSchema,
  clientId: uuidSchema,
  issueDate: dateStringSchema,
  dueDate: dateStringSchema,
  paymentTermsDays: z.number().int().nonnegative(),
  subtotal: nonNegativeMoneySchema,
  taxAmount: nonNegativeMoneySchema.optional(),
  totalAmount: nonNegativeMoneySchema,
  notes: optionalStringSchema,
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
