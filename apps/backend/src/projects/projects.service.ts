import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
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

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(INJECTION_TOKENS.PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService, // Keep for complex queries not in repo
    private readonly storageService: StorageService,
  ) {}

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
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
          },
        },
      },
    });

    if (!fullProject) {
      throw new NotFoundException('Project not found after creation');
    }

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
    const { page, limit, skip } = PaginationHelper.extractPaginationParams(paginationDto);
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
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          files: {
            where: {
              deletedAt: null,
            },
            select: {
              filename: true,
            },
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
      const { filesCount, commentsCount } = getFilesAndCommentsCounts(project.files);

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

    return PaginationHelper.buildPaginatedResult(projectsWithCounts, total, paginationDto);
  }

  /**
   * Get a project by ID
   */
  async findOne(id: string, userId: string, userRole: Role) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only return non-deleted projects
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        files: {
          where: {
            deletedAt: null, // Only include non-deleted files
          },
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
            uploader: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
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
    const { filesCount, commentsCount } = getFilesAndCommentsCounts(project.files);

    // Convert BigInt to number for JSON serialization and remove files array
    const { files, ...projectWithoutFiles } = project;
    return {
      ...projectWithoutFiles,
      _count: {
        files: filesCount,
        comments: commentsCount,
      },
    };
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
    if (updateProjectDto.clientId && updateProjectDto.clientId !== project.clientId) {
      // Verify the new client exists and is active
      const newClient = await this.prisma.user.findFirst({
        where: {
          id: updateProjectDto.clientId,
          deletedAt: null,
        },
      });

      if (!newClient || newClient.role !== Role.CLIENT) {
        throw new NotFoundException('New client not found');
      }

      // Check if current client has uploaded any files or comments (using already-loaded data)
      const clientUploads = project.files.filter(
        (file) => file.uploadedBy === project.clientId,
      ).length;

      if (clientUploads > 0) {
        throw new ForbiddenException(
          'Cannot change client: current client has uploaded files or comments to this project',
        );
      }
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
          },
        },
      },
    });

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

    // Soft delete the project and its files
    await this.prisma.$transaction(
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
        timeout: TRANSACTION_TIMEOUT_MS, // 30 seconds timeout for projects with many files
      },
    );

    this.logger.log(`Project ${id} soft deleted by user ${userId}`);
    return { message: 'Project deleted successfully' };
  }
}
