import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  getBaseEmailTemplate,
  getOtpCodeHtml,
  escapeHtml,
} from './templates/base-email.template';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private isHealthy: boolean = false;
  private emailFrom: string;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize Resend client
   */
  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      this.emailFrom = this.configService.get<string>('EMAIL_FROM', 'Align Designs <onboarding@resend.dev>');

      if (!apiKey) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      this.resend = new Resend(apiKey);

      this.logger.log(`Email service configured with Resend API`);
      this.logger.debug(`Email From: ${this.emailFrom}`);

      // Test the connection by checking if API key is valid format
      if (apiKey.startsWith('re_')) {
        this.isHealthy = true;
        this.logger.log('✓ Resend API configured successfully');
      } else {
        throw new Error('Invalid Resend API key format');
      }
    } catch (error) {
      this.isHealthy = false;
      this.logger.error(
        '✗ Resend configuration failed. Email functionality may not work properly.',
        error,
      );
      this.logger.warn(
        'Please check your RESEND_API_KEY environment variable.',
      );
      // Don't throw - allow app to start without email
      this.logger.warn('Application will start but email sending will be disabled.');
    }
  }

  /**
   * Check if the email service is healthy and ready to send emails
   */
  isServiceHealthy(): boolean {
    return this.isHealthy;
  }

  /**
   * Generic method to send emails via Resend
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<void> {
    if (!this.isHealthy) {
      this.logger.warn(`Email not sent (service not configured): ${subject} to ${to}`);
      return;
    }

    try {
      const emailOptions: any = {
        from: this.emailFrom,
        to,
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        emailOptions.attachments = attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const { data, error } = await this.resend.emails.send(emailOptions);

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Email sent successfully to ${to} (ID: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw new InternalServerErrorException(
        'Failed to send email. Please try again later.',
      );
    }
  }

  /**
   * Generic method to send OTP emails
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
    const html = getBaseEmailTemplate({
      title,
      userName,
      preMessage,
      bodyContent: getOtpCodeHtml(otpCode),
      postMessage: 'This code will expire in <strong>10 minutes</strong>.',
      warningMessage,
    });

    try {
      await this.sendEmail(to, `${subject} - Align Designs`, html);
      this.logger.log(`${logPrefix} email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send ${logPrefix} email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    origin: string,
  ): Promise<void> {
    if (!origin) {
      this.logger.error('sendWelcomeEmail called without origin - cannot send email with incorrect link');
      return;
    }

    const loginUrl = `${origin}/login`;

    const html = getBaseEmailTemplate({
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
    });

    try {
      await this.sendEmail(to, 'Welcome to Align Designs Platform', html);
      this.logger.log(`Welcome email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      // Don't throw to avoid blocking user creation if email fails
    }
  }

  /**
   * Send OTP Email (Generic wrapper for different types)
   */
  async sendOtpEmail(
    to: string,
    otpCode: string,
    userName: string,
    type: 'new_user' | 'login' | 'password_recovery' = 'login',
  ): Promise<void> {
    let subject = 'Verification Code';
    let title = 'Verification Code';
    let message = 'Hello {userName},<br>Use the following code to log in:';
    let disclaimer = 'If you did not request this code, please ignore this message.';
    let context = 'OTP';

    if (type === 'new_user') {
      subject = 'Account Verification';
      title = 'Account Verification';
      message = 'Hello {userName},<br>Welcome to Align Designs! Use this code to verify your account and create your password:';
      disclaimer = 'If you did not create this account, please ignore this message.';
      context = 'New user OTP';
    } else if (type === 'password_recovery') {
      subject = 'Password Recovery Code';
      title = 'Password Recovery Code';
      message = 'Hello {userName},<br>Use this code to reset your password:';
      disclaimer = 'If you did not request this password reset, please ignore this message.';
      context = 'Password recovery OTP';
    }

    return this.sendOtpEmailGeneric(
      to,
      otpCode,
      userName,
      subject,
      title,
      message,
      disclaimer,
      context,
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
    if (!origin) {
      this.logger.error('sendPasswordResetEmail called without origin - cannot send email with incorrect link');
      throw new InternalServerErrorException('Origin is required to send password reset email.');
    }

    const resetLink = `${origin}/reset-password?token=${resetToken}`;
    const html = this.getPasswordResetEmailTemplate(resetLink, userName);

    await this.sendEmail(to, 'Password Recovery - Align Designs', html);
    this.logger.log(`Password reset email sent successfully to ${to}`);
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
            If you did not request this change, please ignore this message and your password will remain unchanged.
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
    const html = getBaseEmailTemplate({
      title,
      userName: 'User',
      preMessage: message,
      bodyContent: actionLink ? `<div style="text-align: center; margin: 30px 0;"><a href="${actionLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${actionText || 'View Details'}</a></div>` : '',
      postMessage: '',
      warningMessage: '',
    });

    try {
      await this.sendEmail(to, `${subject} - Align Designs`, html);
      this.logger.log(`Notification email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${to}:`, error);
      // Don't throw to avoid breaking the main flow
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
            Please find your detailed invoice attached to this email as a PDF document.
          </p>

          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Payment Instructions:</strong><br>
              Please include your invoice number <strong>${escapeHtml(invoiceNumber)}</strong> in the payment reference.
            </p>
          </div>

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
            Align Designs | Professional Design Solutions
          </p>
        </div>
      </div>
    `;

    await this.sendEmail(
      to,
      `Invoice ${invoiceNumber} from Align Designs - ${formattedAmount} Due`,
      emailContent,
      [{ filename: `Invoice-${invoiceNumber}.pdf`, content: pdfBuffer }],
    );

    this.logger.log(`Invoice email sent successfully to ${to}`);
  }

  /**
   * Check if email service is healthy
   */
  async checkHealth(): Promise<boolean> {
    return this.isHealthy;
  }
}
