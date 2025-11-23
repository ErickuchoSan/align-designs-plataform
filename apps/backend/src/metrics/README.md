# Prometheus Metrics Module

This module provides Prometheus metrics integration for monitoring application performance and health.

## Metrics Endpoint

Access metrics at: `GET /metrics`

## Available Metrics

### Default Metrics (provided by Prometheus)
- `aligndesigns_process_cpu_user_seconds_total` - CPU usage
- `aligndesigns_process_resident_memory_bytes` - Memory usage
- `aligndesigns_nodejs_heap_size_total_bytes` - Node.js heap size
- `aligndesigns_nodejs_heap_size_used_bytes` - Node.js heap usage
- And more Node.js process metrics...

### Custom Application Metrics

#### HTTP Request Metrics
- **`http_requests_total`** (Counter)
  - Total number of HTTP requests
  - Labels: `method`, `route`, `status_code`
  - Example: `http_requests_total{method="GET",route="/api/projects",status_code="200"}`

- **`http_request_duration_seconds`** (Histogram)
  - HTTP request duration in seconds
  - Labels: `method`, `route`
  - Buckets: 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10 seconds

#### Cache Metrics
- **`cache_operations_total`** (Counter)
  - Total number of cache operations
  - Labels: `operation` (hit, miss, set, delete), `key_prefix`
  - Example: `cache_operations_total{operation="hit",key_prefix="projects"}`

#### Database Metrics
- **`database_queries_total`** (Counter)
  - Total number of database queries
  - Labels: `model`, `operation`
  - Example: `database_queries_total{model="user",operation="findMany"}`

#### Active Users
- **`active_users`** (Gauge)
  - Current number of active users
  - No labels

## Usage in Services

The `MetricsService` is globally available and can be injected into any service:

```typescript
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MyService {
  constructor(private readonly metricsService: MetricsService) {}

  async myMethod() {
    // Record cache operations
    this.metricsService.recordCacheOperation('hit', 'users:list:page:1');

    // Record database queries
    this.metricsService.recordDatabaseQuery('user', 'findMany');

    // Record HTTP requests (typically done in middleware)
    this.metricsService.recordHttpRequest('GET', '/api/users', 200);
    this.metricsService.recordHttpDuration('GET', '/api/users', 0.125);

    // Update active users gauge
    this.metricsService.setActiveUsers(42);
  }
}
```

## Integration Points

### Automatic Cache Metrics
Cache operations are automatically tracked in `CacheManagerService`:
- Cache hits/misses are recorded on every `get()` operation
- Cache sets are recorded on every `set()` operation
- Cache deletes are recorded on every `del()` operation

### Future Enhancements
- [ ] HTTP metrics middleware (automatic request tracking)
- [ ] Prisma middleware for automatic database query tracking
- [ ] Authentication metrics (login success/failure rates)
- [ ] File upload metrics (size, duration, success rate)

## Monitoring Setup

### Local Development
```bash
# Access metrics
curl http://localhost:3000/metrics
```

### Production with Prometheus
Add this job to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'align-designs-backend'
    scrape_interval: 15s
    static_configs:
      - targets: ['backend:3000']
```

### Grafana Dashboard
Import a Node.js/Express dashboard or create custom panels:
- HTTP request rate: `rate(http_requests_total[5m])`
- HTTP error rate: `rate(http_requests_total{status_code=~"5.."}[5m])`
- Cache hit rate: `rate(cache_operations_total{operation="hit"}[5m]) / rate(cache_operations_total{operation=~"hit|miss"}[5m])`
- 95th percentile response time: `histogram_quantile(0.95, http_request_duration_seconds)`

## Performance Impact

Metrics collection has minimal performance impact:
- Counter increments: ~0.001ms per operation
- Histogram observations: ~0.005ms per operation
- Gauge updates: ~0.001ms per operation

All metrics are stored in-memory and exported on scrape.
