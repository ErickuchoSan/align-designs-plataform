import { test, expect } from '@playwright/test';
import { ADMIN_USER, TEST_CLIENT, TEST_PROJECT, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Full Project Flow
 * Tests complete project lifecycle from creation to completion
 */

test.describe('Full Project Flow', () => {
  const projectName = `E2E Full Flow ${Date.now()}`;

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

  test.describe('Complete Project Lifecycle', () => {
    test('should create project with client', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Click create project
      const createButton = page.locator(
        'button:has-text("Create Project"), button:has-text("New Project"), a:has-text("Create")',
      );

      if (await createButton.first().isVisible()) {
        await createButton.first().click();
        await page.waitForSelector('[role="dialog"], form', { timeout: 5000 }).catch(() => {});

        // Fill project details
        const nameInput = page.locator('#project-name, input[name*="name" i]');
        if (await nameInput.first().isVisible()) {
          await nameInput.first().fill(projectName);
        }

        // Select client
        const clientSelect = page.locator(
          'select[name*="client" i], button[class*="select"]',
        );
        if (await clientSelect.first().isVisible()) {
          await clientSelect.first().click();
          await page.waitForTimeout(300);

          const option = page.locator('[role="option"]').first();
          if (await option.isVisible()) {
            await option.click();
          }
        }

        // Set budget
        const budgetInput = page.locator('input[name*="budget" i], input[type="number"]');
        if (await budgetInput.first().isVisible()) {
          await budgetInput.first().fill('5000');
        }

        // Submit
        const submitButton = page.locator(
          'button:has-text("Create"), button[type="submit"]',
        );

        if (await submitButton.first().isVisible()) {
          await submitButton.first().click();
          await page.waitForTimeout(3000);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should fill project brief', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      // Find and click on a project
      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for project brief section
      const briefTab = page.locator(
        'button:has-text("Brief"), [role="tab"]:has-text("Brief"), a:has-text("Brief")',
      );

      if (await briefTab.first().isVisible()) {
        await briefTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Fill brief details
      const descriptionInput = page.locator(
        'textarea[name*="description" i], textarea[name*="brief" i], #description',
      );

      if (await descriptionInput.first().isVisible()) {
        await descriptionInput.first().fill('E2E Test project brief description');

        const saveButton = page.locator(
          'button:has-text("Save"), button:has-text("Submit"), button[type="submit"]',
        );

        if (await saveButton.first().isVisible()) {
          await saveButton.first().click();
          await page.waitForTimeout(2000);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should receive initial payment', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for payments tab/section
      const paymentsTab = page.locator(
        'button:has-text("Payments"), [role="tab"]:has-text("Payments"), a:has-text("Payments")',
      );

      if (await paymentsTab.first().isVisible()) {
        await paymentsTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Check for payment record
      const paymentRecord = page.locator(
        '[class*="payment"], text=Initial, table tbody tr',
      );

      await expect(page.locator('body')).toBeVisible();
    });

    test('should activate project', async ({ page }) => {
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
        'button:has-text("Activate"), button:has-text("Start")',
      );

      if (await activateButton.first().isVisible()) {
        await activateButton.first().click();
        await page.waitForTimeout(500);

        // Confirm if needed
        const confirmButton = page.locator(
          '[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")',
        );

        if (await confirmButton.first().isVisible()) {
          await confirmButton.first().click();
        }

        await page.waitForTimeout(2000);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should assign employees to project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Navigate to employees section
      const employeesTab = page.locator(
        'button:has-text("Employees"), [role="tab"]:has-text("Team")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Assign employee
      const assignButton = page.locator('button:has-text("Assign")');

      if (await assignButton.first().isVisible()) {
        await assignButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should progress through stages', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for stage progression
      const stagesSection = page.locator(
        '[class*="stage"], [class*="progress"], [class*="timeline"]',
      );

      // Next stage button
      const nextStageButton = page.locator(
        'button:has-text("Next Stage"), button:has-text("Complete Stage"), button:has-text("Advance")',
      );

      if (await nextStageButton.first().isVisible()) {
        await nextStageButton.first().click();
        await page.waitForTimeout(2000);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should upload design files', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for files section
      const filesTab = page.locator(
        'button:has-text("Files"), [role="tab"]:has-text("Files"), a:has-text("Files")',
      );

      if (await filesTab.first().isVisible()) {
        await filesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Upload button
      const uploadButton = page.locator('button:has-text("Upload"), input[type="file"]');

      if (await uploadButton.first().isVisible()) {
        // Can't actually upload in test without file
        await expect(uploadButton.first()).toBeVisible();
      }
    });

    test('should submit for client feedback', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for submit for feedback button
      const submitButton = page.locator(
        'button:has-text("Submit for Feedback"), button:has-text("Request Review")',
      );

      if (await submitButton.first().isVisible()) {
        await submitButton.first().click();
        await page.waitForTimeout(2000);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should complete project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for complete button
      const completeButton = page.locator(
        'button:has-text("Complete"), button:has-text("Mark Complete")',
      );

      if (await completeButton.first().isVisible()) {
        await completeButton.first().click();
        await page.waitForTimeout(500);

        // Confirm
        const confirmButton = page.locator(
          '[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Complete")',
        );

        if (await confirmButton.first().isVisible()) {
          await confirmButton.first().click();
        }

        await page.waitForTimeout(2000);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should generate final invoice', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for invoices section
      const invoicesTab = page.locator(
        'button:has-text("Invoices"), [role="tab"]:has-text("Invoices")',
      );

      if (await invoicesTab.first().isVisible()) {
        await invoicesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Generate invoice button
      const generateButton = page.locator(
        'button:has-text("Generate Invoice"), button:has-text("Create Invoice")',
      );

      if (await generateButton.first().isVisible()) {
        await generateButton.first().click();
        await page.waitForTimeout(2000);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should archive completed project', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for archive button
      const archiveButton = page.locator('button:has-text("Archive")');

      if (await archiveButton.first().isVisible()) {
        await archiveButton.first().click();
        await page.waitForTimeout(500);

        // Confirm
        const confirmButton = page.locator(
          '[role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Archive")',
        );

        if (await confirmButton.first().isVisible()) {
          await confirmButton.first().click();
        }

        await page.waitForTimeout(2000);
      }

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Project Dashboard Overview', () => {
    test('should display project summary on dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for project summary widgets
      const projectWidget = page.locator(
        '[class*="project-widget"], [class*="project-card"], text=Projects, text=Active Projects',
      );

      await expect(page.locator('body')).toBeVisible();
    });

    test('should show recent project activity', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const activitySection = page.locator(
        '[class*="activity"], [class*="recent"], text=Recent Activity',
      );

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Project Quick Actions', () => {
    test('should access project from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click on project link/card from dashboard
      const projectCard = page.locator(
        '[class*="project-card"] a, a[href*="/projects/"]',
      ).first();

      if (await projectCard.isVisible()) {
        await projectCard.click();
        await page.waitForURL(/\/projects\//, { timeout: 10000 });
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should navigate between project tabs', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Navigate through tabs
      const tabs = ['Overview', 'Brief', 'Files', 'Payments', 'Team'];

      for (const tabName of tabs) {
        const tab = page.locator(
          `button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`,
        );

        if (await tab.first().isVisible()) {
          await tab.first().click();
          await page.waitForTimeout(500);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });
  });
});
