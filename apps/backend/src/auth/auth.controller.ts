import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { IpAddress } from './decorators/ip-address.decorator';
import { UserAgent } from './decorators/user-agent.decorator';
import type { UserPayload } from './interfaces/user.interface';
import { RATE_LIMIT_AUTH } from '../common/constants/timeouts.constants';
import { AuditService, AuditAction } from '../audit/audit.service';
import { safeAuditLog } from '../audit/audit.helper';
import { COOKIE_MAX_AGE_ONE_DAY } from '../common/constants/time.constants';
import { getCookieSecurityConfig } from '../common/utils/request.utils';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Set authentication cookie with secure settings
   * Uses centralized cookie security configuration
   */
  private setAuthCookie(res: Response, token: string, req?: Request): void {
    const config = getCookieSecurityConfig(req);

    const cookieOptions = {
      httpOnly: true,
      secure: config.useSecureCookie,
      sameSite: config.sameSite,
      maxAge: COOKIE_MAX_AGE_ONE_DAY,
      path: '/',
    };

    this.logger.debug(
      `Auth Cookie Settings: secure=${config.useSecureCookie}, sameSite=${config.sameSite}, isHttps=${config.isHttps}, host=${req?.headers.host || 'unknown'}`,
    );

    res.cookie('access_token', token, cookieOptions as any);
  }

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get CSRF token',
    description:
      'Returns a CSRF token for subsequent requests. The token will be sent in the X-CSRF-Token header.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token generated successfully',
    schema: {
      example: { message: 'CSRF token generated' },
    },
  })
  async getCsrfToken(@Res({ passthrough: true }) res: Response) {
    // Disable caching for this endpoint to always get fresh CSRF token
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // The CSRF middleware will generate and set the token automatically
    // We just need to return a success message with timestamp to prevent 304
    // The token will be available in the X-CSRF-Token response header
    return {
      message: 'CSRF token generated',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('check-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMIT_AUTH.CHECK_EMAIL })
  @ApiOperation({
    summary: 'Check if email exists and requires password setup',
    description:
      'Returns minimal information to prevent user enumeration. Used for UI flow decisions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email check successful',
    schema: {
      example: { requiresPasswordSetup: false },
    },
  })
  async checkEmail(@Body() checkEmailDto: CheckEmailDto) {
    return this.authService.checkEmail(checkEmailDto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMIT_AUTH.LOGIN })
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates admin or client users. Sets httpOnly cookie with JWT and returns user data.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. JWT token is set in httpOnly cookie, not in response body.',
    schema: {
      example: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or inactive user',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    // Log login attempt for debugging (only in development/debug mode)
    this.logger.debug(`Login attempt for email: ${loginDto.email}`, {
      email: loginDto.email,
      host: req.headers.host,
      origin: req.headers.origin,
      forwardedHost: req.headers['x-forwarded-host'],
      forwardedProto: req.headers['x-forwarded-proto'],
    });

    const result = await this.authService.loginAdmin(
      loginDto.email,
      loginDto.password,
    );

    // Audit log for successful login (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: result.user.id,
        action: AuditAction.LOGIN,
        resourceType: 'auth',
        resourceId: result.user.id,
        ipAddress,
        userAgent,
        details: {
          email: loginDto.email,
          role: result.user.role,
          method: 'password',
        },
      },
      'login',
    );

    // Set access token cookie (short-lived)
    this.setAuthCookie(res, result.access_token, req);

    // Set refresh token cookie (long-lived)
    this.setRefreshTokenCookie(res, result.refresh_token, req);

    // Return only user data
    return { user: result.user };
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMIT_AUTH.OTP_REQUEST })
  async requestOtp(
    @Body() requestOtpDto: RequestOtpDto,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.authService.requestOtpForClient(
      requestOtpDto.email,
    );

    // Audit log for OTP request (userId not available yet) (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        action: AuditAction.OTP_REQUEST,
        resourceType: 'auth',
        ipAddress,
        userAgent,
        details: {
          email: requestOtpDto.email,
        },
      },
      'OTP request',
    );

    return result;
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMIT_AUTH.OTP_VERIFY })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.authService.verifyOtpForClient(
      verifyOtpDto.email,
      verifyOtpDto.token,
    );

    // Audit log for successful OTP verification (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: result.user.id,
        action: AuditAction.OTP_VERIFY,
        resourceType: 'auth',
        resourceId: result.user.id,
        ipAddress,
        userAgent,
        details: {
          email: verifyOtpDto.email,
          role: result.user.role,
          method: 'otp',
        },
      },
      'OTP verification',
    );

    // Set access token cookie (short-lived)
    this.setAuthCookie(res, result.access_token, req);

    // Set refresh token cookie (long-lived)
    this.setRefreshTokenCookie(res, result.refresh_token, req);

    // Return only user data
    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Uses httpOnly refresh token cookie to issue new access and refresh tokens',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token found');
    }

    try {
      const result = await this.authService.refresh(refreshToken);

      // Set access token cookie (short-lived)
      this.setAuthCookie(res, result.access_token, req);

      // Set refresh token cookie (long-lived)
      this.setRefreshTokenCookie(res, result.refresh_token, req);

      return { user: result.user };
    } catch (error) {
      // Clear cookies if refresh fails (security)
      this.clearAuthCookies(res, req);
      throw error;
    }
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setPassword(
    @CurrentUser() user: UserPayload,
    @Body() setPasswordDto: SetPasswordDto,
  ) {
    return this.authService.setPassword(
      user.userId,
      setPasswordDto.password,
      setPasswordDto.confirmPassword,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: UserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.authService.changePassword(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      changePasswordDto.confirmPassword,
    );

    // Audit log for password change (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.PASSWORD_CHANGE,
        resourceType: 'user',
        resourceId: user.userId,
        ipAddress,
        userAgent,
      },
      'password change',
    );

    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMIT_AUTH.FORGOT_PASSWORD })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: RATE_LIMIT_AUTH.RESET_PASSWORD })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
      resetPasswordDto.confirmPassword,
    );

    // Audit log for password reset (userId not available in result) (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        action: AuditAction.PASSWORD_RESET,
        resourceType: 'user',
        ipAddress,
        userAgent,
        details: {
          email: resetPasswordDto.email,
        },
      },
      'password reset',
    );

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    // Revoke access token
    const token = this.extractTokenFromRequest(req);
    if (token) {
      await this.authService.revokeToken(token);
    }

    // Revoke all refresh tokens for user (security best practice)
    await this.authService.revokeAllRefreshTokens(user.userId);

    // Audit log for logout (non-blocking)
    await safeAuditLog(
      this.auditService,
      {
        userId: user.userId,
        action: AuditAction.LOGOUT,
        resourceType: 'auth',
        resourceId: user.userId,
        ipAddress,
        userAgent,
      },
      'logout',
    );

    // Clear cookies
    this.clearAuthCookies(res, req);

    return { message: 'Logged out successfully' };
  }

  /**
   * Helper to set refresh token cookie
   */
  private setRefreshTokenCookie(
    res: Response,
    token: string,
    req?: Request,
  ): void {
    const config = getCookieSecurityConfig(req);

    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: config.useSecureCookie,
      sameSite: config.sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth', // Restrict to auth endpoints (login, refresh, logout)
    });
  }

  /**
   * Helper to clear auth cookies
   */
  private clearAuthCookies(res: Response, req?: Request): void {
    const config = getCookieSecurityConfig(req);

    const cookieOptions = {
      httpOnly: true,
      secure: config.useSecureCookie,
      sameSite: config.sameSite,
      path: '/',
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', {
      ...cookieOptions,
      path: '/api/v1/auth',
    });
  }

  /**
   * Extract JWT token from request
   * Checks both Authorization header and httpOnly cookie
   */
  private extractTokenFromRequest(
    request: Request & { cookies?: Record<string, string> },
  ): string | null {
    // Check Authorization header first
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check httpOnly cookie as fallback
    const cookieToken = request.cookies?.access_token;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }
}
