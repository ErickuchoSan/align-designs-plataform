import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('PasswordService', () => {
  let service: PasswordService;
  let prismaService: any;
  let configService: any;

  const mockUserId = 'user-123';
  const mockPassword = 'Test@Password123';
  const mockHashedPassword = '$2b$14$hashedpassword';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: PrismaService,
          useValue: {
            passwordHistory: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
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
                PASSWORD_HISTORY_COUNT: '5',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash password using bcrypt', async () => {
      const result = await service.hashPassword(mockPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, 14);
      expect(result).toBe(mockHashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should compare passwords using bcrypt', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePassword(mockPassword, mockHashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(mockPassword, mockHashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePassword('wrong', mockHashedPassword);

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordFormat', () => {
    it('should not throw for valid password', () => {
      // Password must avoid: common patterns, 3-consecutive letters (abc, pqr), 3-consecutive numbers (123)
      expect(() => service.validatePasswordFormat('Xa3!Zm8@Kf5$Wp')).not.toThrow();
    });

    it('should throw BadRequestException for password without uppercase', () => {
      expect(() => service.validatePasswordFormat('xk9$mnpqr7vb')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for password without lowercase', () => {
      expect(() => service.validatePasswordFormat('XK9$MNPQR7VB')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for password without number', () => {
      expect(() => service.validatePasswordFormat('XkMn$pQrvBcD')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for short password', () => {
      expect(() => service.validatePasswordFormat('Xk9$m')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validatePasswordsMatch', () => {
    it('should not throw for matching passwords', () => {
      expect(() =>
        service.validatePasswordsMatch(mockPassword, mockPassword),
      ).not.toThrow();
    });

    it('should throw BadRequestException for non-matching passwords', () => {
      expect(() =>
        service.validatePasswordsMatch(mockPassword, 'different'),
      ).toThrow(BadRequestException);
    });
  });

  describe('validatePasswordHistory', () => {
    it('should not throw for new password', async () => {
      prismaService.passwordHistory.findMany.mockResolvedValue([
        { passwordHash: 'old-hash-1' },
        { passwordHash: 'old-hash-2' },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validatePasswordHistory(mockUserId, mockPassword),
      ).resolves.not.toThrow();
    });

    it('should throw BadRequestException for recently used password', async () => {
      prismaService.passwordHistory.findMany.mockResolvedValue([
        { passwordHash: mockHashedPassword },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validatePasswordHistory(mockUserId, mockPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it('should check up to PASSWORD_HISTORY_COUNT passwords', async () => {
      prismaService.passwordHistory.findMany.mockResolvedValue([]);

      await service.validatePasswordHistory(mockUserId, mockPassword);

      expect(prismaService.passwordHistory.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('savePasswordToHistory', () => {
    it('should create password history entry', async () => {
      prismaService.passwordHistory.create.mockResolvedValue({});

      await service.savePasswordToHistory(mockUserId, mockHashedPassword);

      expect(prismaService.passwordHistory.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          passwordHash: mockHashedPassword,
        },
      });
    });
  });

  describe('updatePassword', () => {
    it('should update password with history tracking', async () => {
      prismaService.passwordHistory.findMany.mockResolvedValue([]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.passwordHistory.create.mockResolvedValue({});
      prismaService.user.update.mockResolvedValue({});

      await service.updatePassword(mockUserId, mockPassword, 'old-hash');

      expect(prismaService.passwordHistory.create).toHaveBeenCalled();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { passwordHash: mockHashedPassword },
      });
    });

    it('should skip history save if no current password', async () => {
      prismaService.passwordHistory.findMany.mockResolvedValue([]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prismaService.user.update.mockResolvedValue({});

      await service.updatePassword(mockUserId, mockPassword);

      expect(prismaService.passwordHistory.create).not.toHaveBeenCalled();
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should throw if password was recently used', async () => {
      prismaService.passwordHistory.findMany.mockResolvedValue([
        { passwordHash: mockHashedPassword },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.updatePassword(mockUserId, mockPassword),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
