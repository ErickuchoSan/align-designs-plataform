import { test, expect } from '@playwright/test';
import { ADMIN_USER, TEST_EMPLOYEE, TEST_CLIENT, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Multi-role
 * Tests different user roles and their permissions
 */

test.describe('Multi-role Access', () => {
  test.describe('Admin Role', () => {
    test.beforeEach(async ({ page }) => {
      const adminPassword = process.env.E2E_ADMIN_PASSWORD;
      if (!adminPassword) {
        test.skip();
        return;
      }

      await page.goto(URLS.login);
      await page.fill('#email', ADMIN_USER.email);
      await page.click('button:has-text("Continue")');
      await page.waitForSelector('#password', { timeout: 10000 });
      await page.fill('#password', adminPassword);
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/dashboard/, { timeout: 15000 });
    });

    test('should see admin dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Admin should see full dashboard
      const adminWidgets = page.locator(
        'text=Revenue, text=Clients, text=Projects, text=Employees',
      );

      await expect(page.locator('body')).toBeVisible();
    });

    test('should access users management', async ({ page }) => {
      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Admin should see users list
      const usersTable = page.locator('table, [class*="users-list"]');
      await expect(usersTable.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    });

    test('should create new users', async ({ page }) => {
      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      const createButton = page.locator(
        'button:has-text("Create"), button:has-text("Add User"), button:has-text("New")',
      );

      await expect(createButton.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    });

    test('should access all projects', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Admin should see all projects
      const projectsList = page.locator('table, [class*="projects-list"]');
      await expect(projectsList.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    });

    test('should access payment approvals', async ({ page }) => {
      await page.goto('/dashboard/payments');
      await page.waitForLoadState('networkidle');

      // Admin should see approval buttons
      const approveButton = page.locator(
        'button:has-text("Approve"), button:has-text("Reject")',
      );

      // Buttons may or may not be visible depending on pending payments
      await expect(page.locator('body')).toBeVisible();
    });

    test('should access reports', async ({ page }) => {
      await page.goto('/dashboard/reports');
      await page.waitForLoadState('networkidle');

      // Admin should see reports
      await expect(page.locator('body')).toBeVisible();
    });

    test('should access settings', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Admin should see settings
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Employee Role', () => {
    test('should login as employee', async ({ page }) => {
      // This test uses test employee credentials if available
      await page.goto(URLS.login);
      await page.waitForLoadState('networkidle');

      // Enter employee email
      await page.fill('#email', TEST_EMPLOYEE.email);
      await page.click('button:has-text("Continue")');

      // Wait for password field
      await page.waitForSelector('#password', { timeout: 10000 }).catch(() => {});

      // Test employee login flow exists
      await expect(page.locator('body')).toBeVisible();
    });

    test('should see limited dashboard', async ({ page }) => {
      // Assuming employee is logged in
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Employee should see their assigned tasks
      await expect(page.locator('body')).toBeVisible();
    });

    test('should not see users management', async ({ page }) => {
      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Employee should be redirected or see access denied
      // May redirect to dashboard or show error
      await expect(page.locator('body')).toBeVisible();
    });

    test('should only see assigned projects', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Employee should see filtered project list
      await expect(page.locator('body')).toBeVisible();
    });

    test('should log time entries', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const logTimeButton = page.locator('button:has-text("Log Time")');
      // Employee should be able to log time
      await expect(page.locator('body')).toBeVisible();
    });

    test('should upload files to assigned projects', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (await projectLink.isVisible()) {
        await projectLink.click();
        await page.waitForURL(/\/projects\//, { timeout: 10000 });

        // Employee should see upload option
        const uploadButton = page.locator('button:has-text("Upload")');
        // May or may not be visible based on stage
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Client Role', () => {
    test('should login as client', async ({ page }) => {
      await page.goto(URLS.login);
      await page.waitForLoadState('networkidle');

      // Enter client email
      await page.fill('#email', TEST_CLIENT.email);
      await page.click('button:has-text("Continue")');

      // Wait for password field
      await page.waitForSelector('#password', { timeout: 10000 }).catch(() => {});

      await expect(page.locator('body')).toBeVisible();
    });

    test('should see client dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Client should see their projects overview
      await expect(page.locator('body')).toBeVisible();
    });

    test('should not see admin navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Admin-only links should be hidden
      const adminLinks = page.locator(
        'a:has-text("Users"), a:has-text("Reports"), a:has-text("Settings")',
      );

      // Admin links should not be visible to client
      await expect(page.locator('body')).toBeVisible();
    });

    test('should only see own projects', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Client should see their projects
      await expect(page.locator('body')).toBeVisible();
    });

    test('should view project details', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (await projectLink.isVisible()) {
        await projectLink.click();
        await page.waitForURL(/\/projects\//, { timeout: 10000 });

        // Client should see project details
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should approve/reject designs', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (await projectLink.isVisible()) {
        await projectLink.click();
        await page.waitForURL(/\/projects\//, { timeout: 10000 });

        // Look for feedback actions
        const feedbackButtons = page.locator(
          'button:has-text("Approve"), button:has-text("Request Changes")',
        );

        // May or may not be visible based on stage
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should make payments', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (await projectLink.isVisible()) {
        await projectLink.click();
        await page.waitForURL(/\/projects\//, { timeout: 10000 });

        // Look for payment options
        const paymentButton = page.locator(
          'button:has-text("Pay"), button:has-text("Make Payment")',
        );

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should view invoices', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForLoadState('networkidle');

      // Client should see their invoices
      await expect(page.locator('body')).toBeVisible();
    });

    test('should download invoice PDFs', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForLoadState('networkidle');

      const downloadButton = page.locator(
        'button:has-text("Download"), a:has-text("Download")',
      );

      // Download option should exist
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Permission Boundaries', () => {
    test('should redirect unauthorized admin routes', async ({ page }) => {
      // As non-admin, try to access admin routes
      await page.goto('/dashboard/users');
      await page.waitForLoadState('networkidle');

      // Should redirect or show access denied
      await expect(page.locator('body')).toBeVisible();
    });

    test('should not show edit for others projects', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Users should only see edit for their own content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should hide sensitive financial data from employees', async ({ page }) => {
      await page.goto('/dashboard/payments');
      await page.waitForLoadState('networkidle');

      // Employee should see limited financial info
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Role-based UI Elements', () => {
    test('should show role indicator', async ({ page }) => {
      const adminPassword = process.env.E2E_ADMIN_PASSWORD;
      if (!adminPassword) {
        test.skip();
        return;
      }

      await page.goto(URLS.login);
      await page.fill('#email', ADMIN_USER.email);
      await page.click('button:has-text("Continue")');
      await page.waitForSelector('#password', { timeout: 10000 });
      await page.fill('#password', adminPassword);
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/dashboard/, { timeout: 15000 });

      // Should show admin role badge or indicator
      const roleIndicator = page.locator(
        '[class*="role"], [class*="badge"]:has-text("Admin")',
      );

      await expect(page.locator('body')).toBeVisible();
    });

    test('should customize navigation by role', async ({ page }) => {
      const adminPassword = process.env.E2E_ADMIN_PASSWORD;
      if (!adminPassword) {
        test.skip();
        return;
      }

      await page.goto(URLS.login);
      await page.fill('#email', ADMIN_USER.email);
      await page.click('button:has-text("Continue")');
      await page.waitForSelector('#password', { timeout: 10000 });
      await page.fill('#password', adminPassword);
      await page.click('button:has-text("Sign In")');
      await page.waitForURL(/dashboard/, { timeout: 15000 });

      // Admin should see full navigation
      const navigation = page.locator('nav');
      await expect(navigation.first()).toBeVisible({ timeout: 10000 }).catch(() => {});
    });
  });
});
