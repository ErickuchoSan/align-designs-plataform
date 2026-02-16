import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateEmployeePaymentDto } from './dto/create-employee-payment.dto';
import { UpdateEmployeePaymentDto } from './dto/update-employee-payment.dto';
import { EmployeePaymentStatus, Role, Prisma } from '@prisma/client';



@Injectable()
export class EmployeePaymentsService {
  private readonly logger = new Logger(EmployeePaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) { }

  async create(createDto: CreateEmployeePaymentDto, createdBy: string) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project ${createDto.projectId} not found`);
    }

    // Verify employee exists and is assigned to project
    const employeeAssignment = await this.prisma.projectEmployee.findUnique({
      where: {
        projectId_employeeId: {
          projectId: createDto.projectId,
          employeeId: createDto.employeeId,
        },
      },
    });

    if (!employeeAssignment) {
      throw new BadRequestException(`Employee ${createDto.employeeId} is not assigned to this project`);
    }

    return this.prisma.employeePayment.create({
      data: {
        ...createDto,
        createdBy,
        paymentDate: new Date(createDto.paymentDate),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        receiptFile: true,
      },
    });
  }

  async findAll(userId: string, userRole: Role, projectId?: string) {
    const where: Prisma.EmployeePaymentWhereInput = {};

    // Privacy filters
    if (userRole === Role.EMPLOYEE) {
      // Employees only see their own payments
      where.employeeId = userId;
    } else if (userRole === Role.CLIENT) {
      // Clients don't see employee payments
      throw new ForbiddenException('Clients cannot view employee payments');
    }
    // Admins see all

    if (projectId) {
      where.projectId = projectId;
    }

    return this.prisma.employeePayment.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        receiptFile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const payment = await this.prisma.employeePayment.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        receiptFile: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Employee payment ${id} not found`);
    }

    // Privacy check
    if (userRole === Role.EMPLOYEE && payment.employeeId !== userId) {
      throw new ForbiddenException('You can only view your own payments');
    }

    if (userRole === Role.CLIENT) {
      throw new ForbiddenException('Clients cannot view employee payments');
    }

    return payment;
  }

  async update(id: string, updateDto: UpdateEmployeePaymentDto, userId: string) {
    const payment = await this.prisma.employeePayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Employee payment ${id} not found`);
    }

    // Only allow updates if status is PENDING
    if (payment.status !== EmployeePaymentStatus.PENDING) {
      throw new BadRequestException('Cannot update payment that is not pending');
    }

    return this.prisma.employeePayment.update({
      where: { id },
      data: {
        ...updateDto,
        paymentDate: updateDto.paymentDate ? new Date(updateDto.paymentDate) : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        receiptFile: true,
      },
    });
  }

  async approve(id: string, approvedBy: string, file?: Express.Multer.File) {
    const payment = await this.prisma.employeePayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Employee payment ${id} not found`);
    }

    if (payment.status !== EmployeePaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending approval');
    }

    if (!file) {
      throw new BadRequestException('Payment receipt file is required for approval');
    }

    // Upload receipt file
    const uploadResult = await this.storageService.uploadFile(file, payment.projectId);

    // Create File record for the receipt
    const receiptFile = await this.prisma.file.create({
      data: {
        projectId: payment.projectId,
        uploadedBy: approvedBy,
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath: uploadResult.storagePath,
        pendingPayment: false, // It IS the payment proof
      }
    });

    const updatedPayment = await this.prisma.employeePayment.update({
      where: { id },
      data: {
        status: EmployeePaymentStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
        receiptFileId: receiptFile.id,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        receiptFile: true,
      },
    });

    return updatedPayment;
  }

  async reject(id: string, rejectionReason: string, userId: string) {
    const payment = await this.prisma.employeePayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Employee payment ${id} not found`);
    }

    if (payment.status !== EmployeePaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not pending approval');
    }

    return this.prisma.employeePayment.update({
      where: { id },
      data: {
        status: EmployeePaymentStatus.REJECTED,
        rejectionReason,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        receiptFile: true,
      },
    });
  }

  async remove(id: string) {
    const payment = await this.prisma.employeePayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Employee payment ${id} not found`);
    }

    // Only allow deletion if status is PENDING or REJECTED
    if (payment.status !== EmployeePaymentStatus.PENDING && payment.status !== EmployeePaymentStatus.REJECTED) {
      throw new BadRequestException('Cannot delete approved payments');
    }

    return this.prisma.employeePayment.delete({
      where: { id },
    });
  }

  /**
   * Get pending payment items for employee
   */
  async getPendingPaymentItems(projectId: string, employeeId: string) {
    // Determine the CLIENT_APPROVED stage value
    // Assuming 'CLIENT_APPROVED' is the enum value in prisma
    const clientApprovedStage = 'CLIENT_APPROVED';

    const items = await this.prisma.file.findMany({
      where: {
        projectId,
        uploadedBy: employeeId,
        stage: clientApprovedStage as any, // Cast to any or import Stage enum
        employeePaymentId: null, // Not yet linked to a payment
        deletedAt: null,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        uploadedAt: true,
        approvedClientAt: true,
        comment: true,
      },
      orderBy: {
        approvedClientAt: 'desc',
      },
    });

    return items;
  }

  /**
   * Get presigned URL for payment receipt
   */
  async getReceiptDownloadUrl(paymentId: string, userId: string, userRole: Role): Promise<string> {
    const payment = await this.findOne(paymentId, userId, userRole);

    if (!payment.receiptFile || !payment.receiptFile.storagePath) {
      throw new BadRequestException('This payment has no receipt file');
    }

    // Generate presigned URL from MinIO
    return this.storageService.getDownloadUrl(payment.receiptFile.storagePath);
  }
}
