import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProjectRepository } from './repositories/project.repository';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';

@Module({
  imports: [StorageModule, AuditModule, AuthModule, UsersModule],
  providers: [
    ProjectsService,
    {
      provide: INJECTION_TOKENS.PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
  ],
  controllers: [ProjectsController],
  exports: [INJECTION_TOKENS.PROJECT_REPOSITORY, ProjectsService],
})
export class ProjectsModule {}
