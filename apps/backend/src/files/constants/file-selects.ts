/**
 * File Select Statements Constants
 * Centralizes Prisma select statements for file operations
 */

/**
 * User basic information for file uploader
 * Matches the standard user info across the application
 */
export const FILE_UPLOADER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
} as const;

/**
 * File with uploader information
 * Used in create, update, and fetch operations
 */
export const FILE_WITH_UPLOADER_INCLUDE = {
  uploader: {
    select: FILE_UPLOADER_SELECT,
  },
} as const;
