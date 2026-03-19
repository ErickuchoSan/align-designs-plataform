/**
 * Test data and credentials for E2E tests
 * NOTE: These are test credentials for the dev environment only
 */

// Admin user for testing (must exist in dev database)
export const ADMIN_USER = {
  email: 'alfonso@aligndesignsllc.com',
  // Password will be entered via OTP flow in real tests
};

// Test data for creating entities
export const TEST_CLIENT = {
  firstName: 'E2E Test',
  lastName: 'Client',
  email: `e2e.client.${Date.now()}@test.com`,
  phone: '5551234567',
};

export const TEST_EMPLOYEE = {
  firstName: 'E2E Test',
  lastName: 'Employee',
  email: `e2e.employee.${Date.now()}@test.com`,
  phone: '5559876543',
};

export const TEST_PROJECT = {
  name: `E2E Test Project ${Date.now()}`,
  description: 'Automated E2E test project',
  amount: '1000.00',
};

// URLs
export const URLS = {
  login: '/login',
  dashboard: '/dashboard',
  users: '/dashboard/admin/users',
  clients: '/dashboard/admin/clients',
  projects: '/dashboard/projects',
};
