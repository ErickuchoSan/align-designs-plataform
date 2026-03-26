import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IProjectRepository } from './project.repository.interface';
import type { CreateProjectDto, UpdateProjectDto } from '../schemas';
import { FindAllOptions } from '../../common/repositories/base.repository';
import { TRANSACTION_TIMEOUT_MS } from '../../common/constants/timeouts.constants';

/**
 * Prisma implementation of Project repository
 * Encapsulates all database operations for Project entities
 */
@Injectable()
export class ProjectRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByIdWithRelations(id: string): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: true,
        files: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async findAll(options?: FindAllOptions): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { deletedAt: null, ...options?.where },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
      include: options?.include,
    });
  }

  async findByClientId(
    clientId: string,
    options?: FindAllOptions,
  ): Promise<Project[]> {
    return this.findAll({
      ...options,
      where: { clientId, ...options?.where },
    });
  }

  async findAllWithRelations(options: FindAllOptions): Promise<{
    data: Project[];
    total: number;
  }> {
    const where = { deletedAt: null, ...options.where };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
        include: {
          client: true,
          files: {
            where: { deletedAt: null },
          },
        },
      }),
      this.count(where),
    ]);

    return { data, total };
  }

  async create(
    data: CreateProjectDto & { createdBy: string },
  ): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        createdBy: data.createdBy,
        // Phase 1: Workflow fields
        initialAmountRequired: data.initialAmountRequired,
        deadlineDate: data.deadlineDate
          ? new Date(data.deadlineDate)
          : undefined,
        initialPaymentDeadline: data.initialPaymentDeadline
          ? new Date(data.initialPaymentDeadline)
          : undefined,
      },
      include: {
        client: true,
      },
    });
  }

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
      include: {
        client: true,
      },
    });
  }

  async softDelete(id: string): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteWithFiles(projectId: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const now = new Date();

        // Soft delete all files in this project
        await tx.file.updateMany({
          where: { projectId, deletedAt: null },
          data: { deletedAt: now },
        });

        // Soft delete the project
        await tx.project.update({
          where: { id: projectId },
          data: { deletedAt: now },
        });
      },
      {
        timeout: TRANSACTION_TIMEOUT_MS,
      },
    );
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.project.count({
      where: { deletedAt: null, ...where },
    });
  }

  async hasUploadedFiles(projectId: string): Promise<boolean> {
    const fileCount = await this.prisma.file.count({
      where: {
        projectId,
        deletedAt: null,
      },
    });

    return fileCount > 0;
  }
}
