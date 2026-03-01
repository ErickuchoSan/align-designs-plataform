import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheManagerService } from '../../cache/services/cache-manager.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { Role, NotificationType } from '@prisma/client';
import { PermissionContext } from '../../common/strategies/permission.strategy';
import { TRANSACTION_TIMEOUT_MS } from '../../common/constants/timeouts.constants';
import { executeTransactionWithRetry } from '../../common/helpers/transaction.helpers';

/**
 * ProjectLifecycleService
 *
 * Single Responsibility: Handles project lifecycle operations including
 * soft deletion, archival checks, and safety validations.
 *
 * Extracted from ProjectsService to improve maintainability and
 * adhere to Single Responsibility Principle.
 */
@Injectable()
export class ProjectLifecycleService {
    private readonly logger = new Logger(ProjectLifecycleService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheManager: CacheManagerService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Soft delete a project and all associated files
     */
    async softDelete(id: string, userId: string, userRole: Role): Promise<{ message: string }> {
        const project = await this.prisma.project.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Verify access permissions
        const permissionContext = new PermissionContext(userRole);
        permissionContext.verifyProjectAccess(
            userId,
            project.clientId,
            'You do not have permission to delete this project',
        );

        // Perform soft delete in transaction
        await executeTransactionWithRetry(
            this.prisma,
            async (tx) => {
                // Soft delete all files in the project
                await tx.file.updateMany({
                    where: { projectId: id, deletedAt: null },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: userId,
                    },
                });

                // Soft delete the project
                await tx.project.update({
                    where: { id },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: userId,
                    },
                });
            },
            {
                maxRetries: 3,
                timeout: TRANSACTION_TIMEOUT_MS,
            },
        );

        // Send notifications
        await this.sendDeletionNotifications(id, project.name);

        // Invalidate caches
        await this.cacheManager.invalidateProjectCaches(id);

        this.logger.log(`Project ${id} soft deleted by user ${userId}`);
        return { message: 'Project deleted successfully' };
    }

    /**
     * Check project deletion safety
     * Returns information about project data to warn admin before deletion
     */
    async checkDeletionSafety(projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId, deletedAt: null },
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        // Count files, employees, invoices and payments
        const [filesCount, employeesCount, invoicesCount, paymentsCount, client] = await Promise.all([
            this.prisma.file.count({
                where: { projectId, deletedAt: null },
            }),
            this.prisma.projectEmployee.count({
                where: { projectId },
            }),
            this.prisma.invoice.count({
                where: { projectId, status: { not: 'CANCELLED' } },
            }),
            this.prisma.payment.count({
                where: { projectId },
            }),
            this.prisma.user.findUnique({
                where: { id: project.clientId },
                select: { id: true, firstName: true, lastName: true },
            }),
        ]);

        const hasData = {
            files: filesCount > 0,
            employees: employeesCount > 0,
            invoices: invoicesCount > 0,
            payments: paymentsCount > 0,
        };

        const hasAnyData = Object.values(hasData).some((v) => v);

        const warnings = [];
        if (hasData.files) {
            warnings.push(`${filesCount} uploaded file${filesCount > 1 ? 's' : ''}`);
        }
        if (hasData.payments) {
            warnings.push(`${paymentsCount} payment record${paymentsCount > 1 ? 's' : ''}`);
        }
        if (hasData.invoices) {
            warnings.push(`${invoicesCount} invoice${invoicesCount > 1 ? 's' : ''}`);
        }
        if (hasData.employees) {
            warnings.push(`${employeesCount} assigned employee${employeesCount > 1 ? 's' : ''}`);
        }

        return {
            projectId,
            projectName: project.name,
            hasData: hasAnyData,
            details: hasData,
            counts: {
                files: filesCount,
                employees: employeesCount,
                invoices: invoicesCount,
                payments: paymentsCount,
            },
            warnings,
            client: client
                ? {
                    id: client.id,
                    name: `${client.firstName} ${client.lastName}`,
                }
                : null,
        };
    }

    /**
     * Send deletion notifications to client and employees
     */
    private async sendDeletionNotifications(projectId: string, projectName: string): Promise<void> {
        const projectWithData = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    select: { id: true },
                },
                employees: {
                    include: {
                        employee: {
                            select: { id: true },
                        },
                    },
                },
            },
        });

        if (!projectWithData) {
            return;
        }

        const notifications = [];

        // Notify client
        if (projectWithData.clientId) {
            notifications.push(
                this.notificationsService.create({
                    userId: projectWithData.clientId,
                    type: NotificationType.WARNING,
                    title: 'Project Deleted',
                    message: `Project "${projectName}" has been deleted.`,
                    link: '/dashboard/projects',
                }),
            );
        }

        // Notify employees
        if (projectWithData.employees && projectWithData.employees.length > 0) {
            for (const assignment of projectWithData.employees) {
                notifications.push(
                    this.notificationsService.create({
                        userId: assignment.employee.id,
                        type: NotificationType.WARNING,
                        title: 'Project Deleted',
                        message: `Project "${projectName}" has been deleted.`,
                        link: '/dashboard/projects',
                    }),
                );
            }
        }

        // Send all notifications in parallel
        await Promise.allSettled(notifications);
    }
}
