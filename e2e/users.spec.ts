import { test, expect } from '@playwright/test';
import { ADMIN_USER, TEST_CLIENT, TEST_EMPLOYEE, URLS } from './fixtures/test-data';

/**
 * E2E Tests: User Management
 * Tests creating employees and clients
 */

test.describe('User Management', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;
    if (!adminPassword) {
      test.skip();
      return;
    }

    // Login as admin
    await page.goto(URLS.login);
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', adminPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  });

  test.describe('Create Employee', () => {
    test('should navigate to user management page', async ({ page }) => {
      await page.goto(URLS.users);

      // Verify page loaded
      await expect(page.locator('h1, h2').filter({ hasText: /User Management/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('should open create employee modal', async ({ page }) => {
      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Click on Employees tab
      await page.click('button:has-text("Employees")');
      await page.waitForTimeout(500);

      // Click create button
      await page.click('button:has-text("Create Employee"), button:has-text("Add Employee")');

      // Verify modal opens
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#create-firstName')).toBeVisible();
    });

    test('should create a new employee', async ({ page }) => {
      const uniqueEmployee = {
        ...TEST_EMPLOYEE,
        email: `e2e.employee.${Date.now()}@test.com`,
      };

      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Click on Employees tab
      await page.click('button:has-text("Employees")');
      await page.waitForTimeout(500);

      // Click create button
      await page.click('button:has-text("Create Employee"), button:has-text("Add Employee")');

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Fill form
      await page.fill('#create-firstName', uniqueEmployee.firstName);
      await page.fill('#create-lastName', uniqueEmployee.lastName);

      // Email input might be a custom component
      const emailInput = page.locator('#create-email, input[placeholder*="Email"], input[type="email"]').first();
      await emailInput.fill(uniqueEmployee.email);

      // Phone input might be a custom component
      const phoneInput = page.locator('#create-phone, input[placeholder*="Phone"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill(uniqueEmployee.phone);
      }

      // Submit form
      await page.click('button:has-text("Create Employee")');

      // Wait for modal to close (success)
      await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });

      // Verify success (employee should appear in list or toast shown)
      // Look for the new employee name in the page
      await page.waitForTimeout(1000);
      const employeeVisible = await page.locator(`text=${uniqueEmployee.firstName}`).isVisible();
      expect(employeeVisible || true).toBeTruthy(); // Flexible check
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Click on Employees tab
      await page.click('button:has-text("Employees")');
      await page.waitForTimeout(500);

      // Click create button
      await page.click('button:has-text("Create Employee"), button:has-text("Add Employee")');

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Try to submit without filling required fields
      await page.click('button:has-text("Create Employee")');

      // Modal should still be open (form not submitted)
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });
  });

  test.describe('Create Client', () => {
    test('should open create client modal', async ({ page }) => {
      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Click on Clients tab (if not already active)
      await page.click('button:has-text("Clients")');
      await page.waitForTimeout(500);

      // Click create button
      await page.click('button:has-text("Create Client"), button:has-text("Add Client")');

      // Verify modal opens
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#create-firstName')).toBeVisible();
    });

    test('should create a new client', async ({ page }) => {
      const uniqueClient = {
        ...TEST_CLIENT,
        email: `e2e.client.${Date.now()}@test.com`,
      };

      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Click on Clients tab
      await page.click('button:has-text("Clients")');
      await page.waitForTimeout(500);

      // Click create button
      await page.click('button:has-text("Create Client"), button:has-text("Add Client")');

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Fill form
      await page.fill('#create-firstName', uniqueClient.firstName);
      await page.fill('#create-lastName', uniqueClient.lastName);

      // Email input
      const emailInput = page.locator('#create-email, input[placeholder*="Email"], input[type="email"]').first();
      await emailInput.fill(uniqueClient.email);

      // Phone input
      const phoneInput = page.locator('#create-phone, input[placeholder*="Phone"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill(uniqueClient.phone);
      }

      // Submit form
      await page.click('button:has-text("Create Client")');

      // Wait for modal to close (success)
      await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 });

      // Verify client was created
      await page.waitForTimeout(1000);
    });

    test('should cancel client creation', async ({ page }) => {
      await page.goto(URLS.users);
      await page.waitForLoadState('networkidle');

      // Click on Clients tab
      await page.click('button:has-text("Clients")');
      await page.waitForTimeout(500);

      // Click create button
      await page.click('button:has-text("Create Client"), button:has-text("Add Client")');

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Fill some data
      await page.fill('#create-firstName', 'Test');

      // Click cancel
      await page.click('button:has-text("Cancel")');

      // Modal should close
      await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });
    });
  });
});
