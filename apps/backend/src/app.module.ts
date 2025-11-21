import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { TasksModule } from './tasks/tasks.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { RequestSizeLimitMiddleware } from './common/middleware/request-size-limit.middleware';
import { IpThrottlerGuard } from './common/guards/ip-throttler.guard';
import { validate } from './config/configuration.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    PrismaModule,
    UsersModule,
    ProjectsModule,
    FilesModule,
    AuthModule,
    OtpModule,
    StorageModule,
    EmailModule,
    HealthModule,
    TasksModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: IpThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestIdMiddleware,
        RequestSizeLimitMiddleware,
        RequestLoggingMiddleware,
        CsrfMiddleware,
      )
      .forRoutes('*');
  }
}
