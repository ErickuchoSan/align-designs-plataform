import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { OtpService } from '../../otp/otp.service';
import { EmailService } from '../../email/email.service';
import { MIN_RESPONSE_DELAY_MS } from '../../common/constants/time.constants';

@Injectable()
export class PasswordManagementService {
  private readonly logger = new Logger(PasswordManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Change password (requires current password)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    this.passwordService.validatePasswordsMatch(newPassword, confirmPassword);
    this.passwordService.validatePasswordFormat(newPassword);

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

    const isPasswordValid = await this.passwordService.comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current (timing-safe comparison using hashes)
    const isSamePassword = await this.passwordService.comparePassword(
      newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Update password with history tracking
    await this.passwordService.updatePassword(
      userId,
      newPassword,
      user.passwordHash,
    );

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

    // Generate 8-digit OTP
    const token = await this.otpService.createOtp(user.id);

    // Send OTP via email for password recovery
    await this.emailService.sendOtpEmail(
      user.email,
      token,
      `${user.firstName} ${user.lastName}`,
      'password_recovery',
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
    this.passwordService.validatePasswordsMatch(newPassword, confirmPassword);
    this.passwordService.validatePasswordFormat(newPassword);

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

    // Update password with history tracking
    await this.passwordService.updatePassword(
      user.id,
      newPassword,
      user.passwordHash ?? undefined,
    );

    this.logger.log(`Password reset for user ${user.id} via OTP`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Set password for the first time and activate the account
   */
  async setPassword(userId: string, password: string, confirmPassword: string) {
    this.passwordService.validatePasswordsMatch(password, confirmPassword);
    this.passwordService.validatePasswordFormat(password);

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
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Update password, activate account and verify email
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        isActive: true, // Activate user
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
   * Check if an email exists and if it has a password configured
   */
  async checkEmail(email: string) {
    const startTime = Date.now();

    // Query database to check if user exists and get password status
    const user = await this.prisma.user.findFirst({
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

    // Return actual user information if user exists
    // If user doesn't exist, return generic response
    const response = user
      ? {
          hasPassword: !!user.passwordHash,
          // Only CLIENT and EMPLOYEE need password setup flow
          // ADMIN is always created with password via seed
          requiresPasswordSetup:
            !user.passwordHash &&
            (user.role === 'CLIENT' || user.role === 'EMPLOYEE'),
        }
      : {
          hasPassword: false,
          requiresPasswordSetup: false,
        };

    // Add constant-time delay to prevent timing attacks
    const elapsedTime = Date.now() - startTime;
    const minimumDelay = MIN_RESPONSE_DELAY_MS;
    const delayNeeded = Math.max(0, minimumDelay - elapsedTime);

    if (delayNeeded > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }

    return response;
  }
}
