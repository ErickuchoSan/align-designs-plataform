import { z } from 'zod';

/**
 * Money/amount schema - positive number with max 2 decimal places
 */
export const moneySchema = z
  .number()
  .positive('Amount must be greater than zero')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');

/**
 * Optional money schema
 */
export const optionalMoneySchema = moneySchema.optional();

/**
 * Non-negative money schema (allows zero)
 */
export const nonNegativeMoneySchema = z
  .number()
  .nonnegative('Amount cannot be negative')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');

/**
 * Money from string (for form inputs)
 */
export const moneyFromStringSchema = z.coerce
  .number()
  .positive('Amount must be greater than zero')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');
