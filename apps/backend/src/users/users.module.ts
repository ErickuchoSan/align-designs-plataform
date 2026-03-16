import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { UserRepository } from './repositories/user.repository';
import { UserAnalyticsService } from './services/user-analytics.service';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';

@Module({
  imports: [AuditModule, AuthModule, CacheModule, PrismaModule, EmailModule],
  providers: [
    UsersService,
    UserAnalyticsService,
    {
      provide: INJECTION_TOKENS.USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  controllers: [UsersController],
  exports: [
    INJECTION_TOKENS.USER_REPOSITORY,
    UsersService,
    UserAnalyticsService,
  ],
})
export class UsersModule {}
