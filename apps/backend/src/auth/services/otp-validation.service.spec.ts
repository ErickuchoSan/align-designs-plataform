import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OtpValidationService } from './otp-validation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from '../../otp/otp.service';
import { EmailService } from '../../email/email.service';
import { Role } from '@prisma/client';

describe('OtpValidationService', () => {
  let service: OtpValidationService;
  let prismaService: any;
  let otpService: any;
  let emailService: any;

  const mockClientUser = {
    id: 'user-123',
    email: 'client@test.com',
    firstName: 'Test',
    lastName: 'Client',
    role: Role.CLIENT,
    passwordHash: 'hashed-password',
    deletedAt: null,
  };

  const mockNewUser = {
    ...mockClientUser,
    id: 'new-user-123',
    email: 'new@test.com',
    passwordHash: null,
  };

  const mockEmployeeUser = {
    ...mockClientUser,
    id: 'employee-123',
    email: 'employee@test.com',
    role: Role.EMPLOYEE,
  };

  const mockAdminUser = {
    ...mockClientUser,
    id: 'admin-123',
    email: 'admin@test.com',
    role: Role.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpValidationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
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

    service = module.get<OtpValidationService>(OtpValidationService);
    prismaService = module.get<PrismaService>(PrismaService);
    otpService = module.get<OtpService>(OtpService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestOtpForLogin', () => {
    it('should send OTP email to existing client user', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockClientUser);
      otpService.createOtp.mockResolvedValue('12345678');
      emailService.sendOtpEmail.mockResolvedValue(undefined);

      const result = await service.requestOtpForLogin('client@test.com');

      expect(result.message).toBe('OTP sent to email');
      expect(result.requiresPasswordSetup).toBe(false);
      expect(otpService.createOtp).toHaveBeenCalledWith('user-123');
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'client@test.com',
        '12345678',
        'Test Client',
        'login',
      );
    });

    it('should send OTP email to existing employee user', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockEmployeeUser);
      otpService.createOtp.mockResolvedValue('12345678');
      emailService.sendOtpEmail.mockResolvedValue(undefined);

      const result = await service.requestOtpForLogin('employee@test.com');

      expect(result.message).toBe('OTP sent to email');
      expect(result.requiresPasswordSetup).toBe(false);
    });

    it('should send new_user OTP email for user without password', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockNewUser);
      otpService.createOtp.mockResolvedValue('12345678');
      emailService.sendOtpEmail.mockResolvedValue(undefined);

      const result = await service.requestOtpForLogin('new@test.com');

      expect(result.message).toBe('OTP sent to email');
      expect(result.requiresPasswordSetup).toBe(true);
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'new@test.com',
        '12345678',
        'Test Client',
        'new_user',
      );
    });

    it('should return generic message for non-existent user (prevents enumeration)', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.requestOtpForLogin('nonexistent@test.com');

      expect(result.message).toContain('If the email exists');
      expect(result.requiresPasswordSetup).toBe(false);
      expect(otpService.createOtp).not.toHaveBeenCalled();
    });

    it('should send OTP email to admin user', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockAdminUser);
      otpService.createOtp.mockResolvedValue('12345678');
      emailService.sendOtpEmail.mockResolvedValue(undefined);

      const result = await service.requestOtpForLogin('admin@test.com');

      expect(result.message).toBe('OTP sent to email');
      expect(result.requiresPasswordSetup).toBe(false);
      expect(otpService.createOtp).toHaveBeenCalledWith('admin-123');
    });
  });

  describe('verifyOtpForLogin', () => {
    it('should return user on valid OTP', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockClientUser);
      otpService.verifyOtp.mockResolvedValue(true);

      const result = await service.verifyOtpForLogin(
        'client@test.com',
        '12345678',
      );

      expect(result).toEqual(mockClientUser);
      expect(otpService.verifyOtp).toHaveBeenCalledWith('user-123', '12345678');
    });

    it('should return employee user on valid OTP', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockEmployeeUser);
      otpService.verifyOtp.mockResolvedValue(true);

      const result = await service.verifyOtpForLogin(
        'employee@test.com',
        '12345678',
      );

      expect(result).toEqual(mockEmployeeUser);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtpForLogin('nonexistent@test.com', '12345678'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return admin user on valid OTP', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockAdminUser);
      otpService.verifyOtp.mockResolvedValue(true);

      const result = await service.verifyOtpForLogin('admin@test.com', '12345678');

      expect(result).toEqual(mockAdminUser);
      expect(otpService.verifyOtp).toHaveBeenCalledWith('admin-123', '12345678');
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockClientUser);
      otpService.verifyOtp.mockResolvedValue(false);

      await expect(
        service.verifyOtpForLogin('client@test.com', 'invalid'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with generic message for invalid OTP', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockClientUser);
      otpService.verifyOtp.mockResolvedValue(false);

      try {
        await service.verifyOtpForLogin('client@test.com', 'invalid');
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error.message).toContain('Invalid or expired');
      }
    });
  });
});
