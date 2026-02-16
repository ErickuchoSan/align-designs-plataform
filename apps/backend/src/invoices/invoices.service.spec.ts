import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { EmailService } from '../email/email.service';
import { InvoiceStatus, NotificationType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InvoicesService', () => {
    let service: InvoicesService;
    let prismaService: any;
    let notificationsService: any;
    let invoicePdfService: any;
    let emailService: any;

    const mockProjectId = 'project-123';
    const mockInvoiceId = 'invoice-123';
    const mockClientId = 'client-123';

    const mockInvoice = {
        id: mockInvoiceId,
        invoiceNumber: 'INV-2024-01-01-001',
        projectId: mockProjectId,
        clientId: mockClientId,
        subtotal: 1000,
        taxAmount: 0,
        totalAmount: 1000,
        amountPaid: 0,
        status: InvoiceStatus.DRAFT,
        dueDate: new Date(),
        sentToClientAt: null,
        client: {
            firstName: 'Test',
            lastName: 'Client',
            email: 'test@example.com',
        },
        project: {
            name: 'Test Project',
            clientId: mockClientId,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InvoicesService,
                {
                    provide: PrismaService,
                    useValue: {
                        invoice: {
                            findMany: jest.fn(),
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            findFirst: jest.fn(),
                            update: jest.fn(),
                            count: jest.fn(),
                            aggregate: jest.fn(),
                        },
                        payment: {
                            findMany: jest.fn(),
                            updateMany: jest.fn(),
                        },
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        create: jest.fn(),
                    },
                },
                {
                    provide: InvoicePdfService,
                    useValue: {
                        generateInvoicePDF: jest.fn().mockResolvedValue(Buffer.from('pdf')),
                    },
                },
                {
                    provide: EmailService,
                    useValue: {
                        sendInvoiceEmail: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<InvoicesService>(InvoicesService);
        prismaService = module.get<PrismaService>(PrismaService);
        notificationsService = module.get<NotificationsService>(NotificationsService);
        invoicePdfService = module.get<InvoicePdfService>(InvoicePdfService);
        emailService = module.get<EmailService>(EmailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createDto: any = {
            projectId: mockProjectId,
            totalAmount: 1000,
            dueDate: new Date().toISOString(),
        };

        it('should create invoice manually', async () => {
            prismaService.invoice.findMany.mockResolvedValue([]); // No pending invoices
            prismaService.invoice.findFirst.mockResolvedValue(null); // For generating number
            prismaService.invoice.create.mockResolvedValue(mockInvoice);
            prismaService.invoice.findUnique.mockResolvedValue(mockInvoice); // For full data
            prismaService.invoice.update.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(prismaService.invoice.create).toHaveBeenCalled();
            expect(invoicePdfService.generateInvoicePDF).toHaveBeenCalled();
            expect(emailService.sendInvoiceEmail).toHaveBeenCalled();
            expect(prismaService.invoice.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: mockInvoiceId },
                    data: expect.objectContaining({ status: InvoiceStatus.SENT }),
                }),
            );
        });

        it('should throw BadRequest if project has unpaid invoices', async () => {
            prismaService.invoice.findMany.mockResolvedValue([
                { ...mockInvoice, totalAmount: 1000, amountPaid: 500 },
            ]);

            await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('createInvoiceForProject', () => {
        it('should create invoice and link existing payments', async () => {
            prismaService.invoice.findFirst.mockResolvedValue(null);
            prismaService.invoice.create.mockResolvedValue(mockInvoice);
            prismaService.payment.findMany.mockResolvedValue([
                { id: 'p1', amount: 500 },
            ]); // Has initial payment
            prismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
            prismaService.invoice.update.mockResolvedValue({ ...mockInvoice, status: InvoiceStatus.SENT });

            await service.createInvoiceForProject(mockProjectId, mockClientId, 1000);

            expect(prismaService.invoice.create).toHaveBeenCalled();
            expect(prismaService.payment.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: { in: ['p1'] } },
                    data: { invoiceId: mockInvoiceId },
                }),
            );
            // Should update invoice amount paid
            expect(prismaService.invoice.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: mockInvoiceId },
                    data: expect.objectContaining({ amountPaid: 500 }),
                }),
            );
        });
    });

    describe('checkOverdueInvoices', () => {
        it('should mark overdue invoices and notify', async () => {
            const overdueInvoice = { ...mockInvoice, status: InvoiceStatus.SENT };
            prismaService.invoice.findMany.mockResolvedValue([overdueInvoice]);

            await service.checkOverdueInvoices();

            expect(prismaService.invoice.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: overdueInvoice.id },
                    data: { status: InvoiceStatus.OVERDUE },
                }),
            );
            expect(notificationsService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockClientId,
                    type: NotificationType.WARNING,
                }),
            );
        });
    });

    describe('resendInvoiceEmail', () => {
        it('should resend email and update status to SENT', async () => {
            const draftInvoice = { ...mockInvoice, status: InvoiceStatus.DRAFT };
            // First call for findOne, subsequent calls for updateStatus
            prismaService.invoice.findUnique.mockResolvedValue(draftInvoice);
            prismaService.invoice.update.mockResolvedValue({ ...draftInvoice, status: InvoiceStatus.SENT });

            await service.resendInvoiceEmail(mockInvoiceId);

            expect(invoicePdfService.generateInvoicePDF).toHaveBeenCalled();
            expect(emailService.sendInvoiceEmail).toHaveBeenCalled();
            expect(prismaService.invoice.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: mockInvoiceId },
                    data: expect.objectContaining({ status: InvoiceStatus.SENT }),
                }),
            );
        });
    });
});
