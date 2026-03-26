import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtBlacklistService } from '../jwt-blacklist.service';
import { User } from '../interfaces/user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'node:crypto';

/**
 * Token Service - Handles JWT token generation, revocation, and Refresh Tokens
 * Extracted from AuthService for better separation of concerns
 *
 * Responsibilities:
 * - Generate JWT access tokens
 * - Generate and manage Refresh Tokens (opaque, hashed in DB)
 * - Revoke tokens (blacklist)
 * - Decode tokens
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly jwtBlacklist: JwtBlacklistService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate a JWT access token for a user
   */
  generateAccessToken(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRATION', '15m'), // Short-lived access token
      audience: 'align-designs-client',
      issuer: 'align-designs-api',
    });

    return accessToken;
  }

  /**
   * Generate a new Refresh Token (opaque)
   * Hashes the token before storing in DB
   */
  async generateRefreshToken(
    userId: string,
    _ipAddress?: string,
  ): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Verify a Refresh Token
   * Checks hash, expiry, revocation, and reuse detection
   */
  async verifyRefreshToken(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse Detection: If token was already replaced (rotated), it means it's being reused (possible theft)
    if (tokenRecord.replacedByToken) {
      this.logger.warn(
        `Refresh Token Reuse Detected! User: ${tokenRecord.userId}. Revoking all tokens.`,
      );
      await this.revokeAllRefreshTokens(tokenRecord.userId);
      throw new UnauthorizedException('Invalid refresh token (reused)');
    }

    if (tokenRecord.revoked) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    return tokenRecord;
  }

  /**
   * Rotate Refresh Token (Concept: Refresh Token Rotation)
   * Invalidates the old token and issues a new one.
   * Links the old token to the new one for reuse detection.
   */
  async rotateRefreshToken(
    oldTokenHash: string,
    userId: string,
  ): Promise<string> {
    const newToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto
      .createHash('sha256')
      .update(newToken)
      .digest('hex');
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Transaction: Revoke old, Create new
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { tokenHash: oldTokenHash },
        data: {
          revoked: true,
          replacedByToken: newTokenHash,
        },
      }),
      this.prisma.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId,
          expiresAt,
        },
      }),
    ]);

    return newToken;
  }

  /**
   * Revoke all refresh tokens for a user (e.g., on logout or security breach)
   */
  async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  /**
   * Revoke a JWT token by adding it to the blacklist
   * @param token - The JWT token to revoke
   */
  revokeAccessToken(token: string): void {
    try {
      // Decode the token to get expiration time
      const decoded = this.jwt.decode(token);

      if (!decoded?.exp) {
        this.logger.warn(
          'Cannot revoke token: Invalid token or missing expiration',
        );
        return;
      }

      // Calculate time until expiration (in milliseconds)
      const expiresAt = decoded.exp * 1000; // JWT exp is in seconds
      const now = Date.now();
      const expiresInMs = expiresAt - now;

      // Only blacklist if token hasn't expired yet
      if (expiresInMs > 0) {
        this.jwtBlacklist.addToBlacklist(token, expiresInMs);
        this.logger.log('Token revoked and added to blacklist');
      } else {
        this.logger.debug('Token already expired, not adding to blacklist');
      }
    } catch (error) {
      this.logger.error('Error revoking token:', error);
      throw error;
    }
  }

  /**
   * Decode a JWT token without verification
   */
  decodeToken(token: string): JwtPayload | null {
    return this.jwt.decode(token);
  }

  /**
   * Verify a JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync(token);
    } catch (error) {
      this.logger.debug('Token verification failed', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
