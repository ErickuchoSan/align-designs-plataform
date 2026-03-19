import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { User } from '@/types';

// Mock localStorage before importing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Import after mocking
import { AuthStorage } from '../auth-storage';

// Test user data
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'CLIENT',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('AuthStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveAuthData', () => {
    it('should save user data to storage', () => {
      const result = AuthStorage.saveAuthData('token-ignored', mockUser);

      expect(result.success).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockUser)
      );
    });

    it('should NOT save access token (security)', () => {
      AuthStorage.saveAuthData('sensitive-token', mockUser);

      // Token should never be stored
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'accessToken',
        expect.anything()
      );
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'token',
        expect.anything()
      );
    });
  });

  describe('loadAuthData', () => {
    it('should load user data from storage', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      const result = AuthStorage.loadAuthData();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user data exists', () => {
      const result = AuthStorage.loadAuthData();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from storage', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      const result = AuthStorage.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user exists', () => {
      const result = AuthStorage.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    it('should remove user data from storage', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      AuthStorage.clearAuthData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('hasUserData', () => {
    it('should return true when user data exists', () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));

      const result = AuthStorage.hasUserData();

      expect(result).toBe(true);
    });

    it('should return false when no user data exists', () => {
      const result = AuthStorage.hasUserData();

      expect(result).toBe(false);
    });
  });

  describe('user data integrity', () => {
    it('should preserve all user fields', () => {
      const fullUser: User = {
        id: 'user-456',
        email: 'full@example.com',
        firstName: 'Full',
        lastName: 'User',
        role: 'ADMIN',
        phone: '+1234567890',
        profilePictureKey: 'profile/123.jpg',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
      };

      AuthStorage.saveAuthData('token', fullUser);
      localStorageMock.setItem('user', JSON.stringify(fullUser));

      const loaded = AuthStorage.loadAuthData();

      expect(loaded).toEqual(fullUser);
    });
  });

  describe('different user roles', () => {
    const roles = ['ADMIN', 'EMPLOYEE', 'CLIENT'] as const;

    roles.forEach((role) => {
      it(`should handle ${role} role`, () => {
        const user: User = { ...mockUser, role };

        AuthStorage.saveAuthData('token', user);
        localStorageMock.setItem('user', JSON.stringify(user));

        const loaded = AuthStorage.loadAuthData();

        expect(loaded?.role).toBe(role);
      });
    });
  });
});
