import { z } from 'zod';

/**
 * ISO 8601 date string schema (YYYY-MM-DD or full datetime)
 */
export const dateStringSchema = z.string().datetime({
  message: 'Invalid date format. Expected ISO 8601 format.',
});

/**
 * Optional date string schema
 */
export const optionalDateStringSchema = dateStringSchema.optional();

/**
 * Date string that coerces to Date object
 */
export const dateSchema = z.coerce.date({
  message: 'Invalid date',
});

/**
 * Optional date schema
 */
export const optionalDateSchema = dateSchema.optional();

/**
 * Date-only string (YYYY-MM-DD)
 */
export const dateOnlyStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

/**
 * Optional date-only string
 */
export const optionalDateOnlyStringSchema = dateOnlyStringSchema.optional();
