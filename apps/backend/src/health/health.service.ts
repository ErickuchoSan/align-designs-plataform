import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  responseTime: string;
  checks: {
    database: { status: string; responseTime?: string; error?: string };
    storage: { status: string; responseTime?: string; error?: string };
    email: { status: string; configured: boolean };
  };
  system: {
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
    nodeVersion: string;
    environment: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = {
      database: await this.checkDatabase(),
      storage: await this.checkStorage(),
      email: await this.checkEmail(),
    };

    const allHealthy = Object.values(checks).every(
      (check) => check.status === 'healthy',
    );
    const anyUnhealthy = Object.values(checks).some(
      (check) => check.status === 'unhealthy',
    );

    const status = anyUnhealthy ? 'error' : allHealthy ? 'ok' : 'degraded';
    const responseTime = Date.now() - startTime;

    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      responseTime: `${responseTime}ms`,
      checks,
      system: {
        memory: {
          used: `${memoryUsedMB}MB`,
          total: `${memoryTotalMB}MB`,
          percentage: Math.round((memoryUsedMB / memoryTotalMB) * 100),
        },
        nodeVersion: process.version,
        environment: this.configService.get('NODE_ENV', 'development'),
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: string;
    responseTime?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkStorage(): Promise<{
    status: string;
    responseTime?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      // Actually verify MinIO bucket is accessible
      const isHealthy = await this.storageService.checkHealth();
      const responseTime = Date.now() - startTime;

      if (!isHealthy) {
        return {
          status: 'unhealthy',
          error: 'Storage bucket not accessible',
          responseTime: `${responseTime}ms`,
        };
      }

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      this.logger.error('Storage health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkEmail(): Promise<{ status: string; configured: boolean }> {
    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailUser = this.configService.get<string>('EMAIL_USER');

    const configured = !!(emailHost && emailUser);

    if (!configured) {
      return {
        status: 'not_configured',
        configured: false,
      };
    }

    // Actually test email connection
    const isHealthy = await this.emailService.checkHealth();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      configured: true,
    };
  }
}
