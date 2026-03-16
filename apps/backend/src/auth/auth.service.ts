import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDependenciesService } from './services/auth-dependencies.service';
import { TokenService } from './services/token.service';
import { OtpValidationService } from './services/otp-validation.service';
import { PasswordManagementService } from './services/password-management.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authDependencies: AuthDependenciesService,
    private readonly tokenService: TokenService,
    private readonly otpValidation: OtpValidationService,
    private readonly passwordManagement: PasswordManagementService,
  ) { }

  /**
   * Login with email and password (for ADMIN and CLIENT)
   */
  async loginAdmin(email: string, password: string) {
    try {
      this.logger.log(`Attempting login for: ${email}`);
      const user = await this.prisma.user.findFirst({
        where: {
          email,
          deletedAt: null, // Prevent soft-deleted users from logging in
        },
      });

      if (!user) {
        this.logger.warn(`Login attempt for non-existent user: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }
      this.logger.log(`User found: ${user.id}, Role: ${user.role}, Active: ${user.isActive}`);

      // Check if account is locked
      this.authDependencies.accountLockout.validateAccountNotLocked(user);

      if (!user.passwordHash) {
        this.logger.warn(`Login attempt for user without password: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if user account is active BEFORE validating password
      // This ensures inactive users cannot attempt login and avoids unnecessary password validation
      if (!user.isActive) {
        this.logger.warn(`Login attempt for inactive user: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      this.logger.log(`Verifying password...`);
      const isPasswordValid =
        await this.authDependencies.password.comparePassword(
          password,
          user.passwordHash,
        );

      this.logger.log(`Password valid: ${isPasswordValid}`);

      if (!isPasswordValid) {
        // Handle failed login (increments counter and potentially locks account)
        await this.authDependencies.accountLockout.handleFailedLogin(user);
        // Note: handleFailedLogin always throws, so this line is never reached
      }

      // Reset failed login attempts on successful login
      await this.authDependencies.accountLockout.resetFailedAttempts(user);

      this.logger.log(`Successful login for user: ${email} (${user.role})`);
      const access_token = this.tokenService.generateAccessToken(user);
      const refresh_token = await this.tokenService.generateRefreshToken(user.id);

      return {
        access_token,
        refresh_token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed for ${email}: ${(error as any).message}`, (error as any).stack);
      throw error;
    }
  }

  /**
   * Request OTP for Client or Employee
   * Delegated to OtpValidationService
   */
  async requestOtpForClient(email: string) {
    return this.otpValidation.requestOtpForLogin(email);
  }

  /**
   * Verify OTP and generate JWT token for Client or Employee
   * Orchestrates OtpValidationService and TokenService
   */
  async verifyOtpForClient(email: string, token: string) {
    // Validate OTP and get user
    const user = await this.otpValidation.verifyOtpForLogin(email, token);

    // Generate tokens
    const access_token = this.tokenService.generateAccessToken(user);
    const refresh_token = await this.tokenService.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  /**
   * Refresh Access Token using Refresh Token
   */
  async refresh(refreshToken: string) {
    // Verify and rotate refresh token
    const tokenRecord = await this.tokenService.verifyRefreshToken(refreshToken);
    const newRefreshToken = await this.tokenService.rotateRefreshToken(tokenRecord.tokenHash, tokenRecord.userId);
    const newAccessToken = this.tokenService.generateAccessToken(tokenRecord.user);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: tokenRecord.user,
    };
  }

  /**
   * Change password (requires current password)
   * Delegated to PasswordManagementService
   */
  async changePassword(
    userId: string,
    current: string,
    newPass: string,
    confirmPass: string,
  ) {
    return this.passwordManagement.changePassword(
      userId,
      current,
      newPass,
      confirmPass,
    );
  }

  /**
   * Request password recovery with OTP
   * Delegated to PasswordManagementService
   */
  async forgotPassword(email: string) {
    return this.passwordManagement.forgotPassword(email);
  }

  /**
   * Reset password with OTP
   * Delegated to PasswordManagementService
   */
  async resetPassword(
    email: string,
    otp: string,
    newPass: string,
    confirmPass: string,
  ) {
    return this.passwordManagement.resetPassword(
      email,
      otp,
      newPass,
      confirmPass,
    );
  }

  /**
   * Check if an email exists and if it has a password configured
   * Delegated to PasswordManagementService
   */
  async checkEmail(email: string) {
    return this.passwordManagement.checkEmail(email);
  }

  /**
   * Set password for the first time and activate the account
   * Delegated to PasswordManagementService
   */
  async setPassword(userId: string, pass: string, confirm: string) {
    return this.passwordManagement.setPassword(userId, pass, confirm);
  }

  /**
   * Revoke a JWT token by adding it to the blacklist
   * Delegated to TokenService
   */
  async revokeToken(token: string): Promise<void> {
    return this.tokenService.revokeAccessToken(token);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    return this.tokenService.revokeAllRefreshTokens(userId);
  }
}
