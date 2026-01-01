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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private auditService: AuditService,
  ) { }

  /**
   * Set authentication cookie with secure settings
   * Centralizes cookie configuration to follow DRY principle
   * Uses Origin/Referer/Host detection to determine secure flag (same as CSRF middleware)
   */
  private setAuthCookie(res: Response, token: string, req?: Request): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // Determine if request is actually over HTTPS
    // Priority: Origin header > Referer header > Host check for ngrok
    // This matches the CSRF middleware logic
    let isHttps = false;
    if (req) {
      const origin = req.headers.origin as string | undefined;
      const referer = req.headers.referer as string | undefined;
      const host = req.headers.host as string | undefined;

      if (origin) {
        isHttps = origin.startsWith('https://');
      } else if (referer) {
        isHttps = referer.startsWith('https://');
      } else if (host) {
        // ngrok domains always use HTTPS, local domains use HTTP
        isHttps = host.includes('.ngrok') || host.includes('.ngrok-free.dev');
      }
    }

    const useSecureCookie = isHttps || isProduction;

    // When secure is true (HTTPS), we can use sameSite: 'none' for cross-origin
    // When secure is false (HTTP), we must use 'lax' or 'strict'
    const sameSite = useSecureCookie ? 'none' : (isProduction ? 'strict' : 'lax');

    const cookieOptions = {
      httpOnly: true,
      secure: useSecureCookie,
      sameSite: sameSite as 'strict' | 'lax' | 'none',
      maxAge: COOKIE_MAX_AGE_ONE_DAY,
      path: '/',
    };

    this.logger.debug(`Auth Cookie Settings: secure=${useSecureCookie}, sameSite=${sameSite}, isHttps=${isHttps}, host=${req?.headers.host || 'unknown'}`);

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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
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

    // Set JWT as httpOnly cookie for enhanced security
    this.setAuthCookie(res, result.access_token, req);

    // Return only user data (token is in httpOnly cookie, not in response body)
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

    // Set JWT as httpOnly cookie for enhanced security
    this.setAuthCookie(res, result.access_token, req);

    // Return only user data (token is in httpOnly cookie, not in response body)
    return { user: result.user };
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
    // Extract token from request to revoke it
    const token = this.extractTokenFromRequest(req);
    if (token) {
      await this.authService.revokeToken(token);
    }

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

    // Clear the access_token cookie with matching settings
    // Use the same Origin/Referer/Host detection logic as setAuthCookie
    const isProduction = process.env.NODE_ENV === 'production';
    let isHttps = false;
    const origin = req.headers.origin as string | undefined;
    const referer = req.headers.referer as string | undefined;
    const host = req.headers.host as string | undefined;

    if (origin) {
      isHttps = origin.startsWith('https://');
    } else if (referer) {
      isHttps = referer.startsWith('https://');
    } else if (host) {
      isHttps = host.includes('.ngrok') || host.includes('.ngrok-free.dev');
    }

    const useSecureCookie = isHttps || isProduction;
    const sameSite = useSecureCookie ? 'none' : (isProduction ? 'strict' : 'lax');

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: useSecureCookie,
      sameSite: sameSite as 'strict' | 'lax' | 'none',
      path: '/',
    });

    return { message: 'Logged out successfully' };
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
    if (authHeader && authHeader.startsWith('Bearer ')) {
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
