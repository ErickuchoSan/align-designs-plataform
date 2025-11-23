import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HealthService } from './health.service';
import {
  HEALTH_CHECK_RATE_LIMIT,
  HEALTH_CHECK_RATE_WINDOW_MS,
} from './health.constants';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Throttle({
    default: { limit: HEALTH_CHECK_RATE_LIMIT, ttl: HEALTH_CHECK_RATE_WINDOW_MS },
  })
  check() {
    return this.healthService.check();
  }
}
