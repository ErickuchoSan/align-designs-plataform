import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UserRepository } from './repositories/user.repository';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';

@Module({
  imports: [AuditModule, AuthModule],
  providers: [
    UsersService,
    {
      provide: INJECTION_TOKENS.USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  controllers: [UsersController],
  exports: [INJECTION_TOKENS.USER_REPOSITORY, UsersService],
})
export class UsersModule {}
