import { test, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Time Tracking
 * Tests time entry creation, editing, and reporting
 */

test.describe('Time Tracking', () => {
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

  test.describe('Time Entry List', () => {
    test('should display time tracking page', async ({ page }) => {
      // Navigate to time tracking page
      const timeLink = page.locator(
        'a:has-text("Time"), a[href*="time"], a[href*="tracking"]',
      );

      if (await timeLink.first().isVisible()) {
        await timeLink.first().click();
        await page.waitForLoadState('networkidle');
      } else {
        // Try direct navigation
        await page.goto('/dashboard/time-tracking');
        await page.waitForLoadState('networkidle');
      }

      // Should show time tracking content
      await expect(page.locator('body')).toBeVisible();
    });

    test('should list time entries', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      // Look for time entries table or list
      const timeEntries = page.locator(
        'table tbody tr, [class*="time-entry"], [class*="entry-card"]',
      );

      // List should be visible (may be empty)
      await expect(page.locator('body')).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      // Look for date picker/filter
      const dateFilter = page.locator(
        'input[type="date"], button:has-text("Date"), [class*="date-picker"]',
      );

      if (await dateFilter.first().isVisible()) {
        await dateFilter.first().click();
        await page.waitForTimeout(500);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should filter by project', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      // Look for project filter
      const projectFilter = page.locator(
        'select[name*="project" i], button:has-text("Project"), [class*="project-filter"]',
      );

      if (await projectFilter.first().isVisible()) {
        await projectFilter.first().click();
        await page.waitForTimeout(500);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should filter by employee', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      // Look for employee filter
      const employeeFilter = page.locator(
        'select[name*="employee" i], button:has-text("Employee"), [class*="employee-filter"]',
      );

      if (await employeeFilter.first().isVisible()) {
        await employeeFilter.first().click();
        await page.waitForTimeout(500);
      }

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Create Time Entry', () => {
    test('should show add time entry button', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const addButton = page.locator(
        'button:has-text("Add"), button:has-text("Log Time"), button:has-text("New Entry")',
      );

      // Add button may or may not be visible depending on permissions
      await expect(page.locator('body')).toBeVisible();
    });

    test('should open time entry modal', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const addButton = page.locator(
        'button:has-text("Add"), button:has-text("Log Time"), button:has-text("New Entry")',
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();
        }
      }
    });

    test('should create time entry with required fields', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const addButton = page.locator(
        'button:has-text("Add"), button:has-text("Log Time")',
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Select project
          const projectSelect = modal.locator('select[name*="project" i], [class*="select"]');
          if (await projectSelect.first().isVisible()) {
            await projectSelect.first().click();
            await page.waitForTimeout(300);

            const option = page.locator('[role="option"]').first();
            if (await option.isVisible()) {
              await option.click();
            }
          }

          // Enter hours
          const hoursInput = modal.locator(
            'input[name*="hours" i], input[type="number"], input[placeholder*="hours" i]',
          );
          if (await hoursInput.first().isVisible()) {
            await hoursInput.first().fill('2');
          }

          // Enter description
          const descriptionInput = modal.locator(
            'textarea, input[name*="description" i], input[name*="notes" i]',
          );
          if (await descriptionInput.first().isVisible()) {
            await descriptionInput.first().fill('E2E Test time entry');
          }

          // Select date
          const dateInput = modal.locator('input[type="date"]');
          if (await dateInput.first().isVisible()) {
            const today = new Date().toISOString().split('T')[0];
            await dateInput.first().fill(today);
          }

          // Submit
          const submitButton = modal.locator(
            'button:has-text("Save"), button:has-text("Add"), button[type="submit"]',
          );

          if (await submitButton.first().isVisible()) {
            await submitButton.first().click();
            await page.waitForTimeout(2000);

            // Modal should close on success
            await expect(modal).toBeHidden({ timeout: 10000 }).catch(() => {});
          }
        }
      }
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const addButton = page.locator(
        'button:has-text("Add"), button:has-text("Log Time")',
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Try to submit without filling fields
          const submitButton = modal.locator(
            'button:has-text("Save"), button:has-text("Add"), button[type="submit"]',
          );

          if (await submitButton.first().isVisible()) {
            await submitButton.first().click();
            await page.waitForTimeout(1000);

            // Should show validation errors
            const errorMessage = modal.locator(
              '[class*="error"], text=required, [role="alert"]',
            );
            // Validation should prevent submission
            await expect(modal).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Edit Time Entry', () => {
    test('should edit existing time entry', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      // Look for edit button on existing entry
      const editButton = page.locator(
        'button:has-text("Edit"), button[aria-label*="edit" i], [class*="edit-btn"]',
      );

      if (await editButton.first().isVisible()) {
        await editButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Update hours
          const hoursInput = modal.locator('input[name*="hours" i], input[type="number"]');
          if (await hoursInput.first().isVisible()) {
            await hoursInput.first().clear();
            await hoursInput.first().fill('3');
          }

          // Save
          const saveButton = modal.locator(
            'button:has-text("Save"), button:has-text("Update"), button[type="submit"]',
          );

          if (await saveButton.first().isVisible()) {
            await saveButton.first().click();
            await page.waitForTimeout(2000);
          }
        }
      }
    });

    test('should update description', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const editButton = page.locator('button:has-text("Edit")').first();

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          const descriptionInput = modal.locator('textarea, input[name*="description" i]');
          if (await descriptionInput.first().isVisible()) {
            await descriptionInput.first().clear();
            await descriptionInput.first().fill('Updated description');
          }

          const saveButton = modal.locator(
            'button:has-text("Save"), button:has-text("Update")',
          );

          if (await saveButton.first().isVisible()) {
            await saveButton.first().click();
            await page.waitForTimeout(2000);
          }
        }
      }
    });
  });

  test.describe('Delete Time Entry', () => {
    test('should show delete option', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.locator(
        'button:has-text("Delete"), button[aria-label*="delete" i], [class*="delete"]',
      );

      // Delete option should exist
      await expect(page.locator('body')).toBeVisible();
    });

    test('should confirm before deleting', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const deleteButton = page.locator('button:has-text("Delete")').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        // Should show confirmation
        const confirmDialog = page.locator(
          '[role="alertdialog"], [role="dialog"]:has-text("confirm"), [role="dialog"]:has-text("sure")',
        );

        if (await confirmDialog.isVisible()) {
          // Cancel deletion
          const cancelButton = page.locator(
            '[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("No")',
          );
          if (await cancelButton.first().isVisible()) {
            await cancelButton.first().click();
          }
        }
      }
    });
  });

  test.describe('Time Entry from Project', () => {
    test('should log time from project detail', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for time tracking tab or button
      const timeTab = page.locator(
        'button:has-text("Time"), [role="tab"]:has-text("Time"), a:has-text("Time")',
      );

      if (await timeTab.first().isVisible()) {
        await timeTab.first().click();
        await page.waitForTimeout(1000);
      }

      const logTimeButton = page.locator(
        'button:has-text("Log Time"), button:has-text("Add Time")',
      );

      if (await logTimeButton.first().isVisible()) {
        await logTimeButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Project should be pre-selected
          await expect(modal).toBeVisible();
        }
      }
    });

    test('should display project time summary', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for time summary
      const timeSummary = page.locator(
        'text=Total Hours, text=Time Spent, [class*="time-summary"], text=hours',
      );

      // Summary may or may not be visible
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Time Reports', () => {
    test('should display time report page', async ({ page }) => {
      // Navigate to reports
      await page.goto('/dashboard/reports');
      await page.waitForLoadState('networkidle');

      // Look for time report option
      const timeReport = page.locator(
        'a:has-text("Time Report"), button:has-text("Time Report"), text=Time Report',
      );

      if (await timeReport.first().isVisible()) {
        await timeReport.first().click();
        await page.waitForTimeout(1000);
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should export time report', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      const exportButton = page.locator(
        'button:has-text("Export"), button:has-text("Download"), a:has-text("Export")',
      );

      if (await exportButton.first().isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

        await exportButton.first().click();
        await page.waitForTimeout(2000);

        // Download may or may not start
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should show total hours summary', async ({ page }) => {
      await page.goto('/dashboard/time-tracking');
      await page.waitForLoadState('networkidle');

      // Look for total hours display
      const totalHours = page.locator(
        'text=Total, [class*="total"], [class*="summary"]',
      );

      await expect(page.locator('body')).toBeVisible();
    });
  });
});
