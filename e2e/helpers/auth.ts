import { Page, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from '../fixtures/test-data';

/**
 * Login as admin user
 * Note: This requires the admin to have a password set (not first-time OTP flow)
 */
export async function loginAsAdmin(page: Page, password: string) {
  await page.goto(URLS.login);

  // Step 1: Enter email
  await page.fill('#email', ADMIN_USER.email);
  await page.click('button:has-text("Continue")');

  // Wait for password step
  await page.waitForSelector('#password', { timeout: 10000 });

  // Step 2: Enter password
  await page.fill('#password', password);
  await page.click('button:has-text("Sign In")');

  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await expect(page.locator('h1, h2').filter({ hasText: /Dashboard/i })).toBeVisible();
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Click on user menu or logout button
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")');

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Try user dropdown menu
    const userMenu = page.locator('[data-testid="user-menu"], button:has([class*="avatar"])');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.click('button:has-text("Logout"), button:has-text("Sign out")');
    }
  }

  // Wait for redirect to login
  await page.waitForURL(/login/, { timeout: 10000 });
}

/**
 * Check if user is logged in by verifying dashboard access
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto(URLS.dashboard);
    await page.waitForURL(/dashboard/, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Navigate to a page, ensuring user is logged in first
 */
export async function navigateTo(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}
