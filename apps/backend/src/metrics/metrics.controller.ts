import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

/**
 * Controller for Prometheus metrics endpoint
 * Exposes /metrics endpoint for Prometheus scraping
 */
@Controller()
export class MetricsController {
  @Get('metrics')
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
