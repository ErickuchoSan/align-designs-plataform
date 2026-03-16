import { Injectable, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

/**
 * Custom Throttler Guard that uses IP address as the key for rate limiting
 * instead of the default user-based throttling.
 *
 * This prevents brute force attacks from multiple accounts using the same IP,
 * and also prevents distributed attacks from being as effective.
 *
 * Security: Only trusts X-Forwarded-For when behind a verified trusted proxy.
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  private readonly trustedProxies: string[];
  private readonly trustProxy: boolean;

  constructor(
    @Inject('THROTTLER_OPTIONS')
    protected readonly options: ThrottlerModuleOptions,
    @Inject('THROTTLER_STORAGE')
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
    this.trustProxy = this.configService.get<string>('TRUST_PROXY') === 'true';
    const proxies = this.configService.get<string>('TRUSTED_PROXIES', '');
    this.trustedProxies = proxies
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);
  }

  /**
   * Override the default getTracker method to use IP address
   * instead of user identifier
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: Request): Promise<string> {
    // Only trust X-Forwarded-For if we're behind a trusted proxy
    if (this.trustProxy && this.isTrustedProxy(req)) {
      const forwardedFor = req.headers['x-forwarded-for'];

      if (forwardedFor) {
        // X-Forwarded-For can contain multiple IPs, get the leftmost (original client IP)
        const ips = Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : forwardedFor;
        const clientIp = ips.split(',')[0].trim();

        // Validate IP format to prevent injection
        if (this.isValidIp(clientIp)) {
          return clientIp;
        }
      }
    }

    // Fallback to direct connection IP (most secure)
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Check if the request is coming from a trusted proxy
   */
  private isTrustedProxy(req: Request): boolean {
    const remoteAddress = req.socket.remoteAddress;

    if (!remoteAddress) {
      return false;
    }

    // If no trusted proxies configured, don't trust any
    if (this.trustedProxies.length === 0) {
      return false;
    }

    // Check if remote address is in trusted proxies list
    return this.trustedProxies.includes(remoteAddress);
  }

  /**
   * Validate IP address format (basic validation)
   */
  private isValidIp(ip: string): boolean {
    return this.isValidIpv4(ip) || this.isValidIpv6(ip);
  }

  /**
   * Validate IPv4 address using programmatic approach (avoids complex regex)
   */
  private isValidIpv4(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    return parts.every((part) => {
      // Must be numeric and not have leading zeros (except "0" itself)
      if (!/^\d+$/.test(part)) return false;
      if (part.length > 1 && part.startsWith('0')) return false;

      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  /**
   * Validate IPv6 address (simplified check)
   */
  private isValidIpv6(ip: string): boolean {
    const ipv6Regex = /^[0-9a-fA-F:]+$/;
    if (!ipv6Regex.test(ip)) return false;

    const parts = ip.split(':');
    return (
      parts.length === 8 &&
      parts.every((part) => part.length >= 1 && part.length <= 4)
    );
  }
}
