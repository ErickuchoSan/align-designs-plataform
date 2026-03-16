import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'node:crypto';
import { COOKIE_MAX_AGE_ONE_DAY } from '../constants/time.constants';
import { getCookieSecurityConfig } from '../utils/request.utils';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CSRF');
  private readonly csrfTokenCookie = 'csrf-token';
  private readonly csrfHeaderName = 'x-csrf-token';

  constructor(private readonly configService: ConfigService) {}

  // Public endpoints that don't require CSRF protection
  // Security: Use exact paths instead of prefixes to prevent bypass
  private readonly publicPaths = [
    '/health',
    '/api/docs',
    '/api/v1/auth/csrf-token',
    '/api/v1/auth/login',
    '/api/v1/auth/logout',
    '/api/v1/auth/register',
    '/api/v1/auth/check-email',
    '/api/v1/auth/request-password-reset',
    '/api/v1/auth/otp/request', // Specific OTP endpoints
    '/api/v1/auth/otp/verify',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    this.logDebugInfo(req);

    // Special case: /auth/csrf-token should generate token but not validate
    if (req.originalUrl.includes('/auth/csrf-token')) {
      this.generateAndSetToken(req, res);
      return next();
    }

    // Skip CSRF validation for public endpoints
    if (this.isPublicPath(req.originalUrl)) {
      return next();
    }

    // Skip CSRF validation for safe HTTP methods
    if (this.isSafeMethod(req.method)) {
      this.handleSafeMethod(req, res);
      return next();
    }

    // Validate CSRF for state-changing methods
    this.validateCsrfRequest(req, res);
    next();
  }

  private logDebugInfo(req: Request): void {
    const debugInfo = {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      cookieHeader: req.headers.cookie ? 'present' : 'missing',
      csrfCookie: req.cookies[this.csrfTokenCookie]
        ? `${req.cookies[this.csrfTokenCookie].substring(0, 20)}...`
        : 'missing',
      csrfHeader: req.headers[this.csrfHeaderName]
        ? `${String(req.headers[this.csrfHeaderName]).substring(0, 30)}...`
        : 'missing',
      xForwardedProto: req.headers['x-forwarded-proto'] || 'not set',
      host: req.headers.host,
      origin: req.headers.origin || 'not set',
    };
    this.logger.debug(`CSRF Debug: ${JSON.stringify(debugInfo)}`);
  }

  private isSafeMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS'].includes(method);
  }

  private handleSafeMethod(req: Request, res: Response): void {
    if (!req.cookies[this.csrfTokenCookie]) {
      this.generateAndSetToken(req, res);
    } else {
      const existingSecret = req.cookies[this.csrfTokenCookie];
      const token = this.generateToken(existingSecret);
      res.setHeader('X-CSRF-Token', token);
    }
  }

  private validateCsrfRequest(req: Request, res: Response): void {
    if (!req.cookies[this.csrfTokenCookie]) {
      this.logger.warn(
        `CSRF cookie missing, generating new token for ${req.method} ${req.path}`,
      );
      this.generateAndSetToken(req, res);
    }

    const token = req.cookies[this.csrfTokenCookie];
    const submittedToken = req.headers[this.csrfHeaderName] || req.body._csrf;

    this.logger.debug(
      `CSRF Validation: cookie=${token ? 'present' : 'missing'}, header=${submittedToken ? 'present' : 'missing'}`,
    );

    if (!submittedToken) {
      this.logger.warn(`CSRF token missing for ${req.method} ${req.path}`);
      throw new UnauthorizedException('CSRF token missing');
    }

    if (!this.validateToken(token, submittedToken)) {
      this.logger.warn(`Invalid CSRF token for ${req.method} ${req.path}`);
      this.logger.debug(
        `Token mismatch - Cookie secret: ${token ? token.substring(0, 10) + '...' : 'none'}, Header token: ${String(submittedToken).substring(0, 30)}...`,
      );
      throw new UnauthorizedException('Invalid CSRF token');
    }
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

  private generateAndSetToken(req: Request, res: Response): void {
    const secret = crypto.randomBytes(32).toString('hex');
    const token = this.generateToken(secret);

    // Get cookie security config from centralized utility
    const config = getCookieSecurityConfig(req);

    // Allow override from env for CSRF-specific sameSite setting
    const allowNgrok = process.env.ALLOW_NGROK === 'true';
    const configSameSite = this.configService.get<string>('CSRF_SAME_SITE');
    const sameSite = this.resolveSameSite(configSameSite, allowNgrok, config.sameSite);

    this.logger.debug(
      `CSRF Cookie Settings: secure=${config.useSecureCookie}, sameSite=${sameSite}, isHttps=${config.isHttps}, host=${req.headers.host || 'not set'}`,
    );

    res.cookie(this.csrfTokenCookie, secret, {
      httpOnly: true,
      secure: config.useSecureCookie,
      sameSite,
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

  private resolveSameSite(
    configSameSite: string | undefined,
    allowNgrok: boolean,
    defaultValue: 'strict' | 'lax' | 'none',
  ): 'strict' | 'lax' | 'none' {
    const validValues = ['strict', 'lax', 'none'];
    if (configSameSite && validValues.includes(configSameSite)) {
      return configSameSite as 'strict' | 'lax' | 'none';
    }
    return allowNgrok ? 'none' : defaultValue;
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
