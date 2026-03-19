import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountLockoutService } from './account-lockout.service';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role } from '@prisma/client';

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;
  let prismaService: any;
  let configService: any;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    passwordHash: 'hashed-password',
    role: Role.CLIENT,
    isActive: true,
    emailVerified: true,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastFailedLoginAt: null,
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLockoutService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              update: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              const config: Record<string, string> = {
                MAX_LOGIN_ATTEMPTS: '5',
                ACCOUNT_LOCKOUT_DURATION: '15',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AccountLockoutService>(AccountLockoutService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAccountNotLocked', () => {
    it('should not throw if account is not locked', () => {
      expect(() => service.validateAccountNotLocked(mockUser)).not.toThrow();
    });

    it('should not throw if lockout has expired', () => {
      const expiredLockUser = {
        ...mockUser,
        accountLockedUntil: new Date(Date.now() - 1000), // 1 second ago
      };

      expect(() =>
        service.validateAccountNotLocked(expiredLockUser),
      ).not.toThrow();
    });

    it('should throw UnauthorizedException if account is locked', () => {
      const lockedUser = {
        ...mockUser,
        accountLockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      };

      expect(() => service.validateAccountNotLocked(lockedUser)).toThrow(
        UnauthorizedException,
      );
    });

    it('should include remaining minutes in error message', () => {
      const lockedUser = {
        ...mockUser,
        accountLockedUntil: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      };

      try {
        service.validateAccountNotLocked(lockedUser);
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error.message).toContain('5 minute');
      }
    });
  });

  describe('handleFailedLogin', () => {
    it('should increment failed attempts and throw with remaining attempts', async () => {
      const user = { ...mockUser, failedLoginAttempts: 1 };
      prismaService.user.update.mockResolvedValue(user);

      await expect(service.handleFailedLogin(user)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({
          failedLoginAttempts: 2,
          lastFailedLoginAt: expect.any(Date),
        }),
      });
    });

    it('should lock account after max attempts reached', async () => {
      const user = { ...mockUser, failedLoginAttempts: 4 }; // 5th attempt
      prismaService.user.update.mockResolvedValue(user);

      await expect(service.handleFailedLogin(user)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          accountLockedUntil: expect.any(Date),
        }),
      });
    });

    it('should include lockout duration in error message when locking', async () => {
      const user = { ...mockUser, failedLoginAttempts: 4 };
      prismaService.user.update.mockResolvedValue(user);

      try {
        await service.handleFailedLogin(user);
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error.message).toContain('Account locked');
        expect(error.message).toContain('15 minutes');
      }
    });
  });

  describe('resetFailedAttempts', () => {
    it('should reset attempts if user has failed attempts', async () => {
      const user = { ...mockUser, failedLoginAttempts: 3 };
      prismaService.user.update.mockResolvedValue(user);

      await service.resetFailedAttempts(user);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
          accountLockedUntil: null,
        },
      });
    });

    it('should reset if user has locked account', async () => {
      const user = {
        ...mockUser,
        failedLoginAttempts: 0,
        accountLockedUntil: new Date(),
      };
      prismaService.user.update.mockResolvedValue(user);

      await service.resetFailedAttempts(user);

      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should not call update if no failed attempts and no lock', async () => {
      await service.resetFailedAttempts(mockUser);

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
