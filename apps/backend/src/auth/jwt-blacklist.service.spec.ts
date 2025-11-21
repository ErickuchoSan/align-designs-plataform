import { Test, TestingModule } from '@nestjs/testing';
import { JwtBlacklistService } from './jwt-blacklist.service';

describe('JwtBlacklistService', () => {
  let service: JwtBlacklistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtBlacklistService],
    }).compile();

    service = module.get<JwtBlacklistService>(JwtBlacklistService);
  });

  afterEach(() => {
    // Clean up after each test
    service.clearAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToBlacklist', () => {
    it('should add token to blacklist', () => {
      const token = 'test-token';
      service.addToBlacklist(token, 5000);

      expect(service.isBlacklisted(token)).toBe(true);
    });

    it('should track blacklist size correctly', () => {
      expect(service.getBlacklistSize()).toBe(0);

      service.addToBlacklist('token1', 5000);
      expect(service.getBlacklistSize()).toBe(1);

      service.addToBlacklist('token2', 5000);
      expect(service.getBlacklistSize()).toBe(2);
    });
  });

  describe('isBlacklisted', () => {
    it('should return false for non-blacklisted token', () => {
      expect(service.isBlacklisted('non-existent-token')).toBe(false);
    });

    it('should return true for blacklisted token', () => {
      const token = 'blacklisted-token';
      service.addToBlacklist(token, 5000);

      expect(service.isBlacklisted(token)).toBe(true);
    });
  });

  describe('automatic removal', () => {
    it('should automatically remove token after expiration', (done) => {
      const token = 'expiring-token';
      const expirationMs = 100; // 100ms

      service.addToBlacklist(token, expirationMs);
      expect(service.isBlacklisted(token)).toBe(true);

      // Wait for token to expire
      setTimeout(() => {
        expect(service.isBlacklisted(token)).toBe(false);
        expect(service.getBlacklistSize()).toBe(0);
        done();
      }, expirationMs + 50);
    }, 200);
  });

  describe('clearAll', () => {
    it('should clear all blacklisted tokens', () => {
      service.addToBlacklist('token1', 5000);
      service.addToBlacklist('token2', 5000);
      service.addToBlacklist('token3', 5000);

      expect(service.getBlacklistSize()).toBe(3);

      service.clearAll();

      expect(service.getBlacklistSize()).toBe(0);
      expect(service.isBlacklisted('token1')).toBe(false);
      expect(service.isBlacklisted('token2')).toBe(false);
      expect(service.isBlacklisted('token3')).toBe(false);
    });

    it('should clear expiration timers when clearing all', () => {
      service.addToBlacklist('token1', 10000);
      service.addToBlacklist('token2', 10000);

      service.clearAll();

      // Verify no memory leaks from timers
      expect(service.getBlacklistSize()).toBe(0);
    });
  });

  describe('multiple tokens', () => {
    it('should handle multiple different tokens', () => {
      const tokens = ['token1', 'token2', 'token3', 'token4', 'token5'];

      tokens.forEach(token => {
        service.addToBlacklist(token, 5000);
      });

      expect(service.getBlacklistSize()).toBe(5);

      tokens.forEach(token => {
        expect(service.isBlacklisted(token)).toBe(true);
      });
    });

    it('should not affect other tokens when one expires', (done) => {
      service.addToBlacklist('short-lived', 100);
      service.addToBlacklist('long-lived', 5000);

      setTimeout(() => {
        expect(service.isBlacklisted('short-lived')).toBe(false);
        expect(service.isBlacklisted('long-lived')).toBe(true);
        expect(service.getBlacklistSize()).toBe(1);
        done();
      }, 150);
    }, 200);
  });
});
