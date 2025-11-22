import { Injectable } from '@nestjs/common';
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
      throw new Error('User not found');
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

  async count(where?: any): Promise<number> {
    return this.prisma.user.count({
      where: { deletedAt: null, ...where },
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }
}
