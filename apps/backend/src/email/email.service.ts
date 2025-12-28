import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  EMAIL_STYLES,
  EMAIL_CONTENT,
} from './templates/email-styles.constants';
import {
  getBaseEmailTemplate,
  getOtpCodeHtml,
  escapeHtml,
} from './templates/base-email.template';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private isHealthy: boolean = false;

  constructor(private configService: ConfigService) {
    const emailPort = this.configService.get<number>('EMAIL_PORT', 587);

    // Determine secure flag based on port:
    // - Port 465 requires secure: true (implicit TLS/SSL)
    // - Port 587 uses secure: false with STARTTLS (opportunistic TLS)
    // - Port 25 typically uses secure: false (may use STARTTLS)
    const isSecure = emailPort === 465;

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: emailPort,
      secure: isSecure,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
      // Enable STARTTLS for non-secure connections (ports 587, 25)
      // This upgrades the connection to TLS after initial connection
      requireTLS: !isSecure,
      tls: {
        // Don't fail on invalid certificates in development
        // In production, set EMAIL_REJECT_UNAUTHORIZED=true in .env
        rejectUnauthorized:
          this.configService.get<string>(
            'EMAIL_REJECT_UNAUTHORIZED',
            'true',
          ) === 'true',
        // Minimum TLS version for security
        minVersion: 'TLSv1.2',
      },
    });

    this.logger.log(
      `Email transport configured - Host: ${this.configService.get<string>('EMAIL_HOST')}, Port: ${emailPort}, Secure: ${isSecure}, RequireTLS: ${!isSecure}`,
    );
  }

  /**
   * Verify SMTP connection on module initialization
   * This ensures email service is properly configured before accepting requests
   */
  async onModuleInit() {
    try {
      this.logger.log('Verifying SMTP connection...');
      await this.transporter.verify();
      this.isHealthy = true;
      this.logger.log('✓ SMTP connection verified successfully');
    } catch (error) {
      this.isHealthy = false;
      this.logger.error(
        '✗ SMTP connection verification failed. Email functionality may not work properly.',
        error,
      );
      this.logger.warn(
        'Please check your EMAIL_* environment variables and SMTP server availability.',
      );
      // Throw error to fail fast - email is critical for OTP, password reset, etc.
      throw new InternalServerErrorException(
        'Failed to initialize email service. Please check SMTP configuration.',
      );
    }
  }

  /**
   * Check if the email service is healthy and ready to send emails
   */
  isServiceHealthy(): boolean {
    return this.isHealthy;
  }

  /**
   * Generic method to send OTP emails
   * Consolidates duplicate code for different OTP email types
   */
  private async sendOtpEmailGeneric(
    to: string,
    otpCode: string,
    userName: string,
    subject: string,
    title: string,
    preMessage: string,
    warningMessage: string,
    logPrefix: string,
  ): Promise<void> {
    try {
      const emailFrom = this.configService.get<string>('EMAIL_FROM');

      const mailOptions = {
        from: emailFrom,
        to: to,
        subject: `${subject} - Align Designs`,
        html: getBaseEmailTemplate({
          title,
          userName,
          preMessage,
          bodyContent: getOtpCodeHtml(otpCode),
          postMessage: 'This code will expire in <strong>10 minutes</strong>.',
          warningMessage,
        }),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`${logPrefix} email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send ${logPrefix} email to ${to}:`, error);
      throw new InternalServerErrorException(
        'Failed to send email. Please verify your email configuration.',
      );
    }
  }

  /**
   * Send OTP email for new user account verification and password setup
   */
  async sendNewUserOtpEmail(
    to: string,
    otpCode: string,
    userName: string,
  ): Promise<void> {
    return this.sendOtpEmailGeneric(
      to,
      otpCode,
      userName,
      'Account Verification',
      'Account Verification',
      'Hello {userName},<br>Welcome to Align Designs! Use this code to verify your account and create your password:',
      'If you did not create this account, please ignore this message.',
      'New user OTP',
    );
  }

  /**
   * Send OTP email for user login
   */
  async sendOtpEmail(
    to: string,
    otpCode: string,
    userName: string,
  ): Promise<void> {
    return this.sendOtpEmailGeneric(
      to,
      otpCode,
      userName,
      'Verification Code',
      'Verification Code',
      'Hello {userName},<br>Use the following code to log in:',
      'If you did not request this code, please ignore this message.',
      'OTP',
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string,
  ): Promise<void> {
    try {
      const emailFrom = this.configService.get<string>('EMAIL_FROM');
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3000',
      );
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: emailFrom,
        to: to,
        subject: 'Password Recovery - Align Designs',
        html: this.getPasswordResetEmailTemplate(resetLink, userName),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      throw new InternalServerErrorException(
        'Failed to send email. Please verify your email configuration.',
      );
    }
  }

  /**
   * Send OTP email for password recovery
   */
  async sendPasswordRecoveryOtpEmail(
    to: string,
    otpCode: string,
    userName: string,
  ): Promise<void> {
    return this.sendOtpEmailGeneric(
      to,
      otpCode,
      userName,
      'Password Recovery Code',
      'Password Recovery Code',
      'Hello {userName},<br>Use this code to reset your password:',
      'If you did not request this password reset, please ignore this message.',
      'Password recovery OTP',
    );
  }

  /**
   * HTML template for password reset email
   */
  private getPasswordResetEmailTemplate(
    resetLink: string,
    userName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Recovery</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 30px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .message {
            color: #6b7280;
            margin: 20px 0;
          }
          .warning {
            color: #dc2626;
            font-size: 14px;
            margin-top: 30px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 12px;
          }
          .link-text {
            font-size: 12px;
            color: #9ca3af;
            word-break: break-all;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Align Designs</div>

          <h1>Password Recovery</h1>

          <p class="message">
            Hello ${escapeHtml(userName)},<br>
            We received a request to reset your password.
          </p>

          <a href="${escapeHtml(resetLink)}" class="button">Reset Password</a>

          <p class="message">
            This link will expire in <strong>1 hour</strong>.
          </p>

          <p class="warning">
            ⚠️ If you did not request this change, please ignore this message and your password will remain unchanged.
          </p>

          <div class="link-text">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${escapeHtml(resetLink)}</p>
          </div>

          <div class="footer">
            <p>This is an automated message, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Align Designs. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send a generic notification email
   */
  async sendNotificationEmail(
    to: string,
    subject: string,
    title: string,
    message: string,
    actionLink?: string,
    actionText?: string,
  ): Promise<void> {
    try {
      const emailFrom = this.configService.get<string>('EMAIL_FROM');

      const html = getBaseEmailTemplate({
        title,
        userName: 'User', // Generic greeting or we could pass it
        preMessage: message,
        bodyContent: actionLink ? `<div style="text-align: center; margin: 30px 0;"><a href="${actionLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${actionText || 'View Details'}</a></div>` : '',
        postMessage: '',
        warningMessage: '',
      });

      const mailOptions = {
        from: emailFrom,
        to,
        subject: `${subject} - Align Designs`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Notification email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${to}:`, error);
      // Don't throw error to avoid breaking the main flow if email fails
    }
  }

  /**
   * Check if email service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email service health check failed', error);
      return false;
    }
  }
}
