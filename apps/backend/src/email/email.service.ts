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
    this.logger.debug(`Email User: ${this.configService.get<string>('EMAIL_USER') ? '***SET***' : 'NOT SET'}`);
    this.logger.debug(`Email Pass: ${this.configService.get<string>('EMAIL_PASSWORD') ? '***SET***' : 'NOT SET'}`);
    this.logger.debug(`Email From: ${this.configService.get<string>('EMAIL_FROM')}`);
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
   * Send welcome email to new users
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    origin: string,
  ): Promise<void> {
    try {
      const emailFrom = this.configService.get<string>('EMAIL_FROM');

      // origin is required to ensure the login link is correct for the user's context
      if (!origin) {
        this.logger.error('sendWelcomeEmail called without origin - cannot send email with incorrect link');
        return; // Silently fail to avoid blocking user creation
      }

      // Construct the full login URL using the provided origin
      const loginUrl = `${origin}/login`;

      const mailOptions = {
        from: emailFrom,
        to: to,
        subject: 'Welcome to Align Designs Platform',
        html: getBaseEmailTemplate({
          title: 'Welcome to Align Designs!',
          userName,
          preMessage: 'Your account has been successfully created.',
          bodyContent: `
            <p>You can now log in to the platform using your email address: <strong>${to}</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Log In Now</a>
            </div>
            <p><strong>To set your password:</strong></p>
            <ol>
              <li>Go to the login page.</li>
              <li>Enter your email and click "Continue".</li>
              <li>You will receive a verification code via email.</li>
              <li>Enter the verification code.</li>
              <li>Create your secure password.</li>
            </ol>
          `,
          postMessage: 'We are excited to have you on board!',
          warningMessage: '',
        }),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      // Don't throw to avoid blocking user creation if email fails
    }
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
    origin: string,
  ): Promise<void> {
    try {
      const emailFrom = this.configService.get<string>('EMAIL_FROM');

      // origin is required to ensure the reset link is correct for the user's context
      if (!origin) {
        this.logger.error('sendPasswordResetEmail called without origin - cannot send email with incorrect link');
        throw new InternalServerErrorException('Origin is required to send password reset email.');
      }

      const resetLink = `${origin}/reset-password?token=${resetToken}`;

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
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    to: string,
    clientName: string,
    invoiceNumber: string,
    amount: number,
    dueDate: Date,
    pdfBuffer: Buffer,
  ): Promise<void> {
    try {
      const formattedAmount = amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });

      const formattedDueDate = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Align Designs</h1>
            <p style="color: #d4af37; margin: 10px 0 0 0; font-size: 14px;">Professional Design Solutions</p>
          </div>

          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #1e3a5f; margin: 0 0 20px 0; font-size: 24px;">New Invoice</h2>

            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Dear ${escapeHtml(clientName)},
            </p>

            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Thank you for choosing Align Designs! We've generated a new invoice for your project.
            </p>

            <div style="background: #f8f9fa; border-left: 4px solid #d4af37; padding: 20px; margin: 30px 0; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-weight: bold; font-size: 14px; text-align: right;">${escapeHtml(invoiceNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Amount Due:</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-weight: bold; font-size: 18px; text-align: right;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Due Date:</td>
                  <td style="padding: 8px 0; color: #dc3545; font-weight: bold; font-size: 14px; text-align: right;">${formattedDueDate}</td>
                </tr>
              </table>
            </div>

            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Please find your detailed invoice attached to this email as a PDF document. You can view, download, and print it for your records.
            </p>

            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>⚠️ Payment Instructions:</strong><br>
                Please include your invoice number <strong>${escapeHtml(invoiceNumber)}</strong> in the payment reference.
              </p>
            </div>

            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              If you have any questions about this invoice, please don't hesitate to contact us at
              <a href="mailto:invoices@aligndesigns.com" style="color: #d4af37; text-decoration: none;">invoices@aligndesigns.com</a>
              or call us at <strong>+1 (415) 555-0123</strong>.
            </p>

            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-top: 30px;">
              Thank you for your business!
            </p>

            <p style="color: #666666; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #1e3a5f;">The Align Designs Team</strong>
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              Align Designs | 1234 Creative Avenue, Suite 500, San Francisco, CA 94102
            </p>
            <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
              <a href="https://www.aligndesigns.com" style="color: #d4af37; text-decoration: none;">www.aligndesigns.com</a>
            </p>
          </div>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject: `Invoice ${invoiceNumber} from Align Designs - ${formattedAmount} Due`,
        html: emailContent,
        attachments: [
          {
            filename: `Invoice-${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(`Invoice email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice email to ${to} (Attempted to send PDF: ${pdfBuffer ? 'Yes' : 'No'}, Size: ${pdfBuffer?.length} bytes):`, error);
      if (error && typeof error === 'object') {
        this.logger.error('Error details:', JSON.stringify(error, null, 2));
      }
      throw new InternalServerErrorException('Failed to send invoice email');
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
