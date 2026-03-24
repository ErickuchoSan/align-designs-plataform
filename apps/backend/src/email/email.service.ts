import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { OtpEmail } from './templates/OtpEmail';
import { PasswordResetEmail } from './templates/PasswordResetEmail';
import { NotificationEmail } from './templates/NotificationEmail';
import { InvoiceEmail } from './templates/InvoiceEmail';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private isHealthy: boolean = false;
  private emailFrom: string;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Resend client
   */
  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('RESEND_API_KEY');
      this.emailFrom = this.configService.get<string>(
        'EMAIL_FROM',
        'Align Designs <onboarding@resend.dev>',
      );

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
      this.logger.warn(
        'Application will start but email sending will be disabled.',
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
   * Generic method to send emails via Resend
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<void> {
    if (!this.isHealthy) {
      this.logger.warn(
        `Email not sent (service not configured): ${subject} to ${to}`,
      );
      return;
    }

    try {
      const emailOptions: {
        from: string;
        to: string;
        subject: string;
        html: string;
        attachments?: Array<{ filename: string; content: Buffer }>;
      } = {
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
   * Send welcome email to new users
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    origin: string,
  ): Promise<void> {
    if (!origin) {
      this.logger.error(
        'sendWelcomeEmail called without origin - cannot send email with incorrect link',
      );
      return;
    }

    const loginUrl = `${origin}/login`;

    try {
      const html = await render(
        WelcomeEmail({
          userName,
          email: to,
          loginUrl,
        }),
      );

      await this.sendEmail(to, 'Welcome to Align Designs Platform', html);
      this.logger.log(`Welcome email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      // Don't throw to avoid blocking user creation if email fails
    }
  }

  /**
   * Send OTP Email (for login, new user verification, or password recovery)
   */
  async sendOtpEmail(
    to: string,
    otpCode: string,
    userName: string,
    type: 'new_user' | 'login' | 'password_recovery' = 'login',
  ): Promise<void> {
    const subjectMap = {
      login: 'Verification Code',
      new_user: 'Account Verification',
      password_recovery: 'Password Recovery Code',
    };

    const contextMap = {
      login: 'OTP',
      new_user: 'New user OTP',
      password_recovery: 'Password recovery OTP',
    };

    try {
      const html = await render(
        OtpEmail({
          userName,
          otpCode,
          type,
        }),
      );

      await this.sendEmail(
        to,
        `${subjectMap[type]} - Align Designs`,
        html,
      );
      this.logger.log(`${contextMap[type]} email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ${contextMap[type]} email to ${to}:`,
        error,
      );
      throw error;
    }
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
      this.logger.error(
        'sendPasswordResetEmail called without origin - cannot send email with incorrect link',
      );
      throw new InternalServerErrorException(
        'Origin is required to send password reset email.',
      );
    }

    const resetLink = `${origin}/reset-password?token=${resetToken}`;

    const html = await render(
      PasswordResetEmail({
        userName,
        resetLink,
      }),
    );

    await this.sendEmail(to, 'Password Recovery - Align Designs', html);
    this.logger.log(`Password reset email sent successfully to ${to}`);
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
      const html = await render(
        NotificationEmail({
          title,
          message,
          actionLink,
          actionText,
        }),
      );

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

    const html = await render(
      InvoiceEmail({
        clientName,
        invoiceNumber,
        amount,
        dueDate,
      }),
    );

    await this.sendEmail(
      to,
      `Invoice ${invoiceNumber} from Align Designs - ${formattedAmount} Due`,
      html,
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
