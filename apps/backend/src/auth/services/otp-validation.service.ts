import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from '../../otp/otp.service';
import { EmailService } from '../../email/email.service';
import { User } from '@prisma/client';

@Injectable()
export class OtpValidationService {
  private readonly logger = new Logger(OtpValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Request OTP for Client or Employee login
   */
  async requestOtpForLogin(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!user) {
      // Return generic message to prevent user enumeration
      return {
        message:
          'If the email exists and is valid, you will receive an OTP code',
        requiresPasswordSetup: false,
      };
    }

    // We don't validate isActive here because new users will be inactive
    // until they set their password

    const token = await this.otpService.createOtp(user.id);

    // Send appropriate email based on user status
    if (user.passwordHash) {
      // Existing user - send login OTP email
      await this.emailService.sendOtpEmail(
        user.email,
        token,
        `${user.firstName} ${user.lastName}`,
        'login',
      );
    } else {
      // New user - send account verification email
      await this.emailService.sendOtpEmail(
        user.email,
        token,
        `${user.firstName} ${user.lastName}`,
        'new_user',
      );
    }

    return {
      message: 'OTP sent to email',
      requiresPasswordSetup: !user.passwordHash,
    };
  }

  /**
   * Verify OTP for Client or Employee logic
   * Returns the user if successful, throws if not
   */
  async verifyOtpForLogin(email: string, token: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!user) {
      this.logger.warn(`Failed OTP verification attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.otpService.verifyOtp(user.id, token);
    if (!isValid) {
      this.logger.warn(
        `Failed OTP verification for user ${user.id} (${email}): Invalid or expired token`,
      );
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    this.logger.log(
      `Successful OTP verification for user ${user.id} (${email})`,
    );

    return user;
  }
}
