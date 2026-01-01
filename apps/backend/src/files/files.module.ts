import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { PrismaFileRepository } from './repositories';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { FilePermissionsService } from './services/file-permissions.service';
import { FileStorageCoordinatorService } from './services/file-storage-coordinator.service';
import { FileTransformerService } from './services/file-transformer.service';
import { FileStageService } from './services/file-stage.service';
import { FileVersionService } from './file-version.service';
import { FileCleanupService } from './services/file-cleanup.service';

import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [PrismaModule, StorageModule, AuditModule, AuthModule, CacheModule, TrackingModule],
  providers: [
    FilesService,
    FilePermissionsService,
    FileStorageCoordinatorService,
    FileTransformerService,
    FileStageService,
    FileVersionService,
    FileCleanupService,
    {
      provide: INJECTION_TOKENS.FILE_REPOSITORY,
      useClass: PrismaFileRepository,
    },
  ],
  controllers: [FilesController],
  exports: [INJECTION_TOKENS.FILE_REPOSITORY, FileStageService, FileVersionService, FileCleanupService],
})
export class FilesModule { }
