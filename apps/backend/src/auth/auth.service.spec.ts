import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import { JwtBlacklistService } from './jwt-blacklist.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let otpService: OtpService;
  let emailService: EmailService;
  let jwtBlacklistService: JwtBlacklistService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    passwordHash: 'hashed-password',
    role: Role.ADMIN,
    isActive: true,
    emailVerified: true,
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-jwt-token'),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('7d'),
          },
        },
        {
          provide: OtpService,
          useValue: {
            createOtp: jest.fn(),
            verifyOtp: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendNewUserOtpEmail: jest.fn(),
            sendPasswordRecoveryOtpEmail: jest.fn(),
          },
        },
        {
          provide: JwtBlacklistService,
          useValue: {
            addToBlacklist: jest.fn(),
            isBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    otpService = module.get<OtpService>(OtpService);
    emailService = module.get<EmailService>(EmailService);
    jwtBlacklistService = module.get<JwtBlacklistService>(JwtBlacklistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginAdmin', () => {
    it('should successfully login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 14);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(userWithHash);

      const result = await service.loginAdmin('test@example.com', 'password123');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(
        service.loginAdmin('invalid@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 14);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(userWithHash);

      await expect(
        service.loginAdmin('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 14);
      const inactiveUser = { ...mockUser, passwordHash: hashedPassword, isActive: false };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(inactiveUser);

      await expect(
        service.loginAdmin('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not login soft-deleted users', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(
        service.loginAdmin('deleted@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'deleted@example.com',
          deletedAt: null,
        },
      });
    });
  });

  describe('requestOtpForClient', () => {
    it('should send OTP for valid client', async () => {
      const clientUser = { ...mockUser, role: Role.CLIENT };
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(clientUser);
      jest.spyOn(otpService, 'createOtp').mockResolvedValue('123456');
      jest.spyOn(emailService, 'sendPasswordRecoveryOtpEmail').mockResolvedValue();

      const result = await service.requestOtpForClient('test@example.com');

      expect(result.message).toBe('OTP sent to email');
      expect(otpService.createOtp).toHaveBeenCalledWith(clientUser.id);
      expect(emailService.sendPasswordRecoveryOtpEmail).toHaveBeenCalled();
    });

    it('should send new user OTP for user without password', async () => {
      const newUser = { ...mockUser, role: Role.CLIENT, passwordHash: null };
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(newUser);
      jest.spyOn(otpService, 'createOtp').mockResolvedValue('123456');
      jest.spyOn(emailService, 'sendNewUserOtpEmail').mockResolvedValue();

      const result = await service.requestOtpForClient('test@example.com');

      expect(result.requiresPasswordSetup).toBe(true);
      expect(emailService.sendNewUserOtpEmail).toHaveBeenCalled();
    });

    it('should return generic message for non-existent email', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      const result = await service.requestOtpForClient('nonexistent@example.com');

      expect(result.message).toContain('If the email exists');
      expect(otpService.createOtp).not.toHaveBeenCalled();
    });
  });

  describe('revokeToken', () => {
    it('should add valid token to blacklist', () => {
      const mockToken = 'valid.jwt.token';
      const mockDecoded = { exp: Math.floor(Date.now() / 1000) + 3600 }; // Expires in 1 hour

      jest.spyOn(jwtService, 'decode').mockReturnValue(mockDecoded);

      service.revokeToken(mockToken);

      expect(jwtBlacklistService.addToBlacklist).toHaveBeenCalled();
    });

    it('should not blacklist expired token', () => {
      const mockToken = 'expired.jwt.token';
      const mockDecoded = { exp: Math.floor(Date.now() / 1000) - 3600 }; // Expired 1 hour ago

      jest.spyOn(jwtService, 'decode').mockReturnValue(mockDecoded);

      service.revokeToken(mockToken);

      expect(jwtBlacklistService.addToBlacklist).not.toHaveBeenCalled();
    });
  });

  describe('checkEmail', () => {
    it('should always return same response to prevent user enumeration', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      const result = await service.checkEmail('test@example.com');

      expect(result.hasPassword).toBe(false);
      expect(result.requiresPasswordSetup).toBe(false);
    });

    it('should have consistent response time', async () => {
      const startTime = Date.now();
      await service.checkEmail('any@example.com');
      const duration = Date.now() - startTime;

      // Should take at least 100ms (minimum delay)
      expect(duration).toBeGreaterThanOrEqual(100);
    });
  });
});
