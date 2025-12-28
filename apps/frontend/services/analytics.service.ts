import { api } from '@/lib/api';

/**
 * Analytics Service
 * Provides business intelligence data from the backend analytics module
 */

export interface ClientValueMetric {
  clientId: string;
  clientName: string;
  totalBilled: number;
  totalPaid: number;
  projectCount: number;
}

export interface RevenueMetric {
  period: string; // "2024-12" or "2024-Q1"
  revenue: number;
  expenses: number;
  profit: number;
}

export interface EfficiencyMetric {
  projectId: string;
  projectName: string;
  employeeId: string;
  employeeName: string;
  paidDays: number;
  actualWorkingDays: number;
  efficiencyPercentage: number;
}

export interface ProjectPerformanceMetric {
  projectId: string;
  projectName: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

export interface OverviewMetrics {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  activeProjects: number;
  completedProjects: number;
  totalClients: number;
  averageProjectValue: number;
}

export class AnalyticsService {
  private static readonly BASE_URL = '/api/v1/analytics';

  /**
   * Get overview dashboard metrics
   */
  static async getOverview(): Promise<OverviewMetrics> {
    const response = await api.get(`${this.BASE_URL}/overview`);
    return response.data;
  }

  /**
   * Get client value metrics (top clients by revenue)
   */
  static async getClientValue(params?: {
    limit?: number;
    sortBy?: 'totalBilled' | 'totalPaid' | 'projectCount';
  }): Promise<ClientValueMetric[]> {
    const response = await api.get(`${this.BASE_URL}/client-value`, { params });
    return response.data;
  }

  /**
   * Get revenue over time
   */
  static async getRevenue(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'month' | 'quarter' | 'year';
  }): Promise<RevenueMetric[]> {
    const response = await api.get(`${this.BASE_URL}/revenue`, { params });
    return response.data;
  }

  /**
   * Get employee efficiency metrics
   */
  static async getEfficiency(params?: {
    employeeId?: string;
    projectId?: string;
  }): Promise<EfficiencyMetric[]> {
    const response = await api.get(`${this.BASE_URL}/efficiency`, { params });
    return response.data;
  }

  /**
   * Get project performance metrics
   */
  static async getProjectPerformance(params?: {
    status?: 'ACTIVE' | 'COMPLETED';
    limit?: number;
  }): Promise<ProjectPerformanceMetric[]> {
    const response = await api.get(`${this.BASE_URL}/project-performance`, { params });
    return response.data;
  }

  /**
   * Get specific client analytics
   */
  static async getClientAnalytics(clientId: string): Promise<{
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
    projectCount: number;
    averageProjectValue: number;
    projects: Array<{
      id: string;
      name: string;
      status: string;
      totalBilled: number;
      totalPaid: number;
    }>;
  }> {
    const response = await api.get(`${this.BASE_URL}/clients/${clientId}`);
    return response.data;
  }

  /**
   * Get specific project analytics
   */
  static async getProjectAnalytics(projectId: string): Promise<{
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
    hoursTracked: number;
    efficiency: number;
    feedbackCycles: number;
    rejectionRate: number;
  }> {
    const response = await api.get(`${this.BASE_URL}/projects/${projectId}`);
    return response.data;
  }
}
