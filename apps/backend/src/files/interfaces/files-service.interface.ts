import { Role } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination.dto';

export interface UploadFileData {
  file: Express.Multer.File;
  projectId: string;
  comment?: string;
  uploadedBy: string;
  userRole: Role;
}

export interface CreateCommentData {
  projectId: string;
  comment: string;
  uploadedBy: string;
  userRole: Role;
}

export interface UpdateFileData {
  comment?: string | null;
}

export interface FileWithRelations {
  id: string;
  filename: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  size: number | null;
  storagePath: string | null;
  comment: string | null;
  projectId: string;
  uploadedBy: string;
  uploadedAt: Date;
  deletedAt: Date | null;
  project?: {
    id: string;
    name: string;
    clientId: string;
  };
  uploader?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface UserContext {
  userId: string;
  role: Role;
}

export interface IFilesService {
  /**
   * Upload a file to a project
   */
  uploadFile(data: UploadFileData): Promise<FileWithRelations>;

  /**
   * Create a comment without file
   */
  createComment(data: CreateCommentData): Promise<FileWithRelations>;

  /**
   * Find all files for a project with pagination
   */
  findAllByProject(
    projectId: string,
    page: number,
    limit: number,
    userContext: UserContext,
  ): Promise<PaginatedResult<FileWithRelations>>;

  /**
   * Find file by ID
   */
  findOne(id: string, userContext: UserContext): Promise<FileWithRelations>;

  /**
   * Update file/comment
   */
  update(
    id: string,
    data: UpdateFileData,
    userContext: UserContext,
  ): Promise<FileWithRelations>;

  /**
   * Get download URL for a file
   */
  getDownloadUrl(id: string, userContext: UserContext): Promise<string>;

  /**
   * Soft delete file
   */
  remove(id: string, userContext: UserContext): Promise<void>;
}
