import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

/**
 * Service responsible for managing account lockout logic
 * Extracted from AuthService to comply with Single Responsibility Principle
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if account is currently locked
   * @throws UnauthorizedException if account is locked
   */
  validateAccountNotLocked(user: User): void {
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const lockoutMinutes = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / (1000 * 60),
      );
      this.logger.warn(
        `Login attempt for locked account: ${user.email}. Locked for ${lockoutMinutes} more minutes`,
      );
      throw new UnauthorizedException(
        `Account is locked due to multiple failed login attempts. Please try again in ${lockoutMinutes} minute${lockoutMinutes > 1 ? 's' : ''}.`,
      );
    }
  }

  /**
   * Handle failed login attempt
   * Increments counter and locks account if max attempts reached
   * @throws UnauthorizedException with appropriate message
   */
  async handleFailedLogin(user: User): Promise<never> {
    const maxAttempts = parseInt(
      this.configService.get<string>('MAX_LOGIN_ATTEMPTS', '5'),
      10,
    );
    const lockoutDuration = parseInt(
      this.configService.get<string>('ACCOUNT_LOCKOUT_DURATION', '15'),
      10,
    );
    const newFailedAttempts = user.failedLoginAttempts + 1;

    // Check if we should lock the account
    if (newFailedAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: new Date(),
          accountLockedUntil: lockUntil,
        },
      });
      this.logger.warn(
        `Account locked for user ${user.email} after ${newFailedAttempts} failed attempts`,
      );
      throw new UnauthorizedException(
        `Account locked due to multiple failed login attempts. Please try again in ${lockoutDuration} minutes.`,
      );
    } else {
      // Just increment the counter
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: new Date(),
        },
      });
      const remainingAttempts = maxAttempts - newFailedAttempts;
      this.logger.warn(
        `Failed login attempt for user: ${user.email}. ${remainingAttempts} attempts remaining`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetFailedAttempts(user: User): Promise<void> {
    if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
          accountLockedUntil: null,
        },
      });
    }
  }
}
