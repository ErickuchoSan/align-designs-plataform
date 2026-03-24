import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

// Mock @react-email/render - returns HTML containing props values for testing
jest.mock('@react-email/render', () => ({
  render: jest.fn().mockImplementation((component) => {
    // Extract props from the React element to include in mocked HTML
    const props = component?.props || {};
    const propsJson = JSON.stringify(props);
    return Promise.resolve(
      `<html><body>Mocked Email HTML - Props: ${propsJson}</body></html>`,
    );
  }),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: any;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        RESEND_API_KEY: 're_test_api_key_123',
        EMAIL_FROM: 'Test <test@resend.dev>',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize the service
    await service.onModuleInit();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize with valid API key', async () => {
      await service.onModuleInit();
      expect(service.isServiceHealthy()).toBe(true);
    });

    it('should not throw when API key is missing (graceful degradation)', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const newService = new EmailService(configService);
      await newService.onModuleInit();

      expect(newService.isServiceHealthy()).toBe(false);
    });

    it('should not throw when API key format is invalid', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'RESEND_API_KEY') return 'invalid_key';
        return 'Test <test@resend.dev>';
      });

      const newService = new EmailService(configService);
      await newService.onModuleInit();

      expect(newService.isServiceHealthy()).toBe(false);
    });
  });

  describe('isServiceHealthy', () => {
    it('should return health status', () => {
      expect(typeof service.isServiceHealthy()).toBe('boolean');
    });
  });

  describe('checkHealth', () => {
    it('should return health status asynchronously', async () => {
      const result = await service.checkHealth();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('sendWelcomeEmail', () => {
    beforeEach(() => {
      // Ensure service is healthy for email tests
      (service as any).isHealthy = true;
      (service as any).resend = {
        emails: {
          send: jest.fn().mockResolvedValue({ data: { id: 'email-123' } }),
        },
      };
    });

    it('should send welcome email successfully', async () => {
      await service.sendWelcomeEmail(
        'test@test.com',
        'Test User',
        'https://app.example.com',
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: 'Welcome to Align Designs Platform',
        }),
      );
    });

    it('should not throw when origin is missing', async () => {
      // Should log error but not throw
      await expect(
        service.sendWelcomeEmail('test@test.com', 'Test User', ''),
      ).resolves.not.toThrow();
    });

    it('should not send email if service is not healthy', async () => {
      (service as any).isHealthy = false;

      await service.sendWelcomeEmail(
        'test@test.com',
        'Test User',
        'https://app.example.com',
      );

      expect((service as any).resend.emails.send).not.toHaveBeenCalled();
    });
  });

  describe('sendOtpEmail', () => {
    beforeEach(() => {
      (service as any).isHealthy = true;
      (service as any).resend = {
        emails: {
          send: jest.fn().mockResolvedValue({ data: { id: 'email-123' } }),
        },
      };
    });

    it('should send login OTP email', async () => {
      await service.sendOtpEmail(
        'test@test.com',
        '12345678',
        'Test User',
        'login',
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: expect.stringContaining('Verification Code'),
        }),
      );
    });

    it('should send new_user OTP email', async () => {
      await service.sendOtpEmail(
        'test@test.com',
        '12345678',
        'Test User',
        'new_user',
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: expect.stringContaining('Account Verification'),
        }),
      );
    });

    it('should send password_recovery OTP email', async () => {
      await service.sendOtpEmail(
        'test@test.com',
        '12345678',
        'Test User',
        'password_recovery',
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: expect.stringContaining('Password Recovery'),
        }),
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    beforeEach(() => {
      (service as any).isHealthy = true;
      (service as any).resend = {
        emails: {
          send: jest.fn().mockResolvedValue({ data: { id: 'email-123' } }),
        },
      };
    });

    it('should send password reset email with link', async () => {
      await service.sendPasswordResetEmail(
        'test@test.com',
        'reset-token-123',
        'Test User',
        'https://app.example.com',
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: 'Password Recovery - Align Designs',
          html: expect.any(String),
        }),
      );
    });

    it('should throw if origin is missing', async () => {
      await expect(
        service.sendPasswordResetEmail(
          'test@test.com',
          'reset-token-123',
          'Test User',
          '',
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('sendNotificationEmail', () => {
    beforeEach(() => {
      (service as any).isHealthy = true;
      (service as any).resend = {
        emails: {
          send: jest.fn().mockResolvedValue({ data: { id: 'email-123' } }),
        },
      };
    });

    it('should send notification email', async () => {
      await service.sendNotificationEmail(
        'test@test.com',
        'Test Subject',
        'Test Title',
        'Test message',
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: 'Test Subject - Align Designs',
        }),
      );
    });

    it('should send notification email with action link', async () => {
      await service.sendNotificationEmail(
        'test@test.com',
        'Test Subject',
        'Test Title',
        'Test message',
        'https://app.example.com/action',
        'Click Here',
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: 'Test Subject - Align Designs',
          html: expect.any(String),
        }),
      );
    });

    it('should not throw on send error (non-blocking)', async () => {
      (service as any).resend.emails.send.mockRejectedValue(
        new Error('Send failed'),
      );

      await expect(
        service.sendNotificationEmail(
          'test@test.com',
          'Test Subject',
          'Test Title',
          'Test message',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('sendInvoiceEmail', () => {
    beforeEach(() => {
      (service as any).isHealthy = true;
      (service as any).resend = {
        emails: {
          send: jest.fn().mockResolvedValue({ data: { id: 'email-123' } }),
        },
      };
    });

    it('should send invoice email with PDF attachment', async () => {
      const pdfBuffer = Buffer.from('mock-pdf-content');
      const dueDate = new Date('2024-01-30');

      await service.sendInvoiceEmail(
        'test@test.com',
        'John Doe',
        'INV-2024-001',
        1000,
        dueDate,
        pdfBuffer,
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          subject: expect.stringContaining('INV-2024-001'),
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'Invoice-INV-2024-001.pdf',
              content: pdfBuffer,
            }),
          ]),
        }),
      );
    });

    it('should format amount as currency in subject', async () => {
      const pdfBuffer = Buffer.from('mock-pdf-content');
      const dueDate = new Date('2024-01-30');

      await service.sendInvoiceEmail(
        'test@test.com',
        'John Doe',
        'INV-2024-001',
        1500.5,
        dueDate,
        pdfBuffer,
      );

      expect((service as any).resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('$1,500.50'),
        }),
      );
    });
  });
});
