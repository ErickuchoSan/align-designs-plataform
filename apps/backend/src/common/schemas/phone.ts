import { z } from 'zod';
import { PHONE_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Phone number schema (10 digits)
 */
export const phoneNumberSchema = z
  .string()
  .length(
    PHONE_CONSTRAINTS.NUMBER_LENGTH,
    `Phone number must be ${PHONE_CONSTRAINTS.NUMBER_LENGTH} digits`,
  )
  .regex(/^\d+$/, 'Phone number must contain only digits');

/**
 * Optional phone number schema
 */
export const optionalPhoneNumberSchema = phoneNumberSchema.optional();

/**
 * Country code schema (1-3 digits)
 */
export const countryCodeSchema = z
  .string()
  .min(PHONE_CONSTRAINTS.COUNTRY_CODE_MIN_LENGTH, 'Country code is required')
  .max(
    PHONE_CONSTRAINTS.COUNTRY_CODE_MAX_LENGTH,
    `Country code must be at most ${PHONE_CONSTRAINTS.COUNTRY_CODE_MAX_LENGTH} digits`,
  )
  .regex(/^\d+$/, 'Country code must contain only digits');

/**
 * Optional country code schema
 */
export const optionalCountryCodeSchema = countryCodeSchema.optional();

/**
 * Full phone schema (country code + number)
 */
export const fullPhoneSchema = z.object({
  countryCode: countryCodeSchema,
  phoneNumber: phoneNumberSchema,
});

/**
 * Optional full phone schema
 */
export const optionalFullPhoneSchema = z
  .object({
    countryCode: optionalCountryCodeSchema,
    phoneNumber: optionalPhoneNumberSchema,
  })
  .optional();
