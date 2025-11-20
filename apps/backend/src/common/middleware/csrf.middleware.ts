import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CSRF');
  private readonly csrfTokenCookie = 'csrf-token';
  private readonly csrfHeaderName = 'x-csrf-token';

  // Public endpoints that don't require CSRF protection
  private readonly publicPaths = [
    '/health',
    '/api/docs',
    '/auth/csrf-token',
    '/auth/login',
    '/auth/logout',
    '/auth/register',
    '/auth/check-email',
    '/auth/request-password-reset',
    '/auth/otp',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF validation for public endpoints
    if (this.publicPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Skip CSRF validation for safe HTTP methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      this.generateAndSetToken(req, res);
      return next();
    }

    // Generate token if it doesn't exist
    if (!req.cookies[this.csrfTokenCookie]) {
      this.generateAndSetToken(req, res);
    }

    // Validate CSRF token for state-changing operations
    const token = req.cookies[this.csrfTokenCookie];
    const submittedToken = req.headers[this.csrfHeaderName] || req.body._csrf;

    if (!submittedToken) {
      this.logger.warn(`CSRF token missing for ${req.method} ${req.path}`);
      throw new UnauthorizedException('CSRF token missing');
    }

    if (!this.validateToken(token, submittedToken)) {
      this.logger.warn(`Invalid CSRF token for ${req.method} ${req.path}`);
      throw new UnauthorizedException('Invalid CSRF token');
    }

    next();
  }

  private generateAndSetToken(_req: Request, res: Response): void {
    const secret = crypto.randomBytes(32).toString('hex');
    const token = this.generateToken(secret);

    res.cookie(this.csrfTokenCookie, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Store the token in response locals and header for frontend access
    res.locals.csrfToken = token;
    res.setHeader('X-CSRF-Token', token);
  }

  private generateToken(secret: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', secret).update(salt).digest('hex');
    return `${salt}-${hash}`;
  }

  private validateToken(secret: string, token: string): boolean {
    try {
      const [salt, hash] = token.split('-');
      if (!salt || !hash) return false;

      const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(salt)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(expectedHash),
      );
    } catch {
      return false;
    }
  }
}
