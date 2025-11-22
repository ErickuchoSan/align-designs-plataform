import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaProjectRepository } from './repositories';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';

@Module({
  imports: [StorageModule, AuditModule, AuthModule],
  providers: [
    ProjectsService,
    {
      provide: INJECTION_TOKENS.PROJECT_REPOSITORY,
      useClass: PrismaProjectRepository,
    },
  ],
  controllers: [ProjectsController],
  exports: [INJECTION_TOKENS.PROJECT_REPOSITORY],
})
export class ProjectsModule {}
