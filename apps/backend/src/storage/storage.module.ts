import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import {
  FileValidationService,
  FileSecurityService,
  MinioStorageService,
} from './services';

@Module({
  providers: [
    FileValidationService,
    FileSecurityService,
    MinioStorageService,
    // Keep StorageService for backwards compatibility during transition
    StorageService,
  ],
  exports: [
    MinioStorageService,
    FileValidationService,
    FileSecurityService,
    // Keep StorageService export for backwards compatibility
    StorageService,
  ],
})
export class StorageModule {}
