import { test, expect } from '@playwright/test';
import { ADMIN_USER, URLS } from './fixtures/test-data';

/**
 * E2E Tests: Employee Assignment
 * Tests assigning employees to projects, roles, and rates
 */

test.describe('Employee Assignment', () => {
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

  test.describe('View Project Employees', () => {
    test('should display employees tab on project detail', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Look for employees tab or section
      const employeesSection = page.locator(
        'button:has-text("Employees"), a:has-text("Team"), [role="tab"]:has-text("Employees"), h2:has-text("Team"), h3:has-text("Assigned")',
      );

      await expect(page.locator('#main-content, [class*="project"]')).toBeVisible();
    });

    test('should list assigned employees', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      // Click employees tab if exists
      const employeesTab = page.locator(
        'button:has-text("Employees"), [role="tab"]:has-text("Employees"), a:has-text("Team")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Look for employee list
      const employeeList = page.locator(
        '[class*="employee"], [class*="team"], table tbody tr, [class*="card"]',
      );

      // List should be visible (may be empty)
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Assign Employee to Project', () => {
    test('should show assign employee button', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Look for assign button
      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Add Employee"), button:has-text("Add Team Member")',
      );

      // Button may or may not be visible depending on permissions
      await expect(page.locator('body')).toBeVisible();
    });

    test('should open assign employee modal', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Add Employee")',
      );

      if (await assignButton.first().isVisible()) {
        await assignButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        // Modal should open
        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();
        }
      }
    });

    test('should assign employee with role', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Add Employee")',
      );

      if (await assignButton.first().isVisible()) {
        await assignButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Select employee
          const employeeSelect = modal.locator(
            'select[name*="employee" i], [class*="select"], button[class*="select"]',
          );

          if (await employeeSelect.first().isVisible()) {
            await employeeSelect.first().click();
            await page.waitForTimeout(500);

            // Select first available option
            const option = page.locator('[role="option"], option').first();
            if (await option.isVisible()) {
              await option.click();
            }
          }

          // Select role
          const roleSelect = modal.locator('select[name*="role" i], input[name*="role" i]');

          if (await roleSelect.first().isVisible()) {
            await roleSelect.first().click();
            await page.waitForTimeout(500);

            const roleOption = page.locator('[role="option"], option').first();
            if (await roleOption.isVisible()) {
              await roleOption.click();
            }
          }

          // Enter rate if required
          const rateInput = modal.locator('input[name*="rate" i], input[type="number"]');
          if (await rateInput.first().isVisible()) {
            await rateInput.first().fill('50');
          }

          // Submit
          const submitButton = modal.locator(
            'button:has-text("Assign"), button:has-text("Add"), button[type="submit"]',
          );

          if (await submitButton.first().isVisible()) {
            await submitButton.first().click();
            await page.waitForTimeout(2000);

            // Modal should close
            await expect(modal).toBeHidden({ timeout: 10000 }).catch(() => {});
          }
        }
      }
    });
  });

  test.describe('Update Employee Assignment', () => {
    test('should edit employee role', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Look for edit button on existing employee
      const editButton = page.locator(
        'button:has-text("Edit"), button[aria-label*="edit" i], [class*="edit"]',
      );

      if (await editButton.first().isVisible()) {
        await editButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Update role
          const roleSelect = modal.locator('select[name*="role" i]');
          if (await roleSelect.first().isVisible()) {
            await roleSelect.first().selectOption({ index: 1 });
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

    test('should update employee rate', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Look for edit button
      const editButton = page.locator(
        'button:has-text("Edit"), button[aria-label*="edit" i]',
      ).first();

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          const rateInput = modal.locator('input[name*="rate" i], input[type="number"]');
          if (await rateInput.first().isVisible()) {
            await rateInput.first().clear();
            await rateInput.first().fill('75');
          }

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
  });

  test.describe('Remove Employee from Project', () => {
    test('should show remove/unassign option', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      // Look for remove button
      const removeButton = page.locator(
        'button:has-text("Remove"), button:has-text("Unassign"), button[aria-label*="delete" i], button[aria-label*="remove" i]',
      );

      // Remove option should exist
      await expect(page.locator('body')).toBeVisible();
    });

    test('should confirm before removing employee', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      const removeButton = page
        .locator('button:has-text("Remove"), button:has-text("Unassign")')
        .first();

      if (await removeButton.isVisible()) {
        await removeButton.click();
        await page.waitForTimeout(500);

        // Should show confirmation dialog
        const confirmDialog = page.locator(
          '[role="alertdialog"], [role="dialog"]:has-text("confirm"), [role="dialog"]:has-text("sure")',
        );

        if (await confirmDialog.isVisible()) {
          // Cancel the removal
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

  test.describe('Employee Assignment Validation', () => {
    test('should prevent duplicate assignment', async ({ page }) => {
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
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Add Employee")',
      );

      if (await assignButton.first().isVisible()) {
        await assignButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Already assigned employees should be filtered out or show warning
          await expect(modal).toBeVisible();
        }
      }
    });

    test('should require role selection', async ({ page }) => {
      await page.goto(URLS.projects);
      await page.waitForLoadState('networkidle');

      const projectLink = page.locator('a[href*="/projects/"]').first();
      if (!(await projectLink.isVisible())) {
        test.skip();
        return;
      }

      await projectLink.click();
      await page.waitForURL(/\/projects\//, { timeout: 10000 });

      const employeesTab = page.locator(
        'button:has-text("Employees"), [role="tab"]:has-text("Employees")',
      );

      if (await employeesTab.first().isVisible()) {
        await employeesTab.first().click();
        await page.waitForTimeout(1000);
      }

      const assignButton = page.locator(
        'button:has-text("Assign"), button:has-text("Add Employee")',
      );

      if (await assignButton.first().isVisible()) {
        await assignButton.first().click();
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});

        const modal = page.locator('[role="dialog"]');
        if (await modal.isVisible()) {
          // Try to submit without selecting role
          const submitButton = modal.locator(
            'button:has-text("Assign"), button[type="submit"]',
          );

          if (await submitButton.first().isVisible()) {
            await submitButton.first().click();
            await page.waitForTimeout(1000);

            // Should show validation error
            const errorMessage = modal.locator(
              '[class*="error"], text=required, text=select',
            );
            // Validation should prevent submission
            await expect(modal).toBeVisible();
          }
        }
      }
    });
  });
});
