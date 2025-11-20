export interface FileUploaderResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface FileResponse {
  id: string;
  filename: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  uploadedBy: string;
  projectId: string;
  comment: string | null;
  uploadedAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
  uploader: FileUploaderResponse;
}
