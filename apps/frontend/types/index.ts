export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  creator?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    files: number;
    comments: number;
  };
}

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  projectId: string;
  uploadedBy: string;
  uploadedAt: string;
  uploader?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
  downloadUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OTPRequest {
  email: string;
}

export interface OTPVerify {
  email: string;
  token: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CreateClientDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  clientId: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface PaginatedProjects {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
