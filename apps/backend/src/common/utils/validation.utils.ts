/**
 * Validation utilities - Re-export barrel file
 *
 * This file maintains backward compatibility by re-exporting all validation utilities.
 * The original 467-line file has been split into focused modules:
 * - phone-validation.utils.ts (172 lines)
 * - email-validation.utils.ts (104 lines)
 * - password-validation.utils.ts (191 lines)
 *
 * Benefits:
 * - Better maintainability (smaller, focused files)
 * - Easier testing (isolated concerns)
 * - Improved navigation and discoverability
 * - No breaking changes (existing imports still work)
 */

export { PhoneValidationUtils } from './phone-validation.utils';
export { EmailValidationUtils } from './email-validation.utils';
export { PasswordValidationUtils } from './password-validation.utils';
