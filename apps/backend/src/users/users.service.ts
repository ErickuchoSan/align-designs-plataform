import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../cache/services/cache-manager.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/constants/cache-keys';
import { EmailService } from '../email/email.service';
import type { IUserRepository } from './repositories/user.repository.interface';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { UserResponse } from '../common/interfaces/user-response.interface';
import {
  getActiveRecordsWhere,
  getActiveRecordsWhereWith,
} from '../common/helpers/prisma.helpers';
import { PaginationHelper } from '../common/helpers/pagination.helper';
import {
  USER_BASIC_SELECT,
  USER_FULL_SELECT,
  USER_UPDATE_SELECT,
  USER_STATUS_SELECT,
} from './constants/user-selects';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
    private readonly cacheManager: CacheManagerService,
    private readonly mailService: EmailService,
  ) { }

  /**
   * Create a new client (Admin only)
   */
  async createClient(createClientDto: CreateClientDto, origin?: string) {
    // Check if email already exists (only check active users, not soft-deleted)
    // Check for unique fields
    await this.validateUniqueUserFields(createClientDto.email, createClientDto.phone);

    const client = await this.userRepo.create(createClientDto);

    // Invalidate user list cache
    await this.cacheManager.invalidateUserCaches();

    // Send welcome email only if origin is provided (to ensure correct login link)
    if (origin) {
      await this.mailService.sendWelcomeEmail(
        client.email,
        `${client.firstName} ${client.lastName}`,
        origin,
      );
    }

    // Return with selected fields for response
    return this.prisma.user.findFirst({
      where: { id: client.id },
      select: USER_BASIC_SELECT,
    });
  }

  /**
   * Create a new user with role (Admin only)
   */
  async createUser(
    createUserDto: CreateClientDto & { role: 'CLIENT' | 'EMPLOYEE' },
    origin?: string,
  ) {
    // Check if email already exists (only check active users, not soft-deleted)
    // Check for unique fields
    await this.validateUniqueUserFields(createUserDto.email, createUserDto.phone);

    const user = await this.userRepo.createWithRole(createUserDto);

    // Invalidate user list cache
    await this.cacheManager.invalidateUserCaches();

    // Send welcome email only if origin is provided (to ensure correct login link)
    if (origin) {
      await this.mailService.sendWelcomeEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        origin,
      );
    }

    // Return with selected fields for response
    return this.prisma.user.findFirst({
      where: { id: user.id },
      select: USER_BASIC_SELECT,
    });
  }

  /**
   * Get all users (Admin only)
   */
  async findAll(
    paginationDto: PaginationDto,
    role?: Role,
  ): Promise<PaginatedResult<UserResponse>> {
    const { page, limit, skip } =
      PaginationHelper.extractPaginationParams(paginationDto);

    // Try cache first
    // DISABLE CACHE TEMPORARILY: Cache invalidation logic is missing for lists
    // const cacheKey = CACHE_KEYS.USERS.LIST(page, limit);
    // const cached =
    //   await this.cacheManager.get<PaginatedResult<UserResponse>>(cacheKey);
    // if (cached) return cached;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: getActiveRecordsWhereWith(role ? { role } : {}),
        select: USER_FULL_SELECT,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({
        where: getActiveRecordsWhereWith(role ? { role } : {}),
      }),
    ]);

    const result = PaginationHelper.buildPaginatedResult(
      users,
      total,
      paginationDto,
    );
    // await this.cacheManager.set(cacheKey, result, CACHE_TTL.FIVE_MINUTES);
    return result;
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

    // Try cache first
    const cacheKey = CACHE_KEYS.USERS.DETAIL(id);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findFirst({
      where: getActiveRecordsWhereWith({ id }),
      select: USER_FULL_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.cacheManager.set(cacheKey, user, CACHE_TTL.FIVE_MINUTES);
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

    // Check if phone is being updated and if it's already in use
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      await this.validateUniqueUserFields(
        undefined,
        updateUserDto.phone,
        id
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: USER_UPDATE_SELECT,
    });

    // Invalidate caches
    await this.cacheManager.invalidateUserCaches(id);

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
      select: USER_STATUS_SELECT,
    });

    // Invalidate caches
    await this.cacheManager.invalidateUserCaches(id);

    return {
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser,
    };
  }

  /**
   * Soft delete a user (Admin only)
   */
  async remove(id: string, deletedBy?: string, hardDelete = false, force = false) {
    const user = await this.prisma.user.findFirst({
      where: hardDelete ? { id } : getActiveRecordsWhereWith({ id }),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Do not allow deleting admins (optional, for security)
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Cannot delete an administrator user');
    }

    if (hardDelete) {
      // Hard delete: Permanently remove record
      await this.userRepo.hardDelete(id, force);
      this.logger.log(`User ${id} HARD deleted by ${deletedBy || 'system'} (Force: ${force})`);
    } else {
      // Soft delete: Set deletedAt and deletedBy instead of deleting
      await this.userRepo.softDelete(id);
      this.logger.log(`User ${id} soft deleted by ${deletedBy || 'system'}`);
    }

    // Invalidate caches
    await this.cacheManager.invalidateUserCaches(id);

    return { message: 'User deleted successfully' };
  }

  /**
   * Find available employees (not assigned to any ACTIVE project)
   * Used when creating/editing projects to show only employees who can be assigned
   */
  async findAvailableEmployees(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<UserResponse>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Get all employees with their active project assignments
    const where = {
      ...getActiveRecordsWhere(),
      role: Role.EMPLOYEE,
    };

    // Get employees who are NOT assigned to any ACTIVE projects
    const [employees, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          ...where,
          // Exclude employees who have assignments to active projects
          assignedProjects: {
            none: {
              project: {
                status: {
                  in: ['ACTIVE', 'WAITING_PAYMENT'],
                },
                deletedAt: null,
              },
            },
          },
        },
        select: USER_BASIC_SELECT,
        skip,
        take: limit,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.user.count({
        where: {
          ...where,
          assignedProjects: {
            none: {
              project: {
                status: {
                  in: ['ACTIVE', 'WAITING_PAYMENT'],
                },
                deletedAt: null,
              },
            },
          },
        },
      }),
    ]);

    this.logger.log(
      `Found ${total} available employees (not assigned to active projects)`,
    );

    return PaginationHelper.buildPaginatedResult(employees, total, paginationDto);
  }

  /**
   * Validate that email and phone are unique
   * @param email Email to check
   * @param phone Phone to check (optional)
   * @param excludeUserId User ID to exclude from check (for updates)
   */
  private async validateUniqueUserFields(
    email?: string,
    phone?: string,
    excludeUserId?: string,
  ) {
    // Check email
    if (email) {
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser && existingUser.id !== excludeUserId) {
        throw new ConflictException('Email already registered');
      }
    }

    // Check phone
    if (phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone,
          id: excludeUserId ? { not: excludeUserId } : undefined,
          deletedAt: null,
        },
      });

      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }
  }
}
