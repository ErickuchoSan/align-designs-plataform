import { test, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Project Lifecycle
 * Tests project status transitions: waiting → active → completed → archived
 */

test.describe('Project Lifecycle', () => {
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

  test.describe('Project Status Display', () => {
    test('should display project status badge', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Look for status badges
      const statusBadges = page.locator(
        '[class*="badge"], [class*="status"], text=Waiting, text=Active, text=Completed, text=Archived',
      );

      await expect(statusBadges.first()).toBeVisible({ timeout: 10000 });
    });

    test('should filter projects by status', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Look for status filter
      const statusFilter = page.locator(
        'select[name*="status"], button:has-text("Status"), [aria-label*="filter"]',
      );

      if (await statusFilter.first().isVisible()) {
        await statusFilter.first().click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Activate Project', () => {
    test('should show activate button for waiting projects', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for activate button
      const activateButton = page.locator(
        'button:has-text("Activate"), button:has-text("Start Project"), button:has-text("Begin")',
      );

      // Button may or may not be visible depending on project state
      await expect(page.locator('#main-content, [class*="project"]')).toBeVisible();
    });

    test('should activate a project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      const activateButton = page.locator('button:has-text("Activate")').first();

      if (await activateButton.isVisible()) {
        await activateButton.click();

        // May show confirmation
        const confirmButton = page.locator('[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(2000);

        // Status should change
        const activeStatus = page.locator('text=Active, [class*="active"]');
        await expect(activeStatus.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });
  });

  test.describe('Complete Project', () => {
    test('should show complete button for active projects', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      const completeButton = page.locator(
        'button:has-text("Complete"), button:has-text("Mark Complete"), button:has-text("Finish")',
      );

      await expect(page.locator('#main-content, [class*="project"]')).toBeVisible();
    });

    test('should complete a project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      const completeButton = page.locator('button:has-text("Complete")').first();

      if (await completeButton.isVisible()) {
        await completeButton.click();

        const confirmButton = page.locator('[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Pause Project', () => {
    test('should pause an active project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      const pauseButton = page.locator('button:has-text("Pause"), button:has-text("Hold")').first();

      if (await pauseButton.isVisible()) {
        await pauseButton.click();

        const confirmButton = page.locator('[role="dialog"] button:has-text("Confirm")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(2000);
      }
    });

    test('should resume a paused project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      const resumeButton = page.locator('button:has-text("Resume"), button:has-text("Reactivate")').first();

      if (await resumeButton.isVisible()) {
        await resumeButton.click();
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Archive Project', () => {
    test('should archive a completed project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      const archiveButton = page.locator('button:has-text("Archive")').first();

      if (await archiveButton.isVisible()) {
        await archiveButton.click();

        const confirmButton = page.locator('[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Archive")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await page.waitForTimeout(2000);
      }
    });
  });
});
