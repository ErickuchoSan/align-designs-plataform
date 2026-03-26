import { z } from 'zod';
import { emailSchema, loginPasswordSchema } from '../../common/schemas';

/**
 * Login schema
 */
export const LoginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export type LoginDto = z.infer<typeof LoginSchema>;
