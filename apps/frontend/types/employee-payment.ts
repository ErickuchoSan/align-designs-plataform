export enum EmployeePaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface EmployeePayment {
  id: string;
  projectId: string;
  employeeId: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  receiptFileId?: string;
  status: EmployeePaymentStatus;
  paymentDate: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  receiptFile?: any;
}

export interface CreateEmployeePaymentDto {
  projectId: string;
  employeeId: string;
  amount: number;
  description?: string;
  paymentMethod: string;
  paymentDate: string;
  receiptFileId?: string;
}

export interface UpdateEmployeePaymentDto extends Partial<CreateEmployeePaymentDto> {}
