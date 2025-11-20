import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log all incoming HTTP requests
 * Logs request method, URL, status code, response time, and user agent
 * Excludes sensitive headers like Authorization
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Log when response finishes
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // Log level based on status code
      const logLevel = this.getLogLevel(statusCode);

      // Format log message
      const message = `${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${userAgent} - ${ip}`;

      // Log with appropriate level
      this.logger[logLevel](message);

      // Log additional details for errors
      if (statusCode >= 400) {
        this.logger.warn({
          method,
          url: originalUrl,
          statusCode,
          responseTime,
          userAgent,
          ip,
          requestId: req.headers['x-request-id'],
        });
      }
    });

    next();
  }

  private getLogLevel(statusCode: number): string {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'log';
  }
}
