import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDependenciesService } from './auth-dependencies.service';
import { OtpService } from '../../otp/otp.service';
import { EmailService } from '../../email/email.service';
import { JwtBlacklistService } from '../jwt-blacklist.service';
import { AccountLockoutService } from './account-lockout.service';
import { PasswordService } from './password.service';

describe('AuthDependenciesService', () => {
  let service: AuthDependenciesService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRATION: '2h',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockOtpService = {
    createOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockEmailService = {
    sendOtpEmail: jest.fn(),
  };

  const mockJwtBlacklistService = {
    blacklistToken: jest.fn(),
    isBlacklisted: jest.fn(),
  };

  const mockAccountLockoutService = {
    validateAccountNotLocked: jest.fn(),
    handleFailedLogin: jest.fn(),
    resetFailedAttempts: jest.fn(),
  };

  const mockPasswordService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    validatePasswordFormat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthDependenciesService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtBlacklistService, useValue: mockJwtBlacklistService },
        { provide: AccountLockoutService, useValue: mockAccountLockoutService },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<AuthDependenciesService>(AuthDependenciesService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate JWT token using jwt service', async () => {
      const payload = { sub: 'user-123', email: 'test@test.com' };
      const mockToken = 'jwt-token-123';
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.generateAccessToken(payload);

      expect(result).toBe(mockToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload);
    });
  });

  describe('getJwtSecret', () => {
    it('should return JWT secret from config', () => {
      const result = service.getJwtSecret();

      expect(result).toBe('test-secret');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should return empty string if JWT secret is not configured', () => {
      mockConfigService.get.mockReturnValueOnce(undefined);

      const result = service.getJwtSecret();

      expect(result).toBe('');
    });
  });

  describe('getJwtExpiration', () => {
    it('should return JWT expiration from config', () => {
      const result = service.getJwtExpiration();

      expect(result).toBe('2h');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_EXPIRATION');
    });

    it('should return default 1d if not configured', () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue?: string) => {
          if (key === 'JWT_EXPIRATION') return defaultValue;
          return 'test-secret';
        },
      );

      const result = service.getJwtExpiration();

      expect(result).toBe('1d');
    });
  });

  describe('facade properties', () => {
    it('should expose jwt service', () => {
      expect(service.jwt).toBeDefined();
    });

    it('should expose config service', () => {
      expect(service.config).toBeDefined();
    });

    it('should expose otp service', () => {
      expect(service.otp).toBeDefined();
    });

    it('should expose email service', () => {
      expect(service.email).toBeDefined();
    });

    it('should expose jwtBlacklist service', () => {
      expect(service.jwtBlacklist).toBeDefined();
    });

    it('should expose accountLockout service', () => {
      expect(service.accountLockout).toBeDefined();
    });

    it('should expose password service', () => {
      expect(service.password).toBeDefined();
    });
  });
});
