import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class CleanupDeletedFilesTask {
  private readonly logger = new Logger(CleanupDeletedFilesTask.name);
  private readonly RETENTION_DAYS: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    // Load retention days from environment or use default
    this.RETENTION_DAYS = this.configService.get<number>(
      'FILE_RETENTION_DAYS',
      30,
    );
  }

  /**
   * Runs monthly on the 1st at 3 AM
   * Permanently deletes files that were soft-deleted more than 30 days ago
   */
  @Cron('0 3 1 * *')
  async handleCleanup() {
    await this.performCleanup(this.RETENTION_DAYS);
  }

  /**
   * Perform the actual cleanup logic
   * Separated to allow custom retention days without type assertions
   */
  private async performCleanup(retentionDays: number) {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    this.logger.log(
      `Starting cleanup of files deleted before ${retentionDate.toISOString()} (${retentionDays} days retention)`,
    );

    try {
      // Find files that were soft-deleted more than the retention period using Prisma ORM
      const filesToDelete = await this.prisma.file.findMany({
        where: {
          deletedAt: {
            not: null,
            lt: retentionDate,
          },
        },
        select: {
          id: true,
          storagePath: true,
          filename: true,
        },
      });

      if (filesToDelete.length === 0) {
        this.logger.log('No files to clean up');
        return;
      }

      this.logger.log(
        `Found ${filesToDelete.length} files to permanently delete`,
      );

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ fileId: string; error: string }> = [];

      // Process each file
      for (const file of filesToDelete) {
        try {
          // Delete physical file from MinIO if it has a storage path
          if (file.storagePath) {
            try {
              await this.storageService.deleteFile(file.storagePath);
              this.logger.debug(
                `Deleted file from storage: ${file.storagePath}`,
              );
            } catch (storageError) {
              // Log storage deletion error but continue with database deletion
              this.logger.warn(
                `Failed to delete file from storage: ${file.storagePath}`,
                storageError,
              );
            }
          }

          // Hard delete from database using Prisma ORM
          await this.prisma.file.delete({
            where: { id: file.id },
          });

          successCount++;
          this.logger.debug(
            `Permanently deleted file: ${file.id} (${file.filename || 'comment-only'})`,
          );
        } catch (error) {
          failureCount++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          errors.push({ fileId: file.id, error: errorMessage });
          this.logger.error(
            `Failed to delete file ${file.id}: ${errorMessage}`,
          );
        }
      }

      // Summary log
      this.logger.log(
        `Cleanup completed: ${successCount} files deleted successfully, ${failureCount} failures`,
      );

      if (errors.length > 0) {
        this.logger.warn(
          `Errors during cleanup: ${JSON.stringify(errors, null, 2)}`,
        );
      }
    } catch (error) {
      this.logger.error('Error during cleanup task:', error);
      throw error;
    }
  }

  /**
   * Manual trigger for cleanup (useful for testing or admin operations)
   * Can be called with a custom retention period
   */
  async manualCleanup(retentionDays: number = this.RETENTION_DAYS) {
    this.logger.log(
      `Manual cleanup triggered with ${retentionDays} days retention`,
    );
    await this.performCleanup(retentionDays);
  }
}
