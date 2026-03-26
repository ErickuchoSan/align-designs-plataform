import { z } from 'zod';
import {
  EMAIL_CONSTRAINTS,
  NAME_CONSTRAINTS,
} from '../constants/validation.constants';

/**
 * Email schema with lowercase transformation and trimming
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(EMAIL_CONSTRAINTS.MIN_LENGTH, 'Email is too short')
  .max(EMAIL_CONSTRAINTS.MAX_LENGTH, 'Email is too long')
  .toLowerCase()
  .trim();

/**
 * UUID v4 schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Array of UUID v4 schema
 */
export const uuidArraySchema = z.array(uuidSchema);

/**
 * Name schema (for first name, last name, etc.)
 */
export const nameSchema = z
  .string()
  .min(NAME_CONSTRAINTS.MIN_LENGTH, 'Name is required')
  .max(NAME_CONSTRAINTS.MAX_LENGTH, 'Name is too long')
  .trim();

/**
 * Optional name schema
 */
export const optionalNameSchema = nameSchema.optional();

/**
 * Non-empty string schema
 */
export const nonEmptyStringSchema = z.string().min(1, 'This field is required').trim();

/**
 * Optional string schema with trim
 */
export const optionalStringSchema = z.string().trim().optional();
