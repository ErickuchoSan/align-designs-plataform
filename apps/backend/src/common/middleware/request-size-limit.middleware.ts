import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';

/**
 * Middleware to enforce route-specific request size limits
 *
 * This allows different routes to have different payload size limits
 * for defense-in-depth against DoS attacks
 */
@Injectable()
export class RequestSizeLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSizeLimitMiddleware.name);

  // Route-specific size limits (in bytes)
  // Paths are matched using startsWith for prefix matching
  private readonly routeLimits: Map<string, number> = new Map([
    // Auth endpoints - Small payloads (100KB)
    ['/api/v1/auth/login', 100 * 1024],
    ['/api/v1/auth/otp/', 100 * 1024],
    ['/api/v1/auth/check-email', 100 * 1024],
    ['/api/v1/auth/forgot-password', 100 * 1024],
    ['/api/v1/auth/reset-password', 100 * 1024],
    ['/api/v1/auth/set-password', 100 * 1024],
    ['/api/v1/auth/change-password', 100 * 1024],

    // User management - Small to medium payloads (200KB)
    ['/api/v1/users', 200 * 1024],

    // Project management - Medium payloads (300KB for descriptions)
    ['/api/v1/projects', 300 * 1024],

    // Health check - Tiny payloads (10KB)
    ['/api/v1/health', 10 * 1024],
  ]);

  use(req: Request, res: Response, next: NextFunction) {
    const requestPath = req.path;

    // Find the most specific matching route limit
    let limit: number | undefined;
    let matchedRoute: string | undefined;

    for (const [route, routeLimit] of this.routeLimits.entries()) {
      if (requestPath.startsWith(route)) {
        // Use the longest matching prefix (most specific route)
        if (!matchedRoute || route.length > matchedRoute.length) {
          limit = routeLimit;
          matchedRoute = route;
        }
      }
    }

    // If a specific limit is found, apply it
    if (limit !== undefined) {
      // Create route-specific body parsers
      const jsonParser = express.json({
        limit,
        // Only apply to JSON content
        type: 'application/json',
      });

      const urlencodedParser = express.urlencoded({
        extended: true,
        limit,
        // Only apply to URL-encoded content
        type: 'application/x-www-form-urlencoded',
      });

      // Apply the parsers
      jsonParser(req, res, (err) => {
        if (err) {
          this.logger.warn(
            `Request size limit exceeded for ${requestPath} (limit: ${this.formatBytes(limit)})`,
          );
          return next(err);
        }

        urlencodedParser(req, res, (err) => {
          if (err) {
            this.logger.warn(
              `Request size limit exceeded for ${requestPath} (limit: ${this.formatBytes(limit)})`,
            );
            return next(err);
          }
          next();
        });
      });
    } else {
      // No specific limit found, continue to next middleware
      // The global limit from main.ts will apply
      next();
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
}
