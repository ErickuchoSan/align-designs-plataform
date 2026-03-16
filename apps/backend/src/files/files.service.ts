import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Stage } from '@prisma/client';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { FileFiltersDto } from './dto/file-filters.dto';
import { FileResponse } from '../common/interfaces/file-response.interface';
import { UserContext } from '../common/interfaces/user-context.interface';
import { FilePermissionsService } from './services/file-permissions.service';
import { FileStorageCoordinatorService } from './services/file-storage-coordinator.service';
import { FileTransformerService } from './services/file-transformer.service';
import { FileNotificationService } from './services/file-notification.service';
import { FileMaintenanceService } from './services/file-maintenance.service';
import { PaginationHelper } from '../common/helpers/pagination.helper';
import { CacheManagerService } from '../cache/services/cache-manager.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: FilePermissionsService,
    private readonly storageCoordinator: FileStorageCoordinatorService,
    private readonly transformer: FileTransformerService,
    private readonly cacheManager: CacheManagerService,
    private readonly fileNotifications: FileNotificationService,
    private readonly fileMaintenance: FileMaintenanceService,
  ) { }

  async uploadFile(
    projectId: string,
    file: Express.Multer.File,
    comment: string | undefined,
    uploadedBy: string,
    userRole: Role,
    stage?: Stage,
    relatedFileId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file was provided');
    }

    // Verify project access and permissions
    await this.permissions.verifyProjectAccess(
      projectId,
      uploadedBy,
      userRole,
      'You do not have permission to upload files to this project',
    );

    // Upload file with transactional safety
    const fileRecord = await this.storageCoordinator.uploadFileWithTransaction(
      projectId,
      file,
      uploadedBy,
      comment,
      stage,
    );

    // Handle Rejection Logic
    if (relatedFileId) {
      await this.handleFileRejection(
        relatedFileId,
        fileRecord.id,
        uploadedBy,
        userRole,
      );
    }

    // Send Notifications
    await this.fileNotifications.sendProjectNotifications(
      projectId,
      uploadedBy,
      'FILE',
      file.originalname,
    );

    // Invalidate caches
    await this.cacheManager.invalidateFileCaches(projectId, fileRecord.id);

    // Transform and return
    return this.transformer.transformFileRecord(fileRecord);
  }

  /**
   * Create only comment without file
   */
  async createComment(
    projectId: string,
    comment: string,
    uploadedBy: string,
    userRole: Role,
    stage?: Stage,
    relatedFileId?: string,
  ) {
    // Verify project access and permissions
    await this.permissions.verifyProjectAccess(
      projectId,
      uploadedBy,
      userRole,
      'You do not have permission to create comments in this project',
    );

    // STRICT RULE: No standalone comments in SUBMITTED stage
    if (stage === Stage.SUBMITTED) {
      throw new ForbiddenException(
        'Standalone comments are not allowed in the Submitted stage. Please upload a file.',
      );
    }

    // Save comment in database (without file)
    const commentRecord = await this.prisma.file.create({
      data: {
        comment,
        projectId,
        uploadedBy,
        stage,
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Handle Rejection Logic
    if (relatedFileId) {
      await this.handleFileRejection(
        relatedFileId,
        commentRecord.id,
        uploadedBy,
        userRole,
      );
    }

    // Send Notifications
    await this.fileNotifications.sendProjectNotifications(
      projectId,
      uploadedBy,
      'COMMENT',
      comment,
    );

    // Invalidate caches
    await this.cacheManager.invalidateFileCaches(projectId, commentRecord.id);

    // Transform and return
    return this.transformer.transformFileRecord(commentRecord);
  }

  /**
   * Update comment and/or add file to an existing comment
   */
  async updateFile(
    fileId: string,
    file: Express.Multer.File | undefined,
    comment: string | null | undefined,
    userId: string,
    userRole: Role,
  ) {
    // Verify user has permission to modify this file
    const existingFile = await this.permissions.verifyFileModifyPermission(
      fileId,
      userId,
      userRole,
    );

    // Update file with transactional safety
    const updatedFile = await this.storageCoordinator.updateFileWithTransaction(
      fileId,
      existingFile.projectId,
      existingFile.storagePath,
      file,
      comment,
    );

    // Invalidate caches
    await this.cacheManager.invalidateFileCaches(
      existingFile.projectId,
      fileId,
    );

    // Transform and return
    return this.transformer.transformFileRecord(updatedFile);
  }

  async findAllByProject(
    projectId: string,
    fileFilters: FileFiltersDto,
    userContext: UserContext,
  ): Promise<PaginatedResult<FileResponse>> {
    // Verify project access
    await this.permissions.verifyProjectAccess(
      projectId,
      userContext.userId,
      userContext.role,
    );

    const { page, limit, skip } =
      PaginationHelper.extractPaginationParams(fileFilters);

    // Only cache if there are no filters (name/type filters would create too many cache variations)
    const shouldCache =
      !fileFilters.name && (!fileFilters.type || fileFilters.type === 'all');

    if (shouldCache) {

    }

    // Build where clause with filters
    const where: Record<string, unknown> = {
      projectId,
      deletedAt: null,
    };

    // Apply role-based stage visibility restrictions
    if (userContext.role === Role.CLIENT) {
      // Clients can see: BRIEF_PROJECT, FEEDBACK_CLIENT, REFERENCES, ADMIN_APPROVED, CLIENT_APPROVED, PAYMENTS
      // They should NOT see: FEEDBACK_EMPLOYEE (private feedback for employees), SUBMITTED (employee work in progress)
      where.stage = {
        in: [
          Stage.BRIEF_PROJECT,
          Stage.FEEDBACK_CLIENT,
          Stage.REFERENCES,
          Stage.ADMIN_APPROVED,
          Stage.CLIENT_APPROVED,
          Stage.PAYMENTS,
        ],
      };
    } else if (userContext.role === Role.EMPLOYEE) {
      // Employees can see: BRIEF_PROJECT, FEEDBACK_EMPLOYEE, REFERENCES, SUBMITTED (their own), ADMIN_APPROVED (their own)
      // They should NOT see: FEEDBACK_CLIENT (private for clients), PAYMENTS, CLIENT_APPROVED
      // For SUBMITTED and ADMIN_APPROVED, only show files they uploaded
      where.OR = [
        {
          stage: {
            in: [Stage.BRIEF_PROJECT, Stage.FEEDBACK_EMPLOYEE, Stage.REFERENCES],
          },
        },
        {
          stage: { in: [Stage.SUBMITTED, Stage.ADMIN_APPROVED] },
          uploadedBy: userContext.userId,
        },
      ];
    }
    // ADMIN: No stage restrictions

    // Apply name filter (case-insensitive partial match)
    if (fileFilters.name) {
      // Combine with existing OR if role-based filter already set one
      const nameFilter = [
        { filename: { contains: fileFilters.name, mode: 'insensitive' } },
        { originalName: { contains: fileFilters.name, mode: 'insensitive' } },
        { comment: { contains: fileFilters.name, mode: 'insensitive' } },
      ];

      if (where.OR) {
        // If role-based OR exists, we need to combine with AND
        where.AND = [
          { OR: where.OR },
          { OR: nameFilter },
        ];
        delete where.OR;
      } else {
        where.OR = nameFilter;
      }
    }

    // Debug input
    this.logger.debug(
      `Files Filter Input - Name: "${fileFilters.name}", Type: "${fileFilters.type}"`,
    );

    // Apply type filter
    if (fileFilters.type && fileFilters.type !== 'all') {
      if (fileFilters.type === 'comments') {
        // Filter for comments only (no file attached) -> Check storagePath
        where.storagePath = null;
      } else {
        // Filter by file extension (which matches the dropdown values)
        // We use endsWith to match the extension
        where.filename = {
          endsWith: `.${fileFilters.type}`,
          mode: 'insensitive',
        };
        where.storagePath = { not: null };
      }
    }

    // Debug logging for search/filter issues
    this.logger.debug(
      `Files Filter - WHERE clause: ${JSON.stringify(where, null, 2)}`,
    );

    const [total, files] = await Promise.all([
      this.prisma.file.count({ where }),
      this.prisma.file.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              deletedAt: true, // Include to handle deleted users in transformer
            },
          },
        },
        orderBy: {
          uploadedAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    this.logger.debug(`Files Filter - Found ${total} matches`);

    // Transform files for response
    const data = this.transformer.transformFileRecords(files);

    const result = PaginationHelper.buildPaginatedResult(
      data,
      total,
      fileFilters,
    );

    // Cache result if eligible
    if (shouldCache) {
      // const cacheKey = CACHE_KEYS.FILES.LIST(projectId, page, limit);
      // await this.cacheManager.set(cacheKey, result, CACHE_TTL.FIVE_MINUTES);
    }

    return result;
  }

  async getFileUrl(fileId: string, userId: string, userRole: Role) {
    // Verify user has permission to view this file
    const file = await this.permissions.verifyFileViewPermission(
      fileId,
      userId,
      userRole,
    );

    // If it's only a comment without a file, there is no URL
    if (!file.storagePath) {
      throw new BadRequestException(
        'This entry does not have a file to download',
      );
    }

    // Get download URL from storage
    const downloadUrl = await this.storageCoordinator.getFileDownloadUrl(
      file.storagePath,
    );

    return {
      ...this.transformer.transformFileRecord(file),
      downloadUrl,
    };
  }

  async deleteFile(fileId: string, userId: string, userRole: Role) {
    // Verify user has permission to delete this file
    const file = await this.permissions.verifyFileDeletePermission(
      fileId,
      userId,
      userRole,
    );

    // Soft delete from database
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Invalidate caches
    await this.cacheManager.invalidateFileCaches(file.projectId, fileId);

    this.logger.log(`File ${fileId} soft deleted by user ${userId}`);

    return {
      message: file.storagePath
        ? 'File deleted successfully'
        : 'Comment deleted successfully',
    };
  }

  async getProjectFileTypes(projectId: string): Promise<string[]> {
    const files = await this.prisma.file.findMany({
      where: {
        projectId,
        filename: { not: null },
        deletedAt: null,
      },
      select: { filename: true },
    });

    const types = new Set<string>();
    files.forEach((file) => {
      if (file.filename) {
        const ext = file.filename.split('.').pop();
        if (ext) types.add(ext.toLowerCase());
      }
    });

    return Array.from(types).sort();
  }

  async verifyStorageIntegrity(userId: string, userRole: Role) {
    return this.fileMaintenance.verifyStorageIntegrity(userId, userRole);
  }

  async cleanupOrphanedFiles(userId: string, userRole: Role) {
    return this.fileMaintenance.cleanupOrphanedFiles(userId, userRole);
  }

  async findPendingPaymentFiles(projectId: string, employeeId?: string) {
    return this.prisma.file.findMany({
      where: {
        projectId,
        pendingPayment: true,
        ...(employeeId ? { uploadedBy: employeeId } : {}),
        deletedAt: null,
      },
      select: {
        id: true,
        filename: true,
        uploadedAt: true,
        approvedClientAt: true,
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Helper to handle file rejection updates
   */
  private async handleFileRejection(
    targetFileId: string,
    feedbackFileId: string,
    userId: string,
    role: Role,
  ) {
    // Only Admins (and Clients) can reject work
    if (role !== Role.ADMIN && role !== Role.CLIENT) return;

    try {
      await this.prisma.file.update({
        where: { id: targetFileId },
        data: {
          rejectionCount: { increment: 1 },
          lastRejectedAt: new Date(),
          // lastRejectionFeedbackId: feedbackFileId, // FIXME: Requires valid Feedback ID, not File ID.
        },
      });
      this.logger.log(
        `File ${targetFileId} rejected by user ${userId}. Count incremented.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update rejection stats for file ${targetFileId}`,
        error,
      );
      // Non-blocking: don't fail the upload just because stat update failed
    }
  }
}
