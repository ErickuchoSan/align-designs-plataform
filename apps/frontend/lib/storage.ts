/**
 * Safe localStorage wrapper with error handling
 * Handles quota exceeded, private browsing mode, and parse errors
 */

import { logger } from './logger';

interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class SafeStorage {
  private isAvailable: boolean;
  private fallbackStorage: Map<string, string>;
  private readonly MAX_ITEM_SIZE = 5 * 1024 * 1024; // 5MB per item (localStorage total is ~5-10MB)

  constructor() {
    this.fallbackStorage = new Map();
    this.isAvailable = this.checkAvailability();
  }

  /**
   * Check if localStorage is available
   * Returns false in private browsing mode or if disabled
   */
  private checkAvailability(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      logger.warn(
        'localStorage is not available. Using in-memory fallback. Data will not persist across sessions.'
      );
      return false;
    }
  }

  /**
   * Get item from storage
   */
  getItem(key: string): string | null {
    try {
      if (this.isAvailable) {
        return localStorage.getItem(key);
      } else {
        return this.fallbackStorage.get(key) ?? null;
      }
    } catch (error) {
      logger.error(`Error reading from storage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  setItem(key: string, value: string): StorageResult<void> {
    try {
      // Check size limit
      const sizeInBytes = new Blob([value]).size;
      if (sizeInBytes > this.MAX_ITEM_SIZE) {
        const errorMsg = `Item size (${(sizeInBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${this.MAX_ITEM_SIZE / 1024 / 1024}MB)`;
        logger.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (this.isAvailable) {
        localStorage.setItem(key, value);
      } else {
        this.fallbackStorage.set(key, value);
      }

      return { success: true };
    } catch (error) {
      // Handle QuotaExceededError
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        const errorMsg = 'Storage quota exceeded. Please clear some data.';
        logger.error(errorMsg, error);
        return { success: false, error: errorMsg };
      }

      const errorMsg = `Error writing to storage (key: ${key})`;
      logger.error(errorMsg, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    try {
      if (this.isAvailable) {
        localStorage.removeItem(key);
      } else {
        this.fallbackStorage.delete(key);
      }
    } catch (error) {
      logger.error(`Error removing from storage (key: ${key}):`, error);
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    try {
      if (this.isAvailable) {
        localStorage.clear();
      } else {
        this.fallbackStorage.clear();
      }
    } catch (error) {
      logger.error('Error clearing storage:', error);
    }
  }

  /**
   * Get JSON item from storage with safe parsing
   */
  getJSON<T>(key: string): StorageResult<T> {
    try {
      const item = this.getItem(key);
      if (item === null) {
        return { success: true, data: undefined };
      }

      const parsed = JSON.parse(item) as T;
      return { success: true, data: parsed };
    } catch (error) {
      const errorMsg = `Error parsing JSON from storage (key: ${key})`;
      logger.error(errorMsg, error);
      // Remove corrupted data
      this.removeItem(key);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Set JSON item in storage with safe stringification
   */
  setJSON<T>(key: string, value: T): StorageResult<void> {
    try {
      const stringified = JSON.stringify(value);
      return this.setItem(key, stringified);
    } catch (error) {
      const errorMsg = `Error stringifying JSON for storage (key: ${key})`;
      logger.error(errorMsg, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Check if storage is available (not in private mode)
   */
  get available(): boolean {
    return this.isAvailable;
  }

  /**
   * Check if using fallback storage
   */
  get usingFallback(): boolean {
    return !this.isAvailable;
  }
}

// Export singleton instance
export const storage = new SafeStorage();
