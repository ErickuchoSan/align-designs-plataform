import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Role } from '@prisma/client';
import type { AppClsStore } from '../types/cls.types';
import type { UserPayload } from '../../auth/interfaces/user.interface';

/**
 * RequestContextService
 *
 * Provides easy access to request context data stored in CLS.
 * Inject this service in any service to access user info without parameters.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly ctx: RequestContextService) {}
 *
 *   async doSomething() {
 *     const userId = this.ctx.getUserId();
 *     const role = this.ctx.getUserRole();
 *   }
 * }
 * ```
 */
@Injectable()
export class RequestContextService {
  constructor(private readonly cls: ClsService<AppClsStore>) {}

  /**
   * Get the current authenticated user's ID
   */
  getUserId(): string {
    return this.cls.get('userId');
  }

  /**
   * Get the current authenticated user's role
   */
  getUserRole(): Role {
    return this.cls.get('userRole');
  }

  /**
   * Get the current authenticated user's email
   */
  getUserEmail(): string {
    return this.cls.get('userEmail');
  }

  /**
   * Get the full user payload from JWT
   */
  getUser(): UserPayload {
    return this.cls.get('user');
  }

  /**
   * Get the client IP address
   */
  getIpAddress(): string {
    return this.cls.get('ipAddress') ?? 'unknown';
  }

  /**
   * Get the client User-Agent string
   */
  getUserAgent(): string {
    return this.cls.get('userAgent') ?? '';
  }

  /**
   * Get the request ID
   */
  getRequestId(): string {
    return this.cls.getId();
  }

  /**
   * Check if current user is an admin
   */
  isAdmin(): boolean {
    return this.cls.get('userRole') === Role.ADMIN;
  }

  /**
   * Check if current user is a client
   */
  isClient(): boolean {
    return this.cls.get('userRole') === Role.CLIENT;
  }

  /**
   * Check if current user is an employee
   */
  isEmployee(): boolean {
    return this.cls.get('userRole') === Role.EMPLOYEE;
  }

  /**
   * Get full audit context for logging
   */
  getAuditContext(): {
    userId: string;
    ipAddress: string;
    userAgent: string;
    requestId: string;
  } {
    return {
      userId: this.getUserId(),
      ipAddress: this.getIpAddress(),
      userAgent: this.getUserAgent(),
      requestId: this.getRequestId(),
    };
  }
}
