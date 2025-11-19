export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
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
  };
}
