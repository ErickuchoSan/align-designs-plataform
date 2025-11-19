import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute to prevent reconnaissance
  check() {
    return this.healthService.check();
  }
}
