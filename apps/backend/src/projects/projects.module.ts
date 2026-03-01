import { Module, forwardRef } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '../cache/cache.module';
import { ProjectRepository } from './repositories/project.repository';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
// Phase 1: Workflow services
import { ProjectEmployeeService } from './services/project-employee.service';
import { ProjectStatusService } from './services/project-status.service';
import { ProjectLifecycleService } from './services/project-lifecycle.service';
// Phase 2: Invoice auto-generation
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    StorageModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CacheModule,
    forwardRef(() => InvoicesModule),
  ],
  providers: [
    ProjectsService,
    {
      provide: INJECTION_TOKENS.PROJECT_REPOSITORY,
      useClass: ProjectRepository,
    },
    // Phase 1: Workflow services
    ProjectEmployeeService,
    ProjectStatusService,
    ProjectLifecycleService,
  ],
  controllers: [ProjectsController],
  exports: [
    INJECTION_TOKENS.PROJECT_REPOSITORY,
    ProjectsService,
    // Phase 1: Export workflow services for use in other modules
    ProjectEmployeeService,
    ProjectStatusService,
    ProjectLifecycleService,
  ],
})
export class ProjectsModule {}
