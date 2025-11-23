import { Injectable, Logger } from '@nestjs/common';

/**
 * Service to manage JWT token blacklist/revocation
 *
 * ⚠️ SECURITY CONSIDERATION - IN-MEMORY STORAGE LIMITATION:
 * This implementation uses an in-memory Set which has the following limitations:
 * 1. Lost on server restart - revoked tokens become valid again
 * 2. Not shared across multiple server instances in load-balanced environments
 * 3. No persistence - cannot audit revoked tokens after server restart
 *
 * ✅ PRODUCTION RECOMMENDATION:
 * For production deployments, migrate to Redis or database-backed storage:
 * - Redis: Fast, supports TTL, shared across instances
 * - Database: Persistent, auditable, but slower than Redis
 *
 * Tokens are automatically removed from the blacklist after their expiration time
 * to prevent memory leaks.
 */
@Injectable()
export class JwtBlacklistService {
  private readonly logger = new Logger(JwtBlacklistService.name);
  private readonly blacklist = new Set<string>();
  private readonly expirationTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Add a token to the blacklist
   * @param token - The JWT token to blacklist
   * @param expiresInMs - Time in milliseconds until the token expires
   */
  addToBlacklist(token: string, expiresInMs: number): void {
    this.blacklist.add(token);
    this.logger.log(`Token added to blacklist (expires in ${expiresInMs}ms)`);

    // Schedule automatic removal after token expiration
    const timer = setTimeout(() => {
      this.removeFromBlacklist(token);
      this.logger.debug('Expired token automatically removed from blacklist');
    }, expiresInMs);

    this.expirationTimers.set(token, timer);
  }

  /**
   * Remove a token from the blacklist
   * @param token - The JWT token to remove
   */
  private removeFromBlacklist(token: string): void {
    this.blacklist.delete(token);

    // Clear the timer if it exists
    const timer = this.expirationTimers.get(token);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(token);
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if the token is blacklisted, false otherwise
   */
  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  /**
   * Get the number of blacklisted tokens
   * @returns The count of blacklisted tokens
   */
  getBlacklistSize(): number {
    return this.blacklist.size;
  }

  /**
   * Clear all blacklisted tokens (use with caution)
   * This is primarily for testing purposes
   */
  clearAll(): void {
    // Clear all timers
    this.expirationTimers.forEach(timer => clearTimeout(timer));
    this.expirationTimers.clear();

    // Clear the blacklist
    this.blacklist.clear();
    this.logger.warn('All tokens cleared from blacklist');
  }
}
