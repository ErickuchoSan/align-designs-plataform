import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { FILE_WITH_UPLOADER_INCLUDE } from '../constants/file-selects';

/**
 * Service responsible for coordinating file storage operations between database and MinIO
 * Handles transactional logic and rollback scenarios
 */
@Injectable()
export class FileStorageCoordinatorService {
  private readonly logger = new Logger(FileStorageCoordinatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload a file with transactional safety
   * Creates DB record first, uploads to MinIO, then updates DB with storage path
   * Rolls back DB record if MinIO upload fails
   */
  async uploadFileWithTransaction(
    projectId: string,
    file: Express.Multer.File,
    uploadedBy: string,
    comment?: string,
  ) {
    const filename = `${Date.now()}-${file.originalname}`;
    const storagePath = `projects/${projectId}/${filename}`;

    // Step 1: Create database record with pending status (storagePath as placeholder)
    const fileRecord = await this.prisma.file.create({
      data: {
        filename,
        originalName: file.originalname,
        storagePath: null, // Will be set after successful upload
        mimeType: file.mimetype,
        sizeBytes: file.size,
        comment: comment || null,
        projectId,
        uploadedBy,
      },
      include: FILE_WITH_UPLOADER_INCLUDE,
    });

    try {
      // Step 2: Upload file to MinIO
      await this.storageService.uploadFile(file, projectId);

      // Step 3: Update database record with storagePath after successful upload
      const updatedFileRecord = await this.prisma.file.update({
        where: { id: fileRecord.id },
        data: { storagePath },
        include: FILE_WITH_UPLOADER_INCLUDE,
      });

      this.logger.log(
        `File uploaded: ${fileRecord.id} (${file.originalname}) to project ${projectId} by user ${uploadedBy}`,
      );

      return updatedFileRecord;
    } catch (error) {
      // If MinIO upload fails, delete the database record to maintain consistency
      await this.prisma.file.delete({
        where: { id: fileRecord.id },
      });
      this.logger.error(
        `Failed to upload file to MinIO, database record rolled back`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update a file entry with optional file replacement
   * Handles rollback if database update fails
   */
  async updateFileWithTransaction(
    fileId: string,
    projectId: string,
    oldStoragePath: string | null,
    file?: Express.Multer.File,
    comment?: string | null,
  ) {
    // Prepare data to update
    const updateData: {
      comment?: string | null;
      filename?: string;
      originalName?: string;
      storagePath?: string;
      mimeType?: string;
      sizeBytes?: number;
    } = {};

    // If a comment is provided (string or null to remove)
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    // Track new file path for rollback if needed
    let newStoragePath: string | null = null;

    try {
      // If a file is provided, upload it first
      if (file) {
        const uploadResult = await this.storageService.uploadFile(
          file,
          projectId,
        );
        newStoragePath = uploadResult.storagePath;

        updateData.filename = uploadResult.filename;
        updateData.originalName = file.originalname;
        updateData.storagePath = uploadResult.storagePath;
        updateData.mimeType = file.mimetype;
        updateData.sizeBytes = file.size;
      }

      // Update in database
      const updatedFile = await this.prisma.file.update({
        where: { id: fileId },
        data: updateData,
        include: FILE_WITH_UPLOADER_INCLUDE,
      });

      // Clean up old file from MinIO if a new file was uploaded successfully
      if (file && oldStoragePath) {
        try {
          await this.storageService.deleteFile(oldStoragePath);
          this.logger.debug(
            `Deleted old file from storage: ${oldStoragePath}`,
          );
        } catch (error) {
          // Log but don't fail - old file might already be deleted
          this.logger.warn(
            `Failed to delete old file from storage: ${oldStoragePath}`,
            error,
          );
        }
      }

      return updatedFile;
    } catch (error) {
      // Rollback: If DB update failed and we uploaded a new file, delete it
      if (newStoragePath) {
        try {
          await this.storageService.deleteFile(newStoragePath);
          this.logger.warn(
            `Rolled back new file upload from storage: ${newStoragePath}`,
          );
        } catch (rollbackError) {
          this.logger.error(
            `Failed to rollback new file from storage: ${newStoragePath}`,
            rollbackError,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  async getFileDownloadUrl(storagePath: string) {
    return this.storageService.getDownloadUrl(storagePath);
  }
}
