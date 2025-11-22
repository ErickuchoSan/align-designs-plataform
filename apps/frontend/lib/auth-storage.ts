import { storage } from './storage';
import { logger } from './logger';
import { User } from '@/types';

/**
 * Centralized authentication storage utility
 * Eliminates code duplication for token and user management
 */
export class AuthStorage {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly USER_KEY = 'user';

  /**
   * Save authentication data (token + user) to storage
   * @param accessToken - JWT access token
   * @param user - User data
   * @returns Success status and any errors
   */
  static saveAuthData(
    accessToken: string,
    user: User
  ): { success: boolean; errors?: string[] } {
    if (typeof window === 'undefined') {
      return { success: false, errors: ['Storage not available on server'] };
    }

    const errors: string[] = [];

    // Save access token
    const tokenResult = storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (!tokenResult.success) {
      logger.error('Failed to save access token to storage', tokenResult.error);
      errors.push('Failed to save access token');
    }

    // Save user data
    const userResult = storage.setJSON(this.USER_KEY, user);
    if (!userResult.success) {
      logger.error('Failed to save user data to storage', userResult.error);
      errors.push('Failed to save user data');
    }

    // Warn if using fallback storage
    if (storage.usingFallback && errors.length === 0) {
      logger.warn(
        'Using in-memory storage. Session will not persist on page reload.'
      );
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Load authentication data from storage
   * @returns User data if available, null otherwise
   */
  static loadAuthData(): User | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const token = storage.getItem(this.ACCESS_TOKEN_KEY);
    if (!token) {
      return null;
    }

    const userResult = storage.getJSON<User>(this.USER_KEY);

    if (userResult.success && userResult.data) {
      return userResult.data;
    }

    // If user data is corrupted, clear everything
    logger.error('Error loading user from storage:', userResult.error);
    this.clearAuthData();
    return null;
  }

  /**
   * Clear all authentication data from storage
   */
  static clearAuthData(): void {
    if (typeof window === 'undefined') {
      return;
    }

    storage.removeItem(this.ACCESS_TOKEN_KEY);
    storage.removeItem(this.USER_KEY);
  }

  /**
   * Get current user from storage
   * @returns User data if available, null otherwise
   */
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const userResult = storage.getJSON<User>(this.USER_KEY);

    if (userResult.success && userResult.data) {
      return userResult.data;
    }

    return null;
  }

  /**
   * Check if user is authenticated
   * @returns True if access token exists in storage
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return !!storage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get access token from storage
   * @returns Access token if available, null otherwise
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return storage.getItem(this.ACCESS_TOKEN_KEY);
  }
}
