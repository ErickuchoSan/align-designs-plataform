import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { FileFiltersDto } from './dto/file-filters.dto';
import { FileResponse } from '../common/interfaces/file-response.interface';
import { UserContext } from '../common/interfaces/user-context.interface';
import { FilePermissionsService } from './services/file-permissions.service';
import { FileStorageCoordinatorService } from './services/file-storage-coordinator.service';
import { FileTransformerService } from './services/file-transformer.service';
import { PaginationHelper } from '../common/helpers/pagination.helper';
import { CacheManagerService } from '../cache/services/cache-manager.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/constants/cache-keys';

/**
 * Main service for file operations
 * Orchestrates permissions, storage, and data transformation services
 */
@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: FilePermissionsService,
    private readonly storageCoordinator: FileStorageCoordinatorService,
    private readonly transformer: FileTransformerService,
    private readonly cacheManager: CacheManagerService,
  ) { }

  async uploadFile(
    projectId: string,
    file: Express.Multer.File,
    comment: string | undefined,
    uploadedBy: string,
    userRole: Role,
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
  ) {
    // Verify project access and permissions
    await this.permissions.verifyProjectAccess(
      projectId,
      uploadedBy,
      userRole,
      'You do not have permission to create comments in this project',
    );

    // Save comment in database (without file)
    const commentRecord = await this.prisma.file.create({
      data: {
        comment,
        projectId,
        uploadedBy,
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
      // DISABLE CACHE TEMPORARILY: Invalidation not working for paginated lists
      // const cacheKey = CACHE_KEYS.FILES.LIST(projectId, page, limit);
      // const cached =
      //   await this.cacheManager.get<PaginatedResult<FileResponse>>(cacheKey);
      // if (cached) return cached;
    }

    // Build where clause with filters
    const where: Record<string, unknown> = {
      projectId,
      deletedAt: null,
    };

    // Apply name filter (case-insensitive partial match)
    if (fileFilters.name) {
      where.OR = [
        { filename: { contains: fileFilters.name, mode: 'insensitive' } },
        { originalName: { contains: fileFilters.name, mode: 'insensitive' } },
        { comment: { contains: fileFilters.name, mode: 'insensitive' } },
      ];
    }

    // Debug input
    this.logger.debug(`Files Filter Input - Name: "${fileFilters.name}", Type: "${fileFilters.type}"`);

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
          mode: 'insensitive'
        };
        where.storagePath = { not: null };
      }
    }

    // Debug logging for search/filter issues
    this.logger.debug(`Files Filter - WHERE clause: ${JSON.stringify(where, null, 2)}`);

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
    // Only admins can run integrity checks
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can verify storage integrity');
    }

    this.logger.log(`Storage integrity check initiated by user ${userId}`);

    // Get all files with storage paths (not just comments)
    const filesWithStorage = await this.prisma.file.findMany({
      where: {
        storagePath: { not: null },
        deletedAt: null, // Only check active files
      },
      select: {
        id: true,
        filename: true,
        storagePath: true,
        projectId: true,
        uploadedAt: true,
      },
    });

    const totalFiles = filesWithStorage.length;
    const orphans: Array<{
      id: string;
      filename: string | null;
      storagePath: string;
      projectId: string;
      uploadedAt: Date;
    }> = [];

    this.logger.log(`Checking ${totalFiles} files for storage integrity...`);

    // Check each file to see if it exists in MinIO
    for (const file of filesWithStorage) {
      if (!file.storagePath) continue;

      const exists = await this.storageCoordinator.fileExistsInStorage(file.storagePath);

      if (!exists) {
        orphans.push({
          id: file.id,
          filename: file.filename,
          storagePath: file.storagePath,
          projectId: file.projectId,
          uploadedAt: file.uploadedAt,
        });
        this.logger.warn(`Orphaned file found: ${file.id} (${file.filename}) - storage path: ${file.storagePath}`);
      }
    }

    const result = {
      totalFiles,
      orphanedFiles: orphans.length,
      orphans,
      message: orphans.length === 0
        ? 'All files are in sync with storage'
        : `Found ${orphans.length} orphaned database records (files that exist in DB but not in MinIO)`,
    };

    this.logger.log(`Storage integrity check completed: ${orphans.length} orphaned files found out of ${totalFiles} total files`);

    return result;
  }

  async cleanupOrphanedFiles(userId: string, userRole: Role) {
    // Only admins can run cleanup
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can cleanup orphaned files');
    }

    this.logger.log(`Orphaned files cleanup initiated by user ${userId}`);

    // First, verify storage integrity to find orphans
    const integrityCheck = await this.verifyStorageIntegrity(userId, userRole);

    if (integrityCheck.orphanedFiles === 0) {
      this.logger.log('No orphaned files found to clean up');
      return {
        totalChecked: integrityCheck.totalFiles,
        orphansFound: 0,
        orphansDeleted: 0,
        failures: 0,
        deletedFiles: [],
        message: 'No orphaned files found. Storage is in sync.',
      };
    }

    // Delete orphaned files (soft delete)
    const deletedFiles: Array<{ id: string; filename: string | null; storagePath: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const orphan of integrityCheck.orphans) {
      try {
        // Soft delete the orphaned file record
        await this.prisma.file.update({
          where: { id: orphan.id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          },
        });

        // Invalidate cache for this file
        await this.cacheManager.invalidateFileCaches(orphan.projectId, orphan.id);

        deletedFiles.push({
          id: orphan.id,
          filename: orphan.filename,
          storagePath: orphan.storagePath,
        });

        successCount++;
        this.logger.log(`Orphaned file deleted: ${orphan.id} (${orphan.filename})`);
      } catch (error) {
        failureCount++;
        this.logger.error(`Failed to delete orphaned file ${orphan.id}:`, error);
      }
    }

    const result = {
      totalChecked: integrityCheck.totalFiles,
      orphansFound: integrityCheck.orphanedFiles,
      orphansDeleted: successCount,
      failures: failureCount,
      deletedFiles,
      message: `Cleanup completed: ${successCount} orphaned files deleted${failureCount > 0 ? `, ${failureCount} failures` : ''}.`,
    };

    this.logger.log(`Orphaned files cleanup completed: ${successCount} deleted, ${failureCount} failures`);

    return result;
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
}
