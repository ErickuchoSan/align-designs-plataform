// Import and re-export EmployeePaymentStatus from centralized enums file
import { EmployeePaymentStatus } from './enums';
export { EmployeePaymentStatus, EMPLOYEE_PAYMENT_STATUS_LABELS } from './enums';

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
  receiptFile?: { id: string; url: string; originalName: string; mimeType: string; };
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

export interface UpdateEmployeePaymentDto extends Partial<CreateEmployeePaymentDto> { }
