import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './cache/cache.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { TasksModule } from './tasks/tasks.module';
import { MetricsModule } from './metrics/metrics.module';
import { FeedbackModule } from './feedback/feedback.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InvoicesModule } from './invoices/invoices.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TrackingModule } from './tracking/tracking.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { RequestSizeLimitMiddleware } from './common/middleware/request-size-limit.middleware';
import { validate } from './config/configuration.validation';
import { GLOBAL_RATE_LIMIT } from './common/constants/timeouts.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([GLOBAL_RATE_LIMIT]),
    MetricsModule, // Metrics module (Prometheus) - must be before CacheModule
    CacheModule, // Cache module (global)
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
    FeedbackModule,
    NotificationsModule,
    PaymentsModule,
    TrackingModule,
    InvoicesModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
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
