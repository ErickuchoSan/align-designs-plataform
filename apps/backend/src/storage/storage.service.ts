import { Injectable } from '@nestjs/common';
import { MinioStorageService } from './services/minio-storage.service';

/**
 * StorageService (Legacy Facade)
 *
 * This class is maintained for backwards compatibility.
 * New code should use MinioStorageService directly.
 *
 * @deprecated Use MinioStorageService, FileValidationService, or FileSecurityService instead
 */
@Injectable()
export class StorageService {
  constructor(private readonly minioStorageService: MinioStorageService) {}

  /**
   * @deprecated Use MinioStorageService.uploadFile() instead
   */
  async uploadFile(
    file: Express.Multer.File,
    projectId: string,
  ): Promise<{ filename: string; storagePath: string }> {
    return this.minioStorageService.uploadFile(file, projectId);
  }

  /**
   * @deprecated Use MinioStorageService.deleteFile() instead
   */
  async deleteFile(storagePath: string): Promise<void> {
    return this.minioStorageService.deleteFile(storagePath);
  }

  /**
   * @deprecated Use MinioStorageService.getDownloadUrl() instead
   */
  async getDownloadUrl(
    storagePath: string,
    expirySeconds?: number,
  ): Promise<string> {
    return this.minioStorageService.getDownloadUrl(storagePath, expirySeconds);
  }

  /**
   * @deprecated Use MinioStorageService.checkHealth() instead
   */
  async checkHealth(): Promise<boolean> {
    return this.minioStorageService.checkHealth();
  }
}
