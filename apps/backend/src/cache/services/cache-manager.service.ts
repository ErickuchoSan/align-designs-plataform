import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CACHE_KEYS } from '../constants/cache-keys';
import type { MetricsService } from '../../metrics/metrics.service';

/**
 * Centralized cache management service
 * Provides type-safe cache operations and automatic invalidation
 */
@Injectable()
export class CacheManagerService {
  private readonly logger = new Logger(CacheManagerService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Optional()
    @Inject('MetricsService')
    private metricsService?: MetricsService,
  ) {}

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      // Record cache hit or miss
      if (this.metricsService) {
        this.metricsService.recordCacheOperation(
          value !== undefined ? 'hit' : 'miss',
          key,
        );
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache key "${key}":`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cached key "${key}" with TTL ${ttl || 'default'}`);
      // Record cache set operation
      if (this.metricsService) {
        this.metricsService.recordCacheOperation('set', key);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key "${key}":`, error);
    }
  }

  /**
   * Delete specific key from cache
   * @param key Cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted cache key "${key}"`);
      // Record cache delete operation
      if (this.metricsService) {
        this.metricsService.recordCacheOperation('delete', key);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache key "${key}":`, error);
    }
  }

  /**
   * Clear all cache
   * Note: Not implemented for all cache stores
   * Use with caution!
   */
  async reset(): Promise<void> {
    this.logger.warn(
      'Cache reset requested - not implemented for current store',
    );
    // If using Redis directly, you can implement this with FLUSHDB command
  }

  /**
   * Invalidate all project-related caches
   * Call this when a project is created, updated, or deleted
   */
  async invalidateProjectCaches(projectId?: string): Promise<void> {
    // If projectId provided, delete specific project caches
    if (projectId) {
      await this.del(CACHE_KEYS.PROJECTS.DETAIL(projectId));
      await this.del(CACHE_KEYS.PROJECTS.FILES(projectId));
    }

    // Always invalidate lists since they might include the affected project
    // In a real production app with Redis, you'd use pattern matching to delete all list keys
    // For now, we'll just log it
    this.logger.debug('Project caches invalidated');
  }

  /**
   * Invalidate all user-related caches
   * Call this when a user is created, updated, or deleted
   */
  async invalidateUserCaches(userId?: string): Promise<void> {
    if (userId) {
      await this.del(CACHE_KEYS.USERS.DETAIL(userId));
      await this.del(CACHE_KEYS.USERS.PROFILE(userId));
    }

    this.logger.debug('User caches invalidated');
  }

  /**
   * Invalidate all file-related caches for a project
   * Call this when files are added, updated, or deleted
   */
  async invalidateFileCaches(
    projectId: string,
    fileId?: string,
  ): Promise<void> {
    if (fileId) {
      await this.del(CACHE_KEYS.FILES.DETAIL(fileId));
    }

    // Invalidate project's file list
    await this.del(CACHE_KEYS.PROJECTS.FILES(projectId));

    // Also invalidate the project detail since it includes file count
    await this.del(CACHE_KEYS.PROJECTS.DETAIL(projectId));

    this.logger.debug(
      `File caches invalidated for project ${projectId}${fileId ? ` and file ${fileId}` : ''}`,
    );
  }
}
