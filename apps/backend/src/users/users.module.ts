import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaUserRepository } from './repositories';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';

@Module({
  imports: [AuditModule, AuthModule],
  providers: [
    UsersService,
    {
      provide: INJECTION_TOKENS.USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  controllers: [UsersController],
  exports: [INJECTION_TOKENS.USER_REPOSITORY],
})
export class UsersModule {}
