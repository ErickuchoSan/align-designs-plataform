import api from '@/lib/api';

export interface EmployeePayment {
  id: string;
  amount: number;
  description: string;
  employeeId: string;
  projectId: string;
  createdAt: string;
  status: string;
}

export const EmployeePaymentsService = {
  async getPayments(projectId: string): Promise<EmployeePayment[]> {
    const response = await api.get(`/employee-payments/${projectId}`);
    return response.data;
  },

  async createPayment(projectId: string, data: Partial<EmployeePayment>): Promise<EmployeePayment> {
    const response = await api.post(`/employee-payments/${projectId}`, data);
    return response.data;
  },

  async updatePayment(id: string, data: Partial<EmployeePayment>): Promise<EmployeePayment> {
    const response = await api.patch(`/employee-payments/${id}`, data);
    return response.data;
  },

  async deletePayment(id: string): Promise<void> {
    await api.delete(`/employee-payments/${id}`);
  },
};
