import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PasswordValidationUtils } from '../common/utils/validation.utils';
import { User } from './interfaces/user.interface';

// Bcrypt configuration - using 14 rounds for enhanced security
// Higher rounds provide better protection against brute-force attacks
const BCRYPT_SALT_ROUNDS = 14;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  /**
   * Login with email and password (for ADMIN and CLIENT)
   */
  async loginAdmin(email: string, password: string) {
    try {
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

      if (!user.passwordHash) {
        this.logger.warn(`Login attempt for user without password: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        this.logger.warn(`Failed login attempt for user: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isActive) {
        this.logger.warn(`Login attempt for inactive user: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      this.logger.log(`Successful login for user: ${email} (${user.role})`);
      return this.generateToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error during login for ${email}:`, error);
      throw new UnauthorizedException('Login failed');
    }
  }

  /**
   * Request OTP for Client
   */
  async requestOtpForClient(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!user || user.role !== Role.CLIENT) {
      // Return generic message to prevent user enumeration
      return {
        message:
          'If the email exists and is valid, you will receive an OTP code',
        requiresPasswordSetup: false,
      };
    }

    // We don't validate isActive here because new users will be inactive
    // until they set their password

    const token = await this.otpService.createOtp(user.id);

    // Send appropriate email based on user status
    if (!user.passwordHash) {
      // New user - send account verification email
      await this.emailService.sendNewUserOtpEmail(
        user.email,
        token,
        `${user.firstName} ${user.lastName}`,
      );
    } else {
      // Existing user - send password recovery email
      await this.emailService.sendPasswordRecoveryOtpEmail(
        user.email,
        token,
        `${user.firstName} ${user.lastName}`,
      );
    }

    return {
      message: 'OTP sent to email',
      requiresPasswordSetup: !user.passwordHash,
    };
  }

  /**
   * Verify OTP and generate JWT token for Client
   */
  async verifyOtpForClient(email: string, token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!user || user.role !== Role.CLIENT) {
      this.logger.warn(`Failed OTP verification attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.otpService.verifyOtp(user.id, token);
    if (!isValid) {
      this.logger.warn(
        `Failed OTP verification for user ${user.id} (${email}): Invalid or expired token`,
      );
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    this.logger.log(`Successful OTP verification for user ${user.id} (${email})`);
    return this.generateToken(user);
  }

  /**
   * Change password (requires current password)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate the new password
    const passwordValidation =
      PasswordValidationUtils.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.error);
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    if (!user.passwordHash) {
      throw new BadRequestException(
        'This user does not have a password configured',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current (timing-safe comparison using hashes)
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    this.logger.log(`Password changed for user ${userId}`);

    return { message: 'Password updated successfully' };
  }

  /**
   * Request password recovery with OTP
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    // Do not reveal whether the user exists for security reasons
    if (!user) {
      return {
        message: 'If the email exists, you will receive a verification code',
      };
    }

    // Generate 6-digit OTP
    const token = await this.otpService.createOtp(user.id);

    // Send OTP via email for password recovery
    await this.emailService.sendPasswordRecoveryOtpEmail(
      user.email,
      token,
      `${user.firstName} ${user.lastName}`,
    );

    return {
      message: 'If the email exists, you will receive a verification code',
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    // Validate that passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate the new password
    const passwordValidation =
      PasswordValidationUtils.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.error);
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    // Use generic error message to prevent user enumeration
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(user.id, otp);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    this.logger.log(`Password reset for user ${user.id} via OTP`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Check if an email exists and if it has a password configured
   *
   * SECURITY NOTE: This endpoint always returns the same response to prevent
   * user enumeration attacks. The response does not reveal whether an email
   * exists in the system or its password status.
   *
   * Uses constant-time response to prevent timing attacks.
   */
  async checkEmail(email: string) {
    const startTime = Date.now();

    // Always perform database query to maintain consistent timing
    // but don't use the result in the response
    await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        passwordHash: true,
        role: true,
      },
    });

    // SECURITY: Always return the same response regardless of email existence
    // This prevents attackers from enumerating valid email addresses
    // The actual password status will be revealed during login/OTP flow
    const response = {
      hasPassword: false,
      requiresPasswordSetup: false,
    };

    // Add constant-time delay to prevent timing attacks
    // This ensures all responses take approximately the same time
    const elapsedTime = Date.now() - startTime;
    const minimumDelay = 100; // 100ms minimum response time
    const delayNeeded = Math.max(0, minimumDelay - elapsedTime);

    if (delayNeeded > 0) {
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    return response;
  }

  /**
   * Set password for the first time and activate the account
   */
  async setPassword(userId: string, password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate the password
    const passwordValidation =
      PasswordValidationUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(passwordValidation.error);
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordHash) {
      throw new BadRequestException(
        'This user already has a password configured',
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Update password, activate account and verify email
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
      },
    });

    this.logger.log(
      `Password set and account activated for user ${userId} (${user.email})`,
    );

    return {
      message: 'Password set successfully. Your account has been activated.',
    };
  }

  /**
   * Generate a JWT token
   */
  private generateToken(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRATION', '7d'),
      audience: 'align-designs-client',
      issuer: 'align-designs-api',
    });

    return {
      access_token: accessToken,
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
}
