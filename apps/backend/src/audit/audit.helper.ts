import { Logger } from '@nestjs/common';
import { AuditService, AuditLogData } from './audit.service';

/**
 * Helper function to safely log audit events without blocking the main operation.
 * Wraps audit logging in a try-catch to ensure audit failures don't affect the request.
 *
 * @param auditService - The AuditService instance
 * @param data - The audit log data
 * @param context - Optional context for error logging (e.g., 'user creation', 'file upload')
 */
export async function safeAuditLog(
  auditService: AuditService,
  data: AuditLogData,
  context?: string,
): Promise<void> {
  try {
    await auditService.log(data);
  } catch (error) {
    const logger = new Logger('AuditHelper');
    const errorContext = context ? ` for ${context}` : '';
    logger.error(`Failed to log audit${errorContext}:`, error);
  }
}
