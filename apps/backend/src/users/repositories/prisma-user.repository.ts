import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserRepository } from '../interfaces/user-repository.interface';

/**
 * Prisma User Repository Implementation
 * Implements IUserRepository using Prisma ORM
 * This implementation can be swapped without changing service code
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    // Remove password from returned user
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    // Remove password from returned user
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async findAll(filter?: Record<string, unknown>): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: filter,
    });

    // Remove password from all users
    return users.map(({ passwordHash, ...userWithoutPassword }) => userWithoutPassword as User);
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user = await this.prisma.user.create({
      data,
    });

    // Remove password from returned user
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    // Remove password from returned user
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async delete(id: string): Promise<User> {
    const user = await this.prisma.user.delete({
      where: { id },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id },
    });
    return count > 0;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async findByRole(role: string): Promise<User[]> {
    return this.findAll({ role });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findAll({ isActive: true });
  }

  async updateLastLogin(userId: string): Promise<void> {
    // Note: lastLogin field doesn't exist in current schema
    // This is a no-op for now, but interface is maintained for future use
    // If needed, add lastLogin field to User model in schema.prisma
    return;
  }

  async softDelete(userId: string): Promise<User> {
    return this.update(userId, { isActive: false });
  }
}
