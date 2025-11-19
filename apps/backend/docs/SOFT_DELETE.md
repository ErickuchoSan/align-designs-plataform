# Soft Delete Pattern

This document explains the soft delete implementation in the Align Designs backend.

## Overview

Soft delete marks records as deleted without permanently removing them from the database. This provides:
- **Data recovery**: Restore accidentally deleted records
- **Audit trail**: Track who deleted what and when
- **Compliance**: Meet regulatory requirements for data retention
- **Relationships**: Maintain referential integrity

## Implementation

### Schema Changes

Added to `Project` and `File` models:

```prisma
model Project {
  // ... existing fields
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)
  deletedBy   String?   @map("deleted_by") @db.Uuid

  @@index([deletedAt])
}

model File {
  // ... existing fields
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)
  deletedBy   String?   @map("deleted_by") @db.Uuid

  @@index([deletedAt])
}
```

### Middleware

The `soft-delete.middleware.ts` automatically:
1. Converts `delete()` to `update()` with `deletedAt = now()`
2. Excludes soft-deleted records from `findMany()`, `findFirst()`, `count()`
3. Prevents updates to soft-deleted records

**Location**: `src/common/middleware/soft-delete.middleware.ts`

Applied globally in `PrismaService`:

```typescript
constructor() {
  super();
  this.$use(createSoftDeleteMiddleware());
}
```

## Usage

### Normal Operations (Automatic)

```typescript
// DELETE - Automatically converted to soft delete
await prisma.project.delete({ where: { id: 'uuid' } });
// Sets deletedAt to current timestamp

// FIND - Automatically excludes deleted records
const projects = await prisma.project.findMany();
// Only returns records where deletedAt IS NULL

// COUNT - Automatically excludes deleted records
const count = await prisma.project.count();
// Only counts non-deleted records
```

### Include Deleted Records

```typescript
import { SoftDeleteUtils } from '@/common/middleware/soft-delete.middleware';

// Get all records including deleted
const allProjects = await prisma.project.findMany({
  where: SoftDeleteUtils.withDeleted(),
});

// Get only deleted records
const deletedProjects = await prisma.project.findMany({
  where: SoftDeleteUtils.onlyDeleted(),
});
```

### Restore Deleted Records

```typescript
import { SoftDeleteUtils } from '@/common/middleware/soft-delete.middleware';

// Restore a project
const restored = await SoftDeleteUtils.restore(
  prisma.project,
  { id: 'project-uuid' }
);
```

### Hard Delete (Permanent)

⚠️ **Use with extreme caution** - This is irreversible!

```typescript
import { SoftDeleteUtils } from '@/common/middleware/soft-delete.middleware';

// Permanently delete a record
await SoftDeleteUtils.hardDelete(
  prisma.project,
  { id: 'project-uuid' }
);
```

## Service Implementation

### Projects Service Example

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SoftDeleteUtils } from '../common/middleware/soft-delete.middleware';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Standard delete (soft delete)
  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  // Restore deleted project
  async restore(id: string) {
    return SoftDeleteUtils.restore(this.prisma.project, { id });
  }

  // Get deleted projects (admin only)
  async findDeleted() {
    return this.prisma.project.findMany({
      where: SoftDeleteUtils.onlyDeleted(),
      include: {
        client: true,
        creator: true,
      },
    });
  }

  // Permanent delete (admin only, use sparingly)
  async hardDelete(id: string) {
    // Add authorization check
    // Add logging
    return SoftDeleteUtils.hardDelete(this.prisma.project, { id });
  }
}
```

## Controller Implementation

```typescript
import { Controller, Delete, Patch, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // Soft delete
  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.projectsService.remove(id, userId);
  }

  // Restore (admin only)
  @Patch(':id/restore')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async restore(@Param('id') id: string) {
    return this.projectsService.restore(id);
  }

  // View deleted (admin only)
  @Get('deleted')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findDeleted() {
    return this.projectsService.findDeleted();
  }

  // Hard delete (admin only)
  @Delete(':id/permanent')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async hardDelete(@Param('id') id: string) {
    return this.projectsService.hardDelete(id);
  }
}
```

## Database Queries

### Manual SQL Queries

If you need to bypass Prisma and use raw SQL:

```typescript
// Get all projects including deleted
const projects = await prisma.$queryRaw`
  SELECT * FROM projects
`;

// Get only non-deleted projects
const activeProjects = await prisma.$queryRaw`
  SELECT * FROM projects
  WHERE deleted_at IS NULL
`;

// Get only deleted projects
const deletedProjects = await prisma.$queryRaw`
  SELECT * FROM projects
  WHERE deleted_at IS NOT NULL
`;

// Soft delete
await prisma.$executeRaw`
  UPDATE projects
  SET deleted_at = NOW(), deleted_by = ${userId}
  WHERE id = ${projectId}
`;

// Restore
await prisma.$executeRaw`
  UPDATE projects
  SET deleted_at = NULL, deleted_by = NULL
  WHERE id = ${projectId}
`;

