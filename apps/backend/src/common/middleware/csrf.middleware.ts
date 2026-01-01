import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { COOKIE_MAX_AGE_ONE_DAY } from '../constants/time.constants';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CSRF');
  private readonly csrfTokenCookie = 'csrf-token';
  private readonly csrfHeaderName = 'x-csrf-token';

  constructor(private readonly configService: ConfigService) { }

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
    '/api/v1/auth/otp/request',  // Specific OTP endpoints
    '/api/v1/auth/otp/verify',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // DEBUG: Log all incoming CSRF-related data
    const debugInfo = {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      cookieHeader: req.headers.cookie ? 'present' : 'missing',
      csrfCookie: req.cookies[this.csrfTokenCookie] ? `${req.cookies[this.csrfTokenCookie].substring(0, 20)}...` : 'missing',
      csrfHeader: req.headers[this.csrfHeaderName] ? `${String(req.headers[this.csrfHeaderName]).substring(0, 30)}...` : 'missing',
      xForwardedProto: req.headers['x-forwarded-proto'] || 'not set',
      host: req.headers.host,
      origin: req.headers.origin || 'not set',
    };
    this.logger.debug(`CSRF Debug: ${JSON.stringify(debugInfo)}`);

    // Special case: /auth/csrf-token should generate token but not validate
    if (req.originalUrl.includes('/auth/csrf-token')) {
      this.generateAndSetToken(req, res);
      return next();
    }

    // Skip CSRF validation for public endpoints
    // Use exact match or proper prefix check to prevent bypass
    // Use originalUrl to ensure we check the full path including global prefix
    const isPublic = this.isPublicPath(req.originalUrl);

    if (isPublic) {
      return next();
    }

    // Skip CSRF validation for safe HTTP methods
    // Only generate new token if one doesn't exist
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (!req.cookies[this.csrfTokenCookie]) {
        // No cookie exists, generate new token
        this.generateAndSetToken(req, res);
      } else {
        // Cookie exists, reuse it and set the token header
        const existingSecret = req.cookies[this.csrfTokenCookie];
        const token = this.generateToken(existingSecret);
        res.setHeader('X-CSRF-Token', token);
      }
      return next();
    }

    // Generate token if it doesn't exist
    if (!req.cookies[this.csrfTokenCookie]) {
      this.logger.warn(`CSRF cookie missing, generating new token for ${req.method} ${req.path}`);
      this.generateAndSetToken(req, res);
    }

    const token = req.cookies[this.csrfTokenCookie];
    const submittedToken = req.headers[this.csrfHeaderName] || req.body._csrf;

    // DEBUG: Log token comparison details
    this.logger.debug(`CSRF Validation: cookie=${token ? 'present' : 'missing'}, header=${submittedToken ? 'present' : 'missing'}`);

    if (!submittedToken) {
      this.logger.warn(`CSRF token missing for ${req.method} ${req.path}`);
      throw new UnauthorizedException('CSRF token missing');
    }

    if (!this.validateToken(token, submittedToken)) {
      this.logger.warn(`Invalid CSRF token for ${req.method} ${req.path}`);
      this.logger.debug(`Token mismatch - Cookie secret: ${token ? token.substring(0, 10) + '...' : 'none'}, Header token: ${String(submittedToken).substring(0, 30)}...`);
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

  private generateAndSetToken(req: Request, res: Response): void {
    const secret = crypto.randomBytes(32).toString('hex');
    const token = this.generateToken(secret);

    // Get sameSite setting from config (default: 'lax' for better compatibility)
    const allowNgrok = process.env.ALLOW_NGROK === 'true';
    const sameSite = this.configService.get<string>('CSRF_SAME_SITE', allowNgrok ? 'none' : 'lax');
    const validSameSite = ['strict', 'lax', 'none'].includes(sameSite)
      ? (sameSite as 'strict' | 'lax' | 'none')
      : 'lax';

    // Determine if request is actually over HTTPS
    // Priority: Origin header > Referer header > Host check for ngrok > req.secure
    // Note: X-Forwarded-Proto is unreliable when ngrok routes through nginx
    const origin = req.headers.origin as string | undefined;
    const referer = req.headers.referer as string | undefined;
    const host = req.headers.host as string | undefined;

    // Use origin/referer to determine protocol - this is the most reliable source
    // because it reflects what the browser actually used
    let isHttps = false;
    if (origin) {
      isHttps = origin.startsWith('https://');
    } else if (referer) {
      isHttps = referer.startsWith('https://');
    } else if (host) {
      // ngrok domains always use HTTPS, local domains use HTTP
      isHttps = host.includes('.ngrok') || host.includes('.ngrok-free.dev');
    } else {
      isHttps = req.secure;
    }

    // Only set Secure flag if actually using HTTPS
    // This allows HTTP (nginx local) and HTTPS (ngrok) to coexist
    const isProduction = process.env.NODE_ENV === 'production';
    const useSecureCookie = isHttps || isProduction;

    // DEBUG: Log cookie settings
    this.logger.debug(`CSRF Cookie Settings: secure=${useSecureCookie}, sameSite=${validSameSite}, isHttps=${isHttps}, origin=${origin || 'not set'}, host=${host || 'not set'}`);

    res.cookie(this.csrfTokenCookie, secret, {
      httpOnly: true,
      secure: useSecureCookie,
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
