import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { COOKIE_MAX_AGE_ONE_DAY } from '../constants/time.constants';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CSRF');
  private readonly csrfTokenCookie = 'csrf-token';
  private readonly csrfHeaderName = 'x-csrf-token';

  constructor(private readonly configService: ConfigService) {}

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
    // Use exact match or proper prefix check to prevent bypass
    if (this.isPublicPath(req.path)) {
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

  /**
   * Check if a path is public (doesn't require CSRF protection)
   * Uses exact match to prevent bypass attacks
   */
  private isPublicPath(requestPath: string): boolean {
    // Remove version prefix and query params for comparison
    const normalizedPath = requestPath.split('?')[0];

    return this.publicPaths.some((publicPath) => {
      // Exact match
      if (normalizedPath === publicPath) {
        return true;
      }

      // For paths that should match with sub-paths (like /auth/otp/*)
      // Only allow if followed by / or end of string
      if (publicPath.endsWith('/')) {
        return normalizedPath.startsWith(publicPath);
      }

      // Check if it's a valid sub-path (must be followed by /)
      return (
        normalizedPath.startsWith(publicPath + '/') ||
        normalizedPath === publicPath
      );
    });
  }

  private generateAndSetToken(_req: Request, res: Response): void {
    const secret = crypto.randomBytes(32).toString('hex');
    const token = this.generateToken(secret);

    // Get sameSite setting from config (default: 'strict')
    const sameSite = this.configService.get<string>('CSRF_SAME_SITE', 'strict');
    const validSameSite = ['strict', 'lax', 'none'].includes(sameSite)
      ? (sameSite as 'strict' | 'lax' | 'none')
      : 'strict';

    res.cookie(this.csrfTokenCookie, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: validSameSite,
      maxAge: COOKIE_MAX_AGE_ONE_DAY,
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
