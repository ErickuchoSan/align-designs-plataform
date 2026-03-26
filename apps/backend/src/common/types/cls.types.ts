import { ClsStore } from 'nestjs-cls';
import { Role } from '@prisma/client';

/**
 * CLS Store Interface
 *
 * Defines the shape of data stored in the Continuation-Local Storage context.
 * This data is available throughout the entire request lifecycle without
 * passing it through function parameters.
 */
export interface AppClsStore extends ClsStore {
  /** Current authenticated user ID */
  userId: string;

  /** Current user's role */
  userRole: Role;

  /** Current user's email */
  userEmail: string;

  /** Full user payload from JWT */
  user: {
    userId: string;
    email: string;
    role: Role;
  };

  /** Client IP address */
  ipAddress: string;

  /** Client User-Agent string */
  userAgent: string;
}

/**
 * Keys available in the CLS store
 */
export type ClsKey = keyof AppClsStore;
