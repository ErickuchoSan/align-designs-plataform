import { Test, TestingModule } from '@nestjs/testing';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock PDFKit
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const events: Record<string, Function> = {};
    return {
      on: jest.fn((event: string, callback: Function) => {
        events[event] = callback;
        return this;
      }),
      emit: jest.fn((event: string, data?: any) => {
        if (events[event]) {
          events[event](data);
        }
      }),
      page: { width: 612, height: 792 },
      fontSize: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      strokeColor: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      rect: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      lineWidth: jest.fn().mockReturnThis(),
      roundedRect: jest.fn().mockReturnThis(),
      save: jest.fn().mockReturnThis(),
      restore: jest.fn().mockReturnThis(),
      rotate: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn(function (this: any) {
        // Simulate async PDF generation
        setTimeout(() => {
          if (events['data']) {
            events['data'](Buffer.from('mock-pdf-data'));
          }
          if (events['end']) {
            events['end']();
          }
        }, 10);
      }),
    };
  });
});

describe('InvoicePdfService', () => {
  let service: InvoicePdfService;

  const mockInvoice = {
    id: 'invoice-123',
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-123',
    projectId: 'project-123',
    subtotal: new Decimal(1000),
    tax: new Decimal(0),
    totalAmount: new Decimal(1000),
    amountPaid: new Decimal(0),
    status: InvoiceStatus.DRAFT,
    issueDate: new Date('2024-01-15'),
    dueDate: new Date('2024-01-30'),
    paymentTermsDays: 15,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    project: { name: 'Test Project' },
    client: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      phone: '555-1234',
      company: 'Test Company',
    },
    items: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoicePdfService],
    }).compile();

    service = module.get<InvoicePdfService>(InvoicePdfService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInvoicePDF', () => {
    it('should generate PDF buffer for invoice', async () => {
      const result = await service.generateInvoicePDF(mockInvoice);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should generate PDF for paid invoice', async () => {
      const paidInvoice = {
        ...mockInvoice,
        status: InvoiceStatus.PAID,
        amountPaid: new Decimal(1000),
      };

      const result = await service.generateInvoicePDF(paidInvoice);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle invoice with partial payment', async () => {
      const partialPaymentInvoice = {
        ...mockInvoice,
        status: InvoiceStatus.SENT,
        amountPaid: new Decimal(500),
      };

      const result = await service.generateInvoicePDF(partialPaymentInvoice);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle invoice with line items', async () => {
      const invoiceWithItems = {
        ...mockInvoice,
        items: [
          { description: 'Design Services', amount: new Decimal(500) },
          { description: 'Development', amount: new Decimal(500) },
        ],
      };

      const result = await service.generateInvoicePDF(invoiceWithItems);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle invoice without client', async () => {
      const invoiceWithoutClient = {
        ...mockInvoice,
        client: undefined,
      };

      const result = await service.generateInvoicePDF(invoiceWithoutClient);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle invoice without project', async () => {
      const invoiceWithoutProject = {
        ...mockInvoice,
        project: undefined,
      };

      const result = await service.generateInvoicePDF(invoiceWithoutProject);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle numeric amounts', async () => {
      const invoiceWithNumericAmounts = {
        ...mockInvoice,
        subtotal: 1000,
        totalAmount: 1000,
        amountPaid: 500,
        items: [{ description: 'Service', amount: 1000 }],
      } as any;

      const result = await service.generateInvoicePDF(
        invoiceWithNumericAmounts,
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
