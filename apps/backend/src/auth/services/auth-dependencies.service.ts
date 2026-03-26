import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from '../../otp/otp.service';
import { EmailService } from '../../email/email.service';
import { JwtBlacklistService } from '../jwt-blacklist.service';
import { AccountLockoutService } from './account-lockout.service';
import { PasswordService } from './password.service';

/**
 * Facade service that aggregates auth-related dependencies
 * Reduces coupling by providing a single injection point for auth operations
 *
 * This follows the Facade pattern to simplify complex subsystem interactions
 */
@Injectable()
export class AuthDependenciesService {
  constructor(
    public readonly jwt: JwtService,
    public readonly config: ConfigService,
    public readonly otp: OtpService,
    public readonly email: EmailService,
    public readonly jwtBlacklist: JwtBlacklistService,
    public readonly accountLockout: AccountLockoutService,
    public readonly password: PasswordService,
  ) {}

  /**
   * Generate JWT access token
   */
  async generateAccessToken(payload: Record<string, unknown>): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  /**
   * Get JWT secret from config
   */
  getJwtSecret(): string {
    return this.config.get<string>('JWT_SECRET') || '';
  }

  /**
   * Get JWT expiration from config
   */
  getJwtExpiration(): string {
    return this.config.get<string>('JWT_EXPIRATION') || '1d';
  }
}
