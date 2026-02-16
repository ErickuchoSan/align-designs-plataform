import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDependenciesService } from './services/auth-dependencies.service';
import { TokenService } from './services/token.service';
import { OtpValidationService } from './services/otp-validation.service';
import { PasswordManagementService } from './services/password-management.service';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let authDependencies: any;
  let tokenService: any;
  let otpValidation: any;
  let passwordManagement: any;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: Role.CLIENT,
    passwordHash: 'hashed_password',
    isActive: true,
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
  };

  const expectedUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: Role.CLIENT,
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
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
            },
          },
        },
        {
          provide: AuthDependenciesService,
          useValue: {
            accountLockout: {
              validateAccountNotLocked: jest.fn(),
              handleFailedLogin: jest.fn(),
              resetFailedAttempts: jest.fn(),
            },
            password: {
              comparePassword: jest.fn(),
            },
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
            rotateRefreshToken: jest.fn(),
            revokeAccessToken: jest.fn(),
            revokeAllRefreshTokens: jest.fn(),
          },
        },
        {
          provide: OtpValidationService,
          useValue: {
            requestOtpForLogin: jest.fn(),
            verifyOtpForLogin: jest.fn(),
          },
        },
        {
          provide: PasswordManagementService,
          useValue: {
            changePassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            setPassword: jest.fn(),
            checkEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    authDependencies = module.get<AuthDependenciesService>(AuthDependenciesService);
    tokenService = module.get<TokenService>(TokenService);
    otpValidation = module.get<OtpValidationService>(OtpValidationService);
    passwordManagement = module.get<PasswordManagementService>(PasswordManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginAdmin', () => {
    it('should login successfully', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      authDependencies.password.comparePassword.mockResolvedValue(true);
      tokenService.generateAccessToken.mockReturnValue('access_token');
      tokenService.generateRefreshToken.mockReturnValue('refresh_token');

      const result = await service.loginAdmin('test@example.com', 'password');

      expect(authDependencies.accountLockout.validateAccountNotLocked).toHaveBeenCalledWith(mockUser);
      expect(authDependencies.password.comparePassword).toHaveBeenCalledWith('password', 'hashed_password');
      expect(authDependencies.accountLockout.resetFailedAttempts).toHaveBeenCalledWith(mockUser);
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: expectedUser,
      });
    });

    it('should throw UnauthorizedException if password valid is false', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      authDependencies.password.comparePassword.mockResolvedValue(false);
      authDependencies.accountLockout.handleFailedLogin.mockRejectedValue(new UnauthorizedException());

      await expect(service.loginAdmin('test@example.com', 'wrong')).rejects.toThrow(UnauthorizedException);
      expect(authDependencies.accountLockout.handleFailedLogin).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('requestOtpForClient', () => {
    it('should delegate to OtpValidationService', async () => {
      otpValidation.requestOtpForLogin.mockResolvedValue({ message: 'sent' });
      const result = await service.requestOtpForClient('email');
      expect(otpValidation.requestOtpForLogin).toHaveBeenCalledWith('email');
      expect(result).toEqual({ message: 'sent' });
    });
  });

  describe('verifyOtpForClient', () => {
    it('should verify otp and generate token', async () => {
      otpValidation.verifyOtpForLogin.mockResolvedValue(mockUser);
      tokenService.generateAccessToken.mockReturnValue('access_token');
      tokenService.generateRefreshToken.mockResolvedValue('refresh_token');

      const result = await service.verifyOtpForClient('email', '123456');

      expect(otpValidation.verifyOtpForLogin).toHaveBeenCalledWith('email', '123456');
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: expectedUser,
      });
    });
  });

  describe('Delegated Methods', () => {
    it('changePassword delegation', async () => {
      await service.changePassword('u', 'o', 'n', 'c');
      expect(passwordManagement.changePassword).toHaveBeenCalledWith('u', 'o', 'n', 'c');
    });

    it('forgotPassword delegation', async () => {
      await service.forgotPassword('e');
      expect(passwordManagement.forgotPassword).toHaveBeenCalledWith('e');
    });

    it('resetPassword delegation', async () => {
      await service.resetPassword('e', 'o', 'n', 'c');
      expect(passwordManagement.resetPassword).toHaveBeenCalledWith('e', 'o', 'n', 'c');
    });

    it('checkEmail delegation', async () => {
      await service.checkEmail('e');
      expect(passwordManagement.checkEmail).toHaveBeenCalledWith('e');
    });

    it('setPassword delegation', async () => {
      await service.setPassword('u', 'p', 'c');
      expect(passwordManagement.setPassword).toHaveBeenCalledWith('u', 'p', 'c');
    });

    it('revokeToken delegation', async () => {
      await service.revokeToken('t');
      expect(tokenService.revokeAccessToken).toHaveBeenCalledWith('t');
    });
  });
});
