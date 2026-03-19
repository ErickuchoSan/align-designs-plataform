import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EmployeePaymentsService } from './employee-payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EmployeePaymentStatus, Role } from '@prisma/client';

describe('EmployeePaymentsService', () => {
  let service: EmployeePaymentsService;
  let prismaService: any;
  let storageService: any;

  const mockProjectId = 'project-123';
  const mockEmployeeId = 'employee-123';
  const mockAdminId = 'admin-123';
  const mockPaymentId = 'payment-123';

  const mockProject = {
    id: mockProjectId,
    name: 'Test Project',
  };

  const mockEmployee = {
    id: mockEmployeeId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
  };

  const mockEmployeePayment = {
    id: mockPaymentId,
    projectId: mockProjectId,
    employeeId: mockEmployeeId,
    amount: 500,
    status: EmployeePaymentStatus.PENDING,
    paymentDate: new Date(),
    employee: mockEmployee,
    project: mockProject,
    receiptFile: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePaymentsService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              findUnique: jest.fn(),
            },
            projectEmployee: {
              findUnique: jest.fn(),
            },
            employeePayment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            file: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
            getDownloadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeePaymentsService>(EmployeePaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      projectId: mockProjectId,
      employeeId: mockEmployeeId,
      amount: 500,
      paymentDate: new Date().toISOString(),
      description: 'Test payment',
    };

    it('should create employee payment successfully', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.projectEmployee.findUnique.mockResolvedValue({
        projectId: mockProjectId,
        employeeId: mockEmployeeId,
      });
      prismaService.employeePayment.create.mockResolvedValue(mockEmployeePayment);

      const result = await service.create(createDto, mockAdminId);

      expect(result).toEqual(mockEmployeePayment);
      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProjectId },
      });
      expect(prismaService.projectEmployee.findUnique).toHaveBeenCalled();
      expect(prismaService.employeePayment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockAdminId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if employee not assigned to project', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.projectEmployee.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, mockAdminId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all payments for admin', async () => {
      prismaService.employeePayment.findMany.mockResolvedValue([mockEmployeePayment]);

      const result = await service.findAll(mockAdminId, Role.ADMIN);

      expect(result).toHaveLength(1);
      expect(prismaService.employeePayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should return only own payments for employee', async () => {
      prismaService.employeePayment.findMany.mockResolvedValue([mockEmployeePayment]);

      const result = await service.findAll(mockEmployeeId, Role.EMPLOYEE);

      expect(result).toHaveLength(1);
      expect(prismaService.employeePayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: mockEmployeeId },
        }),
      );
    });

    it('should throw ForbiddenException for clients', async () => {
      await expect(
        service.findAll('client-123', Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should filter by projectId when provided', async () => {
      prismaService.employeePayment.findMany.mockResolvedValue([mockEmployeePayment]);

      await service.findAll(mockAdminId, Role.ADMIN, mockProjectId);

      expect(prismaService.employeePayment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: mockProjectId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return payment for admin', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);

      const result = await service.findOne(mockPaymentId, mockAdminId, Role.ADMIN);

      expect(result).toEqual(mockEmployeePayment);
    });

    it('should return payment for own employee', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);

      const result = await service.findOne(mockPaymentId, mockEmployeeId, Role.EMPLOYEE);

      expect(result).toEqual(mockEmployeePayment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(mockPaymentId, mockAdminId, Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for different employee', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);

      await expect(
        service.findOne(mockPaymentId, 'other-employee', Role.EMPLOYEE),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for clients', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);

      await expect(
        service.findOne(mockPaymentId, 'client-123', Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDto = { amount: 600, description: 'Updated payment' };

    it('should update pending payment', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);
      const updatedPayment = { ...mockEmployeePayment, ...updateDto };
      prismaService.employeePayment.update.mockResolvedValue(updatedPayment);

      const result = await service.update(mockPaymentId, updateDto, mockAdminId);

      expect(result.amount).toBe(600);
      expect(prismaService.employeePayment.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockPaymentId, updateDto, mockAdminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment is not pending', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue({
        ...mockEmployeePayment,
        status: EmployeePaymentStatus.APPROVED,
      });

      await expect(
        service.update(mockPaymentId, updateDto, mockAdminId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    const mockFile = {
      originalname: 'receipt.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    it('should approve payment with receipt', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);
      storageService.uploadFile.mockResolvedValue({ storagePath: 'receipts/file.pdf' });
      prismaService.file.create.mockResolvedValue({ id: 'file-123' });
      const approvedPayment = {
        ...mockEmployeePayment,
        status: EmployeePaymentStatus.APPROVED,
      };
      prismaService.employeePayment.update.mockResolvedValue(approvedPayment);

      const result = await service.approve(mockPaymentId, mockAdminId, mockFile);

      expect(result.status).toBe(EmployeePaymentStatus.APPROVED);
      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(prismaService.file.create).toHaveBeenCalled();
      expect(prismaService.employeePayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: EmployeePaymentStatus.APPROVED,
            approvedBy: mockAdminId,
          }),
        }),
      );
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(null);

      await expect(
        service.approve(mockPaymentId, mockAdminId, mockFile),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment is not pending', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue({
        ...mockEmployeePayment,
        status: EmployeePaymentStatus.APPROVED,
      });

      await expect(
        service.approve(mockPaymentId, mockAdminId, mockFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no receipt file provided', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);

      await expect(
        service.approve(mockPaymentId, mockAdminId, undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject pending payment', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);
      const rejectedPayment = {
        ...mockEmployeePayment,
        status: EmployeePaymentStatus.REJECTED,
        rejectionReason: 'Invalid amount',
      };
      prismaService.employeePayment.update.mockResolvedValue(rejectedPayment);

      const result = await service.reject(mockPaymentId, 'Invalid amount', mockAdminId);

      expect(result.status).toBe(EmployeePaymentStatus.REJECTED);
      expect(prismaService.employeePayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: EmployeePaymentStatus.REJECTED,
            rejectionReason: 'Invalid amount',
          }),
        }),
      );
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(null);

      await expect(
        service.reject(mockPaymentId, 'Invalid', mockAdminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment is not pending', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue({
        ...mockEmployeePayment,
        status: EmployeePaymentStatus.APPROVED,
      });

      await expect(
        service.reject(mockPaymentId, 'Invalid', mockAdminId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete pending payment', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);
      prismaService.employeePayment.delete.mockResolvedValue(mockEmployeePayment);

      const result = await service.remove(mockPaymentId);

      expect(result).toEqual(mockEmployeePayment);
      expect(prismaService.employeePayment.delete).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
      });
    });

    it('should delete rejected payment', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue({
        ...mockEmployeePayment,
        status: EmployeePaymentStatus.REJECTED,
      });
      prismaService.employeePayment.delete.mockResolvedValue(mockEmployeePayment);

      const result = await service.remove(mockPaymentId);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if payment not found', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockPaymentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if payment is approved', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue({
        ...mockEmployeePayment,
        status: EmployeePaymentStatus.APPROVED,
      });

      await expect(service.remove(mockPaymentId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPendingPaymentItems', () => {
    it('should return pending payment items', async () => {
      const mockItems = [
        { id: 'file-1', filename: 'design.pdf', uploadedAt: new Date() },
      ];
      prismaService.file.findMany.mockResolvedValue(mockItems);

      const result = await service.getPendingPaymentItems(mockProjectId, mockEmployeeId);

      expect(result).toEqual(mockItems);
      expect(prismaService.file.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: mockProjectId,
            uploadedBy: mockEmployeeId,
            stage: 'CLIENT_APPROVED',
            employeePaymentId: null,
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('getReceiptDownloadUrl', () => {
    it('should return presigned URL for receipt', async () => {
      const paymentWithReceipt = {
        ...mockEmployeePayment,
        receiptFile: { storagePath: 'receipts/file.pdf' },
      };
      prismaService.employeePayment.findUnique.mockResolvedValue(paymentWithReceipt);
      storageService.getDownloadUrl.mockResolvedValue('https://signed.url/file.pdf');

      const result = await service.getReceiptDownloadUrl(
        mockPaymentId,
        mockAdminId,
        Role.ADMIN,
      );

      expect(result).toBe('https://signed.url/file.pdf');
      expect(storageService.getDownloadUrl).toHaveBeenCalledWith('receipts/file.pdf');
    });

    it('should throw BadRequestException if no receipt file', async () => {
      prismaService.employeePayment.findUnique.mockResolvedValue(mockEmployeePayment);

      await expect(
        service.getReceiptDownloadUrl(mockPaymentId, mockAdminId, Role.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
