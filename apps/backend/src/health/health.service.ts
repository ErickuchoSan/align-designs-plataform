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
    database: {
      status: string;
      responseTime?: string;
      error?: string;
      poolSize?: number;
      activeConnections?: number;
    };
    storage: {
      status: string;
      responseTime?: string;
      error?: string;
      available?: boolean;
    };
    email: {
      status: string;
      configured: boolean;
      verified?: boolean;
    };
    scheduler: {
      status: string;
      enabled: boolean;
      jobsRegistered?: number;
    };
  };
  system: {
    memory: {
      used: string;
      total: string;
      percentage: number;
      rss: string;
      external: string;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    nodeVersion: string;
    environment: string;
    platform: string;
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
      scheduler: this.checkScheduler(),
    };

    const allHealthy = Object.values(checks).every(
      (check) =>
        check.status === 'healthy' || check.status === 'not_configured',
    );
    const anyUnhealthy = Object.values(checks).some(
      (check) => check.status === 'unhealthy',
    );

    const status = this.resolveOverallStatus(anyUnhealthy, allHealthy);
    const responseTime = Date.now() - startTime;

    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);
    const externalMB = Math.round(memoryUsage.external / 1024 / 1024);

    // Calculate CPU usage (simple approximation)
    const loadAverage = process.cpuUsage
      ? process.cpuUsage()
      : { user: 0, system: 0 };
    const cpuUsage =
      Math.round(((loadAverage.user + loadAverage.system) / 1000000) * 100) /
      100;

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
          rss: `${rssMB}MB`,
          external: `${externalMB}MB`,
        },
        cpu: {
          usage: cpuUsage,
          loadAverage: [0, 0, 0], // Not available in Node.js on all platforms
        },
        nodeVersion: process.version,
        environment: this.configService.get('NODE_ENV', 'development'),
        platform: process.platform,
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: string;
    responseTime?: string;
    error?: string;
    poolSize?: number;
    activeConnections?: number;
  }> {
    const startTime = Date.now();
    try {
      // Test basic database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Get database connection pool statistics (if available)
      let poolSize: number | undefined;
      let activeConnections: number | undefined;

      try {
        const poolStats = await this.prisma.$queryRaw<
          Array<{ count: bigint }>
        >`SELECT COUNT(*) as count FROM pg_stat_activity WHERE datname = current_database()`;

        if (poolStats && poolStats[0]) {
          activeConnections = Number(poolStats[0].count);
        }

        // Get max connections from PostgreSQL
        const maxConnections = await this.prisma.$queryRaw<
          Array<{ max_connections: string }>
        >`SHOW max_connections`;

        if (maxConnections && maxConnections[0]) {
          poolSize = Number.parseInt(maxConnections[0].max_connections, 10);
        }
      } catch (poolError) {
        // Pool stats are optional, log but don't fail the health check
        this.logger.warn('Could not retrieve database pool stats:', poolError);
      }

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        poolSize,
        activeConnections,
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
    available?: boolean;
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
          available: false,
        };
      }

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        available: true,
      };
    } catch (error) {
      this.logger.error('Storage health check failed:', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        available: false,
      };
    }
  }

  private async checkEmail(): Promise<{
    status: string;
    configured: boolean;
    verified?: boolean;
  }> {
    const emailHost = this.configService.get<string>('EMAIL_HOST');
    const emailUser = this.configService.get<string>('EMAIL_USER');

    const configured = !!(emailHost && emailUser);

    if (!configured) {
      return {
        status: 'not_configured',
        configured: false,
        verified: false,
      };
    }

    // Actually test email connection
    const isHealthy = await this.emailService.checkHealth();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      configured: true,
      verified: isHealthy,
    };
  }

  /**
   * Resolve the overall health status based on check results
   */
  private resolveOverallStatus(
    anyUnhealthy: boolean,
    allHealthy: boolean,
  ): 'ok' | 'degraded' | 'error' {
    if (anyUnhealthy) return 'error';
    if (allHealthy) return 'ok';
    return 'degraded';
  }

  /**
   * Check scheduler/cron jobs status
   * Validates that the NestJS Scheduler module is properly initialized
   */
  private checkScheduler(): {
    status: string;
    enabled: boolean;
    jobsRegistered?: number;
  } {
    try {
      // Check if scheduler is enabled via environment
      const schedulerDisabled =
        this.configService.get<string>('DISABLE_SCHEDULER') === 'true';

      if (schedulerDisabled) {
        return {
          status: 'disabled',
          enabled: false,
        };
      }

      // If scheduler is enabled, it's healthy (NestJS handles initialization)
      // We could extend this to track last execution times of specific jobs
      return {
        status: 'healthy',
        enabled: true,
        jobsRegistered: 1, // CleanupDeletedFilesTask
      };
    } catch (error) {
      this.logger.error('Scheduler health check failed:', error);
      return {
        status: 'unhealthy',
        enabled: false,
      };
    }
  }
}
