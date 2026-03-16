import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileStorageCoordinatorService } from './file-storage-coordinator.service';
import { CacheManagerService } from '../../cache/services/cache-manager.service';
import { Role } from '@prisma/client';

@Injectable()
export class FileMaintenanceService {
  private readonly logger = new Logger(FileMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageCoordinator: FileStorageCoordinatorService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  async verifyStorageIntegrity(userId: string, userRole: Role) {
    // Only admins can run integrity checks
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can verify storage integrity',
      );
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

      const exists = await this.storageCoordinator.fileExistsInStorage(
        file.storagePath,
      );

      if (!exists) {
        orphans.push({
          id: file.id,
          filename: file.filename,
          storagePath: file.storagePath,
          projectId: file.projectId,
          uploadedAt: file.uploadedAt,
        });
        this.logger.warn(
          `Orphaned file found: ${file.id} (${file.filename}) - storage path: ${file.storagePath}`,
        );
      }
    }

    const result = {
      totalFiles,
      orphanedFiles: orphans.length,
      orphans,
      message:
        orphans.length === 0
          ? 'All files are in sync with storage'
          : `Found ${orphans.length} orphaned database records (files that exist in DB but not in MinIO)`,
    };

    this.logger.log(
      `Storage integrity check completed: ${orphans.length} orphaned files found out of ${totalFiles} total files`,
    );

    return result;
  }

  async cleanupOrphanedFiles(userId: string, userRole: Role) {
    // Only admins can run cleanup
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can cleanup orphaned files',
      );
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
    const deletedFiles: Array<{
      id: string;
      filename: string | null;
      storagePath: string;
    }> = [];
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
        await this.cacheManager.invalidateFileCaches(
          orphan.projectId,
          orphan.id,
        );

        deletedFiles.push({
          id: orphan.id,
          filename: orphan.filename,
          storagePath: orphan.storagePath,
        });

        successCount++;
        this.logger.log(
          `Orphaned file deleted: ${orphan.id} (${orphan.filename})`,
        );
      } catch (error) {
        failureCount++;
        this.logger.error(
          `Failed to delete orphaned file ${orphan.id}:`,
          error,
        );
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

    this.logger.log(
      `Orphaned files cleanup completed: ${successCount} deleted, ${failureCount} failures`,
    );

    return result;
  }
}