// Hard delete
await prisma.$executeRaw`
  DELETE FROM projects WHERE id = ${projectId}
`;
```

## Maintenance

### Cleanup Old Deleted Records

Create a scheduled task to permanently remove old soft-deleted records:

```typescript
// src/tasks/cleanup-deleted-records.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupDeletedRecordsTask {
  private readonly logger = new Logger(CleanupDeletedRecordsTask.name);

  constructor(private prisma: PrismaService) {}

  // Run monthly on the 1st at 3 AM
  @Cron('0 3 1 * *')
  async handleCleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.logger.log('Starting cleanup of old deleted records...');

    try {
      // Hard delete files deleted more than 30 days ago
      const filesDeleted = await this.prisma.$executeRaw`
        DELETE FROM files
        WHERE deleted_at IS NOT NULL
          AND deleted_at < ${thirtyDaysAgo}
      `;

      // Hard delete projects deleted more than 30 days ago
      const projectsDeleted = await this.prisma.$executeRaw`
        DELETE FROM projects
        WHERE deleted_at IS NOT NULL
          AND deleted_at < ${thirtyDaysAgo}
      `;

      this.logger.log(
        `Cleanup completed: ${filesDeleted} files, ${projectsDeleted} projects permanently deleted`,
      );
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
    }
  }
}
```

Add to `TasksModule`:

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupDeletedRecordsTask } from './cleanup-deleted-records.task';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [CleanupDeletedRecordsTask],
})
export class TasksModule {}
```

## Best Practices

### 1. Always Track Deletor

```typescript
// Good - tracks who deleted
await prisma.project.update({
  where: { id },
  data: {
    deletedAt: new Date(),
    deletedBy: currentUserId,
  },
});

// Bad - doesn't track who deleted
await prisma.project.delete({ where: { id } });
```

### 2. Restore Validation

```typescript
async restore(id: string) {
  const project = await prisma.project.findFirst({
    where: {
      id,
      deletedAt: { not: null },
    },
  });

  if (!project) {
    throw new NotFoundException('Deleted project not found');
  }

  // Additional validation: Check if client still exists
  const client = await prisma.user.findUnique({
    where: { id: project.clientId },
  });

  if (!client) {
    throw new BadRequestException('Cannot restore - client no longer exists');
  }

  return SoftDeleteUtils.restore(prisma.project, { id });
}
```

### 3. Cascade Soft Delete

```typescript
async removeProject(id: string, userId: string) {
  // Soft delete project and all its files
  await prisma.$transaction([
    // Delete all files in project
    prisma.file.updateMany({
      where: { projectId: id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    }),
    // Delete project
    prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    }),
  ]);
}
```

### 4. Authorization

```typescript
async remove(id: string, userId: string, userRole: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  // Only admin or project creator can delete
  if (userRole !== 'ADMIN' && project.createdBy !== userId) {
    throw new ForbiddenException('Not authorized to delete this project');
  }

  return prisma.project.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    },
  });
}
```

### 5. Logging

```typescript
async remove(id: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  // Log deletion
  this.logger.log({
    action: 'SOFT_DELETE_PROJECT',
    projectId: id,
    projectName: project.name,
    deletedBy: userId,
    timestamp: new Date(),
  });

  return prisma.project.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    },
  });
}
```

## Testing

### Unit Tests

```typescript
describe('ProjectsService - Soft Delete', () => {
  it('should soft delete a project', async () => {
    const project = await service.remove('project-id', 'user-id');

    expect(project.deletedAt).toBeDefined();
    expect(project.deletedBy).toBe('user-id');

    // Verify it's not returned in findMany
    const projects = await service.findAll();
    expect(projects).not.toContainEqual(
      expect.objectContaining({ id: 'project-id' })
    );
  });

  it('should restore a deleted project', async () => {
    await service.remove('project-id', 'user-id');
    const restored = await service.restore('project-id');

    expect(restored.deletedAt).toBeNull();
    expect(restored.deletedBy).toBeNull();
  });

  it('should find deleted projects', async () => {
    await service.remove('project-id', 'user-id');
    const deleted = await service.findDeleted();

    expect(deleted).toHaveLength(1);
    expect(deleted[0].id).toBe('project-id');
  });
});
```

## Troubleshooting

### Issue: Deleted records still appearing

**Cause**: Query is bypassing middleware or using raw SQL

**Solution**: Use Prisma ORM methods or add `WHERE deleted_at IS NULL` to raw queries

### Issue: Cannot find deleted record to restore

**Cause**: Using `findUnique` which excludes deleted records

**Solution**: Use `SoftDeleteUtils.onlyDeleted()` or raw query

### Issue: Foreign key constraint errors on restore

**Cause**: Related records were hard deleted

**Solution**: Validate related records exist before restoring

## Performance Considerations

1. **Index on deletedAt**: Ensures fast filtering of deleted records
2. **Composite indexes**: Consider `@@index([deletedAt, createdAt])` for sorted queries
3. **Cleanup routine**: Prevents table bloat from accumulating deleted records
4. **Query optimization**: Use `onlyDeleted()` for admin views instead of loading all records

## Security

1. **Admin-only hard delete**: Only admins should permanently delete
2. **Audit logging**: Log all delete and restore operations
3. **Rate limiting**: Prevent abuse of delete/restore endpoints
4. **Authorization**: Verify user has permission to delete/restore

## Migration Notes

The soft delete migration adds nullable columns, so it's safe to apply to existing databases without data loss.

```sql
-- Safe migration - no data loss
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ(6);
ALTER TABLE projects ADD COLUMN deleted_by UUID;
CREATE INDEX projects_deleted_at_idx ON projects(deleted_at);

ALTER TABLE files ADD COLUMN deleted_at TIMESTAMPTZ(6);
ALTER TABLE files ADD COLUMN deleted_by UUID;
CREATE INDEX files_deleted_at_idx ON files(deleted_at);
```

Existing records will have `deleted_at = NULL`, meaning they are not deleted.
