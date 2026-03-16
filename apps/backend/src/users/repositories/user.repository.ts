import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserRepository } from './user.repository.interface';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { FindAllOptions } from '../../common/repositories/base.repository';

/**
 * Prisma implementation of User repository
 * Encapsulates all database operations for User entities
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findByRole(role: Role, options?: FindAllOptions): Promise<User[]> {
    return this.findAll({
      ...options,
      where: { role, ...options?.where },
    });
  }

  async findAll(options?: FindAllOptions): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null, ...options?.where },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
    });
  }

  async findAllWithPagination(options: FindAllOptions): Promise<{
    data: User[];
    total: number;
  }> {
    const where = { deletedAt: null, ...options.where };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      }),
      this.count(where),
    ]);

    return { data, total };
  }

  async create(data: CreateClientDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: Role.CLIENT,
        isActive: true,
      },
    });
  }

  async createWithRole(
    data: CreateClientDto & { role: 'CLIENT' | 'EMPLOYEE' },
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        isActive: true,
      },
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async toggleStatus(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string, force: boolean = false): Promise<User> {
    if (force) {
      return this.prisma.$transaction(async (tx) => {
        // 1. Delete dependent relations (Restricted ones first)
        // Invoices (User as client)
        await tx.invoice.deleteMany({ where: { clientId: id } });

        // Payments (User as from/to)
        await tx.payment.deleteMany({
          where: {
            OR: [{ fromUserId: id }, { toUserId: id }],
          },
        });

        // Employee Payments (User as employee, creator, or approver)
        await tx.employeePayment.deleteMany({
          where: {
            OR: [{ employeeId: id }, { createdBy: id }, { approvedBy: id }],
          },
        });

        // Feedback (User as creator)
        await tx.feedback.deleteMany({ where: { createdBy: id } });

        // Files (User as uploader) - Note: This might leave files on disk but cleans DB
        await tx.file.deleteMany({ where: { uploadedBy: id } });

        // User's Login Data
        await tx.passwordHistory.deleteMany({ where: { userId: id } });
        await tx.notification.deleteMany({ where: { userId: id } });
        await tx.otpToken.deleteMany({ where: { userId: id } });
        await tx.auditLog.deleteMany({ where: { userId: id } });

        // Projects (User as client or creator) - Client is usually Cascade, but Creator is Restrict
        // Deleting projects where user is creator (if any)
        await tx.project.deleteMany({ where: { createdBy: id } });
        // Projects where user is client (will cascade from project delete usually, but doing explicit for safety)
        const clientProjects = await tx.project.findMany({
          where: { clientId: id },
        });
        if (clientProjects.length > 0) {
          await tx.project.deleteMany({ where: { clientId: id } });
        }

        // Finally delete the user
        return tx.user.delete({
          where: { id },
        });
      });
    }

    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete user: This user has associated records (e.g., invoices) and cannot be permanently deleted.',
        );
      }
      throw error;
    }
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.user.count({
      where: { deletedAt: null, ...where },
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }
}
