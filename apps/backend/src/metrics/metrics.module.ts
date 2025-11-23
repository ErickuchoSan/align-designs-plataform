import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { metricsProviders } from './metrics.providers';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'aligndesigns_',
        },
      },
      path: '/metrics',
      defaultLabels: {
        app: 'align-designs-backend',
      },
    }),
  ],
  providers: [
    MetricsService,
    ...metricsProviders,
    // Also provide with string token for optional injection
    {
      provide: 'MetricsService',
      useExisting: MetricsService,
    },
  ],
  controllers: [MetricsController],
  exports: [MetricsService, 'MetricsService'],
})
export class MetricsModule {}
