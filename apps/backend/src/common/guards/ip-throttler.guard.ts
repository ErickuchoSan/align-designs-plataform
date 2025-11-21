import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/**
 * Custom Throttler Guard that uses IP address as the key for rate limiting
 * instead of the default user-based throttling.
 *
 * This prevents brute force attacks from multiple accounts using the same IP,
 * and also prevents distributed attacks from being as effective.
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  /**
   * Override the default getTracker method to use IP address
   * instead of user identifier
   */
  protected async getTracker(req: Request): Promise<string> {
    // Check for X-Forwarded-For header (when behind proxy/load balancer)
    const forwardedFor = req.headers['x-forwarded-for'];

    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, get the first one (client IP)
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // Fallback to direct connection IP
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
