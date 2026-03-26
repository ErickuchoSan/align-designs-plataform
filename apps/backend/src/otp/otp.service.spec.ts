import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OtpService', () => {
  let service: OtpService;
  let prismaService: any;

  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: {
            otpToken: {
              findMany: jest.fn(),
              count: jest.fn(),
              updateMany: jest.fn(),
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              const config: Record<string, string> = {
                NODE_ENV: 'test',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOtp', () => {
    it('should create OTP and return token', async () => {
      prismaService.otpToken.findMany.mockResolvedValue([]);
      prismaService.otpToken.count.mockResolvedValue(0);
      prismaService.otpToken.updateMany.mockResolvedValue({ count: 0 });
      prismaService.otpToken.create.mockResolvedValue({ id: 'otp-123' });

      const result = await service.createOtp(mockUserId);

      expect(result).toBeDefined();
      expect(result.length).toBe(8); // 8-digit OTP
      expect(prismaService.otpToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should invalidate previous unused OTPs', async () => {
      prismaService.otpToken.findMany.mockResolvedValue([]);
      prismaService.otpToken.count.mockResolvedValue(0);
      prismaService.otpToken.updateMany.mockResolvedValue({ count: 2 });
      prismaService.otpToken.create.mockResolvedValue({ id: 'otp-123' });

      await service.createOtp(mockUserId);

      expect(prismaService.otpToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          used: false,
        },
        data: {
          used: true,
        },
      });
    });

    it('should throw BadRequestException when rate limit exceeded', async () => {
      prismaService.otpToken.findMany.mockResolvedValue([
        { createdAt: new Date() },
      ]);
      prismaService.otpToken.count.mockResolvedValue(5); // MAX_OTP_PER_WINDOW

      await expect(service.createOtp(mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should return true for valid OTP', async () => {
      const mockOtpRecord = {
        id: 'otp-123',
        userId: mockUserId,
        used: false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      prismaService.otpToken.findFirst.mockResolvedValue(mockOtpRecord);
      prismaService.otpToken.update.mockResolvedValue({
        ...mockOtpRecord,
        used: true,
      });

      const result = await service.verifyOtp(mockUserId, '12345678');

      expect(result).toBe(true);
      expect(prismaService.otpToken.update).toHaveBeenCalledWith({
        where: { id: 'otp-123' },
        data: { used: true },
      });
    });

    it('should return false for invalid OTP', async () => {
      prismaService.otpToken.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp(mockUserId, 'invalid');

      expect(result).toBe(false);
    });

    it('should return false for already used OTP', async () => {
      // findFirst returns null because we filter for used: false
      prismaService.otpToken.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp(mockUserId, '12345678');

      expect(result).toBe(false);
    });

    it('should return false for expired OTP', async () => {
      // findFirst returns null because we filter for expiresAt > now
      prismaService.otpToken.findFirst.mockResolvedValue(null);

      const result = await service.verifyOtp(mockUserId, '12345678');

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and old used tokens', async () => {
      prismaService.otpToken.deleteMany.mockResolvedValue({ count: 10 });

      await service.cleanupExpiredTokens();

      expect(prismaService.otpToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            {
              used: true,
              createdAt: { lt: expect.any(Date) },
            },
          ],
        },
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      prismaService.otpToken.deleteMany.mockRejectedValue(
        new Error('DB error'),
      );

      // Should not throw
      await expect(service.cleanupExpiredTokens()).resolves.not.toThrow();
    });
  });
});
