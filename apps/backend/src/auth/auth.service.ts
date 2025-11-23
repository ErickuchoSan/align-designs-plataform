import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDependenciesService } from './services/auth-dependencies.service';
import { TokenService } from './services/token.service';
import { Role } from '@prisma/client';
import { User } from './interfaces/user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private deps: AuthDependenciesService,
    private tokenService: TokenService,
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

      // Check if account is locked
      this.deps.accountLockout.validateAccountNotLocked(user);

      if (!user.passwordHash) {
        this.logger.warn(`Login attempt for user without password: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await this.deps.password.comparePassword(
        password,
        user.passwordHash,
      );

      if (!isPasswordValid) {
        // Handle failed login (increments counter and potentially locks account)
        await this.deps.accountLockout.handleFailedLogin(user);
        // Note: handleFailedLogin always throws, so this line is never reached
      }

      if (!user.isActive) {
        this.logger.warn(`Login attempt for inactive user: ${email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      // Reset failed login attempts on successful login
      await this.deps.accountLockout.resetFailedAttempts(user);

      this.logger.log(`Successful login for user: ${email} (${user.role})`);
      return this.tokenService.generateToken(user);
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

    const token = await this.deps.otp.createOtp(user.id);

    // Send appropriate email based on user status
    if (!user.passwordHash) {
      // New user - send account verification email
      await this.deps.email.sendNewUserOtpEmail(
        user.email,
        token,
        `${user.firstName} ${user.lastName}`,
      );
    } else {
      // Existing user - send login OTP email
      await this.deps.email.sendOtpEmail(
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

    const isValid = await this.deps.otp.verifyOtp(user.id, token);
    if (!isValid) {
      this.logger.warn(
        `Failed OTP verification for user ${user.id} (${email}): Invalid or expired token`,
      );
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    this.logger.log(`Successful OTP verification for user ${user.id} (${email})`);
    return this.tokenService.generateToken(user);
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
    this.deps.password.validatePasswordsMatch(newPassword, confirmPassword);
    this.deps.password.validatePasswordFormat(newPassword);

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

    const isPasswordValid = await this.deps.password.comparePassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current (timing-safe comparison using hashes)
    const isSamePassword = await this.deps.password.comparePassword(
      newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Update password with history tracking
    await this.deps.password.updatePassword(
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

    // Generate 6-digit OTP
    const token = await this.deps.otp.createOtp(user.id);

    // Send OTP via email for password recovery
    await this.deps.email.sendPasswordRecoveryOtpEmail(
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
    this.deps.password.validatePasswordsMatch(newPassword, confirmPassword);
    this.deps.password.validatePasswordFormat(newPassword);

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
    const isValid = await this.deps.otp.verifyOtp(user.id, otp);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update password with history tracking
    await this.deps.password.updatePassword(
      user.id,
      newPassword,
      user.passwordHash ?? undefined,
    );

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
    this.deps.password.validatePasswordsMatch(password, confirmPassword);
    this.deps.password.validatePasswordFormat(password);

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
    const hashedPassword = await this.deps.password.hashPassword(password);

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
   * Revoke a JWT token by adding it to the blacklist
   * Delegated to TokenService for better separation of concerns
   * @param token - The JWT token to revoke
   */
  async revokeToken(token: string): Promise<void> {
    return this.tokenService.revokeToken(token);
  }
}
