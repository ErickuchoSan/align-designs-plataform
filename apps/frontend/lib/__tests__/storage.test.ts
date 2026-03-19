import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock localStorage before importing storage
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
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Import after mocking
import { storage } from '../storage';

describe('SafeStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getItem', () => {
    it('should return item from localStorage', () => {
      localStorageMock.setItem('test-key', 'test-value');

      const result = storage.getItem('test-key');

      expect(result).toBe('test-value');
    });

    it('should return null for non-existent key', () => {
      const result = storage.getItem('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should set item in localStorage', () => {
      const result = storage.setItem('test-key', 'test-value');

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should reject items exceeding max size', () => {
      // Create a string larger than 5MB
      const largeValue = 'x'.repeat(6 * 1024 * 1024);

      const result = storage.setItem('large-key', largeValue);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });
  });

  describe('removeItem', () => {
    it('should remove item from localStorage', () => {
      localStorageMock.setItem('test-key', 'test-value');

      storage.removeItem('test-key');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('clear', () => {
    it('should clear all items from localStorage', () => {
      localStorageMock.setItem('key1', 'value1');
      localStorageMock.setItem('key2', 'value2');

      storage.clear();

      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('getJSON', () => {
    it('should parse and return JSON data', () => {
      const testData = { name: 'Test', value: 123 };
      localStorageMock.setItem('json-key', JSON.stringify(testData));

      const result = storage.getJSON<typeof testData>('json-key');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
    });

    it('should return undefined for non-existent key', () => {
      const result = storage.getJSON('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should handle arrays', () => {
      const testArray = [1, 2, 3, 'test'];
      localStorageMock.setItem('array-key', JSON.stringify(testArray));

      const result = storage.getJSON<typeof testArray>('array-key');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testArray);
    });

    it('should handle nested objects', () => {
      const nestedData = {
        user: {
          name: 'Test',
          profile: {
            email: 'test@example.com',
          },
        },
      };
      localStorageMock.setItem('nested-key', JSON.stringify(nestedData));

      const result = storage.getJSON<typeof nestedData>('nested-key');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(nestedData);
    });
  });

  describe('setJSON', () => {
    it('should stringify and store JSON data', () => {
      const testData = { name: 'Test', value: 123 };

      const result = storage.setJSON('json-key', testData);

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'json-key',
        JSON.stringify(testData)
      );
    });

    it('should handle arrays', () => {
      const testArray = [1, 2, 3];

      const result = storage.setJSON('array-key', testArray);

      expect(result.success).toBe(true);
    });

    it('should handle null values', () => {
      const result = storage.setJSON('null-key', null);

      expect(result.success).toBe(true);
    });
  });

  describe('available property', () => {
    it('should return true when localStorage is available', () => {
      expect(storage.available).toBe(true);
    });
  });

  describe('usingFallback property', () => {
    it('should return false when localStorage is available', () => {
      expect(storage.usingFallback).toBe(false);
    });
  });
});
