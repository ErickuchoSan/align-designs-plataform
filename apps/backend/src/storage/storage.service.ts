import { Injectable } from '@nestjs/common';
import { MinioStorageService } from './services/minio-storage.service';

/**
 * StorageService (Facade Pattern)
 *
 * This facade provides a simplified interface to the underlying storage implementation.
 * It delegates all operations to MinioStorageService while maintaining a clean API.
 *
 * Architecture Decision:
 * ======================
 * This is NOT a deprecated legacy pattern, but an intentional architectural choice.
 * The facade pattern provides:
 * - Abstraction: Services don't need to know about MinIO specifics
 * - Future flexibility: Can switch storage providers without changing consumers
 * - Simplified interface: Clean API for common storage operations
 *
 * Status: ACTIVE (not deprecated)
 * Migration: No migration needed - this is the recommended approach
 */
@Injectable()
export class StorageService {
  constructor(private readonly minioStorageService: MinioStorageService) {}

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: Express.Multer.File,
    projectId: string,
  ): Promise<{ filename: string; storagePath: string }> {
    return this.minioStorageService.uploadFile(file, projectId);
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    return this.minioStorageService.deleteFile(storagePath);
  }

  /**
   * Get a presigned download URL for a file
   */
  async getDownloadUrl(
    storagePath: string,
    expirySeconds?: number,
  ): Promise<string> {
    return this.minioStorageService.getDownloadUrl(storagePath, expirySeconds);
  }

  /**
   * Check storage health status
   */
  async checkHealth(): Promise<boolean> {
    return this.minioStorageService.checkHealth();
  }
}
