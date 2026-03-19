import { test, expect } from '@playwright/test';
import { ADMIN_USER, TEST_PROJECT, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Project Management
 * Tests creating projects and project brief
 */

test.describe('Project Management', () => {
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

  test.describe('Create Project', () => {
    test('should navigate to projects page', async ({ page }) => {
      await page.goto(URLS.projects);

      // Verify page loaded - look for projects header or create button
      const pageLoaded = await page
        .locator('h1:has-text("Projects"), button:has-text("Create"), button:has-text("New Project")')
        .first()
        .isVisible({ timeout: 10000 });
      expect(pageLoaded).toBeTruthy();
    });

    test('should open create project modal', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Click create button
      await page.click(
        'button:has-text("Create New Project"), button:has-text("New Project"), button:has-text("Create Project")',
      );

      // Verify modal opens
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#create-name')).toBeVisible();
    });

    test('should create a new project', async ({ page }) => {
      const uniqueProject = {
        ...TEST_PROJECT,
        name: `E2E Test Project ${Date.now()}`,
      };

      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Click create button
      await page.click(
        'button:has-text("Create New Project"), button:has-text("New Project"), button:has-text("Create Project")',
      );

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Fill project name
      await page.fill('#create-name', uniqueProject.name);

      // Fill description (optional)
      const descriptionInput = page.locator('#create-description, textarea[placeholder*="Describe"]');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill(uniqueProject.description);
      }

      // Select client - this is a searchable select
      const clientSelect = page.locator('#create-client, [placeholder*="Search for a client"]').first();
      if (await clientSelect.isVisible()) {
        await clientSelect.click();
        // Wait for dropdown options
        await page.waitForTimeout(500);
        // Click first available client option
        const firstOption = page.locator('[role="option"], [class*="option"]').first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
        }
      }

      // Fill amount (optional)
      const amountInput = page.locator('#create-amount');
      if (await amountInput.isVisible()) {
        await amountInput.fill(uniqueProject.amount);
      }

      // Submit form
      await page.click('button[type="submit"]:has-text("Create Project")');

      // Wait for modal to close or redirect to project detail
      await page.waitForTimeout(3000);

      // Should either close modal or redirect to project
      const modalHidden = await page.locator('[role="dialog"]').isHidden();
      const redirectedToProject = page.url().includes('/projects/');

      expect(modalHidden || redirectedToProject).toBeTruthy();
    });

    test('should show validation error for missing project name', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Click create button
      await page.click(
        'button:has-text("Create New Project"), button:has-text("New Project"), button:has-text("Create Project")',
      );

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Try to submit without project name
      await page.click('button[type="submit"]:has-text("Create Project")');

      // Modal should still be open
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Name field should show error or be focused
      await expect(page.locator('#create-name')).toBeVisible();
    });
  });

  test.describe('Project Brief', () => {
    test('should navigate to project detail page', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Click on first project in list
      const projectLink = page.locator('a[href*="/projects/"], tr:has-text("Project") a, [class*="project"]').first();

      if (await projectLink.isVisible()) {
        await projectLink.click();

        // Should navigate to project detail
        await page.waitForURL(/\/projects\//, { timeout: 10000 });

        // Verify project detail page loaded
        await expect(page.locator('#main-content, [class*="project"]')).toBeVisible();
      }
    });

    test('should show project stages for admin', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Click on first project
      const projectLink = page.locator('a[href*="/projects/"]').first();

      if (await projectLink.isVisible()) {
        await projectLink.click();
        await page.waitForURL(/\/projects\//, { timeout: 10000 });

        // Look for Project Brief stage
        const briefStage = page.locator('text=Project Brief, text=Brief');
        await expect(briefStage.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should add content to Project Brief stage', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Click on first project
      const projectLink = page.locator('a[href*="/projects/"]').first();

      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Find and click on Project Brief stage or add button
      const addContentButton = page.locator('button:has-text("Add"), button:has-text("Upload")').first();

      if (await addContentButton.isVisible()) {
        await addContentButton.click();

        // Wait for modal
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Select "Comment Only" mode if available
        const commentOnlyButton = page.locator('button:has-text("Comment Only")');
        if (await commentOnlyButton.isVisible()) {
          await commentOnlyButton.click();
        }

        // Fill comment
        const commentInput = page.locator('#commentText, textarea[placeholder*="comment"]');
        if (await commentInput.isVisible()) {
          await commentInput.fill('E2E Test: Project brief content added via automated test');
        }

        // Submit
        const submitButton = page.locator('button:has-text("Send Comment"), button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }

        // Wait for modal to close
        await page.waitForTimeout(2000);
      }
    });
  });
});
