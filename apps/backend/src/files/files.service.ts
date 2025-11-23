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
  ) {}

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
      const cacheKey = CACHE_KEYS.FILES.LIST(projectId, page, limit);
      const cached =
        await this.cacheManager.get<PaginatedResult<FileResponse>>(cacheKey);
      if (cached) return cached;
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

    // Apply type filter (file extension)
    if (fileFilters.type && fileFilters.type !== 'all') {
      where.mimeType = { contains: fileFilters.type, mode: 'insensitive' };
    }

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

    // Transform files for response
    const data = this.transformer.transformFileRecords(files);

    const result = PaginationHelper.buildPaginatedResult(
      data,
      total,
      fileFilters,
    );

    // Cache result if eligible
    if (shouldCache) {
      const cacheKey = CACHE_KEYS.FILES.LIST(projectId, page, limit);
      await this.cacheManager.set(cacheKey, result, CACHE_TTL.FIVE_MINUTES);
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
}
