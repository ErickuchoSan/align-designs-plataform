import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt, createHash } from 'crypto';
import {
  OTP_EXPIRATION_MS,
  OTP_EXPIRATION_MINUTES,
} from '../common/constants/timeouts.constants';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate an 8-digit OTP token using secure crypto
   */
  private generateToken(): string {
    // Generate a cryptographically secure random number between 10000000 and 99999999
    return randomInt(10000000, 100000000).toString();
  }

  /**
   * Hash OTP token using SHA-256
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new OTP for a user
   * Expires in 10 minutes
   */
  async createOtp(userId: string): Promise<string> {
    // Rate limiting: max 5 OTP creations per 15 minutes per user
    const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const rateLimitWindowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentOtps = await this.prisma.otpToken.findMany({
      where: {
        userId,
        createdAt: {
          gte: rateLimitWindowStart,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 1,
    });

    const MAX_OTP_PER_WINDOW = 5;
    const recentOtpCount = await this.prisma.otpToken.count({
      where: {
        userId,
        createdAt: {
          gte: rateLimitWindowStart,
        },
      },
    });

    if (recentOtpCount >= MAX_OTP_PER_WINDOW) {
      // Calculate when the oldest OTP will expire from the rate limit window
      const oldestOtp = recentOtps[0];
      const waitUntil = new Date(oldestOtp.createdAt.getTime() + RATE_LIMIT_WINDOW_MS);
      const waitMinutes = Math.ceil((waitUntil.getTime() - Date.now()) / 60000);

      this.logger.warn(
        `OTP rate limit exceeded for user ${userId}: ${recentOtpCount} attempts in last 15 minutes`,
      );
      throw new BadRequestException(
        `Too many OTP requests. Please wait ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''} before trying again.`,
      );
    }

    // Invalidate previous unused OTPs
    await this.prisma.otpToken.updateMany({
      where: {
        userId,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Create new OTP
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

    await this.prisma.otpToken.create({
      data: {
        userId,
        tokenHash, // Store hash, not plaintext
        expiresAt,
      },
    });

    // Log OTP generation without sensitive details
    // Note: OTP code is never logged, even in development, to prevent security leaks
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'development') {
      this.logger.debug(
        '\n🔐 ==================== OTP GENERATED ====================',
      );
      this.logger.debug(`   User ID: ${userId.substring(0, 8)}...`);
      this.logger.debug(`   OTP Code: [REDACTED - Check email or database]`);
      this.logger.debug(`   Expires in: ${OTP_EXPIRATION_MINUTES} minutes`);
      this.logger.debug(
        '========================================================\n',
      );
    } else {
      // In production only log without any user identifiers
      this.logger.log('OTP generated successfully');
    }

    return token;
  }

  /**
   * Verify if an OTP is valid
   */
  async verifyOtp(userId: string, token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const otpRecord = await this.prisma.otpToken.findFirst({
      where: {
        userId,
        tokenHash, // Compare hash, not plaintext
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Mark as used
    await this.prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    return true;
  }

  /**
   * Cleanup expired and used OTP tokens
   * Runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.otpToken.deleteMany({
        where: {
          OR: [
            // Delete expired tokens
            {
              expiresAt: {
                lt: new Date(),
              },
            },
            // Delete used tokens older than 7 days
            {
              used: true,
              createdAt: {
                lt: sevenDaysAgo,
              },
            },
          ],
        },
      });

      this.logger.log(
        `OTP cleanup completed: ${result.count} tokens removed`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup expired OTP tokens', error);
    }
  }
}
