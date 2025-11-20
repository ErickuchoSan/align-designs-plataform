import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Role } from '@prisma/client';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { ProjectResponse } from '../common/interfaces/project-response.interface';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  /**
   * Create a new project
   */
  async create(createProjectDto: CreateProjectDto, createdBy: string) {
    // Verify that the client exists and is not deleted
    const client = await this.prisma.user.findFirst({
      where: {
        id: createProjectDto.clientId,
        deletedAt: null, // Only allow active (non-deleted) clients
      },
    });

    if (!client || client.role !== Role.CLIENT) {
      throw new NotFoundException('Client not found');
    }

    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        clientId: createProjectDto.clientId,
        createdBy,
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
    return {
      ...project,
      files: project.files.map((file) => ({
        ...file,
        sizeBytes: Number(file.sizeBytes),
      })),
    };
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
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null, // Only include non-deleted projects
      ...(userRole === Role.CLIENT ? { clientId: userId } : {}),
    };

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

    const totalPages = Math.ceil(total / limit);

    // Transform projects to include separate counts for files and comments
    const projectsWithCounts = projects.map((project) => {
      const filesCount = project.files.filter((f) => f.filename !== null).length;
      const commentsCount = project.files.filter((f) => f.filename === null).length;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { files, ...projectWithoutFiles } = project;

      return {
        ...projectWithoutFiles,
        _count: {
          files: filesCount,
          comments: commentsCount,
        },
      };
    });

    return {
      data: projectsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
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
    if (userRole === Role.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this project',
      );
    }

    // Separate files and comments count
    const filesCount = project.files.filter((f) => f.filename !== null).length;
    const commentsCount = project.files.filter((f) => f.filename === null).length;

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
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null, // Only allow updating non-deleted projects
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Client can only update their own projects
    if (userRole === Role.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this project',
      );
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
    return {
      ...updatedProject,
      files: updatedProject.files.map((file) => ({
        ...file,
        sizeBytes: Number(file.sizeBytes),
      })),
    };
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
    if (userRole === Role.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this project',
      );
    }

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
        timeout: 30000, // 30 seconds timeout for projects with many files
      },
    );

    this.logger.log(`Project ${id} soft deleted by user ${userId}`);
    return { message: 'Project deleted successfully' };
  }
}
