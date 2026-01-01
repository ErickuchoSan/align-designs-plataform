/**
 * Project Select Statements Constants
 * Centralizes Prisma select statements to follow DRY principle
 */

/**
 * Basic user information for relations (client, creator, uploader)
 * Used in project includes to show user details
 */
export const USER_BASIC_INFO_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
} as const;

/**
 * Basic file information without uploader
 * Used in simple file listings
 */
export const FILE_BASIC_SELECT = {
  id: true,
  filename: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  uploadedAt: true,
  stage: true,
  comment: true,
} as const;

/**
 * File information with uploader details
 * Used in detailed project views
 */
export const FILE_WITH_UPLOADER_SELECT = {
  ...FILE_BASIC_SELECT,
  uploader: {
    select: USER_BASIC_INFO_SELECT,
  },
} as const;

/**
 * Minimal file info for counting
 * Used in list views where we only need filename
 */
export const FILE_MINIMAL_SELECT = {
  filename: true,
} as const;
