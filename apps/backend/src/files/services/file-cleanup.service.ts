import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

/**
 * File Cleanup Service
 *
 * BUSINESS RULE:
 * Files from ARCHIVED projects should be automatically deleted 90 days
 * after the project was archived to free up storage space.
 *
 * This service runs daily at midnight to check for files that need cleanup.
 */
@Injectable()
export class FileCleanupService {
  private readonly logger = new Logger(FileCleanupService.name);
  private readonly CLEANUP_DAYS = 90; // Days after archive to delete files

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Cron job that runs daily at midnight (00:00)
   * Checks for files in archived projects older than 90 days and deletes them
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupArchivedFiles(): Promise<void> {
    this.logger.log('Starting archived files cleanup job...');

    try {
      // Calculate cutoff date (90 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_DAYS);

      this.logger.log(
        `Looking for files in projects archived before ${cutoffDate.toISOString()}`,
      );

      // Find files in projects that were archived more than 90 days ago
      const filesToCleanup = await this.prisma.file.findMany({
        where: {
          deletedAt: null, // Only non-deleted files
          project: {
            status: 'ARCHIVED',
            archivedAt: {
              lte: cutoffDate, // Archived 90+ days ago
            },
            deletedAt: null,
          },
        },
        select: {
          id: true,
          filename: true,
          storagePath: true,
          sizeBytes: true,
          project: {
            select: {
              id: true,
              name: true,
              archivedAt: true,
            },
          },
        },
      });

      if (filesToCleanup.length === 0) {
        this.logger.log('No files to cleanup');
        return;
      }

      this.logger.log(
        `Found ${filesToCleanup.length} files to cleanup from ${new Set(filesToCleanup.map((f) => f.project.id)).size} archived projects`,
      );

      let successCount = 0;
      let failureCount = 0;
      let totalSizeDeleted = 0n;

      // Process each file
      for (const file of filesToCleanup) {
        try {
          // Delete from MinIO
          if (file.storagePath) {
            await this.storageService.deleteFile(file.storagePath);
            this.logger.debug(`Deleted from MinIO: ${file.storagePath}`);
          }

          // Soft delete from database
          await this.prisma.file.update({
            where: { id: file.id },
            data: {
              deletedAt: new Date(),
              deletedBy: null, // System cleanup, no user
            },
          });

          successCount++;
          totalSizeDeleted += file.sizeBytes || 0n;

          this.logger.debug(
            `Cleaned up file ${file.filename} from project ${file.project.name}`,
          );
        } catch (error) {
          failureCount++;
          const err = error as Error;
          this.logger.error(
            `Failed to cleanup file ${file.id} (${file.filename}): ${err.message}`,
            err.stack,
          );
        }
      }

      // Log summary
      const totalSizeMB = Number(totalSizeDeleted) / (1024 * 1024);
      this.logger.log(
        `Cleanup completed: ${successCount} files deleted (${totalSizeMB.toFixed(2)} MB freed), ${failureCount} failures`,
      );

      // If there were no failures, log successful completion
      if (failureCount === 0) {
        this.logger.log(
          `✅ File cleanup job completed successfully`,
        );
      } else {
        this.logger.warn(
          `⚠️ File cleanup job completed with ${failureCount} failures`,
        );
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Critical error in file cleanup job: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Manual cleanup trigger for specific project
   * Can be called from admin panel or API endpoint
   */
  async cleanupProjectFiles(projectId: string): Promise<{
    filesDeleted: number;
    sizeFreed: number;
    errors: string[];
  }> {
    this.logger.log(`Manual cleanup requested for project ${projectId}`);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        archivedAt: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    if (project.status !== 'ARCHIVED') {
      throw new Error(
        `Project ${project.name} is not archived (status: ${project.status})`,
      );
    }

    // Find all files in this project
    const files = await this.prisma.file.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        filename: true,
        storagePath: true,
        sizeBytes: true,
      },
    });

    let filesDeleted = 0;
    let sizeFreed = 0n;
    const errors: string[] = [];

    for (const file of files) {
      try {
        if (file.storagePath) {
          await this.storageService.deleteFile(file.storagePath);
        }

        await this.prisma.file.update({
          where: { id: file.id },
          data: {
            deletedAt: new Date(),
            deletedBy: null,
          },
        });

        filesDeleted++;
        sizeFreed += file.sizeBytes || 0n;
      } catch (error) {
        const err = error as Error;
        errors.push(
          `Failed to delete ${file.filename}: ${err.message}`,
        );
      }
    }

    const result = {
      filesDeleted,
      sizeFreed: Number(sizeFreed),
      errors,
    };

    this.logger.log(
      `Manual cleanup completed for project ${project.name}: ${filesDeleted} files deleted, ${(result.sizeFreed / (1024 * 1024)).toFixed(2)} MB freed`,
    );

    return result;
  }

  /**
   * Get statistics about files eligible for cleanup
   * Useful for admin dashboard
   */
  async getCleanupStatistics(): Promise<{
    eligibleFiles: number;
    totalSize: number;
    projectCount: number;
    oldestArchiveDate: Date | null;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.CLEANUP_DAYS);

    const eligibleFiles = await this.prisma.file.findMany({
      where: {
        deletedAt: null,
        project: {
          status: 'ARCHIVED',
          archivedAt: {
            lte: cutoffDate,
          },
          deletedAt: null,
        },
      },
      select: {
        id: true,
        sizeBytes: true,
        project: {
          select: {
            id: true,
            archivedAt: true,
          },
        },
      },
    });

    const totalSize = eligibleFiles.reduce(
      (sum, file) => sum + (file.sizeBytes || 0n),
      0n,
    );

    const uniqueProjects = new Set(eligibleFiles.map((f) => f.project.id));

    const oldestArchive: Date | null =
      eligibleFiles.length > 0
        ? eligibleFiles.reduce((oldest: Date | null, file) => {
            const archivedAt = file.project.archivedAt;
            if (!archivedAt) return oldest;
            if (!oldest) return archivedAt;
            return archivedAt < oldest ? archivedAt : oldest;
          }, null as Date | null)
        : null;

    return {
      eligibleFiles: eligibleFiles.length,
      totalSize: Number(totalSize),
      projectCount: uniqueProjects.size,
      oldestArchiveDate: oldestArchive,
    };
  }
}
