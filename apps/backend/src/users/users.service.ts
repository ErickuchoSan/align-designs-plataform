import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { IUserRepository } from './repositories/user.repository.interface';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { UserResponse } from '../common/interfaces/user-response.interface';
import { getActiveRecordsWhere, getActiveRecordsWhereWith } from '../common/helpers/prisma.helpers';
import { PaginationHelper } from '../common/helpers/pagination.helper';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService, // Keep for complex queries
  ) {}

  /**
   * Create a new client (Admin only)
   */
  async createClient(createClientDto: CreateClientDto) {
    // Check if email already exists (only check active users, not soft-deleted)
    const existingUser = await this.userRepo.findByEmail(createClientDto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const client = await this.userRepo.create(createClientDto);

    // Return with selected fields for response
    return this.prisma.user.findFirst({
      where: { id: client.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get all users (Admin only)
   */
  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<UserResponse>> {
    const { page, limit, skip } = PaginationHelper.extractPaginationParams(paginationDto);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: getActiveRecordsWhere(),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: getActiveRecordsWhere(),
      }),
    ]);

    return PaginationHelper.buildPaginatedResult(users, total, paginationDto);
  }

  /**
   * Get a user by ID
   */
  async findOne(
    id: string,
    requestingUserId: string,
    requestingUserRole: Role,
  ) {
    // Client can only view their own profile
    if (requestingUserRole === Role.CLIENT && id !== requestingUserId) {
      throw new ForbiddenException(
        'You do not have permission to view this user',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: getActiveRecordsWhereWith({ id }),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update a user
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    requestingUserId: string,
    requestingUserRole: Role,
  ) {
    // Client can only update their own profile
    if (requestingUserRole === Role.CLIENT && id !== requestingUserId) {
      throw new ForbiddenException(
        'You do not have permission to update this user',
      );
    }

    // Client cannot change their active status
    if (
      requestingUserRole === Role.CLIENT &&
      updateUserDto.isActive !== undefined
    ) {
      throw new ForbiddenException(
        'You do not have permission to change the active status',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: getActiveRecordsWhereWith({ id }),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Toggle active/inactive status of a user (Admin only)
   */
  async toggleStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({
      where: getActiveRecordsWhereWith({ id }),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Do not allow deactivating admins
    if (user.role === Role.ADMIN && !isActive) {
      throw new ForbiddenException('Cannot deactivate an administrator user');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser,
    };
  }

  /**
   * Soft delete a user (Admin only)
   */
  async remove(id: string, deletedBy?: string) {
    const user = await this.prisma.user.findFirst({
      where: getActiveRecordsWhereWith({ id }),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Do not allow deleting admins (optional, for security)
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot delete an administrator user');
    }

    // Soft delete: Set deletedAt and deletedBy instead of deleting
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
      },
    });

    this.logger.log(`User ${id} soft deleted by ${deletedBy || 'system'}`);

    return { message: 'User deleted successfully' };
  }
}
