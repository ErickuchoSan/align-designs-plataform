import { Injectable } from '@nestjs/common';
import { File, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IFileRepository } from '../interfaces/file-repository.interface';

/**
 * Prisma File Repository Implementation
 * Implements IFileRepository using Prisma ORM
 * This implementation can be swapped without changing service code
 */
@Injectable()
export class PrismaFileRepository implements IFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  async findByIdWithUploader(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(filter?: any): Promise<File[]> {
    return this.prisma.file.findMany({
      where: filter,
    });
  }

  async findByProjectId(projectId: string): Promise<File[]> {
    return this.findAll({ projectId });
  }

  async findByProjectIdWithUploader(projectId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: { projectId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });
  }

  async findByUploaderId(uploaderId: string): Promise<File[]> {
    return this.findAll({ uploadedBy: uploaderId });
  }

  async create(data: Prisma.FileCreateInput): Promise<File> {
    return this.prisma.file.create({
      data,
    });
  }

  async update(id: string, data: Prisma.FileUpdateInput): Promise<File> {
    return this.prisma.file.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<File> {
    return this.prisma.file.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.file.count({
      where: { id },
    });
    return count > 0;
  }

  async countByProjectId(projectId: string): Promise<number> {
    return this.prisma.file.count({
      where: { projectId },
    });
  }

  async deleteByProjectId(projectId: string): Promise<number> {
    const result = await this.prisma.file.deleteMany({
      where: { projectId },
    });
    return result.count;
  }

  async belongsToProject(fileId: string, projectId: string): Promise<boolean> {
    const count = await this.prisma.file.count({
      where: {
        id: fileId,
        projectId: projectId,
      },
    });
    return count > 0;
  }
}
