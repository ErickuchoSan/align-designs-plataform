import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaFileRepository } from './repositories';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';

@Module({
  imports: [PrismaModule, StorageModule, AuditModule, AuthModule],
  providers: [
    FilesService,
    {
      provide: INJECTION_TOKENS.FILE_REPOSITORY,
      useClass: PrismaFileRepository,
    },
  ],
  controllers: [FilesController],
  exports: [INJECTION_TOKENS.FILE_REPOSITORY],
})
export class FilesModule {}
