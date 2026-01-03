import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CacheManagerService } from '../cache/services/cache-manager.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/constants/cache-keys';
import type { IProjectRepository } from './repositories/project.repository.interface';
import type { IUserRepository } from '../users/repositories/user.repository.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Role, Stage, ProjectStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { ProjectResponse } from '../common/interfaces/project-response.interface';
import { getFilesAndCommentsCounts } from '../common/utils/file.utils';
import { PermissionContext } from '../common/strategies/permission.strategy';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { TRANSACTION_TIMEOUT_MS } from '../common/constants/timeouts.constants';
import { PaginationHelper } from '../common/helpers/pagination.helper';
import { BigIntTransformer } from '../common/helpers/bigint-transformer.helper';
import { executeTransactionWithRetry } from '../common/helpers/transaction.helpers';
import {
  USER_BASIC_INFO_SELECT,
  FILE_BASIC_SELECT,
  FILE_WITH_UPLOADER_SELECT,
  FILE_MINIMAL_SELECT,
} from './constants/project-selects';
import { ProjectEmployeeService } from './services/project-employee.service';
import { ProjectStatusService } from './services/project-status.service';
import { InvoicesService } from '../invoices/invoices.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import {
  getAccessibleStages as getAccessibleStagesHelper,
  getStagePermissions,
  getStageName,
  getStageIcon,
  canViewStage,
  canWriteToStage,
  canDeleteFromStage,
} from '../common/helpers/stage-permissions.helper';

