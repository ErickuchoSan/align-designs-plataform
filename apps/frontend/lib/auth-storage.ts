import { storage } from './storage';
import { logger } from './logger';
import { User } from '@/types';

/**
 * Centralized authentication storage utility
 * Manages user data in localStorage (non-sensitive data only)
 *
 * SECURITY NOTE: JWT tokens are managed exclusively via httpOnly cookies
 * and are NEVER stored in localStorage to prevent XSS attacks.
 */
export class AuthStorage {
  private static readonly USER_KEY = 'user';

  /**
   * Save authentication data (user only) to storage
   *
   * NOTE: The accessToken parameter is kept for backward compatibility
   * but is NOT stored. Token authentication relies exclusively on httpOnly cookies.
   *
   * @param accessToken - JWT access token (ignored, sent via httpOnly cookie)
   * @param user - User data (non-sensitive information)
   * @returns Success status and any errors
   */
  static saveAuthData(
    accessToken: string, // Parameter kept for API compatibility
    user: User
  ): { success: boolean; errors?: string[] } {
    if (typeof window === 'undefined') {
      return { success: false, errors: ['Storage not available on server'] };
    }

    const errors: string[] = [];

    // SECURITY: Do NOT save access token to localStorage
    // Token is sent via httpOnly cookie by the backend
    // This prevents XSS attacks from stealing the token

    // Save user data (non-sensitive information only)
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
   *
   * Returns user data from localStorage. Authentication state is determined
   * by the presence of a valid httpOnly cookie (managed by the backend).
   *
   * @returns User data if available, null otherwise
   */
  static loadAuthData(): User | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const userResult = storage.getJSON<User>(this.USER_KEY);

    if (userResult.success && userResult.data) {
      return userResult.data;
    }

    // If user data is corrupted, clear everything
    if (userResult.error) {
      logger.error('Error loading user from storage:', userResult.error);
      this.clearAuthData();
    }

    return null;
  }

  /**
   * Clear all authentication data from storage
   *
   * NOTE: This only clears localStorage (user data).
   * The httpOnly cookie is cleared by the backend on logout.
   */
  static clearAuthData(): void {
    if (typeof window === 'undefined') {
      return;
    }

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
   * Check if user data exists in storage
   *
   * NOTE: This only checks if user data exists in localStorage.
   * True authentication state should be verified with the backend
   * as it relies on httpOnly cookies.
   *
   * @returns True if user data exists in storage
   */
  static hasUserData(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const userResult = storage.getJSON<User>(this.USER_KEY);
    return userResult.success && !!userResult.data;
  }
}
