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
    const requestId = req.requestId || req.headers['x-request-id'] || 'unknown';

    // Log when response finishes
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;

      // Log level based on status code
      const logLevel = this.getLogLevel(statusCode);

      // Format log message with request ID
      const message = `[${requestId}] ${method} ${originalUrl} ${statusCode} ${responseTime}ms - ${userAgent} - ${ip}`;

      // Log with appropriate level
      if (logLevel === 'error') {
        this.logger.error(message);
      } else if (logLevel === 'warn') {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }

      // Log additional details for errors
      if (statusCode >= 400) {
        this.logger.warn({
          requestId,
          method,
          url: originalUrl,
          statusCode,
          responseTime,
          userAgent,
          ip,
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
