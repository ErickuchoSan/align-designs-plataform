import { Injectable } from '@nestjs/common';
import { Project, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IProjectRepository } from '../interfaces/project-repository.interface';
import { PaginatedResult } from '../../common/interfaces/repository.interface';

/**
 * Prisma Project Repository Implementation
 * Implements IProjectRepository using Prisma ORM
 * This implementation can be swapped without changing service code
 */
@Injectable()
export class PrismaProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
    });
  }

  async findByIdWithRelations(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
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
      },
    });
  }

  async findByIdWithCounts(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({
      where: { id },
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
        _count: {
          select: {
            files: true,
          },
        },
      },
    });
  }

  async findAll(filter?: Record<string, unknown>): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: filter,
    });
  }

  async findAllWithRelations(filter?: Record<string, unknown>): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: filter,
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
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    filter?: Record<string, unknown>,
  ): Promise<PaginatedResult<Project>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: filter,
        skip,
        take: limit,
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
          _count: {
            select: {
              files: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.count(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByClientId(clientId: string): Promise<Project[]> {
    return this.findAll({ clientId });
  }

  async findByCreatorId(creatorId: string): Promise<Project[]> {
    return this.findAll({ createdBy: creatorId });
  }

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Project> {
    return this.prisma.project.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.project.count({
      where: { id },
    });
    return count > 0;
  }

  async count(filter?: Record<string, unknown>): Promise<number> {
    return this.prisma.project.count({
      where: filter,
    });
  }

  async canChangeClient(projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        _count: {
          select: {
            files: true,
          },
        },
      },
    });

    if (!project) {
      return false;
    }

    // Can change client if project has no files
    // Note: Comments relation doesn't exist in current schema
    return project._count.files === 0;
  }
}
