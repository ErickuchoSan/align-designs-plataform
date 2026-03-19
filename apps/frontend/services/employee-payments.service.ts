import api from '@/lib/api';

import { EmployeePayment } from '@/types/employee-payment';

export const EmployeePaymentsService = {
  async getPayments(projectId: string): Promise<EmployeePayment[]> {
    const response = await api.get('/employee-payments', {
      params: { projectId }
    });
    return response.data;
  },

  // Alias for getPayments - some components use this name
  async getByProject(projectId: string): Promise<EmployeePayment[]> {
    return this.getPayments(projectId);
  },

  async createPayment(projectId: string, data: Partial<EmployeePayment>): Promise<EmployeePayment> {
    const response = await api.post('/employee-payments', { ...data, projectId });
    return response.data;
  },

  // Alias for createPayment
  async create(projectId: string, data: Partial<EmployeePayment>): Promise<EmployeePayment> {
    return this.createPayment(projectId, data);
  },

  async updatePayment(id: string, data: Partial<EmployeePayment>): Promise<EmployeePayment> {
    const response = await api.patch(`/employee-payments/${id}`, data);
    return response.data;
  },

  async deletePayment(id: string): Promise<void> {
    await api.delete(`/employee-payments/${id}`);
  },

  async approve(id: string, file: File): Promise<EmployeePayment> {
    const formData = new FormData();
    formData.append('receiptFile', file);

    // Send as POST/PATCH with FormData, header usually set automatically by browser or axios
    const response = await api.patch(`/employee-payments/${id}/approve`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async reject(id: string, reason: string): Promise<EmployeePayment> {
    const response = await api.patch(`/employee-payments/${id}/reject`, { rejectionReason: reason });
    return response.data;
  },

  async getPendingItems(projectId: string, employeeId: string): Promise<any[]> {
    const response = await api.get('/employee-payments/pending-items', {
      params: { projectId, employeeId }
    });
    return response.data;
  },

  async getReceiptUrl(paymentId: string): Promise<string> {
    const response = await api.get<{ url: string }>(`/employee-payments/${paymentId}/receipt-url`);
    return response.data.url;
  },

  /**
   * Download receipt file as blob for viewing
   * Uses the presigned URL to fetch the file and return as blob
   */
  async downloadReceipt(paymentId: string): Promise<Blob> {
    const presignedUrl = await this.getReceiptUrl(paymentId);
    const response = await fetch(presignedUrl);
    if (!response.ok) {
      throw new Error('Failed to download receipt');
    }
    return response.blob();
  },
};
