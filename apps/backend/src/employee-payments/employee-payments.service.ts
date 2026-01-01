import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeePaymentDto } from './dto/create-employee-payment.dto';
import { UpdateEmployeePaymentDto } from './dto/update-employee-payment.dto';
import { EmployeePaymentStatus, Role } from '@prisma/client';

@Injectable()
export class EmployeePaymentsService {
  constructor(private prisma: PrismaService) {}

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
    const where: any = {};

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

  async approve(id: string, approvedBy: string) {
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
        status: EmployeePaymentStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
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
}