/**
 * Projects Service
 *
 * Architecture Decision: Hybrid Repository + Prisma Pattern
 * ========================================================
 * This service intentionally uses BOTH repository pattern AND direct Prisma access:
 *
 * Repository Pattern (projectRepo, userRepo):
 * - Used for: Simple CRUD operations (create, findById, update, delete)
 * - Benefits: Abstraction, easier testing, decoupling from ORM
 * - Examples: Creating projects, finding users by ID
 *
 * Direct Prisma Access (prisma):
 * - Used for: Complex queries with joins, aggregations, and filters
 * - Benefits: Type safety, performance, flexibility for complex operations
 * - Examples: Listing projects with counts, nested includes, soft-delete queries
 *
 * Rationale: This hybrid approach balances clean architecture with pragmatism.
 * Adding all complex queries to repositories would create bloated interfaces.
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(INJECTION_TOKENS.PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cacheManager: CacheManagerService,
    private readonly projectEmployeeService: ProjectEmployeeService,
    private readonly projectStatusService: ProjectStatusService,
    @Inject(forwardRef(() => InvoicesService))
    private readonly invoicesService: InvoicesService,
    private readonly notificationsService: NotificationsService,
  ) { }

  /**
   * Create a new project
   * Phase 1: Added employee assignment and workflow fields
   */
  async create(createProjectDto: CreateProjectDto, createdBy: string) {
    // Verify that the client exists and is not deleted
    const client = await this.userRepo.findById(createProjectDto.clientId);

    if (!client || client.role !== Role.CLIENT) {
      throw new NotFoundException('Client not found');
    }

    // Extract employee IDs from DTO (Phase 1)
    const { employeeIds, ...projectData } = createProjectDto;

    // Validate employees before creating project (Phase 1)
    if (employeeIds && employeeIds.length > 0) {
      for (const employeeId of employeeIds) {
        await this.projectEmployeeService.validateEmployeeAvailability(
          employeeId,
        );
      }
    }

    const project = await this.projectRepo.create({
      ...projectData,
      createdBy,
    });

    // Assign employees if provided (Phase 1)
    if (employeeIds && employeeIds.length > 0) {
      await this.projectEmployeeService.assignEmployeesToProject(
        project.id,
        employeeIds,
      );
    }

    // Phase 2: Auto-generate invoice if initialAmountRequired is set
    if (project.initialAmountRequired && Number(project.initialAmountRequired) > 0) {
      try {
        await this.invoicesService.createInvoiceForProject(
          project.id,
          project.clientId,
          Number(project.initialAmountRequired),
          15, // Default payment terms: 15 days
        );
        this.logger.log(
          `Auto-generated invoice for project ${project.id} with amount ${project.initialAmountRequired}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to auto-generate invoice for project ${project.id}:`,
          error,
        );
        // Don't fail project creation if invoice generation fails
        // Admin can create invoice manually
      }
    }

    // Fetch with relations for response
    const fullProject = await this.prisma.project.findFirst({
      where: { id: project.id },
      include: {
        client: {
          select: USER_BASIC_INFO_SELECT,
        },
        creator: {
          select: USER_BASIC_INFO_SELECT,
        },
        files: {
          select: FILE_BASIC_SELECT,
        },
        // Phase 1: Include employee assignments
        employees: {
          include: {
            employee: {
              select: USER_BASIC_INFO_SELECT,
            },
          },
        },
      },
    });

    if (!fullProject) {
      throw new NotFoundException('Project not found after creation');
    }

    // Invalidate project list caches since a new project was created
    await this.cacheManager.invalidateProjectCaches();

    // Convert BigInt to number for JSON serialization
    return BigIntTransformer.transformProjectWithFiles(fullProject);
  }

  /**
   * List projects
   * Admin sees all, Client only sees their own
   */
  async findAll(
    userId: string,
    userRole: Role,
    paginationDto: PaginationDto,
    filterClientId?: string,
  ): Promise<PaginatedResult<ProjectResponse>> {
    const { page, limit, skip } =
      PaginationHelper.extractPaginationParams(paginationDto);

    // Generate cache key based on user role and pagination
    const cacheKey = CACHE_KEYS.PROJECTS.LIST(
      page,
      limit,
      userRole === Role.CLIENT ? userId : filterClientId,
    );

    // Try to get from cache first
    // DISABLE CACHE TEMPORARILY: Cache invalidation logic is missing for lists
    // const cached =
    //   await this.cacheManager.get<PaginatedResult<ProjectResponse>>(cacheKey);
    // if (cached) {
    //   this.logger.debug(`Cache hit for projects list: ${cacheKey}`);
    //   return cached;
    // }

    // Build where clause based on user role
    let where: any = {
      deletedAt: null, // Only include non-deleted projects
    };

    // Role-based filtering
    if (userRole === Role.CLIENT) {
      where.clientId = userId;
    } else if (userRole === Role.EMPLOYEE) {
      // For employees, filter by assigned projects
      where.employees = {
        some: {
          employeeId: userId,
        },
      };
    } else if (filterClientId) {
      // For admin with client filter
      where.clientId = filterClientId;
    }

    // Optimized: Only 2 queries - projects with files included, and total count
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          client: {
            select: USER_BASIC_INFO_SELECT,
          },
          files: {
            where: {
              deletedAt: null,
            },
            select: FILE_MINIMAL_SELECT,
          },
          employees: {
            include: {
              employee: {
                select: USER_BASIC_INFO_SELECT,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    // Transform projects to include separate counts from already-loaded files
    const projectsWithCounts = projects.map((project) => {
      const { filesCount, commentsCount } = getFilesAndCommentsCounts(
        project.files,
      );

      // Remove the files array and replace with counts
      const { files, ...projectWithoutFiles } = project;

      return {
        ...projectWithoutFiles,
        _count: {
          files: filesCount,
          comments: commentsCount,
        },
      };
    });

    const result = PaginationHelper.buildPaginatedResult(
      projectsWithCounts,
      total,
      paginationDto,
    );

    // Cache the result for 5 minutes
    // await this.cacheManager.set(cacheKey, result, CACHE_TTL.FIVE_MINUTES);
    this.logger.debug(`Fetched projects list (Cache Disabled)`);

    return result;
  }

  /**
   * Get a project by ID
   */
  async findOne(id: string, userId: string, userRole: Role) {
    // Try cache first
    // DISABLE CACHE TEMPORARILY: Cache invalidation logic is missing for lists
    // const cacheKey = CACHE_KEYS.PROJECTS.DETAIL(id);
    // const cached = await this.cacheManager.get(cacheKey);
    // if (cached) {
    //   const permissionContext = new PermissionContext(userRole);
    //   permissionContext.verifyProjectAccess(
    //     userId,
    //     (cached as any).clientId,
    //     'You do not have permission to view this project',
    //     );
    //   return cached;
    // }

    this.logger.debug(`findOne called - projectId: ${id}, userId: ${userId}, userRole: ${userRole}`);

    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only return non-deleted projects
      },
      include: {
        client: {
          select: USER_BASIC_INFO_SELECT,
        },
        creator: {
          select: USER_BASIC_INFO_SELECT,
        },
        files: {
          where: {
            deletedAt: null, // Only include non-deleted files
          },
          select: FILE_WITH_UPLOADER_SELECT,
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        employees: {
          include: {
            employee: {
              select: USER_BASIC_INFO_SELECT,
            },
          },
        },
      },
    });

    if (!project) {
      this.logger.warn(`Project ${id} not found or deleted`);
      throw new NotFoundException('Project not found');
    }

    this.logger.debug(`Project found - clientId: ${project.clientId}, employeeIds: ${project.employees.map(e => e.employeeId).join(', ')}`);

    // Verify access based on role
    const permissionContext = new PermissionContext(userRole);

    if (userRole === Role.EMPLOYEE) {
      // For employees, check if they are assigned to this project
      const isAssigned = project.employees.some(
        (emp) => emp.employeeId === userId,
      );
      this.logger.debug(`Employee ${userId} assignment check: ${isAssigned}`);
      if (!isAssigned) {
        this.logger.warn(`Employee ${userId} not assigned to project ${id}`);
        throw new ForbiddenException(
          'You do not have permission to view this project',
        );
      }
    } else {
      // For client and admin, use standard permission check
      this.logger.debug(`Checking access for ${userRole} - userId: ${userId}, clientId: ${project.clientId}`);
      permissionContext.verifyProjectAccess(
        userId,
        project.clientId,
        'You do not have permission to view this project',
      );
    }

    // Separate files and comments count
    const { filesCount, commentsCount } = getFilesAndCommentsCounts(
      project.files,
    );

    // Convert BigInt to number for JSON serialization and remove files array but keep employees
    const { files, ...projectWithoutFiles } = project;
    const result = {
      ...projectWithoutFiles,
      _count: {
        files: filesCount,
        comments: commentsCount,
      },
    };

    // Cache for 5 minutes
    // await this.cacheManager.set(cacheKey, result, CACHE_TTL.FIVE_MINUTES);
    return result;
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    userRole: Role,
  ) {
    // Optimized: Load project with client uploads in single query
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only allow updating non-deleted projects
      },
      include: {
        files: {
          where: {
            deletedAt: null,
          },
          select: {
            uploadedBy: true,
          },
        },
        employees: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Client can only update their own projects
    const permissionContext = new PermissionContext(userRole);
    permissionContext.verifyProjectAccess(
      userId,
      project.clientId,
      'You do not have permission to update this project',
    );

    // If clientId is being changed, verify the current client hasn't uploaded files
    if (
      updateProjectDto.clientId &&
      updateProjectDto.clientId !== project.clientId
    ) {
      await this.validateClientChange(
        updateProjectDto.clientId,
        project.clientId,
        project.files,
      );
    }

    // Phase 1: Update Employee Assignments
    const { employeeIds, ...projectData } = updateProjectDto;

    if (employeeIds) {
      // Get current assignments
      const currentEmployeeIds = project.employees.map((e) => e.employeeId);

      // Determine additions and removals
      const toAdd = employeeIds.filter((id) => !currentEmployeeIds.includes(id));
      const toRemove = currentEmployeeIds.filter((id) => !employeeIds.includes(id));

      // Remove employees
      for (const employeeId of toRemove) {
        await this.projectEmployeeService.removeEmployeeFromProject(id, employeeId);
      }

      // Add new employees (validates availability internally)
      if (toAdd.length > 0) {
        await this.projectEmployeeService.assignEmployeesToProject(id, toAdd);
      }
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: projectData,
      include: {
        client: {
          select: USER_BASIC_INFO_SELECT,
        },
        files: {
          select: FILE_BASIC_SELECT,
        },
        employees: {
          include: {
            employee: {
              select: USER_BASIC_INFO_SELECT,
            },
          },
        },
      },
    });

    // Invalidate caches
    await this.cacheManager.invalidateProjectCaches(id);

    // Convert BigInt to number for JSON serialization
    return BigIntTransformer.transformProjectWithFiles(updatedProject);
  }

  /**
   * Soft delete a project and all associated files
   */
  async remove(id: string, userId: string, userRole: Role) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only allow deleting non-deleted projects
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Client can only delete their own projects
    const permissionContext = new PermissionContext(userRole);
    permissionContext.verifyProjectAccess(
      userId,
      project.clientId,
      'You do not have permission to delete this project',
    );

    // Soft delete the project and its files with automatic retry on deadlocks
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
        maxRetries: 3, // Retry up to 3 times on transient errors
        timeout: TRANSACTION_TIMEOUT_MS, // 30 seconds timeout for projects with many files
      },
    );

    // Get project data before deletion for notifications
    const projectWithData = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        employees: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    // Invalidate caches
    await this.cacheManager.invalidateProjectCaches(id);

    // Send notifications to client and employees
    if (projectWithData) {
      const notifications = [];

      // Notify client
      if (projectWithData.clientId) {
        notifications.push(
          this.notificationsService.create({
            userId: projectWithData.clientId,
            type: NotificationType.WARNING,
            title: 'Project Deleted',
            message: `Project "${project.name}" has been deleted.`,
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
              message: `Project "${project.name}" has been deleted.`,
              link: '/dashboard/projects',
            }),
          );
        }
      }

      // Send all notifications in parallel
      await Promise.allSettled(notifications);
    }

    this.logger.log(`Project ${id} soft deleted by user ${userId}`);
    return { message: 'Project deleted successfully' };
  }

  /**
   * Check project deletion safety
   * Returns information about project data to warn admin before deletion
   */
  async checkProjectDeletionSafety(projectId: string) {
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
   * Validates if a project's client can be changed
   * Checks if new client exists and if current client has uploaded files
   * @throws NotFoundException if new client doesn't exist or isn't a CLIENT
   * @throws ForbiddenException if current client has uploaded files
   */
  private async validateClientChange(
    newClientId: string,
    currentClientId: string,
    files: Array<{ uploadedBy: string }>,
  ): Promise<void> {
    // Verify the new client exists and is active
    const newClient = await this.prisma.user.findFirst({
      where: {
        id: newClientId,
        deletedAt: null,
      },
    });

    if (!newClient || newClient.role !== Role.CLIENT) {
      throw new NotFoundException('New client not found');
    }

    // Check if current client has uploaded any files (using already-loaded data)
    const clientUploads = files.filter(
      (file) => file.uploadedBy === currentClientId,
    ).length;

    if (clientUploads > 0) {
      throw new ForbiddenException(
        'Cannot change client: current client has uploaded files or comments to this project',
      );
    }
  }

  /**
   * Get completion status checklist
   * Checks if project is ready to be archived
   */
  async getCompletionStatus(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        files: true,
        employees: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    // 1. Check Pending Payments from Client (Invoices)
    const pendingInvoices = await this.prisma.invoice.count({
      where: {
        projectId: id,
        status: { not: 'PAID' },
      },
    });

    // 2. Check Pending Payments to Employees
    const pendingEmployeePayments = await this.prisma.file.count({
      where: {
        projectId: id,
        pendingPayment: true,
        deletedAt: null,
      },
    });

    // 3. Check Open Feedback Cycles
    const openFeedback = await this.prisma.file.count({
      where: {
        projectId: id,
        stage: { in: [Stage.FEEDBACK_CLIENT, Stage.FEEDBACK_EMPLOYEE] },
        deletedAt: null,
      },
    });

    // 4. Check Delivery
    const deliveredFiles = await this.prisma.file.count({
      where: {
        projectId: id,
        stage: { in: [Stage.ADMIN_APPROVED, Stage.CLIENT_APPROVED, Stage.PAYMENTS] },
        deletedAt: null
      }
    });

    const isReady =
      pendingInvoices === 0 &&
      pendingEmployeePayments === 0 &&
      openFeedback === 0 &&
      deliveredFiles > 0;

    return {
      isReady,
      checklist: {
        allClientPaymentsReceived: pendingInvoices === 0,
        allEmployeesPaid: pendingEmployeePayments === 0,
        noOpenFeedback: openFeedback === 0,
        finalFilesDelivered: deliveredFiles > 0,
      },
      counts: {
        pendingInvoices,
        pendingEmployeePayments,
        openFeedback,
      }
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkArchivedProjects() {
    this.logger.log('Checking for old archived projects...');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldProjects = await this.prisma.project.findMany({
      where: {
        status: ProjectStatus.ARCHIVED,
        archivedAt: {
          lt: ninetyDaysAgo,
        },
      },
      select: { id: true, name: true },
    });

    if (oldProjects.length > 0) {
      this.logger.warn(`Found ${oldProjects.length} projects archived > 90 days ago: ${oldProjects.map(p => p.name).join(', ')}`);
      // Future: Implement auto-deletion or email notification to admin
    }
  }

  /**
   * Get accessible stages for a project based on user role
   * Returns stage information with permissions and file counts
   */
  async getAccessibleStages(projectId: string, userRole: Role) {
    // Verify project exists
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    // Get file counts per stage
    const fileCounts = await this.prisma.file.groupBy({
      by: ['stage'],
      where: {
        projectId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    // Map counts to stages
    const countsMap = new Map(
      fileCounts.map((fc) => [fc.stage, fc._count.id]),
    );

    // Get accessible stages for this user role
    const accessibleStages = getAccessibleStagesHelper(userRole);

    // Build response with permissions and counts
    const stages = accessibleStages.map((stage) => ({
      stage,
      name: getStageName(stage),
      icon: getStageIcon(stage),
      fileCount: countsMap.get(stage) || 0,
      permissions: {
        canView: canViewStage(userRole, stage),
        canWrite: canWriteToStage(userRole, stage),
        canDelete: canDeleteFromStage(userRole, stage),
      },
      description: getStagePermissions(stage).description,
    }));

    this.logger.log(
      `User with role ${userRole} can access ${stages.length} stages in project ${project.name}`,
    );

    return {
      projectId: project.id,
      projectName: project.name,
      projectStatus: project.status,
      userRole,
      stages,
    };
  }
}
