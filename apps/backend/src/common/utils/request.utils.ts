import type { Request } from 'express';

export type SameSitePolicy = 'strict' | 'lax' | 'none';

export interface CookieSecurityConfig {
  isProduction: boolean;
  isHttps: boolean;
  useSecureCookie: boolean;
  sameSite: SameSitePolicy;
}

/**
 * Detect if request is over HTTPS based on headers
 * Priority: Origin header > Referer header > Host check for ngrok > req.secure
 *
 * This is the most reliable source because it reflects what the browser actually used.
 * Note: X-Forwarded-Proto is unreliable when ngrok routes through nginx.
 */
export function detectHttpsFromRequest(req?: Request): boolean {
  if (!req) return false;

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  if (origin) {
    return origin.startsWith('https://');
  }
  if (referer) {
    return referer.startsWith('https://');
  }
  if (host) {
    // ngrok domains always use HTTPS, local domains use HTTP
    return host.includes('.ngrok') || host.includes('.ngrok-free.dev');
  }

  return req.secure ?? false;
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Resolve SameSite policy based on cookie security and environment
 */
function resolveSameSitePolicy(
  useSecureCookie: boolean,
  isProd: boolean,
): SameSitePolicy {
  if (useSecureCookie) return 'none';
  if (isProd) return 'strict';
  return 'lax';
}

/**
 * Get cookie security configuration based on request
 * Centralizes cookie security logic to follow DRY principle
 */
export function getCookieSecurityConfig(req?: Request): CookieSecurityConfig {
  const isProd = isProduction();
  const isHttps = detectHttpsFromRequest(req);
  const useSecureCookie = isHttps || isProd;

  // When secure is true (HTTPS), we can use sameSite: 'none' for cross-origin
  // When secure is false (HTTP), we must use 'lax' or 'strict'
  const sameSite = resolveSameSitePolicy(useSecureCookie, isProd);

  return {
    isProduction: isProd,
    isHttps,
    useSecureCookie,
    sameSite,
  };
}

/**
 * Build cookie options for auth cookies
 */
export function buildAuthCookieOptions(
  req?: Request,
  maxAge?: number,
): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: SameSitePolicy;
  maxAge?: number;
  path: string;
} {
  const config = getCookieSecurityConfig(req);

  return {
    httpOnly: true,
    secure: config.useSecureCookie,
    sameSite: config.sameSite,
    ...(maxAge && { maxAge }),
    path: '/',
  };
}
