import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordValidationUtils } from '../../common/utils/validation.utils';
import * as bcrypt from 'bcrypt';

// Bcrypt configuration - using 14 rounds for enhanced security
// Higher rounds provide better protection against brute-force attacks
const BCRYPT_SALT_ROUNDS = 14;

/**
 * Service responsible for password management
 * Extracted from AuthService to comply with Single Responsibility Principle
 */
@Injectable()
export class PasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compare a plaintext password with a hashed password
   */
  async comparePassword(plaintext: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hashed);
  }

  /**
   * Validate password format and strength
   * @throws BadRequestException if password is invalid
   */
  validatePasswordFormat(password: string): void {
    const validation = PasswordValidationUtils.validatePassword(password);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }
  }

  /**
   * Validate that passwords match
   * @throws BadRequestException if passwords don't match
   */
  validatePasswordsMatch(password: string, confirmPassword: string): void {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
  }

  /**
   * Validate that a new password hasn't been used recently
   * Prevents password reuse based on PASSWORD_HISTORY_COUNT
   * @throws BadRequestException if password was recently used
   */
  async validatePasswordHistory(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    const historyCount = Number.parseInt(
      this.configService.get<string>('PASSWORD_HISTORY_COUNT', '5'),
      10,
    );

    // Get recent password history
    const passwordHistory = await this.prisma.passwordHistory.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: historyCount,
    });

    // Check if new password matches any in history
    for (const history of passwordHistory) {
      const matches = await bcrypt.compare(newPassword, history.passwordHash);
      if (matches) {
        throw new BadRequestException(
          `Password has been used recently. Please choose a different password. You cannot reuse your last ${historyCount} passwords.`,
        );
      }
    }
  }

  /**
   * Save current password to history before updating
   */
  async savePasswordToHistory(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.prisma.passwordHistory.create({
      data: {
        userId,
        passwordHash,
      },
    });
  }

  /**
   * Update user's password with full validation and history tracking
   */
  async updatePassword(
    userId: string,
    newPassword: string,
    currentPasswordHash?: string,
  ): Promise<void> {
    // Validate password history
    await this.validatePasswordHistory(userId, newPassword);

    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Save current password to history if user has one
    if (currentPasswordHash) {
      await this.savePasswordToHistory(userId, currentPasswordHash);
    }

    // Update password in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }
}
