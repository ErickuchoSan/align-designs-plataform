import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CacheManagerService } from '../cache/services/cache-manager.service';
import { CACHE_KEYS, CACHE_TTL } from '../cache/constants/cache-keys';
import type { IProjectRepository } from './repositories/project.repository.interface';
import type { IUserRepository } from '../users/repositories/user.repository.interface';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Role } from '@prisma/client';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { ProjectResponse } from '../common/interfaces/project-response.interface';
import { getFilesAndCommentsCounts } from '../common/utils/file.utils';
import { PermissionContext } from '../common/strategies/permission.strategy';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import { TRANSACTION_TIMEOUT_MS } from '../common/constants/timeouts.constants';
import { PaginationHelper } from '../common/helpers/pagination.helper';
import { BigIntTransformer } from '../common/helpers/bigint-transformer.helper';
import { executeTransactionWithRetry } from '../common/helpers/transaction.helpers';
import {
  USER_BASIC_INFO_SELECT,
  FILE_BASIC_SELECT,
  FILE_WITH_UPLOADER_SELECT,
  FILE_MINIMAL_SELECT,
} from './constants/project-selects';

/**
 * Projects Service
 *
 * Architecture Decision: Hybrid Repository + Prisma Pattern
 * ========================================================
 * This service intentionally uses BOTH repository pattern AND direct Prisma access:
 *
 * Repository Pattern (projectRepo, userRepo):
 * - Used for: Simple CRUD operations (create, findById, update, delete)
 * - Benefits: Abstraction, easier testing, decoupling from ORM
 * - Examples: Creating projects, finding users by ID
 *
 * Direct Prisma Access (prisma):
 * - Used for: Complex queries with joins, aggregations, and filters
 * - Benefits: Type safety, performance, flexibility for complex operations
 * - Examples: Listing projects with counts, nested includes, soft-delete queries
 *
 * Rationale: This hybrid approach balances clean architecture with pragmatism.
 * Adding all complex queries to repositories would create bloated interfaces.
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(INJECTION_TOKENS.PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cacheManager: CacheManagerService,
  ) { }

  /**
   * Create a new project
   */
  async create(createProjectDto: CreateProjectDto, createdBy: string) {
    // Verify that the client exists and is not deleted
    const client = await this.userRepo.findById(createProjectDto.clientId);

    if (!client || client.role !== Role.CLIENT) {
      throw new NotFoundException('Client not found');
    }

    const project = await this.projectRepo.create({
      ...createProjectDto,
      createdBy,
    });

    // Fetch with relations for response
    const fullProject = await this.prisma.project.findFirst({
      where: { id: project.id },
      include: {
        client: {
          select: USER_BASIC_INFO_SELECT,
        },
        creator: {
          select: USER_BASIC_INFO_SELECT,
        },
        files: {
          select: FILE_BASIC_SELECT,
        },
      },
    });

    if (!fullProject) {
      throw new NotFoundException('Project not found after creation');
    }

    // Invalidate project list caches since a new project was created
    await this.cacheManager.invalidateProjectCaches();

    // Convert BigInt to number for JSON serialization
    return BigIntTransformer.transformProjectWithFiles(fullProject);
  }

  /**
   * List projects
   * Admin sees all, Client only sees their own
   */
  async findAll(
    userId: string,
    userRole: Role,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<ProjectResponse>> {
    const { page, limit, skip } =
      PaginationHelper.extractPaginationParams(paginationDto);

    // Generate cache key based on user role and pagination
    const cacheKey = CACHE_KEYS.PROJECTS.LIST(
      page,
      limit,
      userRole === Role.CLIENT ? userId : undefined,
    );

    // Try to get from cache first
    // DISABLE CACHE TEMPORARILY: Cache invalidation logic is missing for lists
    // const cached =
    //   await this.cacheManager.get<PaginatedResult<ProjectResponse>>(cacheKey);
    // if (cached) {
    //   this.logger.debug(`Cache hit for projects list: ${cacheKey}`);
    //   return cached;
    // }

    const where = {
      deletedAt: null, // Only include non-deleted projects
      ...(userRole === Role.CLIENT ? { clientId: userId } : {}),
    };

    // Optimized: Only 2 queries - projects with files included, and total count
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          client: {
            select: USER_BASIC_INFO_SELECT,
          },
          files: {
            where: {
              deletedAt: null,
            },
            select: FILE_MINIMAL_SELECT,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    // Transform projects to include separate counts from already-loaded files
    const projectsWithCounts = projects.map((project) => {
      const { filesCount, commentsCount } = getFilesAndCommentsCounts(
        project.files,
      );

      // Remove the files array and replace with counts
      const { files, ...projectWithoutFiles } = project;

      return {
        ...projectWithoutFiles,
        _count: {
          files: filesCount,
          comments: commentsCount,
        },
      };
    });

    const result = PaginationHelper.buildPaginatedResult(
      projectsWithCounts,
      total,
      paginationDto,
    );

    // Cache the result for 5 minutes
    // await this.cacheManager.set(cacheKey, result, CACHE_TTL.FIVE_MINUTES);
    this.logger.debug(`Fetched projects list (Cache Disabled)`);

    return result;
  }

  /**
   * Get a project by ID
   */
  async findOne(id: string, userId: string, userRole: Role) {
    // Try cache first
    // DISABLE CACHE TEMPORARILY: Cache invalidation logic is missing for lists
    // const cacheKey = CACHE_KEYS.PROJECTS.DETAIL(id);
    // const cached = await this.cacheManager.get(cacheKey);
    // if (cached) {
    //   const permissionContext = new PermissionContext(userRole);
    //   permissionContext.verifyProjectAccess(
    //     userId,
    //     (cached as any).clientId,
    //     'You do not have permission to view this project',
    //     );
    //   return cached;
    // }

    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only return non-deleted projects
      },
      include: {
        client: {
          select: USER_BASIC_INFO_SELECT,
        },
        creator: {
          select: USER_BASIC_INFO_SELECT,
        },
        files: {
          where: {
            deletedAt: null, // Only include non-deleted files
          },
          select: FILE_WITH_UPLOADER_SELECT,
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Client can only view their own projects
    const permissionContext = new PermissionContext(userRole);
    permissionContext.verifyProjectAccess(
      userId,
      project.clientId,
      'You do not have permission to view this project',
    );

    // Separate files and comments count
    const { filesCount, commentsCount } = getFilesAndCommentsCounts(
      project.files,
    );

    // Convert BigInt to number for JSON serialization and remove files array
    const { files, ...projectWithoutFiles } = project;
    const result = {
      ...projectWithoutFiles,
      _count: {
        files: filesCount,
        comments: commentsCount,
      },
    };

    // Cache for 5 minutes
    // await this.cacheManager.set(cacheKey, result, CACHE_TTL.FIVE_MINUTES);
    return result;
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
    userRole: Role,
  ) {
    // Optimized: Load project with client uploads in single query
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only allow updating non-deleted projects
      },
      include: {
        files: {
          where: {
            deletedAt: null,
          },
          select: {
            uploadedBy: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Client can only update their own projects
    const permissionContext = new PermissionContext(userRole);
    permissionContext.verifyProjectAccess(
      userId,
      project.clientId,
      'You do not have permission to update this project',
    );

    // If clientId is being changed, verify the current client hasn't uploaded files
    if (
      updateProjectDto.clientId &&
      updateProjectDto.clientId !== project.clientId
    ) {
      await this.validateClientChange(
        updateProjectDto.clientId,
        project.clientId,
        project.files,
      );
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        client: {
          select: USER_BASIC_INFO_SELECT,
        },
        files: {
          select: FILE_BASIC_SELECT,
        },
      },
    });

    // Invalidate caches
    await this.cacheManager.invalidateProjectCaches(id);

    // Convert BigInt to number for JSON serialization
    return BigIntTransformer.transformProjectWithFiles(updatedProject);
  }

  /**
   * Soft delete a project and all associated files
   */
  async remove(id: string, userId: string, userRole: Role) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only allow deleting non-deleted projects
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Client can only delete their own projects
    const permissionContext = new PermissionContext(userRole);
    permissionContext.verifyProjectAccess(
      userId,
      project.clientId,
      'You do not have permission to delete this project',
    );

    // Soft delete the project and its files with automatic retry on deadlocks
    await executeTransactionWithRetry(
      this.prisma,
      async (tx) => {
        // Soft delete all files in the project
        await tx.file.updateMany({
          where: { projectId: id, deletedAt: null },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          },
        });

        // Soft delete the project
        await tx.project.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
          },
        });
      },
      {
        maxRetries: 3, // Retry up to 3 times on transient errors
        timeout: TRANSACTION_TIMEOUT_MS, // 30 seconds timeout for projects with many files
      },
    );

    // Invalidate caches
    await this.cacheManager.invalidateProjectCaches(id);

    this.logger.log(`Project ${id} soft deleted by user ${userId}`);
    return { message: 'Project deleted successfully' };
  }

  /**
   * Validates if a project's client can be changed
   * Checks if new client exists and if current client has uploaded files
   * @throws NotFoundException if new client doesn't exist or isn't a CLIENT
   * @throws ForbiddenException if current client has uploaded files
   */
  private async validateClientChange(
    newClientId: string,
    currentClientId: string,
    files: Array<{ uploadedBy: string }>,
  ): Promise<void> {
    // Verify the new client exists and is active
    const newClient = await this.prisma.user.findFirst({
      where: {
        id: newClientId,
        deletedAt: null,
      },
    });

    if (!newClient || newClient.role !== Role.CLIENT) {
      throw new NotFoundException('New client not found');
    }

    // Check if current client has uploaded any files (using already-loaded data)
    const clientUploads = files.filter(
      (file) => file.uploadedBy === currentClientId,
    ).length;

    if (clientUploads > 0) {
      throw new ForbiddenException(
        'Cannot change client: current client has uploaded files or comments to this project',
      );
    }
  }
}
