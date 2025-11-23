import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtBlacklistService } from '../jwt-blacklist.service';
import { User } from '../interfaces/user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Token Service - Handles JWT token generation and revocation
 * Extracted from AuthService for better separation of concerns
 *
 * Responsibilities:
 * - Generate JWT tokens
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
  ) {}

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRATION', '1d'),
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

  /**
   * Revoke a JWT token by adding it to the blacklist
   * @param token - The JWT token to revoke
   */
  async revokeToken(token: string): Promise<void> {
    try {
      // Decode the token to get expiration time
      const decoded = this.jwt.decode(token) as JwtPayload;

      if (!decoded || !decoded.exp) {
        this.logger.warn('Cannot revoke token: Invalid token or missing expiration');
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
    return this.jwt.decode(token) as JwtPayload | null;
  }

  /**
   * Verify a JWT token
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
