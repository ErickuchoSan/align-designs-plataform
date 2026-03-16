import { z } from 'zod';

export const createInvoiceSchema = z.object({
    projectId: z.string().uuid({ message: 'Project is required' }),
    clientId: z.string().uuid({ message: 'Client ID is missing' }),
    issueDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
        message: 'Invalid issue date',
    }),
    paymentTermsDays: z.coerce.number().min(0, { message: 'Terms must be non-negative' }),
    subtotal: z.coerce.number().min(0.01, { message: 'Subtotal must be greater than 0' }),
    taxRate: z.coerce.number().min(0).max(100).default(0),
    notes: z.string().optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;
