/**
 * TanStack Query Keys Factory
 *
 * Centralized query keys for consistent cache management.
 * Use these keys for queries and invalidation.
 *
 * @example
 * // In a query
 * useQuery({ queryKey: queryKeys.projects.list({ page: 1 }) })
 *
 * // For invalidation
 * queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
 */

export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: { page?: number; limit?: number; status?: string }) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    files: (projectId: string) =>
      [...queryKeys.projects.detail(projectId), 'files'] as const,
    payments: (projectId: string) =>
      [...queryKeys.projects.detail(projectId), 'payments'] as const,
    feedback: (projectId: string) =>
      [...queryKeys.projects.detail(projectId), 'feedback'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: { page?: number; limit?: number; role?: string }) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    clients: () => [...queryKeys.users.all, 'clients'] as const,
    employees: () => [...queryKeys.users.all, 'employees'] as const,
    availableEmployees: () =>
      [...queryKeys.users.all, 'available-employees'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters: { page?: number; limit?: number; status?: string }) =>
      [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    byProject: (projectId: string) =>
      [...queryKeys.invoices.all, 'project', projectId] as const,
    unpaidByProject: (projectId: string) =>
      [...queryKeys.invoices.byProject(projectId), 'unpaid'] as const,
    hasUnpaid: (projectId: string) =>
      [...queryKeys.invoices.byProject(projectId), 'has-unpaid'] as const,
  },

  // Employee Payments
  employeePayments: {
    all: ['employee-payments'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.employeePayments.all, 'project', projectId] as const,
    pendingItems: (projectId: string, employeeId: string) =>
      [...queryKeys.employeePayments.byProject(projectId), 'pending', employeeId] as const,
  },

  // Files
  files: {
    all: ['files'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.files.all, 'project', projectId] as const,
    list: (projectId: string, filters: { page?: number; limit?: number; name?: string; type?: string }) =>
      [...queryKeys.files.byProject(projectId), 'list', filters] as const,
    types: (projectId: string) =>
      [...queryKeys.files.byProject(projectId), 'types'] as const,
    pendingPayment: (projectId: string, employeeId: string) =>
      [...queryKeys.files.byProject(projectId), 'pending-payment', employeeId] as const,
  },

  // Stages
  stages: {
    all: ['stages'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.stages.all, 'project', projectId] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: { page?: number; limit?: number; projectId?: string }) =>
      [...queryKeys.payments.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.payments.all, 'detail', id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    projectStats: (projectId: string) =>
      [...queryKeys.analytics.all, 'project', projectId] as const,
  },

  // Tracking
  tracking: {
    all: ['tracking'] as const,
    projectStats: (projectId: string) =>
      [...queryKeys.tracking.all, 'project-stats', projectId] as const,
  },

  // Feedback
  feedback: {
    all: ['feedback'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.feedback.all, 'project', projectId] as const,
    cycles: (projectId: string) =>
      [...queryKeys.feedback.byProject(projectId), 'cycles'] as const,
  },

  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
} as const;

// Type helper for query key
export type QueryKeys = typeof queryKeys;