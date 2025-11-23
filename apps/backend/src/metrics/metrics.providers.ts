import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

/**
 * Custom Prometheus metric providers
 * These are injected into MetricsService
 */
export const metricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  }),
  makeCounterProvider({
    name: 'cache_operations_total',
    help: 'Total number of cache operations',
    labelNames: ['operation', 'key_prefix'],
  }),
  makeCounterProvider({
    name: 'database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['model', 'operation'],
  }),
  makeGaugeProvider({
    name: 'active_users',
    help: 'Number of currently active users',
  }),
];
