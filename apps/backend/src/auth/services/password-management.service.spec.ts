import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PasswordManagementService } from './password-management.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { OtpService } from '../../otp/otp.service';
import { EmailService } from '../../email/email.service';
import { Role } from '@prisma/client';

describe('PasswordManagementService', () => {
  let service: PasswordManagementService;
  let prismaService: any;
  let passwordService: any;
  let otpService: any;
  let emailService: any;

  const mockUserId = 'user-123';
  const mockUser = {
    id: mockUserId,
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.CLIENT,
    passwordHash: 'hashed-current-password',
    isActive: true,
    deletedAt: null,
  };

  const mockNewUser = {
    ...mockUser,
    id: 'new-user-123',
    passwordHash: null,
    isActive: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordManagementService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: PasswordService,
          useValue: {
            validatePasswordsMatch: jest.fn(),
            validatePasswordFormat: jest.fn(),
            comparePassword: jest.fn(),
            hashPassword: jest.fn(),
            updatePassword: jest.fn(),
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
            sendOtpEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordManagementService>(PasswordManagementService);
    prismaService = module.get<PrismaService>(PrismaService);
    passwordService = module.get<PasswordService>(PasswordService);
    otpService = module.get<OtpService>(OtpService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changePassword', () => {
    const currentPassword = 'CurrentPass123!';
    const newPassword = 'NewPass456!';
    const confirmPassword = 'NewPass456!';

    it('should change password successfully', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      passwordService.comparePassword
        .mockResolvedValueOnce(true) // current password check
        .mockResolvedValueOnce(false); // same password check
      passwordService.updatePassword.mockResolvedValue(undefined);

      const result = await service.changePassword(
        mockUserId,
        currentPassword,
        newPassword,
        confirmPassword,
      );

      expect(result.message).toContain('Password updated successfully');
      expect(passwordService.validatePasswordsMatch).toHaveBeenCalledWith(
        newPassword,
        confirmPassword,
      );
      expect(passwordService.validatePasswordFormat).toHaveBeenCalledWith(
        newPassword,
      );
      expect(passwordService.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        newPassword,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.changePassword(
          mockUserId,
          currentPassword,
          newPassword,
          confirmPassword,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if user has no password configured', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockNewUser);

      await expect(
        service.changePassword(
          'new-user-123',
          currentPassword,
          newPassword,
          confirmPassword,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(false);

      await expect(
        service.changePassword(
          mockUserId,
          'wrong-password',
          newPassword,
          confirmPassword,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new password is same as current', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      passwordService.comparePassword
        .mockResolvedValueOnce(true) // current password check
        .mockResolvedValueOnce(true); // same password check

      await expect(
        service.changePassword(
          mockUserId,
          currentPassword,
          currentPassword,
          currentPassword,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('should send OTP for existing user', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      otpService.createOtp.mockResolvedValue('12345678');
      emailService.sendOtpEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@test.com');

      expect(result.message).toContain('If the email exists');
      expect(otpService.createOtp).toHaveBeenCalledWith(mockUserId);
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'test@test.com',
        '12345678',
        'Test User',
        'password_recovery',
      );
    });

    it('should return generic message for non-existent user (prevents enumeration)', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@test.com');

      expect(result.message).toContain('If the email exists');
      expect(otpService.createOtp).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const newPassword = 'NewPass456!';
    const confirmPassword = 'NewPass456!';
    const otp = '12345678';

    it('should reset password with valid OTP', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      otpService.verifyOtp.mockResolvedValue(true);
      passwordService.updatePassword.mockResolvedValue(undefined);

      const result = await service.resetPassword(
        'test@test.com',
        otp,
        newPassword,
        confirmPassword,
      );

      expect(result.message).toContain('Password reset successfully');
      expect(passwordService.validatePasswordsMatch).toHaveBeenCalledWith(
        newPassword,
        confirmPassword,
      );
      expect(passwordService.validatePasswordFormat).toHaveBeenCalledWith(
        newPassword,
      );
      expect(passwordService.updatePassword).toHaveBeenCalledWith(
        mockUserId,
        newPassword,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword(
          'nonexistent@test.com',
          otp,
          newPassword,
          confirmPassword,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if OTP is invalid', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      otpService.verifyOtp.mockResolvedValue(false);

      await expect(
        service.resetPassword(
          'test@test.com',
          'invalid',
          newPassword,
          confirmPassword,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle user without existing password (first password setup)', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockNewUser);
      otpService.verifyOtp.mockResolvedValue(true);
      passwordService.updatePassword.mockResolvedValue(undefined);

      const result = await service.resetPassword(
        'test@test.com',
        otp,
        newPassword,
        confirmPassword,
      );

      expect(result.message).toContain('Password reset successfully');
      expect(passwordService.updatePassword).toHaveBeenCalledWith(
        'new-user-123',
        newPassword,
        undefined,
      );
    });
  });

  describe('setPassword', () => {
    const password = 'NewPass456!';
    const confirmPassword = 'NewPass456!';

    it('should set password and activate account for new user', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockNewUser);
      passwordService.hashPassword.mockResolvedValue('hashed-new-password');
      prismaService.user.update.mockResolvedValue({
        ...mockNewUser,
        passwordHash: 'hashed-new-password',
        isActive: true,
        emailVerified: true,
      });

      const result = await service.setPassword(
        'new-user-123',
        password,
        confirmPassword,
      );

      expect(result.message).toContain('Password set successfully');
      expect(passwordService.validatePasswordsMatch).toHaveBeenCalledWith(
        password,
        confirmPassword,
      );
      expect(passwordService.validatePasswordFormat).toHaveBeenCalledWith(
        password,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'new-user-123' },
        data: {
          passwordHash: 'hashed-new-password',
          isActive: true,
          emailVerified: true,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.setPassword('nonexistent', password, confirmPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if user already has password', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.setPassword(mockUserId, password, confirmPassword),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkEmail', () => {
    it('should return hasPassword true for user with password', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        passwordHash: 'hashed-password',
        role: 'CLIENT',
      });

      const result = await service.checkEmail('test@test.com');

      expect(result.hasPassword).toBe(true);
      expect(result.requiresPasswordSetup).toBe(false);
    });

    it('should return requiresPasswordSetup true for client without password', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        passwordHash: null,
        role: 'CLIENT',
      });

      const result = await service.checkEmail('test@test.com');

      expect(result.hasPassword).toBe(false);
      expect(result.requiresPasswordSetup).toBe(true);
    });

    it('should return requiresPasswordSetup true for employee without password', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        passwordHash: null,
        role: 'EMPLOYEE',
      });

      const result = await service.checkEmail('test@test.com');

      expect(result.hasPassword).toBe(false);
      expect(result.requiresPasswordSetup).toBe(true);
    });

    it('should return requiresPasswordSetup false for admin without password', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: mockUserId,
        passwordHash: null,
        role: 'ADMIN',
      });

      const result = await service.checkEmail('test@test.com');

      expect(result.hasPassword).toBe(false);
      expect(result.requiresPasswordSetup).toBe(false);
    });

    it('should return generic response for non-existent user', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.checkEmail('nonexistent@test.com');

      expect(result.hasPassword).toBe(false);
      expect(result.requiresPasswordSetup).toBe(false);
    });
  });
});
