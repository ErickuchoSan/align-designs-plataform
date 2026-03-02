/**
 * User Select Statements Constants
 * Centralizes Prisma select statements to follow DRY principle
 */

/**
 * Basic user fields for most responses
 * Includes core user information
 */
export const USER_BASIC_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Full user fields including verification and timestamps
 * Used for complete user profiles and listings
 * Includes passwordHash to compute hasPassword (not exposed directly)
 */
export const USER_FULL_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  emailVerified: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Update response fields (excludes createdAt)
 * Used after update operations
 */
export const USER_UPDATE_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  emailVerified: true,
  updatedAt: true,
} as const;

/**
 * Status change response fields
 * Minimal fields for status toggle operations
 */
export const USER_STATUS_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
} as const;
