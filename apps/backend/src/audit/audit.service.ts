import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../common/services/request-context.service';
import { DEFAULT_AUDIT_LOG_LIMIT } from './audit.constants';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  OTP_REQUEST = 'OTP_REQUEST',
  OTP_VERIFY = 'OTP_VERIFY',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
}

export type AuditDetailsValue = string | number | boolean | null;

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, AuditDetailsValue>;
}

/**
 * Simplified audit data - user context is obtained from CLS
 */
export interface SimpleAuditData {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, AuditDetailsValue>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  /**
   * Log audit event with full data (legacy method)
   */
  async log(auditData: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: auditData.userId,
          action: auditData.action,
          resourceType: auditData.resourceType,
          resourceId: auditData.resourceId,
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          details: auditData.details
            ? JSON.stringify(auditData.details)
            : undefined,
        },
      });

      this.logger.debug(
        `Audit log created: ${auditData.action} on ${auditData.resourceType}`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
      // Don't throw error to prevent disrupting the main operation
    }
  }

  /**
   * Log audit event with automatic context from CLS
   * User ID, IP, and UserAgent are obtained automatically from request context
   *
   * @example
   * await this.auditService.logWithContext({
   *   action: AuditAction.PROJECT_CREATE,
   *   resourceType: 'project',
   *   resourceId: project.id,
   *   details: { name: project.name },
   * });
   */
  async logWithContext(data: SimpleAuditData): Promise<void> {
    const { userId, ipAddress, userAgent } = this.ctx.getAuditContext();

    return this.log({
      ...data,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async findByUser(userId: string, limit = DEFAULT_AUDIT_LOG_LIMIT) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByResource(
    resourceType: string,
    resourceId: string,
    limit = DEFAULT_AUDIT_LOG_LIMIT,
  ) {
    return this.prisma.auditLog.findMany({
      where: { resourceType, resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByAction(action: AuditAction, limit = DEFAULT_AUDIT_LOG_LIMIT) {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
