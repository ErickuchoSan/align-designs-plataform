import { Role } from '@prisma/client';

/**
 * User context for service methods
 * Encapsulates user identity and role information
 */
export interface UserContext {
  userId: string;
  role: Role;
}
