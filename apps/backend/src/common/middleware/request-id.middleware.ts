import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import type { AppClsStore } from '../types/cls.types';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly cls: ClsService<AppClsStore>) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate or use existing request ID from headers
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Attach request ID to request object
    req.requestId = requestId;

    // Add request ID to response headers for client-side tracking
    res.setHeader('X-Request-Id', requestId);

    // Log incoming request with request ID
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Store IP and UserAgent in CLS for access anywhere
    this.cls.set('ipAddress', ip || 'unknown');
    this.cls.set('userAgent', userAgent);

    this.logger.log(
      `[${requestId}] ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    // Log response when finished
    const startTime = Date.now();
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      const logLevel = statusCode >= 400 ? 'error' : 'log';

      this.logger[logLevel](
        `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms`,
      );
    });

    next();
  }
}
