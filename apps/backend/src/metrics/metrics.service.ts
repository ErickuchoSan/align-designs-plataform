import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

/**
 * Service for tracking application metrics
 * Provides methods to record various performance and operational metrics
 */
@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,

    @InjectMetric('cache_operations_total')
    private readonly cacheOperationsCounter: Counter<string>,

    @InjectMetric('database_queries_total')
    private readonly databaseQueriesCounter: Counter<string>,

    @InjectMetric('active_users')
    private readonly activeUsersGauge: Gauge<string>,
  ) {}

  /**
   * Record an HTTP request
   */
  recordHttpRequest(method: string, route: string, statusCode: number) {
    this.httpRequestsCounter.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
  }

  /**
   * Record HTTP request duration
   */
  recordHttpDuration(method: string, route: string, durationSeconds: number) {
    this.httpRequestDuration.observe(
      {
        method,
        route,
      },
      durationSeconds,
    );
  }

  /**
   * Record cache operation (hit or miss)
   */
  recordCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key?: string,
  ) {
    this.cacheOperationsCounter.inc({
      operation,
      key_prefix: key ? key.split(':')[0] : 'unknown',
    });
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(model: string, operation: string) {
    this.databaseQueriesCounter.inc({
      model,
      operation,
    });
  }

  /**
   * Set number of active users
   */
  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }
}
