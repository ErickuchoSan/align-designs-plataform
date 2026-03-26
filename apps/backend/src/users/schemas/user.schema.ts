import { z } from 'zod';
import { Role } from '@prisma/client';
import { emailSchema, paginationSchema } from '../../common/schemas';
import { NAME_CONSTRAINTS } from '../../common/constants/validation.constants';

/**
 * Name regex pattern - letters, spaces, hyphens, apostrophes
 */
const namePattern = /^[a-zA-ZÀ-ÿ\s'-]+$/;

/**
 * International phone number pattern
 */
const phonePattern = /^\+?[1-9]\d{1,14}$/;

/**
 * Person name schema with validation
 */
const personNameSchema = z
  .string()
  .min(NAME_CONSTRAINTS.MIN_LENGTH, 'Name cannot be empty')
  .max(
    NAME_CONSTRAINTS.MAX_LENGTH,
    `Name cannot exceed ${NAME_CONSTRAINTS.MAX_LENGTH} characters`,
  )
  .regex(
    namePattern,
    'Name can only contain letters, spaces, hyphens, and apostrophes',
  )
  .trim();

/**
 * Optional person name schema
 */
const optionalPersonNameSchema = personNameSchema.optional();

/**
 * Phone schema (international format)
 */
const phoneSchema = z
  .string()
  .regex(
    phonePattern,
    'Invalid phone format. Use international format (e.g., +1234567890)',
  )
  .trim()
  .optional();

/**
 * Base person schema (shared fields)
 */
export const BasePersonSchema = z.object({
  email: emailSchema,
  firstName: personNameSchema,
  lastName: personNameSchema,
  phone: phoneSchema,
});

export type BasePersonDto = z.infer<typeof BasePersonSchema>;

/**
 * Create user schema (with role)
 */
export const CreateUserSchema = BasePersonSchema.extend({
  role: z.enum(['CLIENT', 'EMPLOYEE'], {
    message: 'Role must be either CLIENT or EMPLOYEE',
  }),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

/**
 * Create client schema (same as base person)
 */
export const CreateClientSchema = BasePersonSchema;

export type CreateClientDto = z.infer<typeof CreateClientSchema>;

/**
 * Update user schema (all fields optional)
 */
export const UpdateUserSchema = z.object({
  firstName: optionalPersonNameSchema,
  lastName: optionalPersonNameSchema,
  phone: phoneSchema,
  isActive: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

/**
 * Query users schema (pagination + role filter)
 */
export const QueryUsersSchema = paginationSchema.extend({
  role: z
    .nativeEnum(Role, {
      message: 'Role must be a valid role (ADMIN, CLIENT, or EMPLOYEE)',
    })
    .optional(),
});

export type QueryUsersDto = z.infer<typeof QueryUsersSchema>;

/**
 * Toggle status schema
 */
export const ToggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export type ToggleStatusDto = z.infer<typeof ToggleStatusSchema>;
