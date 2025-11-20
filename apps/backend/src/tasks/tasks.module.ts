import { Module } from '@nestjs/common';
import { CleanupDeletedFilesTask } from './cleanup-deleted-files.task';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [CleanupDeletedFilesTask],
  exports: [CleanupDeletedFilesTask],
})
export class TasksModule {}
