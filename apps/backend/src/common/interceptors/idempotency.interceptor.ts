import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';

/**
 * Decorator to mark an endpoint as requiring idempotency
 * Usage: @Idempotent() or @Idempotent({ ttlSeconds: 3600 })
 */
export const IDEMPOTENCY_KEY = 'idempotency';
export const Idempotent =
  (options?: { ttlSeconds?: number }) =>
  (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      IDEMPOTENCY_KEY,
      options ?? {},
      descriptor.value as object,
    );
    return descriptor;
  };

interface CachedResponse {
  data: unknown;
  timestamp: number;
  status: 'processing' | 'completed';
}

/**
 * IdempotencyInterceptor
 *
 * Ensures that POST/PATCH requests with the same Idempotency-Key header
 * return the same response and don't execute multiple times.
 *
 * Usage:
 * 1. Apply @UseInterceptors(IdempotencyInterceptor) to your controller or method
 * 2. Client sends Idempotency-Key header with unique value
 * 3. If same key is sent again within TTL, returns cached response
 *
 * Benefits:
 * - Prevents duplicate payments
 * - Prevents duplicate resource creation
 * - Safe retries for network failures
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private readonly cache = new Map<string, CachedResponse>();
  private readonly DEFAULT_TTL_SECONDS = 3600; // 1 hour

  constructor(private readonly reflector?: Reflector) {
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      method: string;
      path: string;
      user?: { userId?: string };
    }>();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    // If no idempotency key provided, proceed normally
    if (!idempotencyKey) {
      return next.handle();
    }

    // Build unique cache key including user ID to prevent cross-user conflicts
    const userId = request.user?.userId || 'anonymous';
    const endpoint = `${request.method}:${request.path}`;
    const cacheKey = `idempotency:${userId}:${endpoint}:${idempotencyKey}`;

    // Check if we have a cached response
    const cached = this.cache.get(cacheKey);

    if (cached) {
      // If still processing, reject to prevent race conditions
      if (cached.status === 'processing') {
        this.logger.warn(
          `Duplicate request detected while processing: ${cacheKey}`,
        );
        throw new ConflictException(
          'Request is currently being processed. Please wait and retry.',
        );
      }

      // Return cached response
      this.logger.debug(`Returning cached response for: ${cacheKey}`);
      return of(cached.data);
    }

    // Mark as processing to prevent concurrent duplicate requests
    this.cache.set(cacheKey, {
      data: null,
      timestamp: Date.now(),
      status: 'processing',
    });

    // Get TTL from decorator options or use default
    const options =
      this.reflector?.get(IDEMPOTENCY_KEY, context.getHandler()) ?? {};
    const ttlSeconds = options.ttlSeconds ?? this.DEFAULT_TTL_SECONDS;

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Cache the successful response
          this.cache.set(cacheKey, {
            data: response,
            timestamp: Date.now(),
            status: 'completed',
          });

          this.logger.debug(
            `Cached response for: ${cacheKey} (TTL: ${ttlSeconds}s)`,
          );

          // Schedule cleanup after TTL
          setTimeout(() => {
            this.cache.delete(cacheKey);
            this.logger.debug(`Expired idempotency key: ${cacheKey}`);
          }, ttlSeconds * 1000);
        },
        error: () => {
          // Remove from cache on error to allow retry
          this.cache.delete(cacheKey);
        },
      }),
    );
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const maxAge = this.DEFAULT_TTL_SECONDS * 1000;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }
}
