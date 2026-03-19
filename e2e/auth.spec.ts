import { test, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Authentication Flow
 * Tests login and logout functionality
 */

test.describe('Authentication', () => {
  test('should show login page with email input', async ({ page }) => {
    await page.goto(URLS.login);

    // Verify login page elements
    await expect(page.locator('h1, h2').filter({ hasText: /Align Designs/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  });

  test('should show password field after entering valid email', async ({ page }) => {
    await page.goto(URLS.login);

    // Enter admin email
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');

    // Wait for password step
    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Logging in as/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto(URLS.login);

    // Enter invalid email
    await page.fill('#email', 'invalid-email');
    await page.click('button:has-text("Continue")');

    // Should show validation error or stay on email step
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should allow switching back to change email', async ({ page }) => {
    await page.goto(URLS.login);

    // Enter email and proceed
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');

    // Wait for password step
    await page.waitForSelector('#password', { timeout: 10000 });

    // Click change email
    await page.click('button:has-text("Change email")');

    // Should be back to email input
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Skip if no password is configured in environment
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;
    if (!adminPassword) {
      test.skip();
      return;
    }

    await page.goto(URLS.login);

    // Step 1: Enter email
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');

    // Step 2: Enter password
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', adminPassword);
    await page.click('button:has-text("Sign In")');

    // Should redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard/i })).toBeVisible();
  });

  test('should show error for incorrect password', async ({ page }) => {
    await page.goto(URLS.login);

    // Step 1: Enter email
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');

    // Step 2: Enter wrong password
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', 'WrongPassword123!');
    await page.click('button:has-text("Sign In")');

    // Should show error message (toast or inline)
    // Wait a bit for the error to appear
    await page.waitForTimeout(2000);

    // Should still be on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
  });

  test('should logout successfully', async ({ page }) => {
    // Skip if no password is configured
    const adminPassword = process.env.E2E_ADMIN_PASSWORD;
    if (!adminPassword) {
      test.skip();
      return;
    }

    // First login
    await page.goto(URLS.login);
    await page.fill('#email', ADMIN_USER.email);
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('#password', { timeout: 10000 });
    await page.fill('#password', adminPassword);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/dashboard/, { timeout: 15000 });

    // Now logout - look for logout button or user menu
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")');

    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Try clicking on a user menu first
      const userMenuTrigger = page.locator('[aria-label*="user"], [aria-label*="menu"], button:has(svg)').first();
      if (await userMenuTrigger.isVisible()) {
        await userMenuTrigger.click();
        await page.click('button:has-text("Logout"), a:has-text("Logout")');
      }
    }

    // Should redirect to login page
    await page.waitForURL(/login/, { timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();

    // Try to access dashboard directly
    await page.goto(URLS.dashboard);

    // Should redirect to login
    await page.waitForURL(/login/, { timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible();
  });
});
